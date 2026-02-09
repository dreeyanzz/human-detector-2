"""
Single-command launcher for the Person Detection System.

Usage:
    python run.py              # start on port 8000
    python run.py --port 9000  # custom port
"""

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
DIST = FRONTEND / "dist"


def build_frontend() -> None:
    if not (FRONTEND / "node_modules").is_dir():
        print("[run] Installing frontend dependencies...")
        subprocess.check_call(["npm", "install"], cwd=str(FRONTEND), shell=True)

    if not DIST.is_dir():
        print("[run] Building frontend...")
        subprocess.check_call(["npm", "run", "build"], cwd=str(FRONTEND), shell=True)
    else:
        print("[run] Frontend already built (delete frontend/dist to rebuild)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Person Detection System")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    build_frontend()

    if not args.no_browser:
        import webbrowser
        import threading

        def _open():
            import time
            time.sleep(1.5)
            webbrowser.open(f"http://{args.host}:{args.port}")

        threading.Thread(target=_open, daemon=True).start()

    print(f"[run] Starting server at http://{args.host}:{args.port}")

    import uvicorn
    uvicorn.run("backend.app:app", host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
