import cv2
from pytesseract import *
import numpy as np
from PIL import Image
import io

def preprocess(image):

    # ── 1. Upscale  ───────────────────────────
    h, w = image.shape[:2]

    if w < 1500:
        image = cv2.resize(image, None, fx=2, fy=2)
    elif w > 2000:
        scale = 2000 / w
        image = cv2.resize(image, None, fx=scale, fy=scale)

    # ── 2. Grayscale ─────────────────────────────────────────────────────────
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # ── 3. Denoise — removes thermal printer speckle ─────────────────────────
    gray = cv2.fastNlMeansDenoising(gray, h=10)

    # ── 4. Deskew — fixes tilted phone photos ────────────────────────────────
    coords = np.column_stack(np.where(gray < 200))   # find dark pixels
    if len(coords) > 0:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = 90 + angle
        if abs(angle) > 0.5:                          # only rotate if tilt > 0.5°
            (h, w) = gray.shape
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            gray = cv2.warpAffine(gray, M, (w, h),
                                  flags=cv2.INTER_CUBIC,
                                  borderMode=cv2.BORDER_REPLICATE)

    # ── 5. Adaptive threshold — handles uneven lighting ──────────────────────
    #    Better than OTSU for phone photos with shadows

    kernel = np.array([[0, -1, 0],
                   [-1, 5,-1],
                   [0, -1, 0]])
    gray = cv2.filter2D(gray, -1, kernel)

    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # ── 6. Morphological cleanup — closes tiny gaps in characters ────────────
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

    return thresh


def run_ocr(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = np.array(image)

    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    # Preprocess separately
    items_processed  = preprocess(image)

    custom_config = r'--oem 3 --psm 4'

    items_text = pytesseract.image_to_data(items_processed, config=custom_config, output_type=Output.DICT)

    return items_text

# Used for debugging
# if __name__ == "__main__":
#     with open("backend/uploads/Images/receipt1.jpeg", "rb") as f:
#         raw = run_ocr(f.read())
#     print("── RAW OCR ──────────────────────────────")
#     print(raw)
