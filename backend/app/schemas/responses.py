from typing import Any, Dict, Optional, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class BaseResponse(BaseModel, Generic[T]):
    data: Optional[T] = None
    error: Optional[Dict[str, Any]] = None
    status: str

def success_response(data: Any) -> BaseResponse:
    return BaseResponse(
        data=data,
        error=None,
        status="success"
    )

def error_response(code: str, message: str) -> BaseResponse:
    return BaseResponse(
        data=None,
        error={
            "code": code,
            "message": message
        },
        status="error"
    )
