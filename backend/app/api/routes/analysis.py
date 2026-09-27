from fastapi import APIRouter, File, UploadFile, Depends, Form
from typing import List, Optional
import uuid
import os
from datetime import datetime
from app.schemas.responses import success_response, BaseResponse, error_response
from app.schemas.requests import AnalyzeResultData
from app.api.deps import rate_limit
from app.services.gemini_service import gemini_service
from app.services.notification_service import notification_service
from app.db.supabase import get_supabase
from app.db.local_db import local_db
from app.core.logging import logger

router = APIRouter()

BUCKET_NAME = "leaf-scans"

async def ensure_bucket_exists(sb):
    try:
        buckets = sb.storage.list_buckets()
        if not any(b.name == BUCKET_NAME for b in buckets):
            sb.storage.create_bucket(BUCKET_NAME, options={"public": True})
            logger.info(f"Created Supabase bucket: {BUCKET_NAME}")
    except Exception as e:
        logger.warning(f"Could not verify/create bucket {BUCKET_NAME}: {str(e)}")


def _severity_rank(severity: Optional[str]) -> int:
    s = (severity or "").lower()
    if s == "critical":
        return 4
    if s in ["high", "severe"]:
        return 3
    if s in ["medium", "moderate"]:
        return 2
    if s == "low":
        return 1
    return 0


def _calculate_smart_follow_up(severity: Optional[str], trend: Optional[str] = None) -> dict:
    s = (severity or "").lower()
    if s in ["critical", "high", "severe"]:
        return {
            "recommended_days": 3,
            "urgency": "High",
            "action_text": "Re-scan in 2–3 days after applying treatment to verify pathogen stoppage.",
            "check_target": "Inspect leaf margins and surrounding foliage for spreading."
        }
    if s in ["medium", "moderate"]:
        return {
            "recommended_days": 5,
            "urgency": "Medium",
            "action_text": "Re-scan in 5–7 days to ensure symptoms do not expand to young shoots.",
            "check_target": "Check leaf undersides and stem junctions."
        }
    return {
        "recommended_days": 10,
        "urgency": "Low",
        "action_text": "Routine check in 10–14 days, or sooner if heavy rains / high humidity occur.",
        "check_target": "Maintain regular monitoring schedule."
    }


def _calculate_progression(current_scan: dict, previous_scan: Optional[dict]) -> dict:
    curr_sev = current_scan.get("severity") or (current_scan.get("result_json") or {}).get("severity", "Low")
    if not previous_scan:
        return {
            "has_previous": False,
            "progression_status": "initial_scan",
            "progression_label": "First Scan for this Crop",
            "progression_desc": "Baseline diagnostic record established for this crop.",
            "severity_delta": 0,
            "days_elapsed": 0,
            "is_recurrence": False,
            "previous_scan": None,
            "smart_follow_up": _calculate_smart_follow_up(curr_sev)
        }

    prev_sev = previous_scan.get("severity") or (previous_scan.get("result_json") or {}).get("severity", "Low")
    curr_rank = _severity_rank(curr_sev)
    prev_rank = _severity_rank(prev_sev)
    severity_delta = curr_rank - prev_rank

    curr_disease = (current_scan.get("disease") or (current_scan.get("result_json") or {}).get("disease", "")).strip()
    prev_disease = (previous_scan.get("disease") or (previous_scan.get("result_json") or {}).get("disease", "")).strip()
    
    is_healthy = curr_disease.lower() in ["healthy", "healthy plant", "no disease"]
    was_healthy = prev_disease.lower() in ["healthy", "healthy plant", "no disease"]
    is_recurrence = (curr_disease.lower() == prev_disease.lower()) and not is_healthy and bool(curr_disease)

    days_elapsed = 0
    try:
        c_dt = datetime.fromisoformat(current_scan["created_at"].replace("Z", "+00:00"))
        p_dt = datetime.fromisoformat(previous_scan["created_at"].replace("Z", "+00:00"))
        days_elapsed = max(0, (c_dt - p_dt).days)
    except Exception:
        pass

    if curr_rank < prev_rank:
        status = "improving"
        label = "Improving"
        desc = f"Severity decreased from {prev_sev} to {curr_sev} over {days_elapsed} day(s)."
    elif curr_rank > prev_rank:
        status = "worsening"
        label = "Worsening"
        desc = f"Severity increased from {prev_sev} to {curr_sev}. Corrective action required."
    else:
        if is_healthy and was_healthy:
            status = "healthy_stable"
            label = "Healthy & Stable"
            desc = "Crop remains consistently healthy across sequential checks."
        elif is_recurrence:
            status = "persistent"
            label = "Persistent Condition"
            desc = f"{curr_disease} remains present at {curr_sev} severity."
        else:
            status = "stable"
            label = "Stable"
            desc = f"Severity level unchanged ({curr_sev})."

    return {
        "has_previous": True,
        "progression_status": status,
        "progression_label": label,
        "progression_desc": desc,
        "severity_delta": severity_delta,
        "days_elapsed": days_elapsed,
        "is_recurrence": is_recurrence,
        "previous_scan": {
            "id": previous_scan.get("id"),
            "disease": previous_scan.get("disease"),
            "severity": previous_scan.get("severity"),
            "created_at": previous_scan.get("created_at"),
            "image_url": previous_scan.get("image_url"),
        },
        "smart_follow_up": _calculate_smart_follow_up(curr_sev, status)
    }


@router.post("/analyze", response_model=BaseResponse[dict])
async def analyze_image(
    image: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
    question: str = Form("What disease is this?"),
    lat: str = Form("22.57"),
    lon: str = Form("88.36"),
    language: str = Form("en"),
    crop_id: Optional[str] = Form(None),
    field_id: Optional[str] = Form(None),
    user: dict = Depends(rate_limit)
):
    upload_file = image or file
    if not upload_file:
        return error_response(code="INVALID_FILE", message="No image file was provided in the request payload.")

    try:
        # Validate MIME Content Type
        content_type = upload_file.content_type or ""
        valid_extensions = (".jpg", ".jpeg", ".png", ".webp", ".heic", ".bmp")
        filename = (upload_file.filename or "").lower()
        
        is_image_type = content_type.startswith("image/") or any(filename.endswith(ext) for ext in valid_extensions)
        if not is_image_type:
            return error_response(code="INVALID_FILE", message="Only image files (JPEG, PNG, WebP) are supported.")
            
        file_bytes = await upload_file.read()
        if len(file_bytes) == 0:
            return error_response(code="EMPTY_IMAGE", message="Uploaded image file is empty (0 bytes).")
            
        if len(file_bytes) > 15 * 1024 * 1024: # 15MB limit
            return error_response(code="PAYLOAD_TOO_LARGE", message="Image size exceeds 15MB. Please upload a compressed photo.")

        # Backend image decoding and dimension validation using PIL
        try:
            from PIL import Image as PILImage, ImageOps
            import io
            pil_img = PILImage.open(io.BytesIO(file_bytes))
            pil_img = ImageOps.exif_transpose(pil_img)
            if pil_img.width < 20 or pil_img.height < 20:
                return error_response(code="IMAGE_TOO_SMALL", message="Image resolution is too low for accurate diagnostic analysis.")
            
            # Downsample large phone/camera photos for rapid Gemini vision diagnosis
            if pil_img.width > 1280 or pil_img.height > 1280:
                pil_img.thumbnail((1280, 1280), PILImage.Resampling.LANCZOS)
            if pil_img.mode in ("RGBA", "P"):
                pil_img = pil_img.convert("RGB")
                
            opt_buf = io.BytesIO()
            pil_img.save(opt_buf, format="JPEG", quality=85, optimize=True)
            optimized_bytes = opt_buf.getvalue()
        except Exception as decode_err:
            logger.warning(f"Backend image decoding failed: {decode_err}")
            return error_response(code="INVALID_IMAGE", message="Uploaded file could not be decoded as a valid image. Please provide a clear leaf photo.")
        # 1. Image URL assignment & storage upload (a5.md Section 7: Unique scan_ ID)
        record_id = f"scan_{uuid.uuid4().hex[:16]}"
        file_ext = "jpg"
        if upload_file.filename and "." in upload_file.filename:
            file_ext = upload_file.filename.split(".")[-1].lower()
        file_path = f"{user['id']}/{record_id}.{file_ext}"
        
        # Save locally so image is always available immediately
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        uploads_dir = os.path.join(backend_dir, "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        local_filename = f"{record_id}.{file_ext}"
        local_file_path = os.path.join(uploads_dir, local_filename)
        image_url = f"/api/backend/uploads/{local_filename}"
        try:
            with open(local_file_path, "wb") as f:
                f.write(optimized_bytes)
        except Exception as write_err:
            logger.warning(f"Failed to write local image: {write_err}")

        # Upload to Supabase storage if available
        try:
            sb = get_supabase()
            sb.storage.from_(BUCKET_NAME).upload(
                file_path,
                optimized_bytes,
                file_options={"content-type": "image/jpeg", "upsert": "true"}
            )
            sb_public = sb.storage.from_(BUCKET_NAME).get_public_url(file_path)
            if sb_public:
                image_url = sb_public
                logger.info(f"Image uploaded to Supabase: {image_url}")
        except Exception as sb_err:
            logger.info(f"Supabase storage upload skipped or failed ({sb_err}), using local image: {image_url}")

        # 2. Analyze with Gemini (passing target language)
        logger.info(f"User {user['id']} executing analyze_image with language={language}, size={len(optimized_bytes)} bytes.")
        try:
            analysis_result: AnalyzeResultData = gemini_service.analyze_image(
                image_bytes=optimized_bytes,
                question=question,
                lat=lat,
                lon=lon,
                language=language
            )
        except Exception as ai_err:
            logger.warning(f"AI image analysis raised error ({ai_err}). Using agronomic fallback.")
            from app.services.gemini_service import _get_agronomic_vision_fallback
            analysis_result = _get_agronomic_vision_fallback(question, language)
        
        from app.core.security import DEFAULT_DEV_USER_ID

        # 3. Parse coordinates safely & embed in result_json
        parsed_lat = None
        parsed_lon = None
        try:
            parsed_lat = float(lat)
            parsed_lon = float(lon)
        except Exception:
            pass

        result_dict = analysis_result.model_dump()
        result_dict["latitude"] = parsed_lat
        result_dict["longitude"] = parsed_lon
        if field_id and field_id.strip():
            result_dict["field_id"] = field_id.strip()

        # Parse risk score and severity safely
        safe_risk_score = 0.0
        try:
            if isinstance(analysis_result.risk_score, (int, float)):
                safe_risk_score = float(analysis_result.risk_score)
            elif isinstance(analysis_result.risk_score, str):
                digits = "".join([c for c in analysis_result.risk_score if c.isdigit() or c == '.'])
                safe_risk_score = float(digits) if digits else 0.0
        except Exception:
            safe_risk_score = 0.0

        # 4. Save result to DB (protecting from non-crop contamination)
        if not analysis_result.is_agricultural or analysis_result.validation_status == "NON_CROP":
            db_disease = "Non-Crop Image"
            safe_severity = "None"
        else:
            db_disease = analysis_result.disease or analysis_result.condition or ("Healthy Plant" if analysis_result.health_status == "Healthy" else "Diagnosis Uncertain")
            safe_severity = (analysis_result.severity or "Low").strip()

        db_record = {
            "id": record_id,
            "user_id": user["id"],
            "image_url": image_url,
            "disease": db_disease,
            "severity": safe_severity,
            "result_json": result_dict,
        }
        if analysis_result.is_agricultural and crop_id and crop_id.strip():
            db_record["crop_id"] = crop_id.strip()
        if field_id and field_id.strip():
            db_record["field_id"] = field_id.strip()

        # Always save immediately to local SQLite DB so user gets instant response
        try:
            local_db.create_analysis(user["id"], db_record)
        except Exception as ldb_err:
            logger.warning(f"Local DB save failed: {ldb_err}")

        # Save to Supabase remote database if available (a4.md Section 24)
        try:
            from datetime import timezone
            sb = get_supabase()
            sb.table("analyses").insert({
                "id": record_id,
                "user_id": user["id"],
                "image_url": image_url,
                "disease": db_disease,
                "severity": safe_severity,
                "result_json": result_dict,
                "crop_id": db_record.get("crop_id", ""),
                "field_id": result_dict.get("field_id", ""),
                "created_at": datetime.now(timezone.utc).isoformat()
            }).execute()
            logger.info(f"Analysis saved to Supabase: {record_id}")
        except Exception as sb_ins_err:
            logger.info(f"Supabase analysis insert skipped/failed: {sb_ins_err}")

        # 5. Create Notification ONLY if valid agricultural crop with high risk
        if analysis_result.is_agricultural and (safe_risk_score > 70 or safe_severity.lower() in ['high', 'severe', 'critical']):
            try:
                disease_name = analysis_result.disease or analysis_result.condition or "Crop Infection"
                notification_service.create_notification(
                    user_id=user["id"], 
                    message=f"Critical: {disease_name} detected in your crop!", 
                    notif_type="critical" if safe_risk_score > 85 else "alert"
                )
            except Exception as e:
                logger.warning(f"Failed to create notification: {e}")

        return success_response({
            "id": record_id,
            "result": analysis_result.model_dump(),
            "image_url": image_url,
            "crop_id": db_record.get("crop_id"),
            "field_id": result_dict.get("field_id"),
            "db_saved": True
        })
    except Exception as e:
        logger.error(f"Failed to analyze: {str(e)}")
        # Provide guaranteed fallback response instead of blocking the user
        from app.services.gemini_service import _get_agronomic_vision_fallback
        fallback_res = _get_agronomic_vision_fallback(question, language)
        fallback_img = locals().get("image_url") or "/api/backend/uploads/fallback_leaf.jpg"
        return success_response({
            "id": locals().get("record_id") or f"scan_{uuid.uuid4().hex[:16]}",
            "result": fallback_res.model_dump(),
            "image_url": fallback_img,
            "crop_id": crop_id if crop_id and crop_id.strip() else None,
            "field_id": field_id if field_id and field_id.strip() else None,
            "db_saved": False
        })


@router.get("/analyses", response_model=BaseResponse[List[dict]])
async def get_analyses(user: dict = Depends(rate_limit)):
    local_analyses = local_db.list_analyses(user["id"])
    try:
        sb = get_supabase()
        from app.core.security import DEFAULT_DEV_USER_ID
        if user["id"] == DEFAULT_DEV_USER_ID:
            resp = sb.table("analyses").select("*").eq("user_id", DEFAULT_DEV_USER_ID).order("created_at", desc=True).limit(20).execute()
        else:
            resp = sb.table("analyses").select("*").in_("user_id", [user["id"], DEFAULT_DEV_USER_ID]).order("created_at", desc=True).limit(20).execute()
        if resp.data:
            # Combine without duplicates
            seen_ids = set()
            combined = []
            for item in (resp.data + local_analyses):
                if item["id"] not in seen_ids:
                    seen_ids.add(item["id"])
                    combined.append(item)
            return success_response(combined)
    except Exception as e:
        logger.warning(f"Fetch remote analyses failed: {str(e)}. Using local fallback.")
    
    return success_response(local_analyses)


def _fetch_analysis_record(analysis_id: str, user_id: str) -> Optional[dict]:
    # 1. Check local DB first
    rec = local_db.get_analysis(analysis_id, user_id)
    if rec:
        return rec

    # 2. Check Supabase
    try:
        sb = get_supabase()
        resp = sb.table("analyses").select("*").eq("id", analysis_id).execute()
        if resp.data:
            return resp.data[0]
    except Exception as e:
        logger.warning(f"Fetch remote analysis failed for {analysis_id}: {str(e)}")

    return None


def _find_candidate_scans(current_scan: dict, user_id: str) -> List[dict]:
    from app.core.security import DEFAULT_DEV_USER_ID
    allowed_ids = [user_id, DEFAULT_DEV_USER_ID]
    if current_scan.get("user_id") and current_scan["user_id"] not in allowed_ids:
        allowed_ids.append(current_scan["user_id"])

    all_scans = []

    # 1. Fetch from local DB for all relevant user IDs
    for uid in allowed_ids:
        try:
            for s in local_db.list_analyses(uid):
                all_scans.append(s)
        except Exception as e:
            logger.warning(f"Local DB candidate scan list failed for {uid}: {e}")

    # 2. Fetch from Supabase
    try:
        sb = get_supabase()
        resp = sb.table("analyses").select("*").in_("user_id", allowed_ids).order("created_at", desc=True).limit(50).execute()
        if resp.data:
            all_scans.extend(resp.data)
    except Exception as e:
        logger.warning(f"Supabase candidate scan list failed: {e}")

    # Deduplicate by id and filter out current_scan itself and newer records
    curr_id = current_scan.get("id")
    curr_created = current_scan.get("created_at")
    seen_ids = set()
    candidates = []

    for s in all_scans:
        sid = s.get("id")
        if not sid or sid == curr_id or sid in seen_ids:
            continue
        seen_ids.add(sid)

        s_created = s.get("created_at")
        if curr_created and s_created and str(s_created) >= str(curr_created):
            continue
        candidates.append(s)

    # Sort descending by created_at (newest prior scan first)
    candidates.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
    return candidates


def _pick_best_previous_scan(current_scan: dict, candidates: List[dict]) -> Optional[dict]:
    if not candidates:
        return None

    curr_crop_id = current_scan.get("crop_id")
    curr_rj = current_scan.get("result_json") or {}
    if isinstance(curr_rj, str):
        try:
            import json
            curr_rj = json.loads(curr_rj)
        except Exception:
            curr_rj = {}

    curr_crop_name = (curr_rj.get("crop") or curr_rj.get("plant_name") or current_scan.get("crop") or "").strip().lower()
    curr_disease = (current_scan.get("disease") or curr_rj.get("disease") or "").strip().lower()

    # 1. Match by crop_id if available
    if curr_crop_id:
        for c in candidates:
            if c.get("crop_id") and c["crop_id"] == curr_crop_id:
                return c

    # 2. Match by crop name (e.g. Maize, Corn, Tomato)
    if curr_crop_name:
        for c in candidates:
            c_rj = c.get("result_json") or {}
            if isinstance(c_rj, str):
                try:
                    import json
                    c_rj = json.loads(c_rj)
                except Exception:
                    c_rj = {}
            c_crop = (c_rj.get("crop") or c_rj.get("plant_name") or c.get("crop") or "").strip().lower()
            c_dis = (c.get("disease") or c_rj.get("disease") or "").strip().lower()

            if c_crop and (c_crop == curr_crop_name or c_crop in curr_crop_name or curr_crop_name in c_crop):
                return c
            # Synonym / alias match for corn / maize
            if curr_crop_name in ["maize", "corn"] and (c_crop in ["maize", "corn"] or "maize" in c_dis or "corn" in c_dis or "kernel" in c_dis or "ear rot" in c_dis):
                return c

    # 3. Fallback to immediate prior scan of ANY crop
    return candidates[0]


# IMPORTANT: /analyses/compare MUST be registered BEFORE /analyses/{id} in FastAPI
@router.get("/analyses/compare", response_model=BaseResponse[dict])
async def compare_analyses(scan1_id: str, scan2_id: str, user: dict = Depends(rate_limit)):
    """Compare two arbitrary scans for the authenticated user."""
    try:
        from app.core.security import DEFAULT_DEV_USER_ID
        s1 = _fetch_analysis_record(scan1_id, user["id"])
        s2 = _fetch_analysis_record(scan2_id, user["id"])
        if not s1 or not s2:
            return error_response("NOT_FOUND", "One or both analysis records were not found")

        # Verify access: record belongs to user or dev fallback
        allowed_ids = [user["id"], DEFAULT_DEV_USER_ID]
        if s1.get("user_id") and s1["user_id"] not in allowed_ids and user["id"] != DEFAULT_DEV_USER_ID:
            return error_response("FORBIDDEN", "Unauthorized access to analysis record")
        if s2.get("user_id") and s2["user_id"] not in allowed_ids and user["id"] != DEFAULT_DEV_USER_ID:
            return error_response("FORBIDDEN", "Unauthorized access to analysis record")

        # Order chronologically: older is 'previous', newer is 'current'
        try:
            t1 = datetime.fromisoformat(str(s1["created_at"]).replace("Z", "+00:00"))
            t2 = datetime.fromisoformat(str(s2["created_at"]).replace("Z", "+00:00"))
            if t1 <= t2:
                older, newer = s1, s2
            else:
                older, newer = s2, s1
        except Exception:
            older, newer = s1, s2

        progression = _calculate_progression(newer, older)
        return success_response({
            "previous_scan": older,
            "current_scan": newer,
            "comparison": progression
        })
    except Exception as e:
        logger.error(f"Compare analyses failed: {str(e)}")
        return error_response("DB_ERROR", "Failed to compare analyses")


@router.get("/analyses/{id}/progression", response_model=BaseResponse[dict])
async def get_analysis_progression(id: str, user: dict = Depends(rate_limit)):
    """Fetch an analysis along with its comparative progression relative to the previous scan for the same crop."""
    try:
        from app.core.security import DEFAULT_DEV_USER_ID
        current_scan = _fetch_analysis_record(id, user["id"])
        if not current_scan:
            return error_response("NOT_FOUND", "Analysis record not found")

        # Verify access
        allowed_ids = [user["id"], DEFAULT_DEV_USER_ID]
        if current_scan.get("user_id") and current_scan["user_id"] not in allowed_ids and user["id"] != DEFAULT_DEV_USER_ID:
            return error_response("NOT_FOUND", "Analysis record not found")

        candidates = _find_candidate_scans(current_scan, user["id"])
        previous_scan = _pick_best_previous_scan(current_scan, candidates)
        progression = _calculate_progression(current_scan, previous_scan)

        # Build list of available prior scans for client-side selection
        available_priors = []
        for c in candidates[:10]:
            c_rj = c.get("result_json") or {}
            if isinstance(c_rj, str):
                try:
                    import json
                    c_rj = json.loads(c_rj)
                except Exception:
                    c_rj = {}
            c_crop = c_rj.get("crop") or c_rj.get("plant_name") or c.get("crop") or "Crop"
            available_priors.append({
                "id": c["id"],
                "created_at": c.get("created_at"),
                "disease": c.get("disease", "Healthy"),
                "severity": c.get("severity", "Low"),
                "crop": c_crop,
                "image_url": c.get("image_url", ""),
            })

        return success_response({
            "current_analysis": current_scan,
            "progression": progression,
            "available_prior_scans": available_priors
        })
    except Exception as e:
        logger.error(f"Fetch progression failed: {str(e)}")
        return error_response("DB_ERROR", "Failed to compute progression")


@router.get("/analyses/{id}", response_model=BaseResponse[dict])
async def get_analysis(id: str, user: dict = Depends(rate_limit)):
    # 1. Try local DB first for instant response
    local_rec = local_db.get_analysis(id, user["id"])
    if local_rec:
        return success_response(local_rec)

    try:
        sb = get_supabase()
        from app.core.security import DEFAULT_DEV_USER_ID
        resp = sb.table("analyses").select("*").eq("id", id).execute()
        if resp.data:
            record = resp.data[0]
            allowed_ids = [user["id"], DEFAULT_DEV_USER_ID]
            if record.get("user_id") and record["user_id"] not in allowed_ids and user["id"] != DEFAULT_DEV_USER_ID:
                return error_response("NOT_FOUND", "Analysis record not found")

            if user["id"] != DEFAULT_DEV_USER_ID and record.get("user_id") == DEFAULT_DEV_USER_ID:
                try:
                    sb.table("analyses").update({"user_id": user["id"]}).eq("id", id).execute()
                    record["user_id"] = user["id"]
                except Exception:
                    pass

            return success_response(record)
    except Exception as e:
        logger.warning(f"Fetch remote analysis failed: {str(e)}")

    if local_rec:
        return success_response(local_rec)

    return error_response("NOT_FOUND", "Analysis record not found")


@router.patch("/analyses/{id}/crop", response_model=BaseResponse[dict])
async def assign_crop_to_analysis(id: str, crop_id: Optional[str] = None, user: dict = Depends(rate_limit)):
    try:
        sb = get_supabase()
        from app.core.security import DEFAULT_DEV_USER_ID
        check = sb.table("analyses").select("id, user_id").eq("id", id).execute()
        if not check.data:
            return error_response("NOT_FOUND", "Analysis record not found")

        allowed_ids = [user["id"], DEFAULT_DEV_USER_ID]
        if check.data[0].get("user_id") and check.data[0]["user_id"] not in allowed_ids and user["id"] != DEFAULT_DEV_USER_ID:
            return error_response("NOT_FOUND", "Analysis record not found")

        # If crop_id is provided, verify it belongs to user
        if crop_id and crop_id.strip():
            crop_check = sb.table("crops").select("id").eq("id", crop_id.strip()).in_("user_id", allowed_ids).execute()
            if not crop_check.data:
                return error_response("NOT_FOUND", "Crop not found")
            target_crop_id = crop_id.strip()
        else:
            target_crop_id = None

        resp = sb.table("analyses").update({"crop_id": target_crop_id}).eq("id", id).execute()
        if not resp.data:
            return error_response("DB_ERROR", "Failed to update analysis crop association")
        return success_response(resp.data[0])
    except Exception as e:
        logger.error(f"Assign crop failed: {str(e)}")
        return error_response("DB_ERROR", "Failed to link crop to analysis")


@router.patch("/analyses/{id}/field", response_model=BaseResponse[dict])
async def assign_field_to_analysis(id: str, field_id: Optional[str] = None, user: dict = Depends(rate_limit)):
    try:
        sb = get_supabase()
        from app.core.security import DEFAULT_DEV_USER_ID
        check = sb.table("analyses").select("id, user_id, result_json").eq("id", id).execute()
        if not check.data:
            return error_response("NOT_FOUND", "Analysis record not found")

        allowed_ids = [user["id"], DEFAULT_DEV_USER_ID]
        if check.data[0].get("user_id") and check.data[0]["user_id"] not in allowed_ids and user["id"] != DEFAULT_DEV_USER_ID:
            return error_response("NOT_FOUND", "Analysis record not found")

        # If field_id is provided, verify it belongs to user
        if field_id and field_id.strip():
            field_check = sb.table("fields").select("id").eq("id", field_id.strip()).in_("user_id", allowed_ids).execute()
            if not field_check.data:
                return error_response("NOT_FOUND", "Field not found")
            target_field_id = field_id.strip()
        else:
            target_field_id = None

        # Update field_id inside result_json
        curr_record = check.data[0]
        curr_rj = curr_record.get("result_json") or {}
        curr_rj["field_id"] = target_field_id

        try:
            resp = sb.table("analyses").update({"result_json": curr_rj, "field_id": target_field_id}).eq("id", id).execute()
        except Exception:
            resp = sb.table("analyses").update({"result_json": curr_rj}).eq("id", id).execute()

        if not resp.data:
            return error_response("DB_ERROR", "Failed to update analysis field association")
        return success_response(resp.data[0])
    except Exception as e:
        logger.error(f"Assign field failed: {str(e)}")
        return error_response("DB_ERROR", "Failed to link field to analysis")
