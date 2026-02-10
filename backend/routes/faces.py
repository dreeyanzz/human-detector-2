import asyncio
import io

import cv2
import numpy as np
from PIL import Image, ImageOps
from fastapi import APIRouter, UploadFile, File, Form, Query
from fastapi.responses import Response

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
        return engine.gpu_info()

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
        result = await asyncio.to_thread(engine.enroll_face_from_image, name, bgr, force_cpu)
        result.setdefault("filename", files[0].filename)
        return result

    @router.delete("/faces/{name}")
    def delete_face(name: str):
        return engine.delete_face(name)

    @router.get("/faces/export")
    def export_face_db():
        data = engine.export_face_db()
        return Response(
            content=data,
            media_type="application/octet-stream",
            headers={"Content-Disposition": 'attachment; filename="face_db.pkl"'},
        )

    @router.post("/faces/import")
    async def import_face_db(
        file: UploadFile = File(...),
        merge: str = Form("true"),
    ):
        data = await file.read()
        do_merge = merge.lower() in ("true", "1", "yes")
        return engine.import_face_db(data, do_merge)

    return router
