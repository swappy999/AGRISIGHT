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

    # 1. Fetch user's crops safely
    crops = []
    try:
        crops_resp = (
            sb.table("crops")
            .select("name, variety, growth_stage, field_name")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        crops = crops_resp.data or []
    except Exception as e:
        logger.warning(f"Assistant: could not fetch crops from Supabase ({e})")

    # 2. Fetch user's fields safely (Supabase + local SQLite fallback)
    fields = []
    try:
        fields_resp = (
            sb.table("fields")
            .select("name, area_acres, soil_type, irrigation_type, location_name")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        fields = fields_resp.data or []
    except Exception:
        fields = local_db.list_fields(user_id)

    # 3. Fetch recent analyses safely
    analyses = []
    try:
        analyses_resp = (
            sb.table("analyses")
            .select("disease, severity, created_at, result_json")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(12)
            .execute()
        )
        analyses = analyses_resp.data or []
    except Exception as e:
        logger.warning(f"Assistant: could not fetch analyses ({e})")

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
    if getattr(payload, "field_id", None):
        target_f = next((f for f in fields if f.get("id") == payload.field_id or f.get("name") == payload.field_id), None)
        if not target_f:
            try:
                target_f = local_db.get_field(payload.field_id, user_id)
            except Exception:
                pass
        if target_f:
            fields = [target_f] + [f for f in fields if f.get("id") != target_f.get("id")]

    logger.info(
        f"Assistant chat — user={user_id}, crops={len(crops)}, "
        f"fields={len(fields)}, scans={len(analyses)}, "
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
        )
        return success_response(result)

    except Exception as e:
        logger.error(f"Assistant chat unexpected failure: {e}")
        from app.services.gemini_service import _get_agronomic_fallback
        fallback_res = _get_agronomic_fallback(payload.message, crops, analyses, payload.language)
        return success_response(fallback_res)
