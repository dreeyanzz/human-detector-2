from fastapi import APIRouter

from backend.detector import DetectionEngine

router = APIRouter()


def create_router(engine: DetectionEngine) -> APIRouter:
    @router.post("/start")
    def start():
        return engine.start()

    @router.post("/pause")
    def pause():
        return engine.pause()

    @router.post("/stop")
    def stop():
        return engine.stop()

    return router
