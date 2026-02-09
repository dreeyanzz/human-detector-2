# Architecture

This document describes the system design of the Person Detection System v2.0.

## High-Level Overview

The application is a two-tier web architecture: a Python backend handles camera capture and AI detection, while a React frontend provides the user interface in the browser.

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│  ┌─────────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  VideoFeed   │  │ Controls │  │  Stats / Settings │  │
│  │  <img> MJPEG │  │ Start    │  │  Polling 500ms    │  │
│  │              │  │ Pause    │  │  Optimistic PUT   │  │
│  │              │  │ Stop     │  │                   │  │
│  └──────┬───────┘  └────┬─────┘  └────────┬──────────┘  │
│         │               │                 │              │
└─────────┼───────────────┼─────────────────┼──────────────┘
          │ MJPEG stream  │ POST            │ GET/PUT
          │ GET /api/stream│ /api/*         │ /api/stats,settings
          ▼               ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI (Uvicorn)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │              API Routes (/api/*)                  │   │
│  │  stream.py  controls.py  stats.py  settings.py   │   │
│  │                  screenshots.py                   │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │              DetectionEngine                      │   │
│  │  ┌────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │ Camera │→ │ YOLO     │→ │ JPEG Encode      │  │   │
│  │  │ OpenCV │  │ ByteTrack│  │ Frame + Stats     │  │   │
│  │  └────────┘  └──────────┘  └──────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Static files: frontend/dist/index.html, assets/*        │
└──────────────────────────────────────────────────────────┘
```

## Backend Architecture

### DetectionEngine (`backend/detector.py`)

The core class. A single instance is created at app startup and shared across all API route handlers.

**State Management:**

All mutable state is protected by a single `threading.Lock`:

```
_lock protects:
├── _running, _paused          (control state)
├── _people_count, _total_unique, _fps, _session_start  (stats)
├── _confidence, _camera_index, _model_name, ...        (settings)
├── _jpeg_frame                (latest encoded frame)
├── _raw_frame                 (latest raw frame for screenshots)
└── _all_seen_ids              (tracking ID accumulator)
```

**Critical Design Rule:** The lock is NEVER held during the expensive `model.track()` call. The detection loop reads settings under the lock, releases it, runs detection, then re-acquires the lock to write results. This prevents the API from blocking on detection.

**Threading Model:**

```
Main Thread (Uvicorn)
├── Handles all HTTP requests
├── Reads stats/settings under lock (fast)
└── Writes settings under lock (fast)

Detection Thread (daemon)
├── Reads camera frames via OpenCV
├── Runs YOLO model.track() (10-50ms per frame)
├── Encodes result to JPEG
├── Writes frame + stats under lock
└── Signals frame_event for MJPEG generators

MJPEG Generator (per-connection, runs in Uvicorn's thread pool)
├── Waits on frame_event
├── Reads _jpeg_frame under lock
└── Yields multipart MJPEG frame
```

**Frame Signaling:**

A `threading.Event` (`_frame_event`) coordinates between the detection thread and MJPEG stream generators:

1. Detection thread encodes a new frame and calls `_frame_event.set()`
2. MJPEG generators are blocked on `_frame_event.wait(timeout=1.0)`
3. When signaled, generators read the latest JPEG bytes and yield them
4. Generator calls `_frame_event.clear()` and waits again

The 1-second timeout prevents generators from hanging indefinitely if detection stops.

### FastAPI App (`backend/app.py`)

Responsibilities:
1. Creates the single `DetectionEngine` instance
2. Registers all API routes under the `/api` prefix
3. Serves the built React frontend as static files
4. Provides a catch-all SPA route (returns `index.html` for any non-API path)

### Route Modules (`backend/routes/`)

Each route module follows the same pattern:

```python
router = APIRouter()

def create_router(engine: DetectionEngine) -> APIRouter:
    @router.get("/endpoint")
    def handler():
        return engine.some_method()
    return router
```

The `create_router` factory pattern allows each route module to receive the shared engine instance without global state.

| Module | Endpoints | Purpose |
|--------|-----------|---------|
| `stream.py` | `GET /api/stream` | MJPEG video stream via `StreamingResponse` |
| `controls.py` | `POST /api/start,pause,stop` | Detection lifecycle |
| `stats.py` | `GET /api/stats` | Current statistics |
| `settings.py` | `GET,PUT /api/settings` | Read/update settings |
| `screenshots.py` | `POST /api/screenshot`, `GET /api/screenshots[/name]` | Capture and serve screenshots |

## Frontend Architecture

### Component Tree

```
App
├── Layout                    (header + responsive grid shell)
│   ├── VideoFeed             (MJPEG <img> tag)
│   ├── ControlBar            (Start / Pause / Stop / Screenshot buttons)
│   ├── StatsPanel            (4 stat cards: people, unique, FPS, time)
│   ├── SettingsPanel         (confidence slider, model radio, toggles)
│   └── ScreenshotGallery    (expandable thumbnail grid)
```

### State Management

No state management library. The app uses two custom hooks:

- **`useStats()`** -- Polls `GET /api/stats` every 500ms. Returns the latest `Stats` object. All components read from this single source of truth.
- **`useSettings()`** -- Fetches settings on mount, returns current settings and an `update()` function. Updates are optimistic: the UI updates immediately, then syncs with the server. On error, it reverts to the server's state.

### Video Streaming

The video feed uses the browser's native MJPEG support:

```html
<img src="/api/stream?t=1234567890" />
```

- The `?t=` cache-busting parameter forces a new connection when detection starts
- The browser handles frame decoding natively -- zero JavaScript needed for video
- Connection is automatically closed when the `<img>` element is removed from the DOM

**Why MJPEG over WebSocket?**

- MJPEG is simpler: no JavaScript frame handling, no canvas rendering, no binary decoding
- Browser-native: the `<img>` tag handles everything
- Good enough performance for 720p at 15-20 FPS
- WebSocket would add complexity (binary frame protocol, canvas rendering, reconnection logic) with no meaningful benefit for this use case

### Layout

CSS Grid with Tailwind:
- **Desktop (lg+):** Side-by-side layout -- video area (flex-1) + sidebar (320px fixed)
- **Mobile:** Stacked -- video on top, sidebar below

### Theme

Dark theme matching the original tkinter app:
- Background: `gray-950` (#030712)
- Cards: `gray-900` (#111827) and `gray-800` (#1f2937)
- Accent: `#00d4ff` (cyan-400)
- All interactive elements use the accent color for consistency

## Path Resolution (Dev vs. Frozen)

The app runs in two modes:

| | Development | PyInstaller (frozen) |
|---|---|---|
| Detection | `sys.frozen` is `False` | `sys.frozen` is `True` |
| Base dir | `Path(__file__).parent.parent` | `sys._MEIPASS` (temp extraction dir) |
| Models | `project_root/yolov8n.pt` | `_MEIPASS/yolov8n.pt` |
| Frontend | `project_root/frontend/dist/` | `_MEIPASS/frontend/dist/` |
| Screenshots | `project_root/screenshots/` | `exe_dir/screenshots/` (writable) |

Key distinction: `_MEIPASS` is read-only (extracted bundle), so screenshots use the directory next to the exe (`sys.executable.parent`) which is writable.

Two helper functions in `detector.py` handle this:
- `_base_dir()` -- Returns `_MEIPASS` or project root (for bundled read-only data)
- `_writable_dir()` -- Returns exe directory or project root (for screenshots)

## Detection Pipeline Detail

```
1. Camera Capture
   cv2.VideoCapture(camera_index)
   Set 1280x720 resolution
   cap.read() → BGR numpy array

2. YOLO Inference
   model.track(frame, persist=True, tracker="bytetrack.yaml",
               conf=threshold, classes=[0], verbose=False)
   - persist=True: maintains tracker state across frames
   - classes=[0]: filters to "person" class only
   - ByteTrack: assigns persistent IDs to tracked persons

3. Result Processing
   For each detection box:
   - Extract bounding box coordinates (x1, y1, x2, y2)
   - Extract confidence score and track ID
   - Accumulate track IDs in all_seen_ids set
   - Draw bounding box, corner accents, and label on frame

4. Frame Encoding
   cv2.imencode(".jpg", frame, [JPEG_QUALITY, 80])
   → JPEG bytes stored in _jpeg_frame

5. FPS Calculation
   Exponential moving average: fps = 0.8 * old_fps + 0.2 * instant_fps
   Smooths out frame-to-frame jitter

6. Distribution
   _frame_event.set() wakes MJPEG generators
   Stats available via GET /api/stats
```

## YOLO Models

| Model | File | Size | Speed | Accuracy | Use Case |
|-------|------|------|-------|----------|----------|
| Nano | `yolov8n.pt` | ~6 MB | Fast (~15-25 FPS) | Good | Default, real-time |
| Medium | `yolov8m.pt` | ~52 MB | Slower (~8-15 FPS) | Better | When accuracy matters |

Models auto-download from Ultralytics on first use if the `.pt` file is missing. In the frozen exe, `yolov8n.pt` is bundled.

## Security Considerations

- The app binds to `127.0.0.1` only (localhost) -- not accessible from other machines
- No authentication (not needed for a single-user desktop app)
- Screenshot filenames use timestamps only -- no user input in file paths
- The `/api/screenshots/{name}` endpoint validates the file exists within the screenshots directory
