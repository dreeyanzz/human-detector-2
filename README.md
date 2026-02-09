# Person Detection System v2.0

Real-time person detection and tracking using YOLOv8, served as a web application with a React frontend and FastAPI backend.

## Quick Start

```bash
pip install -r requirements.txt
python run.py
```

This installs dependencies, builds the frontend (if needed), and opens the app at `http://localhost:8000`.

## Prerequisites

- Python 3.10+
- Node.js 18+ (for building the frontend)
- A webcam

## Development

Run the backend and frontend dev server separately for hot-reload:

```bash
# Terminal 1 — backend
uvicorn backend.app:app --reload --port 8000

# Terminal 2 — frontend (proxies /api to backend)
cd frontend && npm run dev
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/stream` | MJPEG video stream |
| POST | `/api/start` | Start detection |
| POST | `/api/pause` | Toggle pause/resume |
| POST | `/api/stop` | Stop detection |
| GET | `/api/stats` | Current stats |
| GET/PUT | `/api/settings` | Get/update settings |
| POST | `/api/screenshot` | Take screenshot |
| GET | `/api/screenshots` | List screenshots |
| GET | `/api/screenshots/{name}` | Serve screenshot file |

## Project Structure

```
backend/          FastAPI server + detection engine
frontend/         React + Vite + Tailwind CSS
screenshots/      Saved detection screenshots
run.py            Single-command launcher
yolov8n.pt        YOLOv8 nano model (auto-downloads)
yolov8m.pt        YOLOv8 medium model (optional)
```
