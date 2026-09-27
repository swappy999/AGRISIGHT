import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.schemas.requests import AssistantChatRequest
from app.schemas.responses import success_response, BaseResponse, error_response
from app.api.deps import rate_limit
from app.services.gemini_service import gemini_service
from app.db.supabase import get_supabase
from app.db.local_db import local_db
from app.core.logging import logger
from app.utils.exceptions import AIServiceError

router = APIRouter()


@router.post("/assistant/chat", response_model=BaseResponse[dict])
async def assistant_chat(payload: AssistantChatRequest, user: dict = Depends(rate_limit)):
    """
    AgriSight AI Assistant.
    Fetches the user's crops, fields, recent analyses, and interventions,
    injects them into a Gemini prompt as context, and returns a grounded response.
    """
    sb = get_supabase()
    user_id = user["id"]

    # 1. Fetch user's crops safely (Supabase + local SQLite fallback)
    crops = []
    try:
        crops_resp = (
            sb.table("crops")
            .select("id, name, variety, growth_stage, field_name, field_id")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        crops = crops_resp.data or []
    except Exception as e:
        logger.warning(f"Assistant: could not fetch crops from Supabase ({e})")
    
    local_crops = local_db.list_crops(user_id)
    seen_crop_names = {c.get("name") for c in crops}
    for lc in local_crops:
        if lc.get("name") not in seen_crop_names:
            crops.append(lc)
            seen_crop_names.add(lc.get("name"))

    # 2. Fetch user's fields safely (Supabase + local SQLite fallback)
    fields = []
    try:
        fields_resp = (
            sb.table("fields")
            .select("id, name, area_acres, soil_type, irrigation_type, location_name")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        fields = fields_resp.data or []
    except Exception:
        fields = local_db.list_fields(user_id)

    # 3. Fetch recent analyses safely (Supabase + local SQLite fallback) - a4.md & a5.md
    analyses = []
    try:
        analyses_resp = (
            sb.table("analyses")
            .select("id, disease, severity, created_at, result_json, crop_id, field_id")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(15)
            .execute()
        )
        analyses = analyses_resp.data or []
    except Exception as e:
        logger.warning(f"Assistant: could not fetch analyses from Supabase ({e})")

    local_analyses = local_db.list_analyses(user_id)
    seen_analysis_ids = {a.get("id") for a in analyses if a.get("id")}
    for la in local_analyses:
        la_id = la.get("id")
        if not la_id or la_id not in seen_analysis_ids:
            analyses.append(la)
            if la_id:
                seen_analysis_ids.add(la_id)

    # 3b. Client Authoritative Scan Context Injection (a5.md Sections 5, 6, 11, 12, 16, 17)
    # If client passed latest_scan from local device storage, inject it at the very top of analyses
    client_scans_injected = []
    if payload.latest_scan:
        ls = payload.latest_scan
        ls_id = ls.id or f"scan_{uuid.uuid4().hex[:12]}"
        ls_crop = ls.crop or ls.crop_name or (ls.result_json.get("crop") if isinstance(ls.result_json, dict) else None) or "crop"
        ls_cond = ls.condition or ls.disease or "Healthy Plant"
        ls_actions = ls.recommended_actions or (ls.result_json.get("actions") if isinstance(ls.result_json, dict) else []) or []
        ls_obs = ls.observations or (ls.result_json.get("observations") if isinstance(ls.result_json, dict) else []) or []
        ls_date = ls.created_at or datetime.now(timezone.utc).isoformat()

        structured_client_scan = {
            "id": ls_id,
            "disease": ls_cond,
            "condition": ls_cond,
            "severity": ls.severity or "Low",
            "created_at": ls_date,
            "crop_id": ls.crop_id or payload.crop_id or "",
            "field_id": ls.field_id or payload.field_id or "",
            "field_name": ls.field_name or "",
            "crop": ls_crop,
            "result_json": ls.result_json or {
                "crop": ls_crop,
                "disease": ls_cond,
                "condition": ls_cond,
                "severity": ls.severity or "Low",
                "actions": ls_actions,
                "observations": ls_obs,
                "possible_causes": ls.possible_causes or [],
                "prevention": ls.prevention or [],
                "summary": " ".join(ls_obs) if ls_obs else f"{ls_cond} observed on {ls_crop}."
            }
        }
        client_scans_injected.append(structured_client_scan)

    if payload.recent_scans:
        for rs in payload.recent_scans:
            rs_id = rs.id or f"scan_{uuid.uuid4().hex[:12]}"
            if client_scans_injected and rs_id == client_scans_injected[0].get("id"):
                continue
            rs_crop = rs.crop or rs.crop_name or (rs.result_json.get("crop") if isinstance(rs.result_json, dict) else None) or "crop"
            rs_cond = rs.condition or rs.disease or "Healthy Plant"
            client_scans_injected.append({
                "id": rs_id,
                "disease": rs_cond,
                "condition": rs_cond,
                "severity": rs.severity or "Low",
                "created_at": rs.created_at or datetime.now(timezone.utc).isoformat(),
                "crop_id": rs.crop_id or "",
                "field_id": rs.field_id or "",
                "field_name": rs.field_name or "",
                "crop": rs_crop,
                "result_json": rs.result_json or {
                    "crop": rs_crop,
                    "disease": rs_cond,
                    "condition": rs_cond,
                    "severity": rs.severity or "Low",
                    "actions": rs.recommended_actions or [],
                    "observations": rs.observations or [],
                }
            })

    if client_scans_injected:
        injected_ids = {s["id"] for s in client_scans_injected}
        analyses = client_scans_injected + [a for a in analyses if a.get("id") not in injected_ids]
    else:
        # Sort all analyses newest first
        analyses.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    
    analyses = analyses[:12]

    # 4. Fetch recent interventions safely (Supabase + local SQLite fallback)
    interventions = []
    try:
        interventions_resp = (
            sb.table("interventions")
            .select("action_title, action_type, notes, created_at")
            .eq("user_id", user_id)
            .order("performed_at", desc=True)
            .limit(8)
            .execute()
        )
        interventions = interventions_resp.data or []
    except Exception:
        interventions = local_db.list_interventions(user_id)

    # If field_id is passed, prioritize that field at top of context
    target_field_id = getattr(payload, "field_id", None) or (analyses[0].get("field_id") if analyses else None)
    if target_field_id:
        target_f = next((f for f in fields if f.get("id") == target_field_id or f.get("name") == target_field_id), None)
        if not target_f:
            try:
                target_f = local_db.get_field(target_field_id, user_id)
            except Exception:
                pass
        if target_f:
            fields = [target_f] + [f for f in fields if f.get("id") != target_f.get("id")]

    # If crop_id is passed, prioritize that crop at top of context
    target_crop_id = getattr(payload, "crop_id", None) or (analyses[0].get("crop_id") if analyses else None)
    if target_crop_id:
        target_c = next((c for c in crops if c.get("id") == target_crop_id or c.get("name") == target_crop_id), None)
        if target_c:
            crops = [target_c] + [c for c in crops if c.get("id") != target_c.get("id")]

    latest_id = analyses[0].get("id") if analyses else "none"
    latest_crop = (analyses[0].get("crop") or (analyses[0].get("result_json") or {}).get("crop")) if analyses else "none"
    latest_disease = analyses[0].get("disease") if analyses else "none"
    logger.info(
        f"Assistant chat — user={user_id}, crops={len(crops)}, "
        f"fields={len(fields)}, scans={len(analyses)} (latest: id={latest_id}, crop={latest_crop}, disease={latest_disease}), "
        f"interventions={len(interventions)}, lang={payload.language}, field_id={payload.field_id}"
    )

    try:
        result = gemini_service.chat_with_context(
            message=payload.message,
            crops=crops,
            analyses=analyses,
            fields=fields,
            interventions=interventions,
            language=payload.language,
            context_text=payload.context_text or "",
        )
        return success_response(result)

    except Exception as e:
        logger.error(f"Assistant chat unexpected failure: {e}")
        from app.services.gemini_service import _get_agronomic_fallback
        fallback_res = _get_agronomic_fallback(payload.message, crops, analyses, payload.language)
        return success_response(fallback_res)
