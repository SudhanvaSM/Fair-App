from fastapi import Header, HTTPException
from app.database import supabase

def get_current_user(authorisation: str = Header(...)):
	if not authorisation.startswith("Bearer "):
		raise HTTPException(
			status_code = 401,
			detail = "Invalid authorisation header"
		)

	token = authorisation.split(" ", 1)[1]

	try:
		response = supabase.auth.get_claims(token)

		claims = response.get("claims")

		if not claims:
			raise HTTPException(
				status_code = 401,
				detail = "Invalid token"
			)

		return claims["sub"]

	except Exception:
		raise HTTPException(
			status_code = 401,
			detail = "Invalid or expired token"
		)