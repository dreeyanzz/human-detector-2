"""
Build standalone PersonDetector.exe using PyInstaller.

Usage:
    python build.py

Output:
    dist/PersonDetector/PersonDetector.exe   (+ supporting files)

The customer receives the dist/PersonDetector folder — just run the exe.
"""

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
DIST = FRONTEND / "dist"


def step(msg: str, end: str = "\n") -> None:
    print(f"  {msg}", end=end, flush=True)


def main() -> None:
    print()
    print("  ======================================")
    print("    Building PersonDetector.exe")
    print("  ======================================")
    print()

    # 1. Ensure PyInstaller is installed
    step("Checking PyInstaller...  ", end="")
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "-q", "pyinstaller"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print("done")

    # 2. Build frontend if needed
    if not DIST.is_dir():
        step("Building frontend...  ", end="")
        if not (FRONTEND / "node_modules").is_dir():
            subprocess.check_call(["npm", "install"], cwd=str(FRONTEND), shell=True,
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.check_call(["npm", "run", "build"], cwd=str(FRONTEND), shell=True,
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("done")

    # 3. Ensure model exists
    model_path = ROOT / "yolov8n.pt"
    if not model_path.exists():
        step("Downloading YOLOv8n model...  ", end="")
        from ultralytics import YOLO
        YOLO("yolov8n.pt")
        print("done")

    # 4. Run PyInstaller
    step("Packaging with PyInstaller (this takes a few minutes)...")
    print()

    sep = ";" if sys.platform == "win32" else ":"

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", "PersonDetector",
        "--noconfirm",
        "--console",
        # Bundle data files
        "--add-data", f"{DIST}{sep}frontend/dist",
        "--add-data", f"{model_path}{sep}.",
        # Hidden imports PyInstaller often misses
        "--hidden-import", "uvicorn.logging",
        "--hidden-import", "uvicorn.loops",
        "--hidden-import", "uvicorn.loops.auto",
        "--hidden-import", "uvicorn.protocols",
        "--hidden-import", "uvicorn.protocols.http",
        "--hidden-import", "uvicorn.protocols.http.auto",
        "--hidden-import", "uvicorn.protocols.websockets",
        "--hidden-import", "uvicorn.protocols.websockets.auto",
        "--hidden-import", "uvicorn.lifespan",
        "--hidden-import", "uvicorn.lifespan.on",
        "--hidden-import", "uvicorn.lifespan.off",
        "--hidden-import", "backend",
        "--hidden-import", "backend.app",
        "--hidden-import", "backend.detector",
        "--hidden-import", "backend.routes",
        "--hidden-import", "backend.routes.stream",
        "--hidden-import", "backend.routes.controls",
        "--hidden-import", "backend.routes.settings",
        "--hidden-import", "backend.routes.stats",
        "--hidden-import", "backend.routes.screenshots",
        "--hidden-import", "backend.routes.faces",
        "--hidden-import", "backend.face_db",
        "--hidden-import", "concurrent.futures",
        "--hidden-import", "concurrent.futures.process",
        "--hidden-import", "multiprocessing",
        "--hidden-import", "multiprocessing.pool",
        "--hidden-import", "multiprocessing.managers",
        "--hidden-import", "face_recognition",
        "--hidden-import", "face_recognition_models",
        "--hidden-import", "dlib",
        "--hidden-import", "python_multipart",
        "--hidden-import", "multipart",
        "--hidden-import", "PIL",
        "--hidden-import", "PIL.Image",
        "--hidden-import", "PIL.ImageOps",
        "--hidden-import", "PIL.ExifTags",
        "--hidden-import", "setuptools",
        "--hidden-import", "pkg_resources",
        # Collect data files (models, configs)
        "--collect-data", "ultralytics",
        "--collect-data", "face_recognition_models",
        # Entry point
        "run_exe.py",
    ]

    subprocess.check_call(cmd, cwd=str(ROOT))

    print()
    output = ROOT / "dist" / "PersonDetector"

    # 5. Create zip archive
    step("Creating zip archive...  ", end="")
    zip_path = ROOT / "dist" / "PersonDetector"
    shutil.make_archive(str(zip_path), "zip", root_dir=str(ROOT / "dist"), base_dir="PersonDetector")
    print("done")

    print()
    step("Build complete!")
    print()
    step(f"Output: {output}")
    step(f"Run:    {output / 'PersonDetector.exe'}")
    step(f"Zip:    {zip_path}.zip")
    print()


if __name__ == "__main__":
    main()
