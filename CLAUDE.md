# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Person Detection System v2.0 — a real-time person detection and tracking web application using YOLOv8 and OpenCV. React + Tailwind CSS frontend served by a FastAPI backend.

## Commands

| Task | Command |
|------|---------|
| Run the app (production) | `python run.py` |
| Install Python deps | `pip install -r requirements.txt` |
| Install frontend deps | `cd frontend && npm install` |
| Build frontend | `cd frontend && npm run build` |
| Dev: backend only | `uvicorn backend.app:app --reload --port 8000` |
| Dev: frontend only | `cd frontend && npm run dev` |

There is no linter configuration and no automated test suite.

## Architecture

### Backend (`backend/`)

- **`app.py`** — FastAPI application. Mounts API routes under `/api` and serves the built React static files for all other paths.
- **`detector.py`** — `DetectionEngine` class. Thread-safe person detection using YOLOv8 + ByteTrack. Runs detection in a daemon thread, encodes annotated frames to JPEG for MJPEG streaming, and exposes stats/settings/screenshot methods. A single `threading.Lock` protects shared state; the lock is NOT held during the expensive `model.track()` call.
- **`routes/`** — FastAPI routers split by concern: `stream.py` (MJPEG), `controls.py` (start/pause/stop), `settings.py`, `stats.py`, `screenshots.py`.

### Frontend (`frontend/`)

Vite + React + TypeScript + Tailwind CSS.

- **`src/api.ts`** — Thin fetch wrappers for all `/api` endpoints.
- **`src/hooks/useStats.ts`** — Polls `GET /api/stats` every 500ms.
- **`src/hooks/useSettings.ts`** — Fetches and optimistically updates settings.
- **`src/components/`** — `Layout`, `VideoFeed` (MJPEG via `<img>`), `ControlBar`, `StatsPanel`, `SettingsPanel`, `ScreenshotGallery`.

### Data Flow

```
Camera → OpenCV VideoCapture → YOLOv8 model.track(ByteTrack)
  → Detection results (boxes, track IDs, confidence)
  → Draw overlays on frame → cv2.imencode JPEG
  → MJPEG StreamingResponse → <img> in React frontend
  → Stats polled via REST → StatsPanel + SettingsPanel
```

### Key Defaults

- Confidence threshold: 0.45 (adjustable via UI, range 0.1–0.95)
- Camera index: 0 (selectable in UI)
- Detection class filter: `[0]` (person only)
- Color scheme: dark theme (gray-950) with `#00d4ff` cyan accent

### Model Files

YOLOv8 weights live in project root:
- `yolov8n.pt` — nano (~6MB, fast)
- `yolov8m.pt` — medium (~52MB, accurate)
- Models auto-download from Ultralytics on first run if missing

### Dependencies

Python: `ultralytics`, `opencv-python`, `fastapi`, `uvicorn`
Frontend: `react`, `react-dom`, `tailwindcss`, `vite`, `typescript`
