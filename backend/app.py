"""
FastAPI application — serves the React frontend and the detection API.
"""

import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.detector import DetectionEngine
from backend.routes import stream, controls, settings, stats, screenshots, faces


def _find_frontend_dist() -> Path:
    """Locate frontend/dist in both dev and PyInstaller frozen mode."""
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS) / "frontend" / "dist"
    return Path(__file__).resolve().parent.parent / "frontend" / "dist"


# Single shared engine instance
engine = DetectionEngine()

app = FastAPI(title="Person Detection System")

# Register API routes under /api
for module in (stream, controls, settings, stats, screenshots, faces):
    app.include_router(module.create_router(engine), prefix="/api")

# Serve built React frontend (production)
FRONTEND_DIST = _find_frontend_dist()
if FRONTEND_DIST.is_dir():
    # Serve static assets (JS/CSS/images)
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    # Catch-all: serve index.html for any non-API route (SPA routing)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse(FRONTEND_DIST / "index.html")
