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


def status(msg: str, end: str = "\n") -> None:
    print(f"  {msg}", end=end, flush=True)


def install_python_deps() -> None:
    status("Installing Python packages...  ", end="")
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "-q", "-r", str(REQUIREMENTS)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print("done")


def install_and_build_frontend() -> None:
    if shutil.which("npm") is None:
        print("\n  Node.js is not installed.")
        print("  Download it from https://nodejs.org and re-run this script.")
        sys.exit(1)

    if not (FRONTEND / "node_modules").is_dir():
        status("Installing frontend packages...  ", end="")
        subprocess.check_call(["npm", "install"], cwd=str(FRONTEND), shell=True,
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("done")

    if not DIST.is_dir():
        status("Building frontend...  ", end="")
        subprocess.check_call(["npm", "run", "build"], cwd=str(FRONTEND), shell=True,
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("done")


def ensure_model() -> None:
    model = ROOT / "yolov8n.pt"
    if not model.exists():
        status("Downloading detection model (~6 MB)...  ", end="")
        from ultralytics import YOLO
        YOLO("yolov8n.pt")
        print("done")


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

    status(f"Starting server...  done")
    print()
    print(f"  App is running at http://{host}:{port}")
    print(f"  Your browser should open automatically.")
    print()
    print(f"  Press Ctrl+C to stop.")
    print()

    import uvicorn
    uvicorn.run("backend.app:app", host=host, port=port, log_level="warning")


def main() -> None:
    print()
    print("  ======================================")
    print("    Person Detection System v2.0")
    print("  ======================================")
    print()

    install_python_deps()
    install_and_build_frontend()
    ensure_model()

    status("Loading detection model...  ", end="")
    # force-import so the model loads before we say "done"
    from backend.detector import DetectionEngine
    DetectionEngine()
    print("done")
    print()

    start_server()


if __name__ == "__main__":
    main()
