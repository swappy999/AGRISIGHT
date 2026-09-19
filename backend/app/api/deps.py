from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_supabase_token, DEFAULT_DEV_USER_ID
from app.utils.exceptions import AuthError, RateLimitError
from app.utils.rate_limiter import rate_limiter
from app.core.logging import logger

from typing import Optional

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials or not credentials.credentials:
        logger.info("No authorization token provided. Using dev fallback user session.")
        return {"id": DEFAULT_DEV_USER_ID, "email": "dev@agrisight.dev"}
    
    token = credentials.credentials
    user = verify_supabase_token(token)
    return user

async def rate_limit(request: Request, user: dict = Depends(get_current_user)):
    # Limit endpoints
    endpoint = request.url.path
    if not rate_limiter.check_limit(user["id"], endpoint):
        logger.warning(f"Rate limit exceeded for user: {user['id']} on {endpoint}")
        raise RateLimitError()
    return user
