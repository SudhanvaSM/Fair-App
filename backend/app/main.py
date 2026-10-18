import os
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from app.api.routes import router
from fastapi.middleware.cors import CORSMiddleware

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.limiter.limiter import limiter

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=False,
        allow_methods=["POST"],
        allow_headers=["Authorization", "Content-Type"],
    )

@app.middleware("http")
async def limit_upload_size(request, call_next):
    if request.url.path == "/upload":
        cl = request.headers.get("content-length")
        if not cl or not cl.isdigit() or int(cl) > 9 * 1024 * 1024:
            return JSONResponse({"detail": "Payload too large"}, status_code=413)
    return await call_next(request)


app.include_router(router)