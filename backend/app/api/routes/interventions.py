from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone
from app.schemas.responses import success_response, BaseResponse, error_response
from app.schemas.requests import InterventionCreate
from app.api.deps import rate_limit
from app.db.supabase import get_supabase
from app.db.local_db import local_db
from app.core.logging import logger

router = APIRouter()


@router.get("/interventions", response_model=BaseResponse[List[dict]])
async def list_interventions(
    crop_id: Optional[str] = Query(None),
    field_id: Optional[str] = Query(None),
    user: dict = Depends(rate_limit)
):
    """List logged interventions (actions taken) for authenticated user, with optional crop/field filtering."""
    user_id = user["id"]
    try:
        sb = get_supabase()
        query = sb.table("interventions").select("*").eq("user_id", user_id)
        if crop_id and crop_id.strip():
            query = query.eq("crop_id", crop_id.strip())
        if field_id and field_id.strip():
            query = query.eq("field_id", field_id.strip())

        resp = query.order("performed_at", desc=True).limit(50).execute()
        if resp.data is not None:
            return success_response(resp.data)
    except Exception as e:
        logger.warning(f"Supabase interventions list failed ({e}), using local SQLite.")

    # Fallback to local SQLite
    records = local_db.list_interventions(user_id, crop_id, field_id)
    return success_response(records)


@router.post("/interventions", response_model=BaseResponse[dict])
async def create_intervention(payload: InterventionCreate, user: dict = Depends(rate_limit)):
    """Log an agronomic intervention / farmer action (e.g. treatment, scouting, pruning)."""
    user_id = user["id"]
    record = {
        "user_id": user_id,
        "action_type": payload.action_type.strip() or "Inspection",
        "action_title": payload.action_title.strip(),
        "notes": payload.notes.strip(),
        "crop_id": payload.crop_id.strip() if payload.crop_id else "",
        "field_id": payload.field_id.strip() if payload.field_id else "",
        "performed_at": payload.performed_at.strip() if payload.performed_at else datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    }

    try:
        sb = get_supabase()
        resp = sb.table("interventions").insert(record).execute()
        if resp.data:
            return success_response(resp.data[0])
    except Exception as e:
        logger.warning(f"Supabase intervention insert failed ({e}), using local SQLite.")

    try:
        local_rec = local_db.create_intervention(user_id, record)
        return success_response(local_rec)
    except Exception as e:
        logger.error(f"Local intervention insert failed: {e}")
        return error_response("DB_ERROR", "Failed to save intervention action")


@router.delete("/interventions/{intervention_id}", response_model=BaseResponse[dict])
async def delete_intervention(intervention_id: str, user: dict = Depends(rate_limit)):
    """Delete an intervention log entry."""
    user_id = user["id"]
    deleted = False

    try:
        sb = get_supabase()
        resp = sb.table("interventions").delete().eq("id", intervention_id).eq("user_id", user_id).execute()
        if resp.data:
            deleted = True
    except Exception as e:
        logger.warning(f"Supabase intervention delete failed ({e}), attempting local delete.")

    local_deleted = local_db.delete_intervention(intervention_id, user_id)
    if deleted or local_deleted:
        return success_response({"deleted": intervention_id})

    return error_response("NOT_FOUND", "Intervention record not found")
