import pytest
import io

from PIL import Image
from fastapi.testclient import TestClient
from unittest.mock import patch
from supabase_auth.errors import AuthError

from app.main import app
from app.limiter.limiter import limiter

client = TestClient(app)
HEADERS = {"Authorization": "Bearer sometoken"}
FILES = {"file": ("x.jpg", b"not an image", "image/jpeg")}

@pytest.fixture
def valid_jpeg():
    image = Image.new("RGB", (2, 2), color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()

@pytest.fixture(autouse=True)
def reset():
    limiter.reset()
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()

def post_upload(headers=None, image_bytes=None):
    if image_bytes is None:
        image_bytes = b"not an image"

    return client.post(
        "/upload",
        headers=headers or {},
        files={
            "file": ("test.jpg", image_bytes, "image/jpeg")
        },
    )

def test_invalid_token_returns_401(valid_jpeg):
    with patch("app.auth.authentication.supabase") as sb:
        sb.auth.get_claims.side_effect = AuthError("invalid jwt", 401)
        response = post_upload(headers=HEADERS, image_bytes=valid_jpeg)
        assert response.status_code == 401

def test_missing_claims_returns_401(valid_jpeg):
    with patch("app.auth.authentication.supabase") as sb:
        sb.auth.get_claims.return_value = {"claims": None}
        response = post_upload(headers=HEADERS, image_bytes=valid_jpeg)
        assert response.status_code == 401

def test_auth_service_down_returns_503():
    with patch("app.auth.authentication.supabase") as sb:
        sb.auth.get_claims.side_effect = RuntimeError("network down")
        assert client.post("/upload", headers=HEADERS, files=FILES).status_code == 503

def test_valid_token_reaches_validation():
    with patch("app.auth.authentication.supabase") as sb:
        sb.auth.get_claims.return_value = {"claims": {"sub": "user-1"}}
        assert client.post("/upload", headers=HEADERS, files=FILES).status_code == 415