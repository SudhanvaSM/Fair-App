# cd backend
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

import logging
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Depends, status
from fastapi.concurrency import run_in_threadpool

import os

from app.services.ocr_remote import run_remote_ocr
from app.services.parser import parse_receipt
from app.auth.authentication import get_current_user
from app.limiter.limiter import limiter

# Set this is to True to print parsing results along with confidence scoring
DEBUG = False

logger = logging.getLogger("fair.upload")
router = APIRouter()

MAX_BYTES = 8 * 1024 * 1024

def _is_supported_image(b: bytes) -> bool:
    return (
        b.startswith(b"\xff\xd8\xff")                      # JPEG magic code
        or b.startswith(b"\x89PNG\r\n\x1a\n")              # PNG magic code
        or (b[:4] == b"RIFF" and b[8:12] == b"WEBP")       # WebP magic code
    )

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
@limiter.limit("5/minute;50/day")
async def upload(
    request: Request, 
    file: UploadFile = File(...), 
    user_id: str = Depends(get_current_user)
    ):

    data = await file.read()
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Empty file")
    if len(data) > MAX_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Image too large")
    if not _is_supported_image(data):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Use a JPEG, PNG or WebP image")

    try:
        raw_text = await run_in_threadpool(run_remote_ocr, data)
    except Exception:
        logger.exception("OCR service failed user=%s", user_id)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "OCR service unavailable, try again")

    try:
        parsed = await run_in_threadpool(parse_receipt, raw_text)
    except Exception:
        logger.exception("Parse failed user=%s", user_id)
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Could not read this receipt")

    logger.info("scan ok user=%s bytes=%d items=%d", user_id, len(data), len(parsed.get("items", [])))

    return {"raw": parsed}

@router.get("/health")
async def health_check():
    return {"status": "ok"}