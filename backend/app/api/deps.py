from fastapi import Depends, Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_supabase_token
from app.utils.exceptions import AuthError, RateLimitError
from app.utils.rate_limiter import rate_limiter
from app.core.logging import logger

from typing import Optional

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials or not credentials.credentials:
        raise AuthError("Authentication required. Please log in.")
    
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
