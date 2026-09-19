from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.schemas.responses import success_response, BaseResponse, error_response
from app.api.deps import rate_limit
from app.db.supabase import get_supabase
from app.db import local_db
from app.services.risk_service import calculate_farm_risk
from app.core.logging import logger

router = APIRouter()

@router.get("/risk/summary", response_model=BaseResponse[dict])
async def get_farm_risk_summary(
    temp: Optional[float] = Query(None),
    humidity: Optional[float] = Query(None),
    rain_probability: Optional[float] = Query(None),
    user: dict = Depends(rate_limit)
):
    """
    Central Agricultural Risk Engine Endpoint.
    Combines live scans, crop phenology, field profiles, recent interventions, and weather.
    """
    try:
        user_id = user["id"]
        sb = get_supabase()
        
        # 1. Fetch recent analyses
        analyses = []
        try:
            a_resp = sb.table("analyses").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(30).execute()
            analyses = a_resp.data or []
        except Exception:
            analyses = local_db.get_analyses_by_user(user_id) or []
            
        # 2. Fetch crops
        crops = []
        try:
            c_resp = sb.table("crops").select("*").eq("user_id", user_id).execute()
            crops = c_resp.data or []
        except Exception:
            pass
            
        # 3. Fetch fields
        fields = []
        try:
            f_resp = sb.table("fields").select("*").eq("user_id", user_id).execute()
            fields = f_resp.data or []
        except Exception:
            fields = local_db.get_fields(user_id) or []
            
        # 4. Fetch recent interventions
        interventions = []
        try:
            i_resp = sb.table("interventions").select("*").eq("user_id", user_id).order("performed_at", desc=True).limit(20).execute()
            interventions = i_resp.data or []
        except Exception:
            pass

        # 5. Weather payload if provided
        weather_dict = None
        if temp is not None or humidity is not None:
            weather_dict = {
                "temp": temp if temp is not None else 26,
                "humidity": humidity if humidity is not None else 65,
                "rain_probability": rain_probability if rain_probability is not None else 20
            }

        # Calculate composite multi-vector risk
        report = calculate_farm_risk(
            analyses=analyses,
            crops=crops,
            fields=fields,
            interventions=interventions,
            weather=weather_dict
        )

        return success_response(report)
    except Exception as e:
        logger.error(f"Calculate farm risk failed: {e}")
        return error_response("RISK_EVAL_ERROR", f"Failed to compute risk radar: {str(e)}")
