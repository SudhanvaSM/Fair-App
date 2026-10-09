# cd backend
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

from fastapi import APIRouter, UploadFile, File
import os

from app.services.ocr_remote import run_remote_ocr
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

        raw_text = run_remote_ocr(contents)

        raw_json = parse_receipt(raw_text)


        return {
            "raw": raw_json
        }

    except Exception as e:
        return{"error": str(e)}