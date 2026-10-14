import os

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from app.database import supabase
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from gotrue.errors import AuthApiError 

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
	
	token = credentials.credentials

	try:
		response = supabase.auth.get_claims(token)
		claims = response.get("claims")
		if not isinstance(claims, dict):
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
			)

		user_id = claims.get("sub")
		if not isinstance(user_id, str):
			raise HTTPException(
				status_code=status.HTTP_401_UNAUTHORIZED,
				detail="Invalid authentication token",
				headers={"WWW-Authenticate": "Bearer"},
			)

		return user_id

	except HTTPException:
		raise

	except AuthApiError as e:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Authentication failed",
			headers={"WWW-Authenticate": "Bearer"},
		)

	except Exception:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Server unavailable",
		)