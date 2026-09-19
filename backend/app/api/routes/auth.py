from fastapi import APIRouter
from app.schemas.responses import success_response
from app.core.logging import logger

router = APIRouter()

# Note: In a pure Supabase setup, the frontend directly authenticates with Supabase.
# This auth router is mostly a placeholder if custom backend signup/login wraps it.
@router.get("/me")
async def get_me():
    return success_response({"msg": "Use Supabase client for direct auth."})
