import cv2, numpy as np
from paddleocr import PaddleOCR   # written for 3.x; 2.x uses ocr.ocr(img, cls=False)

_ocr = PaddleOCR(lang="en",
                 use_doc_orientation_classify=False,
                 use_doc_unwarping=False,
                 use_textline_orientation=False)

CANON_W = 1000   # coordinates are rescaled to this width so parser thresholds stay stable

def run_ocr(image_bytes):
    img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    res = _ocr.predict(img)[0]
    k = CANON_W / img.shape[1]

    boxes = []
    for text, box, conf in zip(res["rec_texts"], res["rec_boxes"], res["rec_scores"]):
        x1, y1, x2, y2 = [v * k for v in box]
        boxes.append(dict(text=text, x1=x1, x2=x2, yc=(y1 + y2) / 2, h=y2 - y1, conf=conf * 100))

    # cluster boxes into rows by vertical centre
    boxes.sort(key=lambda b: b["yc"])
    rows = []
    for b in boxes:
        if rows and abs(b["yc"] - np.mean([r["yc"] for r in rows[-1]])) < 0.6 * b["h"]:
            rows[-1].append(b)
        else:
            rows.append([b])

    out = {k_: [] for k_ in ["text", "left", "top", "width", "height", "conf", "block_num", "line_num"]}
    for line_no, row in enumerate(rows, start=1):
        for b in sorted(row, key=lambda b: b["x1"]):
            words = b["text"].split()
            total_chars = max(len(b["text"]), 1)
            pos = 0
            for w in words:                      # interpolate word x-positions in the box
                left = b["x1"] + (b["x2"] - b["x1"]) * pos / total_chars
                out["text"].append(w); out["left"].append(int(left))
                out["top"].append(int(b["yc"] - b["h"] / 2)); out["width"].append(int((b["x2"] - b["x1"]) * len(w) / total_chars))
                out["height"].append(int(b["h"])); out["conf"].append(b["conf"])
                out["block_num"].append(1); out["line_num"].append(line_no)
                pos += len(w) + 1
    return out

# if __name__ == "__main__":
#     with open("backend/uploads/Images/dhabha.jpeg", "rb") as f:
#         raw = run_ocr(f.read())
#     print("── RAW OCR ──────────────────────────────")
#     print(raw)