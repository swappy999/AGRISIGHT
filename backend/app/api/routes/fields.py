from fastapi import APIRouter, Depends
from typing import List, Optional
from datetime import datetime, timezone
import math
from app.schemas.responses import success_response, BaseResponse, error_response
from app.schemas.requests import FieldCreate, FieldUpdate
from app.api.deps import rate_limit
from app.db.supabase import get_supabase
from app.db.local_db import local_db
from app.core.logging import logger

router = APIRouter()


def _severity_penalty(severity: Optional[str]) -> int:
    s = (severity or "").lower()
    if s == "critical":
        return 35
    if s in ["high", "severe"]:
        return 25
    if s in ["medium", "moderate"]:
        return 12
    if s == "low":
        return 4
    return 0


def _compute_field_health(analyses: List[dict]) -> dict:
    """Compute deterministic Field Health Index (FHI) and Hotspot metrics."""
    if not analyses:
        return {
            "health_score": 98,
            "status": "Healthy",
            "status_color": "emerald",
            "active_hotspots": 0,
            "survival_estimate": 99.0,
            "hotspots": [],
            "zones": [
                {"name": "Zone A (North)", "health": 98, "status": "Optimal", "active_threats": 0},
                {"name": "Zone B (East)", "health": 98, "status": "Optimal", "active_threats": 0},
                {"name": "Zone C (South)", "health": 98, "status": "Optimal", "active_threats": 0},
                {"name": "Zone D (West)", "health": 98, "status": "Optimal", "active_threats": 0},
            ]
        }

    # Filter to only valid agricultural scans
    valid_scans = []
    for s in analyses:
        rj = s.get("result_json") or {}
        is_agri = rj.get("is_agricultural", True)
        d_name = (s.get("disease") or rj.get("disease") or "").lower()
        if is_agri is not False and d_name not in ["non-crop image", "non_crop", "invalid image", "unknown", "none", ""]:
            valid_scans.append(s)

    if not valid_scans:
        return {
            "health_score": 98,
            "status": "Healthy",
            "status_color": "emerald",
            "active_hotspots": 0,
            "survival_estimate": 99.0,
            "hotspots": [],
            "zones": [
                {"name": "Zone A (North)", "health": 98, "status": "Optimal", "active_threats": 0},
                {"name": "Zone B (East)", "health": 98, "status": "Optimal", "active_threats": 0},
                {"name": "Zone C (South)", "health": 98, "status": "Optimal", "active_threats": 0},
                {"name": "Zone D (West)", "health": 98, "status": "Optimal", "active_threats": 0},
            ]
        }

    total_penalty = 0
    hotspots = []
    zone_threats = {"Zone A (North)": 0, "Zone B (East)": 0, "Zone C (South)": 0, "Zone D (West)": 0}
    zone_names = list(zone_threats.keys())

    for idx, scan in enumerate(valid_scans):
        rj = scan.get("result_json") or {}
        sev = scan.get("severity") or rj.get("severity", "Low")
        disease = scan.get("disease") or rj.get("disease", "Unknown")
        risk_score = rj.get("risk_score", 0)
        penalty = _severity_penalty(sev)
        total_penalty += penalty

        is_critical = str(sev).lower() in ["critical", "high", "severe"] or (isinstance(risk_score, (int, float)) and risk_score >= 65)
        zone_assigned = zone_names[idx % 4]

        if is_critical:
            zone_threats[zone_assigned] += 1
            hotspots.append({
                "id": scan.get("id"),
                "scan_id": scan.get("id"),
                "disease": disease,
                "severity": sev,
                "risk_score": risk_score,
                "created_at": scan.get("created_at"),
                "image_url": scan.get("image_url") or rj.get("image_url"),
                "latitude": scan.get("latitude") or rj.get("latitude"),
                "longitude": scan.get("longitude") or rj.get("longitude"),
                "zone": zone_assigned,
                "crop": rj.get("crop") or scan.get("crop") or "Crop"
            })

    # Weighted health score: base 100 minus capped penalty
    avg_penalty = total_penalty / max(1, len(valid_scans))
    score = max(20, min(100, int(100 - (avg_penalty * 1.8) - (len(hotspots) * 4))))

    if score >= 80:
        status = "Healthy"
        color = "emerald"
    elif score >= 55:
        status = "Moderate Stress"
        color = "amber"
    else:
        status = "Critical Outbreak"
        color = "rose"

    survival_estimate = round(max(40.0, min(100.0, score * 0.95 + 4)), 1)

    zones = []
    for z_name, threats in zone_threats.items():
        z_health = max(30, 100 - (threats * 25))
        z_status = "Optimal" if z_health >= 80 else ("Under Stress" if z_health >= 55 else "Infected")
        zones.append({
            "name": z_name,
            "health": z_health,
            "status": z_status,
            "active_threats": threats
        })

    return {
        "health_score": score,
        "status": status,
        "status_color": color,
        "active_hotspots": len(hotspots),
        "survival_estimate": survival_estimate,
        "hotspots": hotspots,
        "zones": zones
    }


def _fetch_user_fields(user_id: str) -> List[dict]:
    """Fetch user fields from Supabase or fallback to local SQLite."""
    try:
        sb = get_supabase()
        resp = sb.table("fields").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        if resp.data is not None:
            return resp.data
    except Exception as e:
        logger.warning(f"Supabase fields read failed ({e}), using local SQLite fallback.")
    
    return local_db.list_fields(user_id)


def _fetch_single_field(field_id: str, user_id: str) -> Optional[dict]:
    """Fetch single field from Supabase or fallback to local SQLite."""
    try:
        sb = get_supabase()
        resp = sb.table("fields").select("*").eq("id", field_id).eq("user_id", user_id).execute()
        if resp.data:
            return resp.data[0]
    except Exception as e:
        logger.warning(f"Supabase single field read failed ({e}), using local SQLite.")
    
    return local_db.get_field(field_id, user_id)


@router.get("/fields", response_model=BaseResponse[List[dict]])
async def list_fields(user: dict = Depends(rate_limit)):
    """List all fields for the authenticated user with aggregated health & crop statistics."""
    try:
        user_id = user["id"]
        fields_data = _fetch_user_fields(user_id)

        sb = get_supabase()
        crops_data = []
        try:
            c_resp = sb.table("crops").select("id, field_name, name, variety, growth_stage").eq("user_id", user_id).execute()
            crops_data = c_resp.data or []
        except Exception:
            pass

        analyses_data = []
        try:
            a_resp = sb.table("analyses").select("id, disease, severity, created_at, result_json, image_url, crop_id").eq("user_id", user_id).order("created_at", desc=True).limit(50).execute()
            analyses_data = a_resp.data or []
        except Exception:
            pass

        enriched = []
        for field in fields_data:
            fid = field["id"]
            fname = field.get("name", "")
            
            # Count linked crops
            linked_crops = [c for c in crops_data if (fname and c.get("field_name") == fname)]
            
            # Linked analyses
            field_analyses = [a for a in analyses_data if (a.get("result_json") or {}).get("field_id") == fid or (fname and (a.get("result_json") or {}).get("field_name") == fname)]
            health_meta = _compute_field_health(field_analyses)

            enriched.append({
                **field,
                "crop_count": len(linked_crops),
                "scan_count": len(field_analyses),
                "health_score": health_meta["health_score"],
                "status": health_meta["status"],
                "status_color": health_meta["status_color"],
                "active_hotspots": health_meta["active_hotspots"],
                "survival_estimate": health_meta["survival_estimate"]
            })

        return success_response(enriched)
    except Exception as e:
        logger.error(f"List fields failed: {e}")
        return error_response("DB_ERROR", "Failed to fetch fields")


@router.post("/fields", response_model=BaseResponse[dict])
async def create_field(payload: FieldCreate, user: dict = Depends(rate_limit)):
    """Create a new agricultural field profile."""
    user_id = user["id"]
    record_dict = {
        "user_id": user_id,
        "name": payload.name.strip(),
        "location_name": payload.location_name.strip(),
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "area_acres": max(0.1, payload.area_acres),
        "soil_type": payload.soil_type.strip() or "Alluvial",
        "irrigation_type": payload.irrigation_type.strip() or "Drip",
        "notes": payload.notes.strip(),
    }

    # Try inserting to Supabase first
    try:
        sb = get_supabase()
        resp = sb.table("fields").insert(record_dict).execute()
        if resp.data:
            logger.info(f"Field created in Supabase for user {user_id}: {resp.data[0]['id']}")
            return success_response(resp.data[0])
    except Exception as e:
        logger.warning(f"Supabase field creation failed ({e}). Storing in persistent local SQLite.")

    # Fallback to local SQLite
    try:
        local_field = local_db.create_field(user_id, record_dict)
        logger.info(f"Field created in local DB for user {user_id}: {local_field['id']}")
        return success_response(local_field)
    except Exception as e:
        logger.error(f"Local DB field creation failed: {e}")
        return error_response("DB_ERROR", "Could not save field profile. Please try again.")


@router.get("/fields/{field_id}", response_model=BaseResponse[dict])
async def get_field(field_id: str, user: dict = Depends(rate_limit)):
    """Get single field with linked crops, analyses, and spatial hotspot calculations."""
    user_id = user["id"]
    field = _fetch_single_field(field_id, user_id)
    if not field:
        return error_response("NOT_FOUND", "Field record not found")

    sb = get_supabase()
    fname = field.get("name", "")

    # Fetch linked crops
    crops = []
    try:
        c_resp = sb.table("crops").select("id, name, variety, planting_date, growth_stage, field_name, notes, created_at").eq("user_id", user_id).execute()
        all_crops = c_resp.data or []
        crops = [c for c in all_crops if (fname and c.get("field_name") == fname)]
    except Exception:
        pass
    field["crops"] = crops

    # Fetch linked analyses
    analyses = []
    try:
        a_resp = sb.table("analyses").select("id, disease, severity, created_at, result_json, image_url, crop_id").eq("user_id", user_id).order("created_at", desc=True).limit(30).execute()
        all_analyses = a_resp.data or []
        analyses = [a for a in all_analyses if (a.get("result_json") or {}).get("field_id") == field_id or (fname and (a.get("result_json") or {}).get("field_name") == fname)]
    except Exception:
        pass
    field["analyses"] = analyses

    # Compute health & spatial metrics
    health_meta = _compute_field_health(analyses)
    field["health_score"] = health_meta["health_score"]
    field["status"] = health_meta["status"]
    field["status_color"] = health_meta["status_color"]
    field["active_hotspots"] = health_meta["active_hotspots"]
    field["survival_estimate"] = health_meta["survival_estimate"]
    field["hotspots"] = health_meta["hotspots"]
    field["zones"] = health_meta["zones"]

    return success_response(field)


@router.patch("/fields/{field_id}", response_model=BaseResponse[dict])
async def update_field(field_id: str, payload: FieldUpdate, user: dict = Depends(rate_limit)):
    """Update field metadata."""
    user_id = user["id"]
    updates = {}
    if payload.name.strip():
        updates["name"] = payload.name.strip()
    if payload.location_name.strip():
        updates["location_name"] = payload.location_name.strip()
    if payload.latitude != 0.0:
        updates["latitude"] = payload.latitude
    if payload.longitude != 0.0:
        updates["longitude"] = payload.longitude
    if payload.area_acres > 0.0:
        updates["area_acres"] = payload.area_acres
    if payload.soil_type.strip():
        updates["soil_type"] = payload.soil_type.strip()
    if payload.irrigation_type.strip():
        updates["irrigation_type"] = payload.irrigation_type.strip()
    if payload.notes.strip():
        updates["notes"] = payload.notes.strip()

    if not updates:
        return error_response("BAD_REQUEST", "No updates provided")

    # Try Supabase update
    try:
        sb = get_supabase()
        resp = sb.table("fields").update(updates).eq("id", field_id).eq("user_id", user_id).execute()
        if resp.data:
            return success_response(resp.data[0])
    except Exception as e:
        logger.warning(f"Supabase update failed ({e}), updating local DB.")

    # Fallback local update
    try:
        updated = local_db.update_field(field_id, user_id, updates)
        if updated:
            return success_response(updated)
        return error_response("NOT_FOUND", "Field not found")
    except Exception as e:
        logger.error(f"Local update failed: {e}")
        return error_response("DB_ERROR", "Failed to update field profile")


@router.delete("/fields/{field_id}", response_model=BaseResponse[dict])
async def delete_field(field_id: str, user: dict = Depends(rate_limit)):
    """Delete a field profile safely."""
    user_id = user["id"]
    deleted = False

    # Try Supabase delete
    try:
        sb = get_supabase()
        resp = sb.table("fields").delete().eq("id", field_id).eq("user_id", user_id).execute()
        if resp.data:
            deleted = True
    except Exception as e:
        logger.warning(f"Supabase delete failed ({e}), attempting local delete.")

    # Try local delete
    local_deleted = local_db.delete_field(field_id, user_id)
    if deleted or local_deleted:
        return success_response({"deleted": field_id})

    return error_response("NOT_FOUND", "Field not found")


@router.get("/fields/{field_id}/analytics", response_model=BaseResponse[dict])
async def get_field_analytics(field_id: str, user: dict = Depends(rate_limit)):
    """Detailed Field Health Index, spatial hotspot clusters, and agronomic task suggestions."""
    user_id = user["id"]
    field = _fetch_single_field(field_id, user_id)
    if not field:
        return error_response("NOT_FOUND", "Field not found")

    sb = get_supabase()
    fname = field.get("name", "")
    analyses = []
    try:
        analyses_resp = (
            sb.table("analyses")
            .select("id, disease, severity, created_at, result_json, image_url, crop_id")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        all_analyses = analyses_resp.data or []
        analyses = [a for a in all_analyses if (a.get("result_json") or {}).get("field_id") == field_id or (fname and (a.get("result_json") or {}).get("field_name") == fname)]
    except Exception:
        pass

    health_meta = _compute_field_health(analyses)

    # Generate targeted agronomic action checklist for this field
    actions = []
    if health_meta["active_hotspots"] > 0:
        actions.append({
            "priority": "High",
            "title": f"Targeted spray on {health_meta['active_hotspots']} detected pathogen hotspot(s)",
            "detail": f"Isolate infected quadrants ({', '.join([h['zone'] for h in health_meta['hotspots'][:2]])}) to stop lateral field propagation."
        })
    if field.get("irrigation_type", "").lower() in ["flood", "furrow"]:
        actions.append({
            "priority": "Medium",
            "title": "Check furrow drainage to prevent root moisture stagnation",
            "detail": "Standing water increases fungal spore germination across dense crop rows."
        })
    else:
        actions.append({
            "priority": "Low",
            "title": "Routine canopy inspection & soil moisture audit",
            "detail": "Maintain current irrigation cadence and check leaf undersides on perimeter rows."
        })

    return success_response({
        "field_id": field_id,
        "field_name": field["name"],
        "soil_type": field.get("soil_type", "Alluvial"),
        "irrigation_type": field.get("irrigation_type", "Drip"),
        "area_acres": field.get("area_acres", 1.0),
        "health_score": health_meta["health_score"],
        "status": health_meta["status"],
        "survival_estimate": health_meta["survival_estimate"],
        "hotspots": health_meta["hotspots"],
        "zones": health_meta["zones"],
        "total_scans": len(analyses),
        "action_checklist": actions
    })
