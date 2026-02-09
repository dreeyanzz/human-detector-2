from fastapi import APIRouter

from backend.detector import DetectionEngine

router = APIRouter()


def create_router(engine: DetectionEngine) -> APIRouter:
    @router.get("/stats")
    def get_stats():
        return engine.get_stats()

    return router
