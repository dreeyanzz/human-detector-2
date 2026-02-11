# Person Detection System v2.0

Real-time person detection and tracking powered by YOLOv8. A modern web application with a React frontend and FastAPI backend, packaged as a standalone Windows executable for easy distribution.

## Features

- **Live Video Detection** -- Real-time person detection from webcam with bounding boxes, tracking IDs, and confidence scores
- **Person Tracking** -- ByteTrack algorithm assigns persistent IDs across frames, counts unique individuals
- **Adjustable Settings** -- Confidence threshold slider, model selection (fast vs. accurate), display toggles
- **Screenshot Capture** -- Save annotated frames as JPEG with one click, browse in a built-in gallery
- **Session Statistics** -- Live people count, total unique individuals, FPS, and session duration
- **Face Recognition** -- Enroll people by photo, identify them by name in the live feed, export/import face databases
- **Standalone Distribution** -- Package as a single-folder Windows executable -- no installs required for customers

## Quick Start

### For Developers

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies and start
cd frontend && npm install && cd ..

# Run the app (builds frontend automatically if needed)
python run.py
```

The app opens at **http://localhost:8000**.

### For Customers

Double-click `PersonDetector.exe`. The browser opens automatically. That's it.

See [DEPLOYMENT.md](DEPLOYMENT.md) for how to build and distribute the exe.

## Project Structure

```
human-detector-2/
├── backend/                 # FastAPI server + detection engine
│   ├── app.py              # FastAPI app, serves API + static frontend
│   ├── detector.py          # DetectionEngine class (YOLO + ByteTrack)
│   └── routes/              # API route handlers
├── frontend/                # React + Vite + Tailwind CSS
│   └── src/
│       ├── components/      # UI components (VideoFeed, StatsPanel, etc.)
│       └── hooks/           # React hooks (useStats, useSettings)
├── screenshots/             # Saved detection screenshots
├── run.py                   # Dev launcher (auto-installs everything)
├── run_exe.py               # Frozen exe entry point
├── build.py                 # Build script for PyInstaller exe
├── requirements.txt         # Python dependencies
├── yolov8n.pt               # YOLOv8 nano model (~6 MB)
└── yolov8m.pt               # YOLOv8 medium model (~52 MB, optional)
```

## Documentation

| Document | Description |
|----------|-------------|
| [USER_GUIDE.md](USER_GUIDE.md) | End-user guide -- interface walkthrough, features, troubleshooting |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, data flow, threading model, design decisions |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Developer setup, how to add features, debugging guide |
| [API.md](API.md) | Full REST API reference with examples |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Building the exe, distributing to customers, troubleshooting |
| [CLAUDE.md](CLAUDE.md) | AI assistant context for Claude Code |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Detection | YOLOv8 (Ultralytics) + ByteTrack |
| Computer Vision | OpenCV |
| Backend | FastAPI + Uvicorn |
| Frontend | React 19 + TypeScript + Tailwind CSS |
| Build Tool | Vite |
| Packaging | PyInstaller |

## License

Proprietary. All rights reserved.
