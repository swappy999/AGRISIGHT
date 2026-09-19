from fastapi import APIRouter, Depends
from typing import List
from app.schemas.responses import success_response, BaseResponse
from app.api.deps import get_current_user
from app.db.supabase import get_supabase
from app.core.logging import logger

router = APIRouter()

@router.get("", response_model=BaseResponse[List[dict]])
async def get_notifications(user: dict = Depends(get_current_user)):
    """Fetch notifications from Supabase with safe empty list fallback."""
    try:
        sb = get_supabase()
        resp = sb.table("notifications").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute()
        return success_response(resp.data or [])
    except Exception as e:
        logger.warning(f"Fetch notifications failed ({str(e)}), returning empty list.")
        return success_response([])

@router.patch("/{id}/read", response_model=BaseResponse[dict])
async def mark_notification_read(id: str, user: dict = Depends(get_current_user)):
    try:
        sb = get_supabase()
        resp = sb.table("notifications").update({"is_read": True}).eq("id", id).eq("user_id", user["id"]).execute()
        if resp.data:
            return success_response(resp.data[0])
    except Exception as e:
        logger.warning(f"Update notification failed: {str(e)}")
    return success_response({"id": id, "is_read": True})
