"""Coordinate-aware receipt parsing for the PaddleOCR word output.

The public ``parse_receipt`` result keeps the API's existing fields.  Monetary
values are INR, and item confidence is a 0-100 completeness/reconciliation score.
"""

import re
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


DEBUG = False
_MONEY_RE = re.compile(r"(?<![A-Za-z])(?:₹|Rs\.?\s*)?\(?[-+]?\d[\d,]*(?:\.\d{1,2})?\)?")
_NUMERIC_TOKEN_RE = re.compile(r"^(?:₹|Rs\.?\s*)?\(?[-+]?\d[\d,]*(?:\.\d{1,2})?\)?$", re.I)
_WORD_RE = re.compile(r"[A-Za-zÀ-ÿ]")
_HEADER_RE = re.compile(r"\b(item|description|qty|quantity|qnt|rate|price|amount|amt)\b", re.I)
_TOTAL_LABELS = {
    "subtotal": re.compile(r"\b(sub\s*total|subtotal|net\s*amount)\b", re.I),
    "tax": re.compile(r"\b(cgst|sgst|igst|gst(?!\s*in\b)|vat|sales\s*tax|tax)\b", re.I),
    "service_charge": re.compile(r"\b(service(?:\s*charge)?|staff\s*contribution|sc)\b", re.I),
    "rounding": re.compile(r"\b(round\s*off|rounding|round\s*off)\b", re.I),
    "total": re.compile(r"\b(grand\s*total|total\s*due|amount\s*due|bill\s*total|total)\b", re.I),
    "discount": re.compile(r"\b(discount|less)\b", re.I),
}
_NON_ITEM_RE = re.compile(
    r"\b(date|time|cashier|server|served|table|token|bill|invoice|receipt|restaurant|"
    r"phone|mobile|address|pin\s*code|gst\s*in|gstin|fssai|thank|visit|payment|cash|"
    r"card|upi|change|tender|balance|total\s*qty|qty\s*total|authorization|approval)\b", re.I
)
_POSTAL_CODE_RE = re.compile(r"(?<!\d)\d{6}(?!\d)")
_DATE_RE = re.compile(r"\b\d{1,4}[-/]\d{1,2}[-/]\d{1,4}\b")
_TIME_RE = re.compile(r"\b\d{1,2}:\d{2}(?:\s*[AP]M)?\b",re.IGNORECASE)
_PHONE_LABEL_RE = re.compile(r"\b(?:phone|mobile|ph)\s*[:.]?",re.IGNORECASE)


def _price(value):
    """Parse price, including comma groups and parenthesized negatives."""
    if value is None:
        return None
    text = str(value).strip().replace("₹", "").replace("Rs", "").replace("rs", "")
    text = text.replace(" ", "")
    negative = text.startswith("-") or (text.startswith("(") and text.endswith(")"))
    text = text.strip("()").lstrip("+-")
    # OCR often reads the decimal point as a comma: "290,00" is 290.00, not 29,000.
    # A thousands group always has 3 digits, so comma + 1-2 digits at the end is a decimal.
    if re.fullmatch(r"\d+,\d{1,2}", text):
        text = text.replace(",", ".")
    text = text.replace(",", "")
    try:
        amount = Decimal(text)
        if negative:
            amount = -amount
        # Used for precision. So, 0.1 == 0.2 returns true
        return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError):
        return None


def normalize_ocr_output(raw_text):
    """Normalize parallel PaddleOCR arrays into word records; accept records too."""
    if not isinstance(raw_text, dict):
        raise TypeError("OCR output must be a dictionary")
    required = (
        "text", "left", "top", "width",
        "height", "conf", "block_num", "line_num"
    )
    missing = [key for key in required if key not in raw_text]
    if missing:
        raise ValueError(f"OCR output missing fields: {', '.join(missing)}")

    lengths = {len(raw_text[key]) for key in required}
    if len(lengths) != 1:
        raise ValueError("OCR output arrays have different lengths")

    count = len(raw_text["text"])
    return [
        {
            "id": i,
            **{key: raw_text[key][i] for key in required}
        }
        for i in range(count)
    ]


def group_words_into_lines(normalized_ocr_data):
    """Group normalized words by block and line."""
    lines = {}
    for word_data in normalized_ocr_data:
        word = str(word_data["text"]).strip()
        if not word:
            continue
        key = (
            word_data["block_num"],
            word_data["line_num"]
        )
        if key not in lines:
            lines[key] = []

        left = float(word_data["left"])
        width = float(word_data["width"])

        lines[key].append({
            "text": word,
            "left": left,
            "right": left + width,
            "conf": float(word_data.get("conf", 0) or 0)
        })
    
    # Sort words
    final_lines = []
    for key in sorted(lines.keys()):
        words = sorted(lines[key], key=lambda x: x["left"])
        final_lines.append(words)
    
    return final_lines

def line_to_text(words):
    return " ".join(word["text"] for word in words)


def _line_money_values(text):
    return [value for match in _MONEY_RE.findall(text) if (value := _price(match)) is not None]


_GLUED_LABEL_RE = re.compile(r"\b(total|subtotal|amount|due|payable|off)(?=\d)", re.I)
_BARE_SUB_RE = re.compile(r"\s*(?:total\s+)?sub\s*", re.I)


def _split_glued_label(text):
    """'Grand Total1376.00' -> 'Grand Total 1376.00' (the rupee sign is often dropped by OCR)."""
    return _GLUED_LABEL_RE.sub(r"\1 ", text)


def _label_kind(text):
    if re.search(r"\bTOTAL\s+GST\b", text, re.IGNORECASE):
        return "total_tax"

    if re.search(r"\bBL\.?\s*TOT\b", text, re.IGNORECASE):
        return "total"

    if re.match(r"^\s*CASH\s+\d", text, re.IGNORECASE):
        return "total"
    # "Sub" alone (its "Total" is printed on the next row). Only when nothing else is
    # on the row, so an item such as "Veg Sub 6 inch" is not mistaken for a subtotal.
    if _BARE_SUB_RE.fullmatch(re.sub(r"[\d.,₹@%+\-()]+", " ", text)):
        return "subtotal"
    # Specific labels must win over the generic "total" in Sub Total / Grand Total.
    for kind in ("subtotal", "tax", "service_charge", "rounding", "discount", "total"):
        if _TOTAL_LABELS[kind].search(text):
            return kind
    return None


def _clean_name(text):
    text = re.sub(r"(?:₹|Rs\.?)", " ", text, flags=re.I)
    text = re.sub(r"^\s*#?\d{1,3}[.)]?\s+", "", text)
    text = re.sub(r"[^\w\s&'()/.,-]", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip(" -.,/")


def _header_columns(lines):
    """x centers of qty / unit price / amount from the first real table-header row.

    Only a row with at least two of the labels counts, so later rows such as
    "Total Qty: 6" cannot overwrite the column positions.
    """
    for words in lines:
        found = {}
        for word in words:
            label = re.sub(r"[^a-z]", "", word["text"].lower())
            center = (word["left"] + word["right"]) / 2
            if label in {"qty", "qnt", "quantity", "qnty"}:
                found["qty"] = center
            elif label in {"price", "rate", "unitprice"}:
                found["unit"] = center
            elif label in {"amount", "amt", "value"}:
                found["amount"] = center
        if len(found) >= 2:
            return {"qty": None, "unit": None, "amount": None, **found}
    return {"qty": None, "unit": None, "amount": None}


def _numeric_cells(words, columns):
    """Numeric table cells: the unbroken run of numbers at the right end of the row.

    Numbers left of the item name (serial no.) or inside it ("Pizza 12") are not cells.
    When the header columns are known, anything left of the qty column is also name.
    """
    cells = []
    for word in reversed(words):
        token = word["text"].strip().replace(" ", "")
        value = _price(token) if _NUMERIC_TOKEN_RE.fullmatch(token) else None
        if value is None:
            break
        cells.append((word["left"], word["right"], token, value))
    cells.reverse()
    if columns["qty"] is not None and columns["amount"] is not None:
        floor = columns["qty"] - 0.3 * (columns["amount"] - columns["qty"])
        cells = [c for c in cells if (c[0] + c[1]) / 2 >= floor]
    return cells


def _assign_numbers(numbers, columns):
    """Assign numeric cells using header x positions, then common receipt patterns."""
    if not numbers:
        return None, None, None
    qty = unit = amount = None
    if columns["qty"] is not None and columns["amount"] is not None:
        centers = {name: x for name, x in columns.items() if x is not None}
        for left, right, token, value in numbers:
            x = (left + right) / 2
            # Find closest header column to number
            closest = min(centers, key=lambda name: abs(x - centers[name]))
            threshold = max(24, (max(centers.values()) - min(centers.values())) * .22)
            if abs(x - centers[closest]) <= threshold:
                if closest == "qty" and value == value.to_integral_value():
                    qty = int(value)
                elif closest == "unit":
                    unit = value
                elif closest == "amount":
                    amount = value
        if amount is not None:
            return qty, unit, amount
        
    # Qty, Price, Amount
    vals = [entry[3] for entry in numbers]
    if len(vals) >= 3 and vals[-3] == vals[-3].to_integral_value() and 0 < vals[-3] <= 100:
        return int(vals[-3]), vals[-2], vals[-1]
    
    # Qty, Amount
    if len(vals) >= 2 and vals[-2] == vals[-2].to_integral_value() and 0 < vals[-2] <= 100:
        return int(vals[-2]), None, vals[-1]
    
    return 1, None, vals[-1]


def _make_score(name, qty, unit, amount, item_sum=None, subtotal=None, totals_match=None):
    checks = {
        "name": bool(name and _WORD_RE.search(name)),
        "qty": qty is not None and qty > 0,
        "unit_price": unit is not None and unit >= 0,
        "total_price": amount is not None and amount >= 0,
    }
    arithmetic = None
    # A line has name + qty + unit price + total price => Complete
    if checks["qty"] and checks["unit_price"] and checks["total_price"]:
        arithmetic = abs(unit * qty - amount) <= Decimal("0.02")
    # Completeness contributes 80 points; 
    # arithmetic and receipt reconciliation contribute 10 each when those checks can be evaluated.
    score = round(80 * sum(checks.values()) / 4)
    if arithmetic is not None:
        score += 10 if arithmetic else 0
    if totals_match is not None:
        score += 10 if totals_match else 0
    return {"score": min(100, score), "checks": checks,
            "unit_times_qty_matches_total": arithmetic,
            "receipt_totals_reconcile": totals_match}


def parse_receipt(result):
    """Extract item rows and receipt totals from PaddleOCR output."""
    words = normalize_ocr_output(result)
    lines = group_words_into_lines(words)
    columns = _header_columns(lines)
    has_any_table_header = any(
        re.search(r"\b(item|description|particulars)\b", re.sub(r"[^a-z]+", " ", line_to_text(row).lower()))
        and re.search(r"\b(qty|quantity|price|rate|amount|amt)\b", re.sub(r"[^a-z]+", " ", line_to_text(row).lower()))
        for row in lines
    )
    data = {"items": [], "subtotal": 0.0, "tax": 0.0, "service_charge": 0.0,
            "rounding": 0.0, "total": 0.0}
    raw_totals = {key: Decimal("0.00") for key in ("subtotal", "tax", "service_charge", "rounding", "total", "discount")}
    seen_totals = set()
    candidates = []
    pending_name = None
    table_started = False
    table_ended = False

    for words_on_line in lines:
        line = line_to_text(words_on_line)
        normalized_line = re.sub(r"[^a-z]+", " ", line.lower()).strip()
        has_item_header = (
            re.search(r"\b(item|description|particulars)\b", normalized_line)
            and re.search(r"\b(qty|quantity|price|rate|amount|amt)\b", normalized_line)
        )
        if has_item_header:
            table_started = True
            continue
        line = _split_glued_label(line)
        qty_total = re.search(r"\b(?:total\s+qty|qty\s+total)\b\s*:?\s*\d*", line, re.I)
        if qty_total:
            line = (line[:qty_total.start()] + " " + line[qty_total.end():]).strip()
            if not line:
                continue
        kind = _label_kind(line)
        values = _line_money_values(line)
        # GST identification numbers are not tax amounts.
        if re.search(r"\bGSTIN\b|\bGST\s*[-:]?\s*\d{2}[A-Z0-9]{10,}\b", line, re.IGNORECASE):
            continue
        if kind:
            if kind in ("subtotal", "total"):
                table_ended = True
            # Tax can appear as CGST and SGST on separate rows, so accumulate it.
            # For repeated subtotal/total labels, keep the last explicit value.
            if values:
                value = values[-1]
                if value > 100000:
                    continue
                if kind == "total_tax":
                    raw_totals["tax"] = values[-1]
                    seen_totals.add("tax")
                elif kind == "tax":
                    raw_totals[kind] += value
                else:
                    raw_totals[kind] = value
                seen_totals.add(kind)
            continue
        if table_ended:
            continue
        if _NON_ITEM_RE.search(line) or _HEADER_RE.search(line):
            continue
        if has_any_table_header and not table_started:
            continue

        if (
            _PHONE_LABEL_RE.search(line)
            or _DATE_RE.search(line)
            or _TIME_RE.search(line)
        ):
            continue

        numeric = _numeric_cells(words_on_line, columns)

        leading_qty = None
        if not has_any_table_header and numeric:
            first_numeric_left = min(entry[0] for entry in numeric)

            # Find standalone integer tokens before the item name.
            leading_qty_words = [
                word for word in words_on_line
                if word["right"] < first_numeric_left
                and word["text"].strip().isdigit()
                and 0 < int(word["text"].strip()) <= 100
            ]

            if leading_qty_words:
                # The leftmost standalone integer is the quantity in this layout.
                leading_qty = int(leading_qty_words[0]["text"].strip())

        if numeric:
            qty, unit, amount = _assign_numbers(numeric, columns)
            # Indian PIN codes in the address/header area must never be treated
            # as line-item prices, even when OCR groups the address into a row.
            if _POSTAL_CODE_RE.search(line) or amount is None or amount <= 0 or amount > 100000:
                continue
            # Headerless receipts are allowed; their first plausible priced row
            # begins the item table.
            if leading_qty is not None:
                qty = leading_qty
            if not table_started:
                table_started = True
            first_num_left = min(entry[0] for entry in numeric)
            name_cutoff = first_num_left
            name_part = " ".join(word["text"] for word in words_on_line
                                 if word["right"] <= name_cutoff + 2)
            name_part = _clean_name(name_part)

            # Handles cases where item names are printed
            # on two different lines
            if pending_name:
                name_part = (pending_name + " " + name_part).strip()
                pending_name = None
            if name_part and amount is not None and amount > 0:
                if qty is None or qty <= 0:
                    qty = 1
                if unit is None:
                    unit = (amount / Decimal(qty)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                if unit < 0 or unit > 100000:
                    continue
                candidates.append({"name": name_part, "qty": qty, "unit": unit, "amount": amount})
            continue

        # Receipt item descriptions often wrap onto a following line. Append a
        # continuation to the previous candidate, or hold it for the next row.
        cleaned = _clean_name(line)
        if table_started and not table_ended and cleaned and _WORD_RE.search(cleaned):
            if candidates:
                candidates[-1]["name"] = (candidates[-1]["name"] + " " + cleaned).strip()
            else:
                pending_name = (pending_name + " " + cleaned).strip() if pending_name else cleaned

    # Paddle OCR layouts in the supplied service are line-grouped already.  A
    # conservative candidate filter avoids treating payment/reference rows as food.
    for index, item in enumerate(candidates, start=1):
        name = _clean_name(item["name"])
        if len(name) < 2 or not _WORD_RE.search(name):
            continue
        data["items"].append({"item_id": index, "name": name, "qty": int(item["qty"]),
                              "unit_price": float(item["unit"]), "total_price": float(item["amount"]),
                              "confidence": 0})

    item_sum = sum((_price(item["total_price"]) for item in data["items"]), Decimal("0.00"))
    if "subtotal" not in seen_totals:
        raw_totals["subtotal"] = item_sum

    # If a receipt has a final total but no itemized tax labels, 
    # those fields remain zero and reconciliation is false.
    for key in ("subtotal", "tax", "service_charge", "rounding", "total"):
        data[key] = float(raw_totals[key])

    # Discount is tracked internally in reconciliation (receipts often list it).
    discount_effect = (raw_totals["discount"] if raw_totals["discount"] < 0
                       else -raw_totals["discount"])
    expected = (raw_totals["subtotal"] + raw_totals["tax"] + raw_totals["service_charge"]
                + raw_totals["rounding"] + discount_effect)
    receipt_has_equation = bool(seen_totals.intersection({"subtotal", "tax", "service_charge", "rounding", "total"}))
    totals_match = (abs(expected - raw_totals["total"]) <= Decimal("0.05")
                    if "total" in seen_totals and receipt_has_equation else None)
    item_sum_match = (abs(item_sum - raw_totals["subtotal"]) <= Decimal("0.02")
                      if "subtotal" in seen_totals else None)

    for item in data["items"]:
        details = _make_score(item["name"], item["qty"], _price(item["unit_price"]),
                              _price(item["total_price"]), item_sum=item_sum,
                              subtotal=raw_totals["subtotal"] if "subtotal" in seen_totals else None,
                              totals_match=totals_match)
        if item_sum_match is not None and not item_sum_match:
            # The receipt-level item/subtotal mismatch lowers each row score.
            details["score"] = max(0, details["score"] - 10)
        item["confidence"] = details["score"]
        item["score_details"] = details
    if DEBUG:
        print(data)
    return data


# def main():
#     import json
#     from ocr_paddleocr import run_ocr
#     with open("backend/uploads/Images/receipt4.jpeg", "rb") as f:
#         raw_text = run_ocr(f.read())
#         print(json.dumps(parse_receipt(raw_text), indent=2))

# if __name__ == "__main__":
#     main()