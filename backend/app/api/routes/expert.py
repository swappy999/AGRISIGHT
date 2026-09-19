from fastapi import APIRouter, Depends
from typing import List
from datetime import datetime, timezone
import uuid
from app.schemas.responses import success_response, BaseResponse, error_response
from app.schemas.requests import ExpertEscalationCreate
from app.api.deps import rate_limit
from app.core.logging import logger

router = APIRouter(prefix="/expert", tags=["Expert Escalation"])

# In-memory / persistent escalation buffer
_ESCALATIONS: List[dict] = []


@router.post("/escalations", response_model=BaseResponse[dict])
async def submit_expert_escalation(payload: ExpertEscalationCreate, user: dict = Depends(rate_limit)):
    """Submit a low-confidence or ambiguous diagnosis for human agronomic expert review."""
    try:
        record = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "scan_id": payload.scan_id,
            "image_url": payload.image_url,
            "suspected_issue": payload.suspected_issue or "Ambiguous Leaf Symptom",
            "confidence": payload.confidence,
            "farmer_note": payload.farmer_note,
            "field_id": payload.field_id,
            "crop_id": payload.crop_id,
            "status": "Pending Review",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "assigned_officer": "Dr. S. Mukherjee (Plant Pathology)"
        }
        _ESCALATIONS.insert(0, record)
        logger.info(f"Expert escalation submitted by user {user['id']}: {record['id']}")
        return success_response(record)
    except Exception as e:
        logger.error(f"Escalation submission error: {e}")
        return error_response("ESCALATION_ERROR", "Failed to submit for expert review")


@router.get("/escalations", response_model=BaseResponse[List[dict]])
async def list_expert_escalations(user: dict = Depends(rate_limit)):
    """List submitted expert escalations and review statuses."""
    user_records = [e for e in _ESCALATIONS if e.get("user_id") == user["id"]]
    return success_response(user_records)
