# API Reference

All endpoints are served under the `/api` prefix. The backend runs on `http://127.0.0.1:8000` by default.

## Detection Controls

### POST /api/start

Start the detection engine. Opens the webcam and begins processing frames.

**Request:** No body required.

**Response:**

```json
// Success
{ "status": "started" }

// Already running
{ "status": "already_running" }

// Camera error
{ "status": "error", "message": "Cannot open camera 0" }
```

**Side Effects:**
- Opens webcam at the configured camera index
- Sets resolution to 1280x720
- Resets all session stats (people count, unique IDs, screenshots, FPS)
- Starts the detection thread
- Begins producing MJPEG frames for `/api/stream`

---

### POST /api/pause

Toggle pause/resume. When paused, the detection thread stops processing new frames but the camera stays open and the last frame remains visible.

**Request:** No body required.

**Response:**

```json
// Paused
{ "status": "paused" }

// Resumed
{ "status": "resumed" }

// Not running
{ "status": "not_running" }
```

---

### POST /api/stop

Stop the detection engine. Releases the webcam and returns a session summary.

**Request:** No body required.

**Response:**

```json
// Success
{
  "status": "stopped",
  "duration": "00:05:32",
  "total_unique": 12,
  "screenshots": 3
}

// Not running
{ "status": "not_running" }
```

**Side Effects:**
- Stops the detection thread (waits up to 3 seconds)
- Releases the webcam
- Closes the MJPEG stream (connected clients receive the end of stream)

---

## Video Stream

### GET /api/stream

Live MJPEG video stream of annotated detection frames. Connect with an `<img>` tag or any MJPEG-capable client.

**Response:** `multipart/x-mixed-replace; boundary=frame`

Each part is a JPEG image:

```
--frame
Content-Type: image/jpeg

<JPEG binary data>
```

**Usage in HTML:**

```html
<img src="/api/stream?t=1234567890" />
```

The `?t=` parameter is optional cache-busting to force a fresh connection.

**Behavior:**
- Blocks until the first frame is available
- Streams at the detection FPS (typically 15-20 FPS)
- Ends when detection is stopped
- Multiple clients can connect simultaneously (each gets their own generator, sharing the same frame data)

**Frame Content:**
- 1280x720 resolution (or camera's actual resolution)
- JPEG quality: 80
- Annotated with: bounding boxes, corner accents, ID labels, confidence percentages (based on display settings)

---

## Statistics

### GET /api/stats

Returns current detection statistics. Designed to be polled (the frontend polls every 500ms).

**Response:**

```json
{
  "people_count": 3,
  "total_unique": 7,
  "fps": 16.4,
  "session_time": "00:02:15",
  "screenshots": 1,
  "running": true,
  "paused": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `people_count` | int | Number of people detected in the current frame |
| `total_unique` | int | Total unique tracking IDs seen this session |
| `fps` | float | Smoothed frames per second (exponential moving average) |
| `session_time` | string | Elapsed time since start in `HH:MM:SS` format. Empty string when not running |
| `screenshots` | int | Number of screenshots taken this session |
| `running` | bool | Whether detection is active |
| `paused` | bool | Whether detection is paused |

---

## Settings

### GET /api/settings

Returns current detection settings.

**Response:**

```json
{
  "confidence": 0.45,
  "camera_index": 0,
  "model_name": "yolov8n.pt",
  "show_labels": true,
  "show_confidence": true
}
```

---

### PUT /api/settings

Update one or more settings. Partial updates are supported -- only include the fields you want to change.

**Request Body (JSON):**

```json
{ "confidence": 0.6 }
```

or multiple fields:

```json
{
  "confidence": 0.6,
  "show_labels": false,
  "model_name": "yolov8m.pt"
}
```

**Response:** Returns the full settings object after the update (same format as GET).

| Field | Type | Range | Notes |
|-------|------|-------|-------|
| `confidence` | float | 0.1 -- 0.95 | Clamped to range. Takes effect on the next frame |
| `camera_index` | int | 0, 1, 2 | Only takes effect on next start |
| `model_name` | string | `"yolov8n.pt"`, `"yolov8m.pt"` | Triggers model reload (blocks briefly) |
| `show_labels` | bool | | Toggle tracking ID labels on bounding boxes |
| `show_confidence` | bool | | Toggle confidence percentage on bounding boxes |

**Note:** Changing `model_name` triggers a synchronous model reload. This takes 1-3 seconds and the API call will block until complete. During this time, the detection thread continues running with the old model until the new one is ready.

---

## Screenshots

### POST /api/screenshot

Capture the current annotated frame as a JPEG screenshot.

**Request:** No body required.

**Response:**

```json
// Success
{ "status": "ok", "filename": "detection_20260210_013702.jpg" }

// No frame available (detection not running)
{ "status": "error", "message": "No frame available" }
```

**Side Effects:**
- Saves the frame to `screenshots/detection_YYYYMMDD_HHMMSS.jpg`
- Increments the session screenshot counter

---

### GET /api/screenshots

List all saved screenshots, newest first.

**Response:**

```json
[
  { "name": "detection_20260210_013702.jpg", "size": 122225 },
  { "name": "detection_20260210_013415.jpg", "size": 118442 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Filename |
| `size` | int | File size in bytes |

Returns an empty array `[]` if no screenshots exist.

---

### GET /api/screenshots/{name}

Serve a specific screenshot file.

**Parameters:**
- `name` (path) -- The screenshot filename (e.g., `detection_20260210_013702.jpg`)

**Response:**
- **200:** JPEG image file (`image/jpeg`)
- **200 with error JSON:** `{ "status": "error", "message": "Not found" }` if the file doesn't exist

---

## Static Frontend

### GET /\{path\}

Any path that doesn't start with `/api/` serves the React single-page application. The frontend is served from `frontend/dist/` (or the bundled location in the exe).

- `GET /` -- Returns `index.html`
- `GET /assets/*` -- Returns static assets (JS, CSS)
- `GET /anything-else` -- Returns `index.html` (SPA client-side routing)

---

## Error Handling

The API uses standard HTTP status codes. Most endpoints return JSON with a `status` field:

- `"started"`, `"stopped"`, `"paused"`, `"resumed"`, `"ok"` -- Success
- `"error"` -- Error, with a `message` field explaining what went wrong
- `"already_running"`, `"not_running"` -- Idempotent state (not an error, just informational)

All endpoints return **200** regardless of the `status` value. The frontend checks the `status` field, not the HTTP code.
