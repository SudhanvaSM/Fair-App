# cd backend
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

from fastapi import APIRouter, UploadFile, File
import os

# from app.services.ocr_paddleocr import run_ocr
from app.services.parser import parse_receipt

# Set this is to True to print parsing results along with confidence scoring
DEBUG = False

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    try:
        # Read the image file as bytes
        contents = await file.read()

        return {
            "status": "backend_online",
            "filename": file.filename,
            "size": len(contents),
        }

    except Exception as e:
        return{"error": str(e)}