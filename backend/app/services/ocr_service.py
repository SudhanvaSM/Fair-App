import cv2, numpy as np
from PIL import Image
import io
import pytesseract
from pytesseract import Output

def crop_receipt(image):
    """Find the bright paper blob, rotate/crop to it. Falls back to the full image."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (9, 9), 0)
    _, mask = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return image
    c = max(cnts, key=cv2.contourArea)
    if cv2.contourArea(c) < 0.2 * image.shape[0] * image.shape[1]:
        return image

    box = cv2.boxPoints(cv2.minAreaRect(c)).astype("float32")
    s, d = box.sum(axis=1), np.diff(box, axis=1).ravel()
    tl, br = box[np.argmin(s)], box[np.argmax(s)]
    tr, bl = box[np.argmin(d)], box[np.argmax(d)]
    W = int(max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl)))
    H = int(max(np.linalg.norm(bl - tl), np.linalg.norm(br - tr)))
    dst = np.array([[0, 0], [W - 1, 0], [W - 1, H - 1], [0, H - 1]], dtype="float32")
    M = cv2.getPerspectiveTransform(np.array([tl, tr, br, bl], dtype="float32"), dst)
    return cv2.warpPerspective(image, M, (W, H))

def preprocess(image):
    # deskews the image
    image = crop_receipt(image)                       

    # Normalise size: ~1600px wide gives Tesseract ~30-40px glyphs
    h, w = image.shape[:2]
    target = 1600
    interp = cv2.INTER_CUBIC if w < target else cv2.INTER_AREA
    image = cv2.resize(image, None, fx=target / w, fy=target / w, interpolation=interp)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Flatten lighting: estimate background (text removed), divide it out
    bg = cv2.medianBlur(cv2.dilate(gray, np.ones((7, 7), np.uint8)), 31)
    norm = cv2.divide(gray, bg, scale=255)
    norm = cv2.normalize(norm, None, 0, 255, cv2.NORM_MINMAX)
    return norm            # no sharpen, no hard threshold

def run_ocr(image_bytes):
    img = np.array(Image.open(io.BytesIO(image_bytes)).convert("RGB"))
    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    cfg = "--oem 3 --psm 6 -c preserve_interword_spaces=1"
    return pytesseract.image_to_data(preprocess(img), config=cfg, output_type=Output.DICT)

# Used for debugging
# if __name__ == "__main__":
#     with open("backend/uploads/Images/dhabha.jpeg", "rb") as f:
#         raw = run_ocr(f.read())
#     print("── RAW OCR ──────────────────────────────")
#     print(raw)
