from fastapi import APIRouter
from fastapi.responses import FileResponse

from backend.detector import DetectionEngine, SCREENSHOT_DIR

router = APIRouter()


def create_router(engine: DetectionEngine) -> APIRouter:
    @router.post("/screenshot")
    def take_screenshot():
        return engine.take_screenshot()

    @router.get("/screenshots")
    def list_screenshots():
        return engine.list_screenshots()

    @router.get("/screenshots/{name}")
    def get_screenshot(name: str):
        path = SCREENSHOT_DIR / name
        if not path.exists() or not path.is_file():
            return {"status": "error", "message": "Not found"}
        return FileResponse(path, media_type="image/jpeg")

    return router
