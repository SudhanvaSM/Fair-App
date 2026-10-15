import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from app.main import app
from app.limiter.limiter import limiter

client = TestClient(app)

def fake_user(user_id: str):
	def dep(request: Request):
		request.state.user_id = user_id
		return user_id
	return dep

@pytest.fixture(autouse=True)
def reset_limiter():
	limiter.reset()
	yield
	app.dependency_overrides.clear()

def post_bad_file(token: str):
    return client.post("/upload", 
                       headers={"Authorization": f"Bearer {token}"},
					   files={"file": ("x.jpg", b"not an image", "image/jpeg")})

users = {
	"user-a": "user-a_token",
	"user-b": "user-b_token"
}

def test_limit_is_per_user():
	codes_a = [post_bad_file(users["user-a"]).status_code for _ in range(6)]
	assert codes_a[:5] == [415] * 5
	assert codes_a[5] == 429
	assert post_bad_file(users["user-b"]).status_code == 415 

def test_missing_token_rejected():
	assert client.post("/upload", files={"file": ("x.jpg", b"x", "image/jpeg")}).status_code in (401, 403)