from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.responses import success_response, BaseResponse, error_response
from app.schemas.requests import CropCreate, CropUpdate
from app.api.deps import rate_limit
from app.db.supabase import get_supabase
from app.db.local_db import local_db
from app.core.logging import logger

router = APIRouter()


@router.get("/crops", response_model=BaseResponse[List[dict]])
async def list_crops(user: dict = Depends(rate_limit)):
    """List all crops for the authenticated user, with local SQLite fallback."""
    try:
        sb = get_supabase()
        resp = (
            sb.table("crops")
            .select("*")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .execute()
        )
        if resp.data is not None:
            return success_response(resp.data)
    except Exception as e:
        logger.warning(f"Supabase list crops failed ({e}). Using persistent local SQLite fallback.")

    return success_response(local_db.list_crops(user["id"]))


@router.post("/crops", response_model=BaseResponse[dict])
async def create_crop(payload: CropCreate, user: dict = Depends(rate_limit)):
    """Create a new crop profile for the authenticated user."""
    record = {
        "user_id": user["id"],
        "name": payload.name.strip(),
        "variety": payload.variety.strip(),
        "planting_date": payload.planting_date or None,
        "growth_stage": payload.growth_stage.strip(),
        "field_name": payload.field_name.strip(),
        "notes": payload.notes.strip(),
    }
    if payload.field_id and payload.field_id.strip():
        record["field_id"] = payload.field_id.strip()

    try:
        sb = get_supabase()
        try:
            resp = sb.table("crops").insert(record).execute()
        except Exception:
            if "field_id" in record:
                record.pop("field_id", None)
                resp = sb.table("crops").insert(record).execute()
            else:
                raise
        if resp.data:
            return success_response(resp.data[0])
    except Exception as e:
        logger.warning(f"Supabase create crop failed ({e}). Storing in persistent local SQLite.")

    local_rec = local_db.create_crop(user["id"], record)
    return success_response(local_rec)


@router.get("/crops/{crop_id}", response_model=BaseResponse[dict])
async def get_crop(crop_id: str, user: dict = Depends(rate_limit)):
    """Get a single crop and its recent analyses."""
    try:
        sb = get_supabase()
        crop_resp = (
            sb.table("crops")
            .select("*")
            .eq("id", crop_id)
            .eq("user_id", user["id"])
            .execute()
        )
        if crop_resp.data:
            crop = crop_resp.data[0]
            analyses_resp = (
                sb.table("analyses")
                .select("id, disease, severity, created_at, image_url, result_json")
                .eq("crop_id", crop_id)
                .eq("user_id", user["id"])
                .order("created_at", desc=True)
                .limit(20)
                .execute()
            )
            crop["analyses"] = analyses_resp.data or []
            return success_response(crop)
    except Exception as e:
        logger.warning(f"Supabase get crop failed ({e}). Falling back to local SQLite.")

    local_crop = local_db.get_crop(crop_id, user["id"])
    if not local_crop:
        return error_response("NOT_FOUND", "Crop not found")

    local_crop["analyses"] = [
        a for a in local_db.list_analyses(user["id"])
        if a.get("crop_id") == crop_id
    ]
    return success_response(local_crop)


@router.patch("/crops/{crop_id}", response_model=BaseResponse[dict])
async def update_crop(crop_id: str, payload: CropUpdate, user: dict = Depends(rate_limit)):
    """Update an existing crop profile."""
    updates = {k: v for k, v in payload.model_dump().items() if v != "" and v is not None}
    if not updates:
        return error_response("BAD_REQUEST", "No fields to update")

    try:
        sb = get_supabase()
        check = (
            sb.table("crops")
            .select("id")
            .eq("id", crop_id)
            .eq("user_id", user["id"])
            .execute()
        )
        if check.data:
            try:
                resp = (
                    sb.table("crops")
                    .update(updates)
                    .eq("id", crop_id)
                    .eq("user_id", user["id"])
                    .execute()
                )
            except Exception:
                if "field_id" in updates:
                    updates.pop("field_id", None)
                    resp = (
                        sb.table("crops")
                        .update(updates)
                        .eq("id", crop_id)
                        .eq("user_id", user["id"])
                        .execute()
                    )
                else:
                    raise
            if resp.data:
                return success_response(resp.data[0])
    except Exception as e:
        logger.warning(f"Supabase update crop failed ({e}). Updating local SQLite.")

    updated = local_db.update_crop(crop_id, user["id"], updates)
    if not updated:
        return error_response("NOT_FOUND", "Crop not found")
    return success_response(updated)


@router.delete("/crops/{crop_id}", response_model=BaseResponse[dict])
async def delete_crop(crop_id: str, user: dict = Depends(rate_limit)):
    """Delete a crop profile."""
    try:
        sb = get_supabase()
        sb.table("crops").delete().eq("id", crop_id).eq("user_id", user["id"]).execute()
    except Exception as e:
        logger.warning(f"Supabase delete crop failed ({e}). Deleting from local SQLite.")

    local_db.delete_crop(crop_id, user["id"])
    return success_response({"deleted": crop_id})


@router.patch("/analyses/{analysis_id}/crop", response_model=BaseResponse[dict])
async def assign_crop_to_analysis(analysis_id: str, crop_id: str, user: dict = Depends(rate_limit)):
    """Assign an existing analysis to a crop (optional post-scan action)."""
    try:
        sb = get_supabase()
        crop_check = sb.table("crops").select("id").eq("id", crop_id).eq("user_id", user["id"]).execute()
        if crop_check.data:
            resp = (
                sb.table("analyses")
                .update({"crop_id": crop_id})
                .eq("id", analysis_id)
                .eq("user_id", user["id"])
                .execute()
            )
            if resp.data:
                return success_response(resp.data[0])
    except Exception as e:
        logger.warning(f"Supabase assign crop failed ({e}).")

    return success_response({"id": analysis_id, "crop_id": crop_id})
