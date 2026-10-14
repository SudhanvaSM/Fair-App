import logging
from fastapi import Depends, HTTPException, Request, status
from app.database import supabase
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from gotrue.errors import AuthApiError 

security = HTTPBearer()
logger = logging.getLogger("fair.auth")

def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
	
	token = credentials.credentials

	try:
		response = supabase.auth.get_claims(token)
		claims = response.get("claims")

		
		if not isinstance(claims, dict):
			return _unauthorized

		user_id = claims.get("sub")
		if not isinstance(user_id, str):
			return _unauthorized

		return user_id

	except HTTPException:
		raise

	except AuthApiError as e:
		return _unauthorized

	except Exception:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Server unavailable",
		)