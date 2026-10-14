import os
import tempfile

from dotenv import load_dotenv
from gradio_client import Client, handle_file

load_dotenv()

OCR_SERVICE_URL = os.environ["OCR_SERVICE_URL"]
HF_TOKEN = os.environ["HF_TOKEN"]

_client = None

def get_client():
    global _client
    if _client is None:
        _client = Client(OCR_SERVICE_URL, token=HF_TOKEN)
    return _client

def run_remote_ocr(image_bytes: bytes):
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=".jpg",
            delete=False
        ) as f:
            f.write(image_bytes)
            temp_path = f.name

        result = get_client.predict(
            handle_file(temp_path),
            api_name="/gradio_wrapper"
        )

        return result

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
