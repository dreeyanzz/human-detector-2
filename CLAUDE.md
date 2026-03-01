# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Person Detection System v2.0 -- a real-time person detection and tracking web application using YOLOv8 and OpenCV. React + Tailwind CSS frontend served by a FastAPI backend. Distributed to customers as a standalone Windows exe via PyInstaller.

## Commands

| Task | Command |
|------|---------|
| Run the app (production) | `python run.py` |
| Install Python deps | `pip install -r requirements.txt` |
| Install frontend deps | `cd frontend && npm install` |
| Build frontend | `cd frontend && npm run build` |
| Dev: backend with reload | `uvicorn backend.app:app --reload --port 8000` |
| Dev: frontend with HMR | `cd frontend && npm run dev` |
| Build standalone exe | `python build.py` |
| Build + publish GitHub release | `python release.py v1.2.3 [--notes "..."]` |

There is no linter configuration and no automated test suite.
`release.py` requires the `gh` CLI to be installed and authenticated (`gh auth login`).

## Architecture

### Backend (`backend/`)

- **`app.py`** -- FastAPI application. Mounts API routes under `/api` and serves the built React static files for all other paths.
- **`detector.py`** -- `DetectionEngine` class. Thread-safe person detection using YOLOv8 + ByteTrack. Runs detection in a daemon thread, encodes annotated frames to JPEG for MJPEG streaming. A single `threading.Lock` protects shared state; the lock is NOT held during the expensive `model.track()` call.
- **`routes/`** -- FastAPI routers split by concern: `stream.py` (MJPEG), `controls.py` (start/pause/stop), `settings.py`, `stats.py`, `screenshots.py`, `faces.py` (face DB CRUD + export/import). Each uses a `create_router(engine)` factory pattern.
- **`face_db.py`** -- `FaceDatabase` class. Stores 128-d dlib face encodings per person name, persisted to `faces/face_db.pkl` in the writable directory. Recognition runs in a `ProcessPoolExecutor` (1 worker) to isolate native dlib crashes; falls back to disabling recognition after 3 consecutive crashes. `_recognize_worker` is the top-level function submitted to the process pool (must be importable at module scope).

### Frontend (`frontend/`)

Vite + React 19 + TypeScript + Tailwind CSS.

- **`src/api.ts`** -- Thin fetch wrappers for all `/api` endpoints.
- **`src/hooks/useStats.ts`** -- Polls `GET /api/stats` every 500ms.
- **`src/hooks/useSettings.ts`** -- Fetches and optimistically updates settings.
- **`src/hooks/useFaces.ts`** -- Fetches and refreshes the enrolled face list from `GET /api/faces`.
- **`src/components/`** -- `Layout`, `VideoFeed` (MJPEG via `<img>`), `ControlBar`, `StatsPanel`, `SettingsPanel`, `ScreenshotGallery`, `FacePanel` (enroll/delete/export/import faces). Shared UI primitives live in `src/components/ui/` (Toast, Modal, Spinner, Skeleton, ToggleSwitch, Tooltip, etc.).
- **`src/types.ts`** -- Shared TypeScript interfaces: `Stats`, `Settings`, `Screenshot`, `FacePerson`.

### Data Flow

```
Camera -> OpenCV VideoCapture -> YOLOv8 model.track(ByteTrack)
  -> Detection results (boxes, track IDs, confidence)
  -> Draw overlays on frame -> cv2.imencode JPEG
  -> MJPEG StreamingResponse -> <img> in React frontend
  -> Stats polled via REST -> StatsPanel + SettingsPanel
```

### Packaging (`build.py`, `run_exe.py`)

- `build.py` runs PyInstaller to produce `dist/PersonDetector/` with the exe and all dependencies.
- `run_exe.py` is the frozen entry point -- no installs, just model load and server start.
- Path resolution uses `sys.frozen` / `sys._MEIPASS` to find bundled data files.
- `_base_dir()` returns read-only bundle root; `_writable_dir()` returns the exe's directory for screenshots.

### Key Defaults

- Confidence threshold: 0.45 (adjustable via UI, range 0.1-0.95)
- Camera index: 0 (selectable in UI)
- Detection class filter: `[0]` (person only)
- JPEG quality: 80
- Camera resolution: 1280x720
- Server: 127.0.0.1:8000
- Color scheme: dark theme (gray-950) with `#00d4ff` cyan accent
- Face recognition: disabled by default, tolerance 0.6 (range 0.3-0.8; lower = stricter)
- Face DB location: `faces/face_db.pkl` (next to exe in production, project root in dev)

### Model Files

YOLOv8 weights live in project root:
- `yolov8n.pt` -- nano (~6 MB, fast, bundled in exe)
- `yolov8m.pt` -- medium (~52 MB, accurate, optional)
- Models auto-download from Ultralytics on first run if missing

### Dependencies

Python: `ultralytics`, `opencv-python`, `fastapi`, `uvicorn`, `face_recognition`, `dlib`, `Pillow`
Frontend: `react`, `react-dom`, `tailwindcss`, `vite`, `typescript`
Build: `pyinstaller`

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) -- System design, threading model, design decisions
- [DEVELOPMENT.md](DEVELOPMENT.md) -- Developer setup, how to add features, debugging
- [API.md](API.md) -- Full REST API reference with examples
- [DEPLOYMENT.md](DEPLOYMENT.md) -- Building the exe, distributing to customers
