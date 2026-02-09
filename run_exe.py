"""
Entry point for the PyInstaller-built exe.
No installs needed — everything is bundled.
Shows clear progress so the customer knows what's happening.
"""

import sys
import threading
import webbrowser
import time


def status(msg: str, end: str = "\n") -> None:
    print(f"  {msg}", end=end, flush=True)


def main() -> None:
    print()
    print("  ======================================")
    print("    Person Detection System v2.0")
    print("  ======================================")
    print()

    status("Loading detection model...  ", end="")
    # This import triggers model load inside DetectionEngine.__init__
    from backend.app import app  # noqa: F811
    print("done")

    host = "127.0.0.1"
    port = 8000

    def _open_browser():
        time.sleep(1.5)
        webbrowser.open(f"http://{host}:{port}")

    threading.Thread(target=_open_browser, daemon=True).start()

    status("Starting server...  done")
    print()
    print(f"  App is running at http://{host}:{port}")
    print(f"  Your browser should open automatically.")
    print()
    print(f"  Close this window to stop the application.")
    print()

    import uvicorn
    uvicorn.run(app, host=host, port=port, log_level="warning")


if __name__ == "__main__":
    main()
