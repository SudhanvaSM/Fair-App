import re
import json

# Set this is to True to print parsing results along with confidence scoring
DEBUG = False 

PRICE_REGEX = re.compile(r'\d+(?:[.,]\d{1,2})?\s*$')

NUMBER_REGEX = re.compile(r'\d+(?:[.,]\d{1,2})?')


SKIP_KEYWORDS = re.compile(
        r'\b(gst|tax|vat|service\s*charge|rounding|round|sub\s*tota[l|]?|sub-total|st|'
    r'total|visa|mastercard|cash|change|approval|cashier|sales\s*person|server|cust|'
    r'date|invoice|receipt|qty|price|amount|description|thank\s*you|service|'
    r'goods\s*sold|not\s*return|table|guests|business|have\s*a\s*nice|'
    r'tel|phone|restaurant|address|order|'
    r'card|number|txn|transaction|auth|bank|upi|ref|id|gstin|cost|nate|cst|sis|cgst|sga|sgst)\b',
    re.IGNORECASE
)

def normalize_price_spaces(line):
    # 1. normalize spacing
    line = re.sub(r'\s+', ' ', line)

    # 2. fix dot/comma decimals
    line = re.sub(r'(\d+)\s*[.,]\s*(\d{2})\b', r'\1.\2', line)

    # 3. fix space decimals
    line = re.sub(r'\b(\d{1,3})\s+(\d{2})\b', r'\1.\2', line)

    return line

def item_confidence_score(line: str):
    score = 0
    reasons = []

    if not any(c.isalpha() for c in line):
        return {"score": 0, "reasons": ["no letters"]}


    if '@' in line or '%' in line:
        score -= 3

    # Words check
    words = line.split()
    if len(words) >= 2:
        score += 1
        reasons.append("multi-word (+1)")
    else:
        score -= 1
        reasons.append("single-word (-1)")

    # Price detection
    price_match = PRICE_REGEX.search(line)
    if price_match:
        score += 2
        reasons.append("price detected (+2)")
    else:
        score -= 2
        reasons.append("no ending price (-2)")

    # Numbers
    numbers = NUMBER_REGEX.findall(line)
    if numbers:
        score += 2
        reasons.append("has number (+1)")
    if len(numbers) > 4:
        score -= 1
        reasons.append("too many numbers (-1)")

    # Length
    if 5 <= len(line) <= 60:
        score += 1
        reasons.append("reasonable length (+1)")
    else:
        score -= 1
        reasons.append("bad length (-1)")

    # Keywords
    if SKIP_KEYWORDS.search(line):
        score -= 5
        reasons.append("skip keyword (-3)")

    return {"score": score, "reasons": reasons}

def fix_merged_words(line):
    # Add space between digit and letter: 2Gobi → 2 Gobi
    line = re.sub(r'(\d)([A-Za-z])', r'\1 \2', line)

    # Add space between lowercase-uppercase: GobiManchurian → Gobi Manchurian
    line = re.sub(r'([a-z])([A-Z])', r'\1 \2', line)

    return line

def extract_price(line: str):
    match = PRICE_REGEX.search(line)
    if not match:
        return None, line
    
    price_str = match.group()
    price = parse_price(price_str)
    line_body = line[:match.start()].strip()

    return price, line_body

def parse_price(price_str):
    """
    Robustly parses price strings:
    - Removes $ signs
    - Handles comma-as-decimal: '86,50' → 86.50
    - Handles thousand separators: '1,876.50' → 1876.50
    - Handles whole numbers: '480' → 480.00
    """
    cleaned = re.sub(r'[$\s]', '', price_str).strip()

    # Count commas and dots to decide which is decimal separator
    comma_count = cleaned.count(',')
    dot_count   = cleaned.count('.')

    if comma_count == 0 and dot_count == 0:
        # Plain integer: "480"
        return round(float(cleaned), 2)

    if comma_count == 1 and dot_count == 0:
        # Could be "1,500" (thousands) or "86,50" (decimal)
        parts = cleaned.split(',')
        if len(parts[1]) == 2:
            # 2 digits after comma → decimal separator: "86,50" → 86.50
            return round(float(parts[0] + '.' + parts[1]), 2)
        elif int(parts[0]) < 100:
            return round(float(parts[0] + '.' + parts[1][:2]), 2)
        else:
            # 3 digits after comma → thousands separator: "1,500" → 1500
            return round(float(cleaned.replace(',', '')), 2)

    if dot_count == 1 and comma_count == 0:
        # Standard: "1876.50"
        return round(float(cleaned), 2)

    if comma_count >= 1 and dot_count == 1:
        # Standard with thousands: "1,876.50" → remove commas
        return round(float(cleaned.replace(',', '')), 2)

    if comma_count >= 2 and dot_count == 0:
        # "71,876,50" → "71876.50"
        parts = cleaned.split(',')
        if len(parts[-1]) == 2:
            integer_part = ''.join(parts[:-1])
            return round(float(integer_part + '.' + parts[-1]), 2)
        else:
            return round(float(cleaned.replace(',', '')), 2)

    # Fallback: strip all commas
    return round(float(cleaned.replace(',', '')), 2)


def parse_receipt(text):
    data = {
        "items": [],
        "subtotal": 0.0,
        "tax": 0.0,
        "service_charge": 0.0,
        "rounding": 0.0,
        "total": 0.0
    }

    lines = [l.strip() for l in text.split('\n') if l.strip()]

    
    SUBTOTAL_LINE = re.compile(r'\bsub\s*tota[l|]?\b', re.IGNORECASE)
    TAX_LINE = re.compile(r'\b(gst|tax|vat)\b', re.IGNORECASE)
    SERVICE_LINE = re.compile(r'\bservice(?:\s*charge)?\b', re.IGNORECASE)
    TOTAL_LINE = re.compile(r'\btotal\b', re.IGNORECASE)
    ROUND_LINE = re.compile(r'\b(round|rounding)\b', re.IGNORECASE)

    QTY_PREFIX = re.compile(r'^(\d{1,2})\s+(.+)$')

    i = 1

    for line in lines:
        line = normalize_price_spaces(line)
        line = fix_merged_words(line)

        price, line_body = extract_price(line)
        if price is None: 
            continue

        if SKIP_KEYWORDS.search(line_body):
            if SUBTOTAL_LINE.search(line_body):
                data["subtotal"] = price
                continue
            elif TAX_LINE.search(line_body):
                data["tax"] = price
                continue
            elif SERVICE_LINE.search(line_body):
                data["service_charge"] = price
                continue
            elif TOTAL_LINE.search(line_body):
                data["total"] = price
                continue
            elif ROUND_LINE.search(line_body):
                data["rounding"] = price
                continue
            continue

        result = item_confidence_score(line)
        if result["score"] < 4: 
            continue

        # ── Extract item ────────────────────────────────
        qty = 1
        name = line_body

        qty_match = QTY_PREFIX.match(name)
        if qty_match:
            qty = int(qty_match.group(1))
            name = qty_match.group(2)
                    
        name = clean_name(name)

        # STRICT FILTER (prevents garbage items)
        if not name or len(name) < 3:
            continue
        if len(name.split()) > 5:
            continue

        if price > 10000 or price <= 0:
            continue

        data["items"].append({
            "confidence": result["score"],
            "item_id": i,
            "name": name,
            "qty": qty,
            "unit_price": round(price / qty, 2),
            "total_price": price
        })

        i += 1

        if DEBUG:
            print(line, result)

    # ── Fix totals ─────────────────────────────────────
    calculated_sum = round(sum(i["total_price"] for i in data["items"]), 2)

    if data["subtotal"] == 0:
        data["subtotal"] = calculated_sum

    if data["tax"] == 0 and data["total"] > 0:
        data["tax"] = round(data["total"] - data["subtotal"], 2)

    expected_total = data["subtotal"] + data["tax"] + data["service_charge"]

    if data["total"] == 0 or abs(data["total"] - expected_total) > 1:
        data["total"] = round(expected_total, 2)

    return data

def clean_name(name: str) -> str:
    from app.services.replace_service import clean_common_ocr
    name = re.sub(r'[^a-zA-Z\s]', ' ', name)
    name = re.sub(r'[^\w\s\-\(\)\/]', ' ', name)
    name = re.sub(r'\s{2,}', ' ', name).strip()
    name = re.sub(r'\bfl\b|\bth\b|\bi\b', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\b\d+\b', '', name)
    name = re.sub(r'\b[xX]\b', '', name)
    name = clean_common_ocr(name)
    return name.title() 

# Used for debugging
# if __name__ == "__main__":
#     from ocr_service import run_ocr
#     with open("backend/uploads/receipt.jpeg", "rb") as f:
#         raw_text = run_ocr(f.read())

#     result = parse_receipt(raw_text)
#     print(json.dumps(result, indent=4))
