"""
FaceDatabase — thread-safe face encoding storage with pickle persistence.

Stores 128-d face encodings per person name, supports enrollment and recognition.
"""

import pickle
import threading
from pathlib import Path

# ---------------------------------------------------------------------------
# Compatibility shim: face_recognition_models uses pkg_resources which was
# removed in Python 3.14+.  Also handles PyInstaller frozen bundles where
# the package data lives under sys._MEIPASS.
# ---------------------------------------------------------------------------
import sys as _sys

try:
    import face_recognition_models  # noqa: F401
except (ImportError, ModuleNotFoundError, RuntimeError):
    import types

    _frm = types.ModuleType("face_recognition_models")
    _frm.__package__ = "face_recognition_models"
    _frm_dir = None

    # 1. PyInstaller frozen bundle: data collected into _MEIPASS
    if getattr(_sys, "frozen", False):
        candidate = Path(_sys._MEIPASS) / "face_recognition_models"
        if candidate.is_dir():
            _frm_dir = candidate

    # 2. Normal Python: use importlib to find installed package
    if _frm_dir is None:
        import importlib.util
        _frm_spec = importlib.util.find_spec("face_recognition_models")
        if _frm_spec and _frm_spec.submodule_search_locations:
            _frm_dir = Path(list(_frm_spec.submodule_search_locations)[0])

    # 3. Last resort: scan site-packages
    if _frm_dir is None:
        import site
        for sp in site.getsitepackages():
            candidate = Path(sp) / "face_recognition_models"
            if candidate.is_dir():
                _frm_dir = candidate
                break

    if _frm_dir is None:
        raise RuntimeError("Cannot locate face_recognition_models package")

    _models = _frm_dir / "models"
    _frm.pose_predictor_model_location = lambda: str(_models / "shape_predictor_68_face_landmarks.dat")
    _frm.pose_predictor_five_point_model_location = lambda: str(_models / "shape_predictor_5_face_landmarks.dat")
    _frm.face_recognition_model_location = lambda: str(_models / "dlib_face_recognition_resnet_model_v1.dat")
    _frm.cnn_face_detector_model_location = lambda: str(_models / "mmod_human_face_detector.dat")

    _sys.modules["face_recognition_models"] = _frm
# ---------------------------------------------------------------------------

import cv2
import dlib
import numpy as np
import face_recognition


_MAX_ENROLL = 800
_MAX_RECOGNIZE = 1500

# Detect GPU availability once at import time
HAS_GPU: bool = False
try:
    if dlib.DLIB_USE_CUDA and dlib.cuda.get_num_devices() > 0:
        HAS_GPU = True
except Exception:
    pass


def _prepare_rgb(bgr_image: np.ndarray, max_dim: int = _MAX_RECOGNIZE) -> np.ndarray:
    """Resize large images so face detectors work reliably, then convert to RGB."""
    h, w = bgr_image.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        bgr_image = cv2.resize(bgr_image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)


def _detect_and_encode(rgb: np.ndarray, model: str = "hog"):
    """Try to find a face and return (locations, encoding, gpu_failed).

    *gpu_failed* is True only when CNN was requested, GPU was available,
    but the CNN call raised an exception.
    """
    locations = None
    gpu_failed = False

    if model == "cnn":
        try:
            locations = face_recognition.face_locations(rgb, model="cnn")
        except Exception:
            gpu_failed = HAS_GPU  # only flag it when we actually expected GPU
            locations = None

    # HOG fallback (or primary when model="hog")
    if not locations:
        locations = face_recognition.face_locations(rgb, model="hog")
    if not locations:
        locations = face_recognition.face_locations(rgb, number_of_times_to_upsample=2, model="hog")
    if not locations:
        return None, None, gpu_failed

    encoding = face_recognition.face_encodings(rgb, known_face_locations=locations)[0]
    return locations, encoding, gpu_failed


def _recognize_worker(crop, tolerance, encodings_snapshot):
    """Run face recognition in a separate process (isolates native crashes)."""
    rgb = _prepare_rgb(crop)
    _, encoding, _ = _detect_and_encode(rgb)
    if encoding is None:
        return None
    if not encodings_snapshot:
        return None
    all_names: list[str] = []
    all_encs: list[np.ndarray] = []
    for person_name, encs in encodings_snapshot.items():
        for enc in encs:
            all_names.append(person_name)
            all_encs.append(enc)
    distances = face_recognition.face_distance(all_encs, encoding)
    best_idx = int(np.argmin(distances))
    if distances[best_idx] <= tolerance:
        return all_names[best_idx]
    return None


class FaceDatabase:
    """Persistent face encoding database."""

    def __init__(self, db_dir: Path) -> None:
        self._dir = db_dir
        self._dir.mkdir(parents=True, exist_ok=True)
        self._db_path = self._dir / "face_db.pkl"
        self._lock = threading.Lock()
        # name -> list of 128-d encoding arrays
        self._encodings: dict[str, list[np.ndarray]] = {}
        self._load()

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _load(self) -> None:
        if self._db_path.exists():
            with open(self._db_path, "rb") as f:
                self._encodings = pickle.load(f)

    def _save(self) -> None:
        if not self._encodings:
            self._db_path.unlink(missing_ok=True)
            return
        with open(self._db_path, "wb") as f:
            pickle.dump(self._encodings, f)

    # ------------------------------------------------------------------
    # Enrollment
    # ------------------------------------------------------------------

    def enroll_from_image(self, name: str, bgr_image: np.ndarray, cpu_only: bool = False) -> dict:
        """Detect a face in a BGR image, encode it, and store under *name*."""
        rgb = _prepare_rgb(bgr_image, max_dim=_MAX_ENROLL)
        model = "hog" if cpu_only else "cnn"
        _, encoding, gpu_failed = _detect_and_encode(rgb, model=model)
        result: dict = {}
        if gpu_failed:
            result["gpu_failed"] = True
        if encoding is None:
            return {**result, "status": "error", "message": "No face detected in image"}

        with self._lock:
            self._encodings.setdefault(name, []).append(encoding)
            sample_count = len(self._encodings[name])
            self._save()

        return {**result, "status": "ok", "name": name, "sample_count": sample_count}

    # ------------------------------------------------------------------
    # Recognition
    # ------------------------------------------------------------------

    def recognize(self, bgr_image: np.ndarray, tolerance: float = 0.6) -> str | None:
        """Return the best matching person name, or None."""
        rgb = _prepare_rgb(bgr_image)
        _, encoding, _ = _detect_and_encode(rgb)
        if encoding is None:
            return None

        with self._lock:
            if not self._encodings:
                return None
            all_names: list[str] = []
            all_encs: list[np.ndarray] = []
            for person_name, encs in self._encodings.items():
                for enc in encs:
                    all_names.append(person_name)
                    all_encs.append(enc)

        distances = face_recognition.face_distance(all_encs, encoding)
        best_idx = int(np.argmin(distances))
        if distances[best_idx] <= tolerance:
            return all_names[best_idx]
        return None

    # ------------------------------------------------------------------
    # Listing / deletion
    # ------------------------------------------------------------------

    def get_encodings_snapshot(self) -> dict[str, list[np.ndarray]]:
        """Return a shallow copy of encodings for cross-process use."""
        with self._lock:
            if not self._encodings:
                return {}
            return {k: list(v) for k, v in self._encodings.items()}

    def list_people(self) -> list[dict]:
        with self._lock:
            return [
                {"name": name, "sample_count": len(encs)}
                for name, encs in sorted(self._encodings.items())
            ]

    def delete_person(self, name: str) -> dict:
        with self._lock:
            if name not in self._encodings:
                return {"status": "error", "message": f"Person '{name}' not found"}
            del self._encodings[name]
            self._save()
        return {"status": "ok", "name": name}

    # ------------------------------------------------------------------
    # Export / Import
    # ------------------------------------------------------------------

    def export_bytes(self) -> bytes:
        """Serialize the entire face database to pickle bytes."""
        with self._lock:
            return pickle.dumps(self._encodings)

    def import_bytes(self, data: bytes, merge: bool) -> dict:
        """Import face encodings from pickle bytes.

        If *merge* is True, new names are added and existing names get their
        sample lists extended.  If False, the database is replaced entirely.
        """
        imported = pickle.loads(data)
        if not isinstance(imported, dict):
            return {"status": "error", "message": "Invalid face database format"}
        for key, val in imported.items():
            if not isinstance(key, str) or not isinstance(val, list):
                return {"status": "error", "message": "Invalid face database format"}

        with self._lock:
            if merge:
                for person_name, encodings in imported.items():
                    self._encodings.setdefault(person_name, []).extend(encodings)
            else:
                self._encodings = imported
            self._save()
            imported_names = sorted(imported.keys())
            total_people = len(self._encodings)

        return {
            "status": "ok",
            "imported_names": imported_names,
            "total_people": total_people,
        }
