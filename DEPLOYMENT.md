# Deployment Guide

How to build, distribute, and support the Person Detection System for customers.

## Building the Standalone Exe

### Prerequisites (Your Machine Only)

- Python 3.10+
- Node.js 18+
- All Python dependencies installed (`pip install -r requirements.txt`)

### Build Steps

```bash
python build.py
```

This single command:
1. Installs PyInstaller if not present
2. Builds the React frontend if not already built
3. Downloads the YOLO model if missing
4. Runs PyInstaller to create the executable

**Output:** `dist/PersonDetector/` folder containing the exe and all dependencies.

**Build time:** 3-5 minutes (first build). Subsequent builds reuse cached analysis.

### Build Output Contents

```
dist/PersonDetector/
├── PersonDetector.exe       # Main executable
├── _internal/               # Bundled Python runtime, libraries, and data
│   ├── frontend/dist/       # Built React frontend
│   ├── yolov8n.pt           # YOLO model
│   ├── *.dll                # Python, OpenCV, PyTorch DLLs
│   └── ...                  # Other bundled packages
```

Total size: ~800 MB uncompressed, ~290 MB zipped.

## Distributing to Customers

### Creating the Zip

```bash
# PowerShell
cd dist
Compress-Archive -Path PersonDetector -DestinationPath PersonDetector.zip
```

Or right-click the `PersonDetector` folder in File Explorer and select "Compress to ZIP file".

### What to Send

Send the customer `PersonDetector.zip` (~290 MB). This can be via:
- File sharing (Google Drive, Dropbox, OneDrive, WeTransfer)
- USB drive
- Internal file server

### Customer Instructions

Include these simple instructions:

```
1. Extract the PersonDetector.zip file
2. Open the PersonDetector folder
3. Double-click PersonDetector.exe
4. Your browser will open automatically
5. Click "Start" to begin detection
6. Close the black terminal window to stop the application
```

## What the Customer Needs

### Requirements

- **Windows 10 or 11** (64-bit)
- **A webcam** (built-in or USB)
- **A modern browser** (Chrome, Edge, Firefox -- already installed on Windows)

### What They Do NOT Need

- Python (bundled in the exe)
- Node.js (frontend is pre-built)
- Any software installation
- Admin privileges
- Internet connection (everything runs locally)

## Isolation

The application is fully portable and isolated:

- **No installation** -- Nothing is written to the registry, Program Files, or AppData
- **No system changes** -- No DLLs registered, no PATH modifications, no services created
- **Fully self-contained** -- Python runtime, all libraries, the model, and the frontend are inside the folder
- **Clean removal** -- Delete the folder and everything is gone
- **Screenshots** -- Saved in a `screenshots/` subfolder next to the exe (included in deletion)

## Updating Customers

When you release a new version:

1. Make your code changes
2. Run `python build.py` to create a new exe
3. Zip the `dist/PersonDetector/` folder
4. Send the new zip to the customer
5. Customer deletes the old folder and extracts the new one

There is no auto-update mechanism. Each release is a full replacement.

### Forcing a Frontend Rebuild

If you changed frontend code, delete the old build first:

```bash
# Delete old frontend build
rmdir /s /q frontend\dist

# Then build the exe
python build.py
```

## Troubleshooting

### Customer Reports: "The exe doesn't start"

**Cause:** Windows SmartScreen blocks unknown executables.
**Fix:** Right-click the exe > Properties > Check "Unblock" > OK. Or click "More info" > "Run anyway" on the SmartScreen popup.

### Customer Reports: "No video appears after clicking Start"

**Cause:** Camera is in use by another application (Zoom, Teams, etc.) or no camera is connected.
**Fix:** Close other apps using the camera. Check Windows Settings > Privacy > Camera to ensure camera access is enabled.

### Customer Reports: "Browser doesn't open"

**Cause:** Default browser not configured, or browser blocking localhost.
**Fix:** Manually open a browser and go to `http://127.0.0.1:8000`.

### Customer Reports: "The app is slow"

**Cause:** Running the accurate (medium) model on a machine without a GPU.
**Fix:** Switch to the "Fast (nano)" model in the Settings panel. The nano model runs 15-25 FPS on CPU.

### Customer Reports: "Windows Defender flags the exe"

**Cause:** PyInstaller executables are sometimes flagged as false positives.
**Fix:** Add an exception in Windows Defender for the PersonDetector folder. This is a known PyInstaller issue and not a real threat.

### Build Fails: "Hidden import not found"

**Cause:** PyInstaller missed a dynamic import.
**Fix:** Add the missing module to the `--hidden-import` list in `build.py` and rebuild.

### Build Fails: "No module named X"

**Cause:** A Python dependency is not installed in your environment.
**Fix:** `pip install X` then rebuild.

## Advanced: Customizing the Build

### Changing the Exe Name

In `build.py`, change the `--name` argument:

```python
"--name", "MyCustomName",
```

### Adding an Icon

Add an `.ico` file and pass it to PyInstaller in `build.py`:

```python
"--icon", "myicon.ico",
```

### Bundling the Medium Model

By default, only `yolov8n.pt` (nano) is bundled. To also include the medium model, add another `--add-data` line in `build.py`:

```python
"--add-data", f"{ROOT / 'yolov8m.pt'}{sep}.",
```

This increases the zip size by ~50 MB.

### Reducing Build Size

The ~800 MB size is mainly PyTorch (~500 MB). Options to reduce:
- Use `torch` CPU-only build instead of the full CUDA build
- Use `--exclude-module` in PyInstaller for unused torch submodules
- Use ONNX Runtime instead of PyTorch (requires code changes to the detection engine)
