# cd backend
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

import asyncio
import logging
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Depends, status
from fastapi.concurrency import run_in_threadpool
from PIL import Image
import io
import os

from app.services.ocr_remote import run_remote_ocr
from app.services.parser import parse_receipt
from app.auth.authentication import get_current_user
from app.limiter.limiter import limiter
from app.limiter.guard import global_budget, ip_throttle

# Set this is to True to print parsing results along with confidence scoring
DEBUG = False

logger = logging.getLogger("fair.upload")
router = APIRouter()

MAX_BYTES = 8 * 1024 * 1024

OCR_SEM = asyncio.Semaphore(4)

def _is_supported_image(b: bytes) -> bool:
    return (
        b.startswith(b"\xff\xd8\xff")                      # JPEG magic code
        or b.startswith(b"\x89PNG\r\n\x1a\n")              # PNG magic code
        or (b[:4] == b"RIFF" and b[8:12] == b"WEBP")       # WebP magic code
    )

def _check_dims(data: bytes, max_pixels=25_000_000):
    Image.MAX_IMAGE_PIXELS = max_pixels
    with Image.open(io.BytesIO(data)) as im:
        w, h = im.size
        if w * h > max_pixels: raise ValueError("too many pixels")
        im.verify()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
@limiter.limit("5/minute;50/day")
async def upload(
    request: Request, 
    _ip: None = Depends(ip_throttle),
    file: UploadFile = File(...), 
    user_id: str = Depends(get_current_user),
    _g: None = Depends(global_budget)
    ):

    data = await file.read()
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Empty file")
    if len(data) > MAX_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Image too large")
    if not _is_supported_image(data):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Use a JPEG, PNG or WebP image")

    try:
        await asyncio.wait_for(OCR_SEM.acquire(), timeout=2)
    except asyncio.TimeoutError:
        raise HTTPException(503, "Busy, try again")

    try:
        raw_text = await asyncio.wait_for(run_in_threadpool(_check_dims, run_remote_ocr, data), timeout=2)
    except Exception: 
        raise HTTPException(422, "Invalid image")
    except Exception:
        logger.exception("OCR service failed user=%s", user_id)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "OCR service unavailable, try again")
    finally:
        OCR_SEM.release()

    try:
        await asyncio.wait_for(OCR_SEM.acquire(), timeout=2)
    except asyncio.TimeoutError:
        raise HTTPException(503, "Busy, try again")
    try:
        parsed = await asyncio.wait_for(run_in_threadpool(parse_receipt, raw_text), timeout=2)
    except Exception:
        logger.exception("Parse failed user=%s", user_id)
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Could not read this receipt")
    finally:
        OCR_SEM.release()

    logger.info("scan ok user=%s bytes=%d items=%d", user_id, len(data), len(parsed.get("items", [])))

    return {"raw": parsed}

@router.get("/health")
async def health_check():
    return {"status": "ok"}