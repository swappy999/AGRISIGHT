from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.schemas.responses import error_response
from app.core.logging import logger

class AppBaseException(Exception):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class AuthError(AppBaseException):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )

class AIServiceError(AppBaseException):
    def __init__(self, message: str = "AI Service is currently unavailable"):
        super().__init__(
            code="AI_PROCESSING_ERROR",
            message=message,
            status_code=status.HTTP_502_BAD_GATEWAY
        )

class RateLimitError(AppBaseException):
    def __init__(self, message: str = "Too many requests. Please try again later."):
        super().__init__(
            code="RATE_LIMIT_EXCEEDED",
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )

async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, AppBaseException):
        logger.warning(f"App exception: {exc.code} - {exc.message}")
        content = error_response(code=exc.code, message=exc.message).model_dump()
        return JSONResponse(
            status_code=exc.status_code,
            content=content
        )
    
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    content = error_response(code="INTERNAL_ERROR", message="An unexpected error occurred").model_dump()
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=content
    )
