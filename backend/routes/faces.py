import io

import cv2
import numpy as np
from PIL import Image, ImageOps
from fastapi import APIRouter, UploadFile, File, Form, Query

from backend.detector import DetectionEngine

router = APIRouter()


def _decode_upload(data: bytes) -> np.ndarray | None:
    """Decode uploaded image bytes to BGR numpy array, applying EXIF orientation."""
    try:
        pil_img = Image.open(io.BytesIO(data))
        pil_img = ImageOps.exif_transpose(pil_img)
        pil_img = pil_img.convert("RGB")
        rgb = np.asarray(pil_img)
        return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    except Exception:
        return None


def create_router(engine: DetectionEngine) -> APIRouter:
    @router.get("/faces")
    def list_faces():
        return engine.list_faces()

    @router.get("/faces/gpu")
    def gpu_info():
        return {"has_gpu": engine.face_has_gpu()}

    @router.post("/faces/enroll")
    def enroll_from_camera(body: dict):
        name = body.get("name", "").strip()
        if not name:
            return {"status": "error", "message": "Name is required"}
        cpu_only = body.get("cpu_only", False)
        return engine.enroll_face_from_camera(name, cpu_only=cpu_only)

    @router.post("/faces/upload")
    async def upload_face(
        name: str = Form(...),
        files: list[UploadFile] = File(...),
        cpu_only: str = Form("false"),
    ):
        name = name.strip()
        if not name:
            return {"status": "error", "message": "Name is required"}
        force_cpu = cpu_only.lower() in ("true", "1", "yes")
        data = await files[0].read()
        bgr = _decode_upload(data)
        if bgr is None:
            return {"status": "error", "message": f"{files[0].filename}: could not decode image"}
        result = engine.enroll_face_from_image(name, bgr, cpu_only=force_cpu)
        result.setdefault("filename", files[0].filename)
        return result

    @router.delete("/faces/{name}")
    def delete_face(name: str):
        return engine.delete_face(name)

    return router
