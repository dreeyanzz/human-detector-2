from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.detector import DetectionEngine

router = APIRouter()


def create_router(engine: DetectionEngine) -> APIRouter:
    @router.get("/stream")
    def video_stream():
        return StreamingResponse(
            engine.frame_generator(),
            media_type="multipart/x-mixed-replace; boundary=frame",
        )

    return router
