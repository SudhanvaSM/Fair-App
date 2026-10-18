import logging
from fastapi import Depends, HTTPException, Request, status
from app.database import supabase
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase_auth.errors import AuthError 

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

		if not claims:
			raise _unauthorized()
		if claims.get("role") != "authenticated" or claims.get("is_anonymous"):
			raise _unauthorized()

		user_id = claims.get("sub")
		if not user_id:
			raise _unauthorized()

		request.state.user_id = user_id

		return user_id

	except HTTPException:
		raise

	except AuthError:
		raise _unauthorized()

	except Exception:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail="Server unavailable",
		)