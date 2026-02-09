"""
FastAPI application — serves the React frontend and the detection API.
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.detector import DetectionEngine
from backend.routes import stream, controls, settings, stats, screenshots

# Single shared engine instance
engine = DetectionEngine()

app = FastAPI(title="Person Detection System")

# Register API routes under /api
for module in (stream, controls, settings, stats, screenshots):
    app.include_router(module.create_router(engine), prefix="/api")

# Serve built React frontend (production)
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.is_dir():
    # Serve static assets (JS/CSS/images)
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    # Catch-all: serve index.html for any non-API route (SPA routing)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        from fastapi.responses import FileResponse
        return FileResponse(FRONTEND_DIST / "index.html")
