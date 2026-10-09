import os
import tempfile

from gradio_client import Client, handle_file


OCR_SERVICE_URL = os.environ["OCR_SERVICE_URL"]

_client = Client(OCR_SERVICE_URL)


def run_remote_ocr(image_bytes: bytes):
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=".jpg",
            delete=False
        ) as f:
            f.write(image_bytes)
            temp_path = f.name

        result = _client.predict(
            handle_file(temp_path),
            api_name="/gradio_wrapper"
        )

        return result

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
