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

@app.get("/test-auth")
def test_auth(user_id: str = Depends(get_current_user)):
	return {
		"authenticated": True,
        "user_id": user_id
    }

app.include_router(router)