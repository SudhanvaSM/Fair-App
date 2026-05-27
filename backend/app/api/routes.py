# cd backend
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

from fastapi import APIRouter, UploadFile, File
import os

from app.services.ocr_service import run_ocr
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

        # Send the image bytes to OCR to extract structured data
        raw_text = run_ocr(contents)

        # Pass the strcuctured data to parser logic
        raw_json = parse_receipt(raw_text)

        if DEBUG:
            print("RETURNING:", raw_json)

        return {
            "raw": raw_json,
        }

    except Exception as e:
        return{"error": str(e)}