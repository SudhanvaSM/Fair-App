# cd backend
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

from fastapi import APIRouter, HTTPException, Request, Response, UploadFile, File, Depends, status
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from fastapi.concurrency import run_in_threadpool

import os

from app.services.ocr_remote import run_remote_ocr
from app.services.parser import parse_receipt
from app.auth.authentication import get_current_user
from backend.app.limiter import limiter

# Set this is to True to print parsing results along with confidence scoring
DEBUG = False

router = APIRouter()
router.state.limiter = limiter
router.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
@limiter.limit("5/minute")
async def upload(
    request: Request, 
    response: Response, 
    file: UploadFile = File(...), 
    user_id: str = Depends(get_current_user)
    ):

    try:
        # Read the image file as bytes
        contents = await file.read()

        raw_text = await run_in_threadpool(run_remote_ocr, contents)

        raw_json = await run_in_threadpool(parse_receipt, raw_text)

        return {
            "raw": raw_json
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OCR Failure",
        )

    except RateLimitExceeded:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests, please try again",
        )