from fastapi import Depends, HTTPException, status
from app.database import supabase
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
	
	token = credentials.credentials

	if not token:
		raise HTTPException(
			status_code = status.HTTP_401_UNAUTHORIZED,
			detail = "Invalid or expired token"
		)
	
	response = supabase.auth.get_claims(token)
	claims = response.get("claims")
	if not claims:
		raise HTTPException(
			status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
			detail="Server unavailable"
		)
	return claims["sub"]