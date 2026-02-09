"""
Person Detection System — single-file launcher.

Just run:
    python run.py

Everything is handled automatically:
  1. Installs Python dependencies (FastAPI, ultralytics, opencv, etc.)
  2. Installs Node.js frontend dependencies
  3. Builds the React frontend
  4. Downloads the YOLO model if missing
  5. Starts the server and opens your browser
"""

import subprocess
import sys
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
DIST = FRONTEND / "dist"
REQUIREMENTS = ROOT / "requirements.txt"


def log(msg: str) -> None:
    print(f"\n  [setup] {msg}")


def install_python_deps() -> None:
    log("Checking Python dependencies...")
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "-q", "-r", str(REQUIREMENTS)],
        stdout=subprocess.DEVNULL,
    )
    log("Python dependencies ready.")


def install_and_build_frontend() -> None:
    if shutil.which("npm") is None:
        print("\n  [error] Node.js / npm is not installed.")
        print("          Download it from https://nodejs.org and re-run this script.")
        sys.exit(1)

    if not (FRONTEND / "node_modules").is_dir():
        log("Installing frontend dependencies (first run only)...")
        subprocess.check_call(["npm", "install"], cwd=str(FRONTEND), shell=True,
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    if not DIST.is_dir():
        log("Building frontend (first run only)...")
        subprocess.check_call(["npm", "run", "build"], cwd=str(FRONTEND), shell=True,
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    log("Frontend ready.")


def ensure_model() -> None:
    model = ROOT / "yolov8n.pt"
    if not model.exists():
        log("Downloading YOLOv8n model (first run only, ~6 MB)...")
        from ultralytics import YOLO
        YOLO("yolov8n.pt")
        log("Model downloaded.")


def start_server() -> None:
    import threading
    import webbrowser
    import time

    host = "127.0.0.1"
    port = 8000

    def _open_browser():
        time.sleep(1.5)
        webbrowser.open(f"http://{host}:{port}")

    threading.Thread(target=_open_browser, daemon=True).start()

    log(f"Starting server at http://{host}:{port}")
    print("         Press Ctrl+C to stop.\n")

    import uvicorn
    uvicorn.run("backend.app:app", host=host, port=port, log_level="info")


def main() -> None:
    print("\n  ====================================")
    print("   Person Detection System v2.0")
    print("  ====================================")

    install_python_deps()
    install_and_build_frontend()
    ensure_model()
    start_server()


if __name__ == "__main__":
    main()
