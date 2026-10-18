import os
from fastapi import HTTPException, Request
from limits import parse
from limits.storage import storage_from_string
from limits.strategies import MovingWindowRateLimiter

from limits.storage import MemoryStorage
_strategy = MovingWindowRateLimiter(MemoryStorage())
IP_LIMIT = parse("30/minute")
GLOBAL_LIMIT = parse(os.getenv("GLOBAL_OCR_DAILY", "2000/day"))  # set from your HF cost ceiling

def ip_throttle(request: Request):
    ip = request.client.host if request.client else "unknown"
    if not _strategy.hit(IP_LIMIT, "ip", ip):
        raise HTTPException(429, "Too many requests")

def global_budget():
    if not _strategy.hit(GLOBAL_LIMIT, "ocr-global"):
        raise HTTPException(503, "Scanner busy, try later")