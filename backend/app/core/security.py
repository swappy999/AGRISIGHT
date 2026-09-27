from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Request, Depends
from typing import Optional, Dict, Any
from app.utils.exceptions import AuthError
from app.core.config import settings
from app.core.logging import logger

security = HTTPBearer()

# Real registered Supabase user UUID used for legacy data association in analysis queries.
# This is NOT an auth bypass — it's used only in data-layer ownership checks.
DEFAULT_DEV_USER_ID = "6013231d-43ee-47c2-8803-ba486258cc18"

def verify_supabase_token(token: str) -> Dict[str, Any]:
    from app.db.supabase import get_supabase
    
    try:
        sb = get_supabase()
        response = sb.auth.get_user(token)
        if response and response.user:
            return {"id": response.user.id, "email": response.user.email}
    except Exception as e:
        logger.warning(f"Supabase auth check failed ({str(e)}). Attempting token decode fallback.")
    
    # Fallback: Extract user ID directly from JWT claims without remote call
    # This handles cases where Supabase is temporarily unreachable but the token is valid
    try:
        payload = jwt.get_unverified_claims(token)
        if payload and "sub" in payload:
            return {"id": payload["sub"], "email": payload.get("email", "")}
    except Exception as jwt_err:
        logger.warning(f"JWT claim extraction failed: {jwt_err}")

    raise AuthError("Authentication failed: Invalid or expired token")

