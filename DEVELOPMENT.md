# Development Guide

This guide covers everything you need to develop, extend, and debug the Person Detection System.

## Prerequisites

- **Python 3.10+** -- Backend runtime
- **Node.js 18+** -- Frontend build tooling
- **A webcam** -- For testing detection
- **Git** -- Version control

## Initial Setup

```bash
# Clone the repo
git clone https://github.com/dreeyanzz/human-detector-2.git
cd human-detector-2

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install && cd ..
```

## Running in Development

### Option 1: Single Command (Recommended for First Run)

```bash
python run.py
```

This auto-installs everything, builds the frontend, and starts the server. The downside is no hot-reload.

### Option 2: Separate Backend + Frontend (Recommended for Active Development)

**Terminal 1 -- Backend (auto-reloads on Python changes):**

```bash
uvicorn backend.app:app --reload --port 8000
```

**Terminal 2 -- Frontend (hot-reloads on React/CSS changes):**

```bash
cd frontend
npm run dev
```

The Vite dev server starts on `http://localhost:5173` and proxies `/api/*` requests to the backend on port 8000. Use the Vite URL for development.

## Project Structure Walkthrough

### Backend

```
backend/
├── app.py              # FastAPI setup, route registration, static file serving
├── detector.py          # DetectionEngine class -- the core of the application
├── face_db.py           # FaceDatabase class -- face encoding storage, enrollment, recognition
└── routes/
    ├── __init__.py
    ├── stream.py        # GET /api/stream -- MJPEG video
    ├── controls.py      # POST /api/start, /api/pause, /api/stop
    ├── stats.py         # GET /api/stats
    ├── settings.py      # GET/PUT /api/settings
    ├── screenshots.py   # Screenshot capture and serving
    └── faces.py         # Face enrollment, listing, deletion, export/import
```

**Key file: `detector.py`**

This is where all the detection logic lives. The `DetectionEngine` class manages:
- Camera capture (OpenCV)
- YOLO inference with ByteTrack tracking
- Frame annotation (bounding boxes, labels)
- JPEG encoding for MJPEG streaming
- Thread-safe state for stats, settings, and frames
- Async face recognition via `ProcessPoolExecutor` (delegates to `face_db.py`)

**Key file: `face_db.py`**

Houses the `FaceDatabase` class and recognition worker function. Manages:
- Persistent face encoding storage (`face_db.pkl` via pickle)
- Face enrollment from images (detect face, compute 128-d encoding, store)
- Face recognition (compare encodings against enrolled database)
- GPU/CPU detection model selection with automatic HOG fallback
- Export/import of the face database for backup and transfer

### Frontend

```
frontend/src/
├── main.tsx             # React entry point
├── App.tsx              # Root component, wires hooks to components
├── api.ts               # Fetch wrappers for all /api endpoints
├── types.ts             # TypeScript interfaces (Stats, Settings, Screenshot, FacePerson)
├── index.css            # Tailwind imports
├── hooks/
│   ├── useStats.ts      # Polls GET /api/stats every 500ms
│   ├── useSettings.ts   # Fetches + optimistically updates settings
│   └── useFaces.ts      # Fetches enrolled face list, provides refresh
└── components/
    ├── Layout.tsx            # Page shell: header + responsive grid
    ├── VideoFeed.tsx         # MJPEG <img> tag
    ├── ControlBar.tsx        # Start / Pause / Stop / Screenshot buttons
    ├── StatsPanel.tsx        # 4 stat cards
    ├── SettingsPanel.tsx     # Confidence slider, model radio, toggles, face recognition
    ├── ScreenshotGallery.tsx # Expandable screenshot thumbnail grid
    ├── FacePanel.tsx         # Face enrollment, listing, export/import, GPU status
    └── ui/                   # Shared UI primitives (Modal, Toast, Spinner, etc.)
```

### Root Files

```
run.py          # Dev launcher: installs deps, builds frontend, starts server
run_exe.py      # PyInstaller entry point (frozen mode)
build.py        # Builds the standalone .exe
requirements.txt
```

## How to Add a New API Endpoint

Example: Adding a `POST /api/reset-stats` endpoint that resets session statistics.

### 1. Add the Method to DetectionEngine

In `backend/detector.py`, add a new public method:

```python
def reset_stats(self) -> dict:
    with self._lock:
        self._people_count = 0
        self._all_seen_ids.clear()
        self._total_unique = 0
        self._screenshot_count = 0
        return {"status": "ok"}
```

### 2. Create or Extend a Route Module

You can either add to an existing route file or create a new one. To add to `controls.py`:

```python
@router.post("/reset-stats")
def reset_stats():
    return engine.reset_stats()
```

If creating a new file (e.g., `backend/routes/admin.py`):

```python
from fastapi import APIRouter
from backend.detector import DetectionEngine

router = APIRouter()

def create_router(engine: DetectionEngine) -> APIRouter:
    @router.post("/reset-stats")
    def reset_stats():
        return engine.reset_stats()
    return router
```

Then register it in `backend/app.py`:

```python
from backend.routes import stream, controls, settings, stats, screenshots, admin

for module in (stream, controls, settings, stats, screenshots, admin):
    app.include_router(module.create_router(engine), prefix="/api")
```

### 3. Add the Frontend API Call

In `frontend/src/api.ts`:

```typescript
export const resetStats = () =>
  json<{ status: string }>(fetch(`${BASE}/reset-stats`, { method: "POST" }));
```

### 4. Use It in a Component

```tsx
import { resetStats } from "../api";

<button onClick={() => resetStats()}>Reset Stats</button>
```

## How to Add a New UI Component

Example: Adding a "Session Log" panel that shows detection events.

### 1. Create the Component

Create `frontend/src/components/SessionLog.tsx`:

```tsx
interface LogEntry {
  time: string;
  message: string;
}

export default function SessionLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Session Log
      </h3>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {entries.map((e, i) => (
          <div key={i} className="text-xs text-gray-400">
            <span className="text-accent font-mono">{e.time}</span> {e.message}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Wire It Into App.tsx

```tsx
import SessionLog from "./components/SessionLog";

// Inside the sidebar <aside>:
<div className="bg-gray-900 rounded-xl p-4">
  <SessionLog entries={logEntries} />
</div>
```

### 3. Style Conventions

- Use `bg-gray-900` for card backgrounds, `bg-gray-800` for inner cards
- Use `text-accent` (`#00d4ff`) for emphasis values
- Use `text-gray-400` for labels, `text-gray-300` for body text
- Use `rounded-xl` for outer cards, `rounded-lg` for inner elements
- Use `text-sm` or `text-xs` for secondary text

## How to Add a New Detection Feature

Example: Adding zone-based detection (count people in specific screen regions).

### 1. Add State to DetectionEngine

```python
# In __init__:
self._zones: list[dict] = []  # [{"x1":0,"y1":0,"x2":640,"y2":720,"count":0}]

# In _detection_loop, after processing boxes:
for zone in self._zones:
    zone["count"] = sum(
        1 for box in boxes
        if self._box_in_zone(box, zone)
    )
```

### 2. Add API Endpoints

Create `backend/routes/zones.py` with GET/PUT for zone configuration.

### 3. Add Frontend Controls

Create a `ZoneEditor` component that draws rectangles on the video canvas overlay.

## Face Recognition Architecture

Face recognition runs alongside YOLO detection. Here's how the pieces fit together:

### Data Flow

```
Enrollment:
  Upload photo → PIL decode + EXIF fix → resize (max 800px)
    → face_recognition.face_locations (CNN or HOG)
    → face_recognition.face_encodings → 128-d vector
    → stored in FaceDatabase._encodings dict → pickled to face_db.pkl

Live Recognition:
  Detection loop spots a person (track_id) → crop bounding box region
    → submit to ThreadPoolExecutor → ThreadPool calls ProcessPoolExecutor
    → _recognize_worker: detect face, encode, compare against all stored encodings
    → face_distance() → best match within tolerance → cache result by track_id
```

### Key Design Decisions

- **ProcessPoolExecutor** -- Face recognition runs in a separate process to isolate native dlib crashes from the main detection thread. If the worker process crashes 3 times, face recognition is automatically disabled for the session.
- **Track ID caching** -- Once a face is recognized for a given track ID, the result is cached. The system won't re-recognize the same tracked person.
- **Retry with cooldown** -- If recognition fails (no face detected in the crop), the system retries up to `_face_max_retries` times with a cooldown interval between attempts.
- **GPU/CPU fallback** -- Enrollment tries CNN (GPU) first, then falls back to HOG (CPU) if GPU fails. The frontend prompts the user to continue with CPU when GPU fails mid-batch.
- **Tolerance** -- The `face_recognition_tolerance` setting (0.3--0.8) controls the maximum Euclidean distance between face encodings to consider a match.

### Files Involved

| File | Role |
|------|------|
| `backend/face_db.py` | `FaceDatabase` class, `_recognize_worker` function, GPU detection |
| `backend/detector.py` | Integrates face recognition into the detection loop, manages async dispatch |
| `backend/routes/faces.py` | REST endpoints for enrollment, listing, deletion, export/import |
| `frontend/src/components/FacePanel.tsx` | Enrollment UI, drag-and-drop, GPU status, export/import buttons |
| `frontend/src/components/SettingsPanel.tsx` | Face recognition toggle and tolerance slider |
| `frontend/src/hooks/useFaces.ts` | Fetches enrolled face list |
| `frontend/src/api.ts` | `uploadFacePhoto`, `deleteFace`, `fetchGpuInfo`, `exportFaceDb`, `importFaceDb` |

### Persistence

Face encodings are stored in `faces/face_db.pkl` (relative to the writable directory). The file is a pickled `dict[str, list[np.ndarray]]` mapping person names to lists of 128-d float arrays. The file is deleted when the last person is removed.

## Debugging

### Backend Logs

By default, `run.py` sets uvicorn to `log_level="warning"`. For verbose logs:

```bash
uvicorn backend.app:app --reload --port 8000 --log-level debug
```

### Detection Thread Crashes

The detection thread catches exceptions silently. To see errors, add print statements or check the console:

```python
# In _detection_loop, the except block:
except Exception as e:
    print(f"Detection error: {e}")
    import traceback
    traceback.print_exc()
```

### MJPEG Stream Not Showing

Common causes:
1. Detection not started (check `GET /api/stats` -- is `running` true?)
2. Camera not available (check the backend console for OpenCV errors)
3. Stale browser cache (add `?t=Date.now()` to the stream URL)
4. Multiple browser tabs holding the camera (close other tabs)

### Frontend Not Updating

1. Check browser DevTools Network tab -- are `/api/stats` requests succeeding?
2. Check the browser console for JavaScript errors
3. Try hard refresh (Ctrl+Shift+R) to clear cached assets

### PyInstaller Exe Crashes

1. Run the exe from a terminal to see error output:
   ```
   cd dist\PersonDetector
   PersonDetector.exe
   ```
2. Common issue: missing hidden imports. Add them to `build.py`'s `--hidden-import` list
3. Common issue: missing data files. Add them to `--add-data` in `build.py`

## Code Style

- **Python:** No linter configured. Follow existing patterns: type hints on public methods, docstrings on classes and public methods, `_private` prefix for internal methods
- **TypeScript:** Strict mode enabled. No linter configured. Use functional components with hooks. Keep components focused on presentation
- **Tailwind:** Use utility classes directly. No custom CSS except the base `@tailwind` imports. Follow the dark theme palette (see ARCHITECTURE.md)

## Testing

There is no automated test suite. Manual testing checklist:

1. `python run.py` -- App starts, browser opens
2. Click Start -- Live video with bounding boxes appears
3. Stats update in real-time (people count, FPS, session time)
4. Adjust confidence slider -- Detection sensitivity changes
5. Switch model -- Detection restarts with new model
6. Take screenshot -- Appears in gallery
7. Pause/Resume -- Video freezes/unfreezes
8. Stop -- Session summary stats shown
9. Resize browser -- Layout adapts (sidebar moves below video on small screens)
10. Enroll a face -- Type a name, drop a photo, confirm it appears in the enrolled list
11. Enable face recognition in Settings -- Recognized names appear on bounding boxes
12. Adjust tolerance slider -- Matching strictness changes
13. Delete an enrolled person -- Confirm removal via the confirmation dialog
14. Export face DB -- Downloads `face_db.pkl`
15. Import face DB -- Upload a previously exported `.pkl`, confirm faces merge correctly
16. GPU status badge -- Shows "GPU" (green) or "CPU" (yellow) correctly

## Dependencies

### Python (requirements.txt)

| Package | Purpose |
|---------|---------|
| `ultralytics` | YOLOv8 models and inference |
| `opencv-python` | Camera capture, image processing, drawing |
| `fastapi` | Web framework for the API |
| `uvicorn` | ASGI server to run FastAPI |
| `face_recognition` | Face detection and 128-d encoding (wraps dlib) |
| `python-multipart` | Multipart form parsing for file uploads |

### Frontend (package.json)

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI framework |
| `typescript` | Type safety |
| `vite` | Build tool and dev server |
| `tailwindcss` | Utility-first CSS framework |
| `autoprefixer`, `postcss` | CSS processing for Tailwind |

### Build-Only

| Package | Purpose |
|---------|---------|
| `pyinstaller` | Packages Python app as standalone exe |
