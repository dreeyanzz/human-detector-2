from fastapi import APIRouter, Body

from backend.detector import DetectionEngine

router = APIRouter()


def create_router(engine: DetectionEngine) -> APIRouter:
    @router.get("/settings")
    def get_settings():
        return engine.get_settings()

    @router.put("/settings")
    def update_settings(data: dict = Body(...)):
        return engine.update_settings(data)

    return router
