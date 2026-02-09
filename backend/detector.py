"""
DetectionEngine — thread-safe YOLOv8 person detection with MJPEG output.

Extracted from the original gui_detector.py tkinter application.
Designed to be driven by FastAPI route handlers.
"""

import sys
import cv2
import threading
import time
from datetime import datetime
from pathlib import Path

from ultralytics import YOLO

# Colors assigned to tracking IDs
_COLORS = [
    (0, 255, 100), (255, 100, 0), (0, 100, 255),
    (255, 0, 150), (0, 255, 255), (255, 255, 0),
    (150, 0, 255), (0, 200, 100), (100, 255, 0),
]


def _base_dir() -> Path:
    """Return project root — works both normally and inside a PyInstaller bundle."""
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent.parent


def _writable_dir() -> Path:
    """Writable directory next to the exe (frozen) or project root (dev)."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent.parent


SCREENSHOT_DIR = _writable_dir() / "screenshots"
SCREENSHOT_DIR.mkdir(exist_ok=True)

MODEL_DIR = _base_dir()


class DetectionEngine:
    """Thread-safe person detection engine backed by YOLOv8 + ByteTrack."""

    def __init__(self) -> None:
        # --- lock protects all mutable state below ---
        self._lock = threading.Lock()

        # state
        self._running = False
        self._paused = False
        self._cap: cv2.VideoCapture | None = None
        self._thread: threading.Thread | None = None

        # stats
        self._people_count = 0
        self._total_unique = 0
        self._all_seen_ids: set[int] = set()
        self._fps = 0.0
        self._session_start: float | None = None
        self._screenshot_count = 0

        # settings
        self._confidence = 0.45
        self._camera_index = 0
        self._model_name = "yolov8n.pt"
        self._show_labels = True
        self._show_confidence = True

        # current JPEG-encoded frame (bytes) for MJPEG streaming
        self._jpeg_frame: bytes | None = None
        self._frame_event = threading.Event()

        # raw BGR frame for screenshots
        self._raw_frame = None

        # model (loaded once, reloaded on model change)
        self._model: YOLO | None = None
        self._load_model()

    # ------------------------------------------------------------------
    # Model
    # ------------------------------------------------------------------

    def _load_model(self) -> None:
        model_path = MODEL_DIR / self._model_name
        self._model = YOLO(str(model_path))

    # ------------------------------------------------------------------
    # Public control methods (called from route handlers)
    # ------------------------------------------------------------------

    def start(self) -> dict:
        with self._lock:
            if self._running:
                return {"status": "already_running"}

            cap = cv2.VideoCapture(self._camera_index)
            if not cap.isOpened():
                return {"status": "error", "message": f"Cannot open camera {self._camera_index}"}

            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

            self._cap = cap
            self._running = True
            self._paused = False
            self._all_seen_ids.clear()
            self._total_unique = 0
            self._people_count = 0
            self._screenshot_count = 0
            self._fps = 0.0
            self._session_start = time.time()
            self._jpeg_frame = None

        # start detection in a daemon thread
        self._thread = threading.Thread(target=self._detection_loop, daemon=True)
        self._thread.start()
        return {"status": "started"}

    def stop(self) -> dict:
        with self._lock:
            if not self._running:
                return {"status": "not_running"}
            self._running = False

        # wait for thread to finish
        if self._thread is not None:
            self._thread.join(timeout=3)
            self._thread = None

        with self._lock:
            if self._cap is not None:
                self._cap.release()
                self._cap = None

            summary = {
                "status": "stopped",
                "duration": self._format_time(time.time() - self._session_start) if self._session_start else "00:00:00",
                "total_unique": self._total_unique,
                "screenshots": self._screenshot_count,
            }
            self._session_start = None
            self._jpeg_frame = None
            # signal any waiting generator
            self._frame_event.set()
            return summary

    def pause(self) -> dict:
        with self._lock:
            if not self._running:
                return {"status": "not_running"}
            self._paused = not self._paused
            return {"status": "paused" if self._paused else "resumed"}

    # ------------------------------------------------------------------
    # Stats / settings
    # ------------------------------------------------------------------

    def get_stats(self) -> dict:
        with self._lock:
            elapsed = ""
            if self._session_start and self._running:
                elapsed = self._format_time(time.time() - self._session_start)
            return {
                "people_count": self._people_count,
                "total_unique": self._total_unique,
                "fps": round(self._fps, 1),
                "session_time": elapsed,
                "screenshots": self._screenshot_count,
                "running": self._running,
                "paused": self._paused,
            }

    def get_settings(self) -> dict:
        with self._lock:
            return {
                "confidence": self._confidence,
                "camera_index": self._camera_index,
                "model_name": self._model_name,
                "show_labels": self._show_labels,
                "show_confidence": self._show_confidence,
            }

    def update_settings(self, data: dict) -> dict:
        reload_model = False
        with self._lock:
            if "confidence" in data:
                self._confidence = max(0.1, min(0.95, float(data["confidence"])))
            if "camera_index" in data:
                self._camera_index = int(data["camera_index"])
            if "show_labels" in data:
                self._show_labels = bool(data["show_labels"])
            if "show_confidence" in data:
                self._show_confidence = bool(data["show_confidence"])
            if "model_name" in data:
                new_model = data["model_name"]
                if new_model != self._model_name:
                    self._model_name = new_model
                    reload_model = True

        if reload_model:
            self._load_model()

        return self.get_settings()

    # ------------------------------------------------------------------
    # Screenshots
    # ------------------------------------------------------------------

    def take_screenshot(self) -> dict:
        with self._lock:
            if self._raw_frame is None:
                return {"status": "error", "message": "No frame available"}
            frame = self._raw_frame.copy()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"detection_{timestamp}.jpg"
        filepath = SCREENSHOT_DIR / filename
        cv2.imwrite(str(filepath), frame)

        with self._lock:
            self._screenshot_count += 1

        return {"status": "ok", "filename": filename}

    def list_screenshots(self) -> list[dict]:
        files = sorted(SCREENSHOT_DIR.glob("*.jpg"), reverse=True)
        return [{"name": f.name, "size": f.stat().st_size} for f in files]

    # ------------------------------------------------------------------
    # MJPEG streaming
    # ------------------------------------------------------------------

    def frame_generator(self):
        """Yields MJPEG multipart frames. Used by StreamingResponse."""
        while True:
            self._frame_event.wait(timeout=1.0)
            self._frame_event.clear()

            with self._lock:
                if not self._running:
                    break
                jpeg = self._jpeg_frame

            if jpeg is not None:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + jpeg + b"\r\n"
                )

    # ------------------------------------------------------------------
    # Internal detection loop
    # ------------------------------------------------------------------

    def _detection_loop(self) -> None:
        prev_time = time.time()

        while True:
            with self._lock:
                if not self._running:
                    break
                if self._paused:
                    continue
                cap = self._cap
                conf = self._confidence
                show_labels = self._show_labels
                show_conf = self._show_confidence

            if cap is None:
                break

            ret, frame = cap.read()
            if not ret:
                with self._lock:
                    self._running = False
                break

            # Run YOLO detection (expensive — lock NOT held)
            results = self._model.track(
                frame,
                persist=True,
                tracker="bytetrack.yaml",
                conf=conf,
                classes=[0],
                verbose=False,
            )

            people_count = 0
            seen_ids: set[int] = set()

            if results[0].boxes is not None and len(results[0].boxes):
                for box in results[0].boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    confidence = float(box.conf[0])
                    track_id = int(box.id[0]) if box.id is not None else -1

                    if track_id >= 0:
                        seen_ids.add(track_id)

                    people_count += 1
                    color = _COLORS[track_id % len(_COLORS)]
                    self._draw_detection(frame, x1, y1, x2, y2, color, track_id, confidence, show_labels, show_conf)

            # Encode frame to JPEG
            _, jpeg_buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            jpeg_bytes = jpeg_buf.tobytes()

            # Calculate FPS
            now = time.time()
            dt = now - prev_time
            prev_time = now
            fps = (1.0 / dt) if dt > 0 else 0.0

            # Write shared state under lock
            with self._lock:
                self._people_count = people_count
                self._all_seen_ids.update(seen_ids)
                self._total_unique = len(self._all_seen_ids)
                self._fps = self._fps * 0.8 + fps * 0.2
                self._raw_frame = frame
                self._jpeg_frame = jpeg_bytes

            # Signal waiting MJPEG generators
            self._frame_event.set()

            # small sleep when paused to avoid busy-loop
            with self._lock:
                if self._paused:
                    time.sleep(0.1)

    # ------------------------------------------------------------------
    # Drawing helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _draw_detection(frame, x1, y1, x2, y2, color, track_id, confidence, show_labels, show_conf):
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # corner accents
        cl = 20
        for (cx, cy), (hx, hy), (vx, vy) in [
            ((x1, y1), (x1 + cl, y1), (x1, y1 + cl)),
            ((x2, y1), (x2 - cl, y1), (x2, y1 + cl)),
            ((x1, y2), (x1 + cl, y2), (x1, y2 - cl)),
            ((x2, y2), (x2 - cl, y2), (x2, y2 - cl)),
        ]:
            cv2.line(frame, (cx, cy), (hx, hy), color, 3)
            cv2.line(frame, (cx, cy), (vx, vy), color, 3)

        # label
        if show_labels or show_conf:
            parts = []
            if show_labels:
                parts.append(f"ID #{track_id}")
            if show_conf:
                parts.append(f"{confidence * 100:.1f}%")
            label = " | ".join(parts)

            font = cv2.FONT_HERSHEY_SIMPLEX
            (tw, th), _ = cv2.getTextSize(label, font, 0.55, 1)
            label_y = y1 - 10 if y1 - 10 > th else y2 + th + 10
            cv2.rectangle(frame, (x1, label_y - th - 8), (x1 + tw + 14, label_y + 4), color, -1)
            cv2.putText(frame, label, (x1 + 7, label_y - 4), font, 0.55, (0, 0, 0), 2, cv2.LINE_AA)

    @staticmethod
    def _format_time(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        return f"{h:02d}:{m:02d}:{s:02d}"
