from fastapi import FastAPI, Depends
from app.api.routes import router
from fastapi.middleware.cors import CORSMiddleware
from app.auth.authentication import get_current_user

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)