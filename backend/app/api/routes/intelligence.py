from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.schemas.responses import success_response, BaseResponse, error_response
from app.schemas.requests import DigitalTwinSimulationRequest
from app.api.deps import rate_limit
from app.services.weather_service import weather_service
from app.services.risk_engine import risk_engine
from app.services.digital_twin_service import digital_twin_service
from app.db.supabase import get_supabase
from app.db.local_db import local_db
from app.core.logging import logger

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])


async def _load_user_context(user_id: str):
    sb = get_supabase()
    crops = []
    try:
        c_resp = sb.table("crops").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        crops = c_resp.data or []
    except Exception:
        pass

    fields = []
    try:
        f_resp = sb.table("fields").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        fields = f_resp.data or []
    except Exception:
        fields = local_db.list_fields(user_id)

    analyses = []
    try:
        a_resp = sb.table("analyses").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(20).execute()
        analyses = a_resp.data or []
    except Exception:
        pass

    interventions = []
    try:
        i_resp = sb.table("interventions").select("*").eq("user_id", user_id).order("performed_at", desc=True).limit(20).execute()
        interventions = i_resp.data or []
    except Exception:
        interventions = local_db.list_interventions(user_id)

    return crops, fields, analyses, interventions


@router.get("/weather", response_model=BaseResponse[dict])
async def get_weather_intelligence(
    lat: float = Query(22.57),
    lon: float = Query(88.36),
    language: str = Query("en"),
    user: dict = Depends(rate_limit)
):
    """Agricultural weather interpretation with heat, rain, and fungal pressure risks."""
    try:
        data = await weather_service.get_agricultural_weather(lat=lat, lon=lon, language=language)
        return success_response(data)
    except Exception as e:
        logger.error(f"Weather intelligence error: {e}")
        return error_response("WEATHER_ERROR", "Failed to retrieve agricultural weather")


@router.get("/irrigation", response_model=BaseResponse[dict])
async def get_smart_irrigation(
    language: str = Query("en"),
    lat: float = Query(22.57),
    lon: float = Query(88.36),
    user: dict = Depends(rate_limit)
):
    """Smart irrigation intelligence with soil water-stress risk and recommended watering windows."""
    try:
        crops, fields, analyses, interventions = await _load_user_context(user["id"])
        assessment = await risk_engine.compute_full_assessment(
            crops=crops, fields=fields, analyses=analyses, interventions=interventions,
            lat=lat, lon=lon, language=language
        )
        return success_response(assessment["smart_irrigation"])
    except Exception as e:
        logger.error(f"Smart irrigation calculation error: {e}")
        return error_response("IRRIGATION_ERROR", "Failed to calculate irrigation recommendation")


@router.get("/risk", response_model=BaseResponse[dict])
async def get_farm_risk(
    language: str = Query("en"),
    lat: float = Query(22.57),
    lon: float = Query(88.36),
    user: dict = Depends(rate_limit)
):
    """Central risk engine: Disease, Pest, Water-stress, Weather, and Farm Health Index."""
    try:
        crops, fields, analyses, interventions = await _load_user_context(user["id"])
        assessment = await risk_engine.compute_full_assessment(
            crops=crops, fields=fields, analyses=analyses, interventions=interventions,
            lat=lat, lon=lon, language=language
        )
        return success_response(assessment)
    except Exception as e:
        logger.error(f"Risk assessment error: {e}")
        return error_response("RISK_ERROR", "Failed to evaluate agricultural risk engine")


@router.get("/decisions", response_model=BaseResponse[List[dict]])
async def get_farmer_decisions(
    language: str = Query("en"),
    lat: float = Query(22.57),
    lon: float = Query(88.36),
    user: dict = Depends(rate_limit)
):
    """Top 1-3 actionable farmer decision cards prioritized for today's farm operations."""
    try:
        crops, fields, analyses, interventions = await _load_user_context(user["id"])
        assessment = await risk_engine.compute_full_assessment(
            crops=crops, fields=fields, analyses=analyses, interventions=interventions,
            lat=lat, lon=lon, language=language
        )
        return success_response(assessment["decision_cards"])
    except Exception as e:
        logger.error(f"Decision cards generation error: {e}")
        return error_response("DECISIONS_ERROR", "Failed to generate decision cards")


@router.get("/timeline", response_model=BaseResponse[List[dict]])
async def get_farm_timeline(
    field_id: Optional[str] = Query(None),
    user: dict = Depends(rate_limit)
):
    """Unified chronological farm timeline integrating leaf scans, treatments, and alerts."""
    try:
        crops, fields, analyses, interventions = await _load_user_context(user["id"])
        events = []

        # 1. Leaf scan events
        for a in analyses:
            rj = a.get("result_json") or {}
            if field_id and rj.get("field_id") != field_id:
                continue
            events.append({
                "id": a.get("id"),
                "event_type": "scan",
                "title": f"Scan: {a.get('disease') or rj.get('condition') or 'Healthy Plant'}",
                "detail": f"Severity: {a.get('severity', 'Low')} · Confidence: {rj.get('confidence', 90)}%",
                "timestamp": a.get("created_at"),
                "image_url": a.get("image_url") or rj.get("image_url"),
                "category_badge": "Diagnosis",
                "severity": a.get("severity", "Low")
            })

        # 2. Field intervention events
        for inv in interventions:
            if field_id and inv.get("field_id") != field_id:
                continue
            events.append({
                "id": inv.get("id"),
                "event_type": "intervention",
                "title": f"Action: {inv.get('action_title') or inv.get('action_type')}",
                "detail": inv.get("notes") or f"Logged {inv.get('action_type')}",
                "timestamp": inv.get("performed_at") or inv.get("created_at"),
                "category_badge": "Treatment",
                "severity": "Low"
            })

        # Sort chronologically (newest first)
        events.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)
        return success_response(events[:30])
    except Exception as e:
        logger.error(f"Timeline generation error: {e}")
        return error_response("TIMELINE_ERROR", "Failed to generate farm timeline")


@router.post("/digital-twin/simulate", response_model=BaseResponse[dict])
async def simulate_digital_twin(
    payload: DigitalTwinSimulationRequest,
    user: dict = Depends(rate_limit)
):
    """Model-based what-if simulation engine for field digital twin."""
    try:
        crops, fields, _, _ = await _load_user_context(user["id"])
        
        target_field = None
        if payload.field_id:
            target_field = next((f for f in fields if f["id"] == payload.field_id), None)
        if not target_field:
            target_field = fields[0] if fields else {"name": "Primary Field Plot", "health_score": 90, "soil_type": "Alluvial"}

        target_crop = None
        if payload.crop_id:
            target_crop = next((c for c in crops if c["id"] == payload.crop_id), None)
        if not target_crop:
            target_crop = crops[0] if crops else {"name": "Tomato", "growth_stage": "Flowering"}

        simulation = await digital_twin_service.simulate_field_scenario(
            base_field=target_field,
            crop=target_crop,
            days_without_water=payload.days_without_water,
            temperature_delta=payload.temperature_delta,
            rainfall_mm=payload.rainfall_mm,
            pesticide_applied=payload.pesticide_applied,
            language=payload.language
        )
        return success_response(simulation)
    except Exception as e:
        logger.error(f"Digital twin simulation error: {e}")
        return error_response("SIMULATION_ERROR", "Failed to run digital twin simulation")
