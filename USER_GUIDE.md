# User Guide

This guide walks you through everything you can do with the Person Detection System. No technical knowledge required.

## Getting Started

### Launching the App

**Standalone exe (customers):**
Double-click `PersonDetector.exe`. Your default browser opens automatically to the app.

**From source (developers):**
```bash
python run.py
```
Then open **http://localhost:8000** in your browser (it opens automatically on first run).

### What to Expect on First Launch

- The YOLOv8 model file downloads automatically if not already present (~6 MB for the Fast model)
- The browser opens to a dark-themed interface with a video area and sidebar panels
- Detection is **not** running yet -- you need to click **Start**

## Interface Overview

The interface has three main areas:

1. **Header** -- App title, live/paused/stopped status indicator, version badge
2. **Video area** (left/top) -- Live camera feed with detection overlays, control buttons above it
3. **Sidebar** (right/bottom on small screens) -- Collapsible panels for Statistics, Settings, Face Recognition, and Screenshots

Each sidebar panel can be collapsed or expanded by clicking its header. Your open/closed preferences are remembered across sessions.

## Starting Detection

1. Click the **Start** button above the video area
2. The app requests access to your webcam
3. A "Connecting to camera..." spinner appears briefly
4. The live video feed starts with a red **LIVE** badge in the top-left corner

If the camera fails to connect, you'll see an error message. Make sure no other application is using the camera.

## Understanding the Video Feed

When detection is running, you'll see overlays on each detected person:

- **Bounding box** -- A colored rectangle around each person, with corner accents
- **Tracking ID** -- A label like `ID #3` above the box, identifying each individual across frames
- **Confidence score** -- A percentage like `92.5%` showing how confident the model is
- **Recognized name** -- If face recognition is enabled and a face matches an enrolled person, the name replaces the ID label

The **LIVE** badge (red, top-left corner) confirms the feed is active. When paused, it changes to a yellow **PAUSED** badge.

## Controls

The control bar sits above the video feed.

| Button | What it does |
|--------|-------------|
| **Start** | Begins detection, opens the camera, starts the live feed |
| **Pause** / **Resume** | Freezes or unfreezes the video feed without closing the camera |
| **Stop** | Ends the session (shows a confirmation dialog first) |
| **Screenshot** | Captures the current annotated frame and saves it |
| **FPS** | Displays the current frames-per-second (read-only badge, appears while running) |

### Stop Confirmation

Clicking **Stop** shows a confirmation dialog. This prevents accidentally ending a session. Click **Stop Detection** to confirm or **Cancel** to continue.

## Statistics Panel

The Statistics panel shows four cards updated in real time:

| Stat | Meaning |
|------|---------|
| **In Frame** | Number of people currently visible in the camera frame. Highlights when > 0 |
| **Total Unique** | Cumulative count of distinct individuals seen during the session (tracked by ID) |
| **FPS** | Processing speed in frames per second |
| **Session** | How long the current detection session has been running (MM:SS or HH:MM:SS) |

Statistics reset when you stop and start a new session.

## Settings Panel

### Confidence Threshold

Controls how confident the model must be before marking something as a person.

- **Higher values** (e.g. 0.80) = fewer detections but almost no false positives
- **Lower values** (e.g. 0.25) = more detections but may include false positives
- **Default:** 0.45
- **Range:** 0.10 to 0.95, in steps of 0.05

Adjust this if you're seeing too many false detections (raise it) or missing real people (lower it).

### Model Selection

Choose between two detection models:

| Model | Speed | Accuracy | Size |
|-------|-------|----------|------|
| **Fast** (yolov8n) | Higher FPS | Good for most cases | ~6 MB |
| **Accurate** (yolov8m) | Lower FPS | Better at distance/crowded scenes | ~52 MB |

The Accurate model downloads automatically when first selected. Switching models briefly interrupts the stream while the new model loads.

### Display Toggles

- **Show ID Labels** -- Show or hide tracking ID labels above bounding boxes
- **Show Confidence** -- Show or hide confidence percentages

Both are enabled by default.

### Face Recognition Toggle

- **Face Recognition** -- Enable or disable face recognition during detection
- **Tolerance** slider -- Appears when face recognition is enabled. Controls how strict face matching is:
  - **Strict** (0.30) = only very close matches, fewer false identifications
  - **Lenient** (0.80) = more flexible matching, may occasionally misidentify
  - **Default:** 0.60

### Camera Selection

Choose which camera to use (Camera 0, 1, or 2). Camera 0 is your default webcam. Change this if you have multiple cameras connected.

## Face Recognition

Face recognition lets the system identify enrolled people by name during detection. Instead of showing "ID #3", it shows the person's actual name.

### Enabling Face Recognition

1. Open the **Settings** panel in the sidebar
2. Toggle **Face Recognition** on
3. Adjust the **Tolerance** slider if needed

### Enrolling Faces

Before the system can recognize someone, you need to enroll their face:

1. Open the **Face Recognition** panel in the sidebar
2. Type the person's name in the **Person name** field
3. Add photos using one of these methods:
   - **Drag and drop** image files onto the drop zone
   - **Click** the drop zone to open a file browser
4. The system processes each photo, detects the face, and stores the encoding
5. A progress bar shows enrollment progress for multiple photos

**Tips for good enrollment:**
- Use clear, well-lit photos where the face is visible
- Multiple photos from different angles improve recognition accuracy
- Each photo must contain at least one detectable face
- Photos must be under 10 MB each
- The sample count next to each person's name shows how many photos are enrolled

### GPU vs CPU Processing

A badge in the Face Recognition panel header shows whether face processing uses **GPU** (green) or **CPU** (yellow):

- **GPU** -- Faster processing, requires a CUDA-compatible NVIDIA GPU with dlib CUDA support
- **CPU** -- Works on all systems, slower but reliable

If GPU processing fails during enrollment, you'll be prompted to continue with CPU. A yellow hint banner suggests installing PyTorch with CUDA for faster detection.

### Managing Enrolled People

Each enrolled person appears in a list showing their name, initial avatar, and sample count.

- **Delete a person** -- Click the trash icon next to their name. A confirmation dialog appears before deletion. All enrolled samples for that person are permanently removed.

### Exporting and Importing the Face Database

You can back up or transfer enrolled faces between systems:

- **Export** -- Click the download icon button at the top of the Face Recognition panel. Saves a `face_db.pkl` file to your downloads folder. Only available when at least one person is enrolled.
- **Import** -- Click the upload icon button and select a `.pkl` file. Imported faces are merged with existing enrollments by default (new names are added, existing names get additional samples).

## Screenshots

### Capturing a Screenshot

While detection is running, click the **Screenshot** button in the control bar. A toast notification confirms the save. The screenshot count badge on the Screenshots panel header updates.

### Browsing Screenshots

Open the **Screenshots** panel to see a thumbnail grid of all saved screenshots. Screenshots are sorted by capture time.

### Lightbox Viewer

Click any thumbnail to open it in a full-size lightbox overlay. In the lightbox:

- **Navigate** -- Use the left/right arrow buttons to move between screenshots
- **Download** -- Click the download icon to save the image to your computer
- **Delete** -- Click the trash icon (confirms before deleting)
- **Close** -- Click outside the lightbox or press the close button

### Deleting Screenshots

You can delete screenshots two ways:

1. **From the grid** -- Hover over a thumbnail and click the X button that appears
2. **From the lightbox** -- Click the trash icon in the lightbox toolbar

Both show a confirmation dialog before deleting.

## Troubleshooting

### No Video Feed

- **Camera in use** -- Close other applications using the camera (video call apps, other browser tabs)
- **Wrong camera selected** -- Try a different camera index in Settings
- **Camera permissions** -- Make sure your browser or OS allows camera access
- **Detection not started** -- Click the Start button

### Slow Performance / Low FPS

- **Switch to the Fast model** -- In Settings, select "Fast" instead of "Accurate"
- **Raise the confidence threshold** -- Fewer detections = less processing
- **Disable face recognition** -- Face recognition adds processing overhead
- **Close other heavy applications** -- Free up CPU/GPU resources
- **Check GPU status** -- The Face Recognition panel shows if you're running on CPU

### Windows SmartScreen Warning

When running the exe for the first time, Windows may show a SmartScreen warning. Click **More info** then **Run anyway**. This happens because the exe is not code-signed.

### Face Recognition Not Working

- **No faces enrolled** -- You need to enroll at least one person before recognition works
- **Poor photo quality** -- Use clear, well-lit photos for enrollment
- **Face not detected in photo** -- Try a different photo where the face is more visible
- **Tolerance too strict** -- Increase the tolerance slider in Settings
- **dlib crashes** -- If face recognition fails repeatedly (3 times), it's automatically disabled for the session. This usually means dlib is incompatible with your Python version. Restart the app to try again.

### Screenshots Not Saving

- **Detection not running** -- Screenshots can only be taken while detection is active
- **Disk permissions** -- Make sure the application has write access to the screenshots folder
