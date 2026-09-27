import json
import traceback
from PIL import Image
import io
from google import genai
from google.genai import types
from app.core.config import settings
from app.utils.exceptions import AIServiceError
from app.core.logging import logger
from app.schemas.requests import AnalyzeResultData

import re

def _clean_json_str(text: str) -> str:
    s = (text or "").strip()
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', s)
    if match:
        s = match.group(1).strip()
    elif s.startswith("```"):
        s = re.sub(r'^```[a-zA-Z]*\n?', '', s)
        s = re.sub(r'\n?```$', '', s)
    first_brace = s.find('{')
    last_brace = s.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        s = s[first_brace:last_brace+1]
    return s.strip()


def normalize_language(lang: str = "en", text: str = "") -> str:
    """
    Robustly normalizes language tags like 'bn-IN', 'bn_IN', 'bengali', 'hi-IN', etc.
    Also auto-detects Bengali or Devanagari Unicode script or Romanized farmer messages.
    """
    lang_str = str(lang or "").strip().lower()
    if lang_str.startswith("bn") or "bengali" in lang_str or "bangla" in lang_str:
        return "bn"
    if lang_str.startswith("hi") or "hindi" in lang_str:
        return "hi"
    # Auto-detect from message text if Bengali or Devanagari Unicode script is present
    if text:
        if re.search(r'[\u0980-\u09FF]', text):
            return "bn"
        if re.search(r'[\u0900-\u097F]', text):
            return "hi"
        # Detect Romanized / Hinglish or Banglish phrases
        lowered = text.lower()
        bn_clues = ["amar", "amader", "kemon", "ache", "hoyeche", "hobe", "foshol", "pata", "holud", "shech", "jomi"]
        hi_clues = ["kya", "kaise", "kisan", "fasal", "khet", "paudhe", "patte", "patti", "keeda", "peela", "upchar", "pani", "dawa", "tamatar"]
        words = set(re.findall(r'\b[a-z]+\b', lowered))
        if len(words.intersection(bn_clues)) >= 2 or (len(words.intersection(bn_clues)) >= 1 and any(w in words for w in ["amar", "amader", "foshol"])):
            return "bn"
        if len(words.intersection(hi_clues)) >= 2 or (len(words.intersection(hi_clues)) >= 1 and any(w in words for w in ["kisan", "fasal", "khet", "tamatar"])):
            return "hi"
    return "en"


def _normalize_analysis_data(data: dict, language: str = "en") -> AnalyzeResultData:
    norm_lang = normalize_language(language)
    is_agri = bool(data.get("is_agricultural", True))
    raw_img_type = str(data.get("image_type") or "LEAF").upper().strip()
    raw_val_status = str(data.get("validation_status") or "VALID").upper().strip()
    rejection_reason = data.get("rejection_reason")

    # Hard rejection check for non-crop content
    is_non_crop = (
        not is_agri
        or raw_img_type in ["HUMAN", "ANIMAL", "OBJECT", "DOCUMENT", "SCREENSHOT", "NON_CROP"]
        or raw_val_status in ["NON_CROP", "REJECTED"]
        or (data.get("crop_detected") is False and not data.get("crop"))
    )

    if is_non_crop:
        status = "NON_CROP" if raw_img_type in ["HUMAN", "ANIMAL", "OBJECT", "DOCUMENT", "SCREENSHOT", "NON_CROP"] else "UNCERTAIN_CROP"
        logger.info(
            f"[SCAN VALIDATION] Image type: {raw_img_type} | Agricultural: False | Crop detected: False | "
            f"Validation decision: REJECT | Rejection reason: {rejection_reason or 'NON_CROP_DETECTED'}"
        )

        farmer_msg = {
            "bn": "এই ছবিটি কোনো ফসল বা উদ্ভিদের বলে মনে হচ্ছে না। সঠিক কৃষি বিশ্লেষণের জন্য অনুগ্রহ করে কোনো পাতা, ফল, কান্ড বা উদ্ভিদের পরিষ্কার ছবি আপলোড করুন।",
            "hi": "यह तस्वीर किसी फसल या पौधे की नहीं लगती है। सटीक कृषि विश्लेषण के लिए कृपया किसी पत्ती, पौधे, तने या फल की स्पष्ट फोटो अपलोड करें।",
            "en": "This image does not appear to contain a crop or plant suitable for agricultural analysis. Please upload a clear photo of a crop, leaf, stem, fruit, or plant."
        }.get(norm_lang, "This image does not appear to contain a crop or plant suitable for agricultural analysis. Please upload a clear photo of a crop, leaf, stem, fruit, or plant.")

        return AnalyzeResultData(
            status="non_crop",
            is_agricultural=False,
            image_type=raw_img_type if raw_img_type != "LEAF" else "NON_CROP",
            validation_status=status,
            category="non_crop",
            is_pest_detected=False,
            pest_name=None,
            pest_type=None,
            ipm_recommendations=[],
            crop_detected=False,
            crop_confidence=0,
            rejection_reason=rejection_reason or "NON_CROP_DETECTED",
            crop=None,
            diagnosis=None,
            condition=None,
            disease=None,
            health_status=None,
            severity=None,
            confidence=None,
            risk_score=0,
            summary=farmer_msg,
            actions=[],
            water_advice="",
            nutrition_advice="",
            ipm_advice="",
            symptoms=[],
            possible_causes=[],
            immediate_actions=[],
            management=[],
            cautions=[],
            prevention_steps=[],
            follow_up="",
            cause="",
            treatment="",
            prevention="",
            terrain_insight="",
            prediction=None,
            farmer_answer=farmer_msg,
            farmer_answer_en="This image does not appear to contain a crop or plant suitable for agricultural analysis. Please upload a clear photo of a crop, leaf, stem, fruit, or plant.",
            farmer_answer_hi="यह तस्वीर किसी फसल या पौधे की नहीं लगती है। सटीक कृषि विश्लेषण के लिए कृपया किसी पत्ती, पौधे, तने या फल की स्पष्ट फोटो अपलोड करें।",
            farmer_answer_bn="এই ছবিটি কোনো ফসল বা উদ্ভিদের বলে মনে হচ্ছে না। সঠিক কৃষি বিশ্লেষণের জন্য অনুগ্রহ করে কোনো পাতা, ফল, কান্ড বা উদ্ভিদের পরিষ্কার ছবি আপলোড করুন।"
        )

    # Valid agricultural image processing
    crop_name = data.get("crop")
    if isinstance(crop_name, str):
        crop_name = crop_name.strip()
    if not crop_name or crop_name.lower() in ["unknown", "null", "none", "uncertain"]:
        crop_name = None

    cond_name = data.get("condition") or data.get("disease")
    if isinstance(cond_name, str):
        cond_name = cond_name.strip()
    
    # Check if healthy
    health_status = data.get("health_status")
    is_healthy = False
    if cond_name and cond_name.lower() in ["healthy plant", "healthy", "no disease", "optimal"]:
        is_healthy = True
        cond_name = "Healthy Plant"
        health_status = "Healthy"
    elif health_status and health_status.lower() == "healthy":
        is_healthy = True
        cond_name = "Healthy Plant"

    # Pest detection checks (Phase 3)
    is_pest = bool(data.get("is_pest_detected", False))
    pest_name = data.get("pest_name")
    if isinstance(pest_name, str):
        pest_name = pest_name.strip()
    if not pest_name or pest_name.lower() in ["none", "null", "no pest", "unknown"]:
        pest_name = None
        is_pest = False

    pest_type = data.get("pest_type")
    if isinstance(pest_type, str):
        pest_type = pest_type.strip()
    
    ipm_recommendations = data.get("ipm_recommendations") if isinstance(data.get("ipm_recommendations"), list) else []

    # Nutrient deficiency checks (Phase 4)
    is_nutrient = bool(data.get("is_nutrient_deficiency", False))
    raw_cat = str(data.get("category", "")).lower()
    if raw_cat == "nutrient_deficiency":
        is_nutrient = True
    
    nutrient_name = data.get("nutrient_name")
    if isinstance(nutrient_name, str):
        nutrient_name = nutrient_name.strip()
    if not nutrient_name or nutrient_name.lower() in ["none", "null", "unknown"]:
        nutrient_name = None

    nutrient_type = data.get("nutrient_type")
    if isinstance(nutrient_type, str):
        nutrient_type = nutrient_type.strip()

    fertilizer_recommendations = data.get("fertilizer_recommendations") if isinstance(data.get("fertilizer_recommendations"), list) else []
    soil_test_recommendation = data.get("soil_test_recommendation") or "Laboratory soil and petiole testing is strongly recommended to confirm actual nutrient availability and soil pH."

    # Category determination
    if is_healthy:
        category = "healthy"
    elif is_pest:
        category = "pest"
        if not cond_name or cond_name == "Diagnosis Uncertain":
            cond_name = pest_name or "Pest Infestation"
        health_status = "Unhealthy"
    elif is_nutrient or (cond_name and "deficiency" in cond_name.lower()):
        category = "nutrient_deficiency"
        is_nutrient = True
        if not nutrient_name and cond_name:
            nutrient_name = cond_name.replace("Possible", "").replace("Deficiency", "").strip()
        # Enforce "Possible " prefix per Phase 4 safety requirement
        if cond_name:
            if not cond_name.lower().startswith("possible "):
                cond_name = f"Possible {cond_name}"
        else:
            cond_name = f"Possible {nutrient_name or 'Nutrient'} Deficiency"
        health_status = "At Risk"
    else:
        category = "disease"
        if not cond_name:
            cond_name = "Diagnosis Uncertain"
            health_status = "At Risk"

    # Clean confidence score (supporting float 0.0-1.0 and percentage integers)
    conf = data.get("confidence")
    if isinstance(conf, str):
        digits = "".join([c for c in conf if c.isdigit()])
        conf = int(digits) if digits else None
    elif isinstance(conf, (int, float)):
        if isinstance(conf, float) and 0.0 < conf <= 1.0:
            conf = int(conf * 100)
        else:
            conf = int(conf)
    else:
        conf = None

    # Determine status & uncertainty per a2.md Section 6
    raw_status = str(data.get("status") or "").lower().strip()
    is_uncertain = (
        raw_status == "uncertain"
        or raw_val_status in ["UNCERTAIN", "UNCERTAIN_CROP", "LOW_IMAGE_QUALITY"]
        or cond_name in ["Diagnosis Uncertain", "Inspection Pending", "Uncertain"]
        or (conf is not None and conf < 40)
        or (not crop_name and not cond_name)
    )

    if is_uncertain:
        status = "uncertain"
        val_status = "UNCERTAIN_CROP"
        if not cond_name or cond_name == "Healthy Plant":
            cond_name = "Diagnosis Uncertain"
        health_status = health_status or "At Risk"
    else:
        status = "success"
        val_status = "VALID"

    diagnosis = data.get("diagnosis") or cond_name

    # Calculate real risk_score based on condition
    risk = data.get("risk_score")
    if is_healthy:
        risk = 0
    elif isinstance(risk, str):
        digits = "".join([c for c in risk if c.isdigit()])
        risk = int(digits) if digits else (int(conf) if conf is not None else 50)
    elif isinstance(risk, (int, float)):
        risk = int(risk)
    else:
        risk = int(conf) if conf is not None else 50

    # Clean prediction object if present
    pred = data.get("prediction")
    prediction_obj = None
    if isinstance(pred, dict):
        rec = pred.get("recovery_chance", 85)
        if isinstance(rec, str):
            digits = "".join([c for c in rec if c.isdigit()])
            rec = int(digits) if digits else 85
        elif not isinstance(rec, (int, float)):
            rec = 85
            
        crit = pred.get("critical_warning", False)
        if isinstance(crit, str):
            crit = crit.lower() in ["true", "yes", "1", "critical", "danger"]
        
        prediction_obj = {
            "next_3_days": str(pred.get("next_3_days") or "Condition expected to remain stable with proper care."),
            "next_7_days": str(pred.get("next_7_days") or "Monitor foliage regularly for any changes in vigor."),
            "recovery_chance": int(rec),
            "critical_warning": bool(crit)
        }

    # Ensure list fields are lists
    symptoms = data.get("symptoms") if isinstance(data.get("symptoms"), list) else []
    possible_causes = data.get("possible_causes") if isinstance(data.get("possible_causes"), list) else []
    immediate_actions = data.get("immediate_actions") if isinstance(data.get("immediate_actions"), list) else []
    management = data.get("management") if isinstance(data.get("management"), list) else []
    cautions = data.get("cautions") if isinstance(data.get("cautions"), list) else []
    prevention_steps = data.get("prevention_steps") if isinstance(data.get("prevention_steps"), list) else []

    # Assign language-specific farmer answer
    if norm_lang == "hi" and data.get("farmer_answer_hi"):
        farmer_answer = data["farmer_answer_hi"]
    elif norm_lang == "bn" and data.get("farmer_answer_bn"):
        farmer_answer = data["farmer_answer_bn"]
    else:
        farmer_answer = data.get("farmer_answer") or data.get("farmer_answer_en", "")

    # Actionable guidance & structured advice (a2.md Section 6)
    summary = data.get("summary")
    if isinstance(summary, str) and summary.strip():
        summary = summary.strip()
    else:
        summary = farmer_answer or (f"{cond_name} observed on {crop_name or 'crop'}." if cond_name else "Foliage condition inspected.")

    actions = data.get("actions")
    if isinstance(actions, list) and actions:
        actions = [str(a).strip() for a in actions if str(a).strip()]
    else:
        if norm_lang == "bn":
            actions = immediate_actions if immediate_actions else [
                "ক্ষতিগ্রস্ত গাছে পোকা বা রোগের বিস্তার সতর্কতার সাথে পর্যবেক্ষণ করুন।",
                "মাটির আর্দ্রতা পরীক্ষা করুন এবং পরিমিত সেচ নিশ্চিত করুন।",
                "পরবর্তী ২-৩ দিন ফসলের সতেজতা নিবিড়ভাবে নজরদারিতে রাখুন।"
            ]
        elif norm_lang == "hi":
            actions = immediate_actions if immediate_actions else [
                "प्रभावित पौधों पर कीट या रोग के लक्षणों की सावधानीपूर्वक जांच करें।",
                "मिट्टी की नमी की जांच करें और संतुलित सिंचाई सुनिश्चित करें।",
                "अगले 2-3 दिनों तक फसल की स्थिति पर बारीकी से नज़र रखें।"
            ]
        else:
            actions = immediate_actions if immediate_actions else [
                "Inspect affected plants for pest or lesion patterns.",
                "Verify soil moisture and ensure balanced irrigation.",
                "Monitor crop vigor over the next 2-3 days."
            ]

    water_advice = data.get("water_advice")
    if isinstance(water_advice, str) and water_advice.strip():
        water_advice = water_advice.strip()
    else:
        if norm_lang == "bn":
            water_advice = "ভোরের দিকে সরাসরি শিকড়ে পানি দিন; পাতার ওপর পানি ছিটানো এড়িয়ে চলুন যাতে ছত্রাক রোগ না ছড়ায়।"
        elif norm_lang == "hi":
            water_advice = "सुबह के समय पौधों की जड़ों में पानी दें; पत्तियों पर पानी छिड़कने से बचें ताकि फफूंद न फैले।"
        else:
            water_advice = "Irrigate at root zone in early morning; avoid splashing water on foliage to suppress fungal spread."

    nutrition_advice = data.get("nutrition_advice")
    if isinstance(nutrition_advice, str) and nutrition_advice.strip():
        nutrition_advice = nutrition_advice.strip()
    elif fertilizer_recommendations:
        nutrition_advice = f"{'সুপারিশকৃত সার প্রয়োগ:' if norm_lang == 'bn' else 'अनुशंसित उर्वरक प्रयोग:' if norm_lang == 'hi' else 'Apply recommended nutrients:'} {fertilizer_recommendations[0]}"
    else:
        if norm_lang == "bn":
            nutrition_advice = "ল্যাব থেকে মাটি পরীক্ষা করিয়ে মাটির পিএইচ ও পুষ্টির অবস্থা নিশ্চিত করার পর প্রয়োজনীয় সুষম সার প্রয়োগ করুন।"
        elif norm_lang == "hi":
            nutrition_advice = "प्रयोगशाला से मिट्टी की जांच करवाकर पोषक तत्वों और पीएच की पुष्टि के बाद ही संतुलित खाद डालें।"
        else:
            nutrition_advice = soil_test_recommendation

    ipm_advice = data.get("ipm_advice")
    if isinstance(ipm_advice, str) and ipm_advice.strip():
        ipm_advice = ipm_advice.strip()
    elif ipm_recommendations:
        ipm_advice = f"{'আইপিএম পদ্ধতি:' if norm_lang == 'bn' else 'आईपीएम पद्धति:' if norm_lang == 'hi' else 'IPM Practice:'} {ipm_recommendations[0]}"
    else:
        if norm_lang == "bn":
            ipm_advice = "সপ্তাহে দুইবার ফসলের মাঠ নিবিড়ভাবে পরিদর্শন করুন, অতিরিক্ত আক্রান্ত পাতা ছাঁটাই করুন এবং উপকারী পোকা রক্ষা করুন।"
        elif norm_lang == "hi":
            ipm_advice = "सप्ताह में दो बार खेत की निगरानी करें, संक्रमित पत्तियों को छांटें और मित्र कीटों का संरक्षण करें।"
        else:
            ipm_advice = "Maintain crop scouting twice weekly, prune blighted foliage, and conserve beneficial predator insects."

    logger.info(
        f"[SCAN VALIDATION] Status: {status} | Category: {category} | Image type: {raw_img_type} | Agricultural: True | Crop: {crop_name} | "
        f"Diagnosis: {diagnosis} | Pest: {pest_name} | Nutrient: {nutrient_name} | Confidence: {conf}% | Severity: {data.get('severity', 'Low')}"
    )

    return AnalyzeResultData(
        status=status,
        is_agricultural=True,
        image_type=raw_img_type,
        validation_status=val_status,
        category=category,
        is_pest_detected=is_pest,
        pest_name=pest_name,
        pest_type=pest_type,
        ipm_recommendations=ipm_recommendations,
        is_nutrient_deficiency=is_nutrient,
        nutrient_name=nutrient_name,
        nutrient_type=nutrient_type,
        fertilizer_recommendations=fertilizer_recommendations,
        soil_test_recommendation=soil_test_recommendation,
        crop_detected=crop_name is not None,
        crop_confidence=conf if conf is not None else 0,
        crop=crop_name,
        diagnosis=diagnosis,
        condition=cond_name,
        disease=cond_name,
        health_status=health_status or ("Healthy" if is_healthy else "Unhealthy"),
        severity="Low" if is_healthy else (data.get("severity") or "Low"),
        confidence=conf,
        risk_score=risk,
        summary=summary,
        actions=actions,
        water_advice=water_advice,
        nutrition_advice=nutrition_advice,
        ipm_advice=ipm_advice,
        symptoms=symptoms,
        possible_causes=possible_causes,
        immediate_actions=immediate_actions,
        management=management,
        cautions=cautions,
        prevention_steps=prevention_steps,
        follow_up=data.get("follow_up") or "",
        cause=data.get("cause") or "",
        treatment=data.get("treatment") or "",
        prevention=data.get("prevention") or "",
        terrain_insight=data.get("terrain_insight") or "",
        prediction=prediction_obj,
        farmer_answer=farmer_answer,
        farmer_answer_en=data.get("farmer_answer_en") or "",
        farmer_answer_hi=data.get("farmer_answer_hi") or "",
        farmer_answer_bn=data.get("farmer_answer_bn") or ""
    )


def _get_agronomic_vision_fallback(question: str = "", language: str = "en") -> AnalyzeResultData:
    logger.warning("[SCAN VALIDATION] Vision models unavailable. Providing uncertain inspection response.")
    norm_lang = normalize_language(language, question)
    farmer_msg = {
        "bn": "চিত্র বিশ্লেষণ পরিষেবা এই মুহূর্তে সংযোগ স্থাপন করতে পারেনি। দয়া করে উজ্জ্বল আলোতে পাতার স্পষ্ট ছবি পুনরায় আপলোড করুন।",
        "hi": "छवि विश्लेषण सेवा से अभी संपर्क नहीं हो पाया। कृपया पर्याप्त रोशनी में पत्ती की स्पष्ट फोटो पुनः अपलोड करें।",
        "en": "The diagnostic vision service is temporarily unavailable. Please retry with a clear crop photo in good lighting."
    }.get(norm_lang, "The diagnostic vision service is temporarily unavailable. Please retry with a clear crop photo in good lighting.")

    actions_map = {
        "bn": ["ক্যামেরা ফোকাস ঠিক রাখুন এবং পাতাটি যেন স্পষ্ট থাকে তা নিশ্চিত করুন", "ইন্টারনেট সংযোগ স্বাভাবিক হলে পুনরায় স্ক্যান করুন"],
        "hi": ["कैमरा फोकस सही रखें और पत्ती को स्पष्ट रूप से दिखाएं", "इंटरनेट कनेक्शन स्थिर होने पर पुनः स्कैन करें"],
        "en": ["Verify camera focus and ensure the leaf is clearly visible", "Retry scan when connection is optimal"],
    }
    water_map = {
        "bn": "নিয়মিত সেচসূচি বজায় রাখুন; পরীক্ষার ফল নিশ্চিত না হওয়া পর্যন্ত অতিরিক্ত পানি দেবেন না।",
        "hi": "नियमित सिंचाई व्यवस्था बनाए रखें; जब तक जांच पूरी न हो, अत्यधिक पानी देने से बचें।",
        "en": "Maintain regular watering schedule; avoid overwatering while inspection is pending.",
    }
    nutrition_map = {
        "bn": "রোগ নির্ণয় নিশ্চিত না হওয়া পর্যন্ত অতিরিক্ত রাসায়নিক সার প্রয়োগ থেকে বিরত থাকুন।",
        "hi": "पौधे की स्थिति स्पष्ट होने तक रासायनिक उर्वरकों का भारी उपयोग न करें।",
        "en": "Avoid applying concentrated fertilizers until the plant condition is confirmed.",
    }
    ipm_map = {
        "bn": "সন্দেহভাজন গাছ সাবধানে পর্যবেক্ষণ করুন এবং পাতার নিচের পিঠে পোকার উপস্থিতি যাচাই করুন।",
        "hi": "संदिग्ध पौधों की सावधानीपूर्वक जांच करें और पत्तियों के नीचे कीटों की तलाश करें।",
        "en": "Isolate suspicious plant specimens and check underside of leaves for insects.",
    }
    cautions_map = {
        "bn": ["সঠিক রোগ নির্ণয় ছাড়া কোনো রাসায়নিক বিষ স্প্রে করবেন না"],
        "hi": ["सटीक रोग पहचान के बिना रासायनिक दवाओं का छिड़काव न करें"],
        "en": ["Do not apply chemical treatments without a confirmed disease diagnosis"],
    }
    prevention_map = {
        "bn": ["নিয়মিত ফসলের মাঠ পরিদর্শন অব্যাহত রাখুন"],
        "hi": ["नियमित रूप से खेत का निरीक्षण करते रहें"],
        "en": ["Maintain regular field scouting"],
    }
    follow_up_map = {
        "bn": "পরিষ্কার ফোকাসে পাতার ছবি তুলে পুনরায় স্ক্যান করুন।",
        "hi": "स्पष्ट रोशनी में पत्ती की फोटो के साथ पुनः स्कैन करें।",
        "en": "Re-scan with clear foliage focus.",
    }

    selected_actions = actions_map.get(norm_lang, actions_map["en"])
    return AnalyzeResultData(
        status="uncertain",
        is_agricultural=True,
        image_type="UNCERTAIN",
        validation_status="UNCERTAIN_CROP",
        crop_detected=False,
        crop=None,
        diagnosis="Inspection Pending",
        condition="Inspection Pending",
        disease="Inspection Pending",
        health_status="At Risk",
        severity="Low",
        confidence=None,
        risk_score=0,
        summary=farmer_msg,
        actions=selected_actions,
        water_advice=water_map.get(norm_lang, water_map["en"]),
        nutrition_advice=nutrition_map.get(norm_lang, nutrition_map["en"]),
        ipm_advice=ipm_map.get(norm_lang, ipm_map["en"]),
        symptoms=[],
        possible_causes=[],
        immediate_actions=selected_actions,
        management=[],
        cautions=cautions_map.get(norm_lang, cautions_map["en"]),
        prevention_steps=prevention_map.get(norm_lang, prevention_map["en"]),
        follow_up=follow_up_map.get(norm_lang, follow_up_map["en"]),
        terrain_insight="",
        prediction=None,
        farmer_answer=farmer_msg,
        farmer_answer_en="The diagnostic vision service is temporarily unavailable. Please retry with a clear crop photo in good lighting.",
        farmer_answer_hi="छवि विश्लेषण सेवा से अभी संपर्क नहीं हो पाया। कृपया पर्याप्त रोशनी में पत्ती की स्पष्ट फोटो पुनः अपलोड करें।",
        farmer_answer_bn="চিত্র বিশ্লেষণ পরিষেবা এই মুহূর্তে সংযোগ স্থাপন করতে পারেনি। দয়া করে উজ্জ্বল আলোতে পাতার স্পষ্ট ছবি পুনরায় আপলোড করুন।"
    )


def _get_agronomic_fallback(message: str, crops: list, analyses: list, language: str = "en") -> dict:
    msg = message.lower()
    norm_lang = normalize_language(language, message)
    recent_disease = analyses[0].get("disease") if analyses else None

    # 0. Recent scan / diagnostic memory queries (a4.md Sections 23-28)
    scan_query_terms = [
        # English (a5.md Sections 5, 12, 14, 17, 39)
        "last scan", "recent scan", "previous scan", "what did you find", "which disease",
        "what disease", "last leaf", "my scan", "last diagnosis", "what was my scan",
        "find in my last", "find in my recent", "find in last", "what did i scan",
        "what did i just scan", "what was the condition", "which crop did i scan",
        "what crop did i scan", "what was scanned", "most recently",
        # Bengali (বাংলা) (a5.md Sections 23, 25, 39)
        "শেষ স্ক্যান", "সর্বশেষ স্ক্যান", "আগের স্ক্যান", "কী পেয়েছিলেন", "কী রোগ", "কোন রোগ",
        "পাতার স্ক্যান", "আমার শেষ স্ক্যান", "কী ধরা পড়েছিল", "কী স্ক্যান করেছিলাম",
        "সর্বশেষ কী স্ক্যান", "কোন ফসল স্ক্যান", "ফসলের অবস্থা কী ছিল", "কী অবস্থা ছিল",
        "আমি কি স্ক্যান করেছি", "আমি কী স্ক্যান করেছিলাম",
        # Hindi (हिन्दी) (a5.md Sections 23, 26, 39)
        "पिछला स्कैन", "अंतिम स्कैन", "क्या मिला", "कौन सा रोग", "कौन सी बीमारी", "पत्ती का स्कैन",
        "मेरा पिछला स्कैन", "क्या बीमारी पाई गई", "क्या स्कैन किया था", "आखिरी बार क्या स्कैन",
        "मैंने क्या स्कैन किया", "मैंने कौन सी फसल स्कैन की", "फसल की स्थिति क्या थी",
        "मैंने आखिरी बार क्या स्कैन किया था", "मैंने हाल ही में क्या स्कैन किया"
    ]
    if any(term in msg for term in scan_query_terms):
        if not analyses:
            if norm_lang == "bn":
                return {
                    "answer": "আপনি এখনও কোনো পাতার স্ক্যান সম্পন্ন করেননি। আপনার অ্যাকাউন্টে পূর্বে সংরক্ষিত কোনো স্ক্যান ডেটা নেই।",
                    "is_grounded": False,
                    "confidence_tier": "Guidance",
                    "evidence_points": ["কোনো সংরক্ষিত স্ক্যান রেকর্ড নেই"],
                    "why_explanation": "বাস্তব স্ক্যান ছাড়া অনুমানভিত্তিক রোগ নির্ণয় করা হয় না।",
                    "suggested_actions": ["'স্ক্যান' ট্যাবে গিয়ে আপনার ফসলের পাতার একটি পরিষ্কার ছবি তুলুন"]
                }
            elif norm_lang == "hi":
                return {
                    "answer": "आपने अभी तक कोई पत्ती स्कैन नहीं किया है। आपके खाते में पहले से कोई स्कैन रिकॉर्ड उपलब्ध नहीं है।",
                    "is_grounded": False,
                    "confidence_tier": "Guidance",
                    "evidence_points": ["कोई सहेजा गया स्कैन रिकॉर्ड नहीं है"],
                    "why_explanation": "बिना वास्तविक स्कैन के अनुमानित जानकारी नहीं दी जाती।",
                    "suggested_actions": ["'स्कैन' टैब में जाकर अपनी फसल की पत्ती का फोटो लें"]
                }
            else:
                return {
                    "answer": "You haven't completed a leaf scan yet. There are no prior scan records saved in your account.",
                    "is_grounded": False,
                    "confidence_tier": "Guidance",
                    "evidence_points": ["No scan records found in account"],
                    "why_explanation": "AgriSight operates strictly on verified application data.",
                    "suggested_actions": ["Go to the 'Scan' tab and capture a leaf photo"]
                }
        else:
            latest = analyses[0]
            d = latest.get("disease") or "Healthy Plant"
            s = latest.get("severity") or "Low"
            dt = str(latest.get("created_at", ""))[:10]
            rj = latest.get("result_json") or {}
            c_name = rj.get("crop") or "crop"
            actions_list = rj.get("actions", [])
            rec = actions_list[0] if isinstance(actions_list, list) and actions_list else "Maintain regular monitoring"
            is_healthy = "healthy" in d.lower()

            if norm_lang == "bn":
                ans = f"আপনার সর্বশেষ স্ক্যানে ({dt}) {c_name} ফসলের পাতা সম্পূর্ণ সুস্থ ও রোগমুক্ত পাওয়া গিয়েছিল।" if is_healthy else f"আপনার সর্বশেষ স্ক্যানে ({dt}) {c_name} ফসলে \"{d}\" (তীব্রতা: {s}) শনাক্ত করা হয়েছিল।"
                return {
                    "answer": ans,
                    "is_grounded": True,
                    "confidence_tier": "High",
                    "evidence_points": [f"তারিখ: {dt}", f"রোগ: {d}", f"তীব্রতা: {s}", f"ফসল: {c_name}"],
                    "why_explanation": "আপনার সংরক্ষিত স্ক্যান ডেটা থেকে সরাসরি এই ফলাফল উপস্থাপন করা হয়েছে।",
                    "suggested_actions": [rec if isinstance(rec, str) else "নিয়মিত পর্যবেক্ষণ চালিয়ে যান"]
                }
            elif norm_lang == "hi":
                ans = f"आपके हालिया स्कैन ({dt}) में {c_name} फसल की पत्तियां पूरी तरह स्वस्थ पाई गई थीं।" if is_healthy else f"आपके हालिया स्कैन ({dt}) में {c_name} फसल में \"{d}\" (गंभीरता: {s}) पाया गया था।"
                return {
                    "answer": ans,
                    "is_grounded": True,
                    "confidence_tier": "High",
                    "evidence_points": [f"दिनांक: {dt}", f"रोग: {d}", f"गंभीरता: {s}", f"फसल: {c_name}"],
                    "why_explanation": "यह जानकारी आपके सहेजे गए स्कैन इतिहास से ली गई है।",
                    "suggested_actions": [rec if isinstance(rec, str) else "नियमित निगरानी बनाए रखें"]
                }
            else:
                ans = f"In your latest scan on {dt}, your {c_name} was diagnosed as healthy with no active pathogen detected." if is_healthy else f"In your latest scan on {dt}, your {c_name} was diagnosed with \"{d}\" at {s} severity."
                return {
                    "answer": ans,
                    "is_grounded": True,
                    "confidence_tier": "High",
                    "evidence_points": [f"Date: {dt}", f"Diagnosis: {d}", f"Severity: {s}", f"Crop: {c_name}"],
                    "why_explanation": "Directly retrieved from your verified diagnostic scan record.",
                    "suggested_actions": [rec if isinstance(rec, str) else "Continue regular crop scouting"]
                }
    
    # 1. Broken / physical damage queries
    if any(w in msg for w in ["broke", "broken", "snap", "fracture", "bend", "fell", "cut", "torn", "ভাঙা", "ভেঙে", "ডাল", "টুট", "टूटी", "शाखा", "टहनी"]):
        if norm_lang == "bn":
            return {
                "answer": "যদি গাছের ডাল বা কান্ড ভেঙে যায়, তবে আংশিক ভাঙা ডাল কাঠি ও নরম ফিতা দিয়ে বেঁধে সোজা রাখার চেষ্টা করুন। মারাত্মকভাবে ভেঙে যাওয়া ডাল পরিষ্কার ও জীবাণুমুক্ত কাঁচি দিয়ে তেরছাভাবে কেটে ফেলুন এবং কাটার স্থানে কপার বা নিমের পেস্ট লাগান যাতে ছত্রাক না ধরে।",
                "is_grounded": False,
                "confidence_tier": "Guidance",
                "evidence_points": ["ভাঙা অংশে সহজে রোগজীবাণু বা ছত্রাক প্রবেশ করে", "গাছকে অবলম্বন (staking) দিলে দ্রুত সেরে ওঠে"],
                "why_explanation": "গাছের ভাঙা ক্ষত জীবাণু প্রবেশের প্রধান পথ। ক্ষত পরিষ্কার করে ছত্রাকনাশক দিলে গাছ আবার সতেজ হয়ে ওঠে।",
                "suggested_actions": ["কাঠি ও দড়ি দিয়ে গাছটিকে বেঁধে সোজা রাখুন", "জীবাণুমুক্ত কাঁচি দিয়ে ভাঙা অংশ সমান করে কেটে দিন", "ক্ষতস্থানে নিমতেল বা কপার অক্সিক্লোরাইড স্প্রে করুন"]
            }
        elif norm_lang == "hi":
            return {
                "answer": "यदि पौधे की शाखा या तना टूट गया है, तो आंशिक रूप से टूटे हिस्से को लकड़ी की खपच्ची और मुलायम कपड़े से बांधकर सहारा दें। पूरी तरह टूटी हुई टहनी को साफ कैंची से तिकोना काट दें और कटे हुए स्थान पर फफूंदनाशक या नीम का लेप लगाएं ताकि संक्रमण न फैले।",
                "is_grounded": False,
                "confidence_tier": "Guidance",
                "evidence_points": ["टूटे हुए स्थान से बैक्टीरिया और फंगस का खतरा रहता है", "सपोर्ट देने से मुख्य शाखा सुरक्षित रहती है"],
                "why_explanation": "खुले घाव पर तुरंत उपचार करने से पौधा सड़न से बचता है और नई कोपलें जल्दी फूटती हैं।",
                "suggested_actions": ["पौधे को लकड़ी या बांस का सहारा (staking) दें", "टूटे हिस्से को साफ प्रूनर से छांटें", "कटे हिस्से पर कॉपर या नीम का फंगीसाइड लगाएं"]
            }
        else:
            return {
                "answer": "If a plant stem or branch is broken, assess whether it is partially snapped or completely severed. For partial breaks, gently splint with a stake and soft plant tape. For complete breaks, make a clean diagonal cut just above the nearest healthy node using sanitized shears, and apply a light copper or neem paste to prevent fungal pathogens from entering.",
                "is_grounded": False,
                "confidence_tier": "Guidance",
                "evidence_points": ["Broken plant tissue is vulnerable to fungal and bacterial pathogens", "Clean cuts stimulate rapid callus formation and lateral shoot development"],
                "why_explanation": "Supporting structural weight and sealing open wounds protects vascular flow and stops disease transmission.",
                "suggested_actions": ["Stake and tie the plant to relieve wind and fruit weight", "Prune jagged breaks cleanly with sanitized shears", "Apply protective fungicide or neem paste to open wounds"]
            }

    # 2. Disease risk & farm health status queries
    if any(w in msg for w in ["risk", "status", "disease", "health", "overall", "জোখিম", "ঝুঁকি", "স্বাস্থ্য", "রোগ", "খামার", "जोखिम", "रोग", "बीमारी", "स्वास्थ्य", "खेत"]):
        if norm_lang == "bn":
            return {
                "answer": f"আপনার খামারের রোগ ঝুঁকি বর্তমানে {'পর্যবেক্ষণাধীন (' + recent_disease + ' শনাক্ত হয়েছে)' if recent_disease else 'স্থিতিশীল ও স্বাভাবিক'}। নিয়মিত পাতার নিচের দিক ও মাটির আর্দ্রতা পরীক্ষা করুন। কোনো পাতায় হলুদ দাগ বা ক্ষত দেখলে সাথে সাথে স্ক্যান করুন।",
                "is_grounded": bool(recent_disease),
                "confidence_tier": "High" if recent_disease else "Guidance",
                "evidence_points": [f"সাম্প্রতিক স্ক্যান: {recent_disease}"] if recent_disease else ["নিয়মিত মনিটরিং ফসলের ফলন রক্ষা করে", "মাটির আর্দ্রতা বজায় রাখা দরকার"],
                "why_explanation": "প্রাথমিক পর্যায়ে লক্ষণ শনাক্ত করলে রোগ পুরো জমিতে ছড়াতে পারে না।",
                "suggested_actions": ["সন্দেহজনক পাতার ছবি তুলে স্ক্যান করুন", "জমির ড্রেনেজ ও সেচ ব্যবস্থা পরীক্ষা করুন", "প্রয়োজনে প্রতিরোধমূলক নিমতেল স্প্রে করুন"]
            }
        elif norm_lang == "hi":
            return {
                "answer": f"आपके खेत का रोग जोखिम वर्तमान में {'निगरानी में है (' + recent_disease + ' पाया गया)' if recent_disease else 'नियंत्रण में और सामान्य है'}। पत्तियों के निचले हिस्से और मिट्टी में नमी की नियमित जांच करें। किसी भी असामान्य लक्षण के लिए पत्ती का स्कैन करें।",
                "is_grounded": bool(recent_disease),
                "confidence_tier": "High" if recent_disease else "Guidance",
                "evidence_points": [f"नवीनतम निदान: {recent_disease}"] if recent_disease else ["नियमित निगरानी से रोग का प्रसार रुकता है", "संतुलित सिंचाई जरूरी है"],
                "why_explanation": "शुरुआती अवस्था में रोग पहचान और उचित फसल स्वच्छता से 90% नुकसान रोका जा सकता है।",
                "suggested_actions": ["प्रभावित पत्तियों का नया स्कैन करें", "खेत में अतिरिक्त जलभराव न होने दें", "अनुशंसित जैविक या फफूंदनाशक उपाय करें"]
            }
        else:
            return {
                "answer": f"Your farm's disease risk is currently {'under active management (' + recent_disease + ' detected)' if recent_disease else 'stable and optimal'}. Continue regular canopy inspections and maintain proper furrow drainage to prevent fungal spore development.",
                "is_grounded": bool(recent_disease),
                "confidence_tier": "High" if recent_disease else "Guidance",
                "evidence_points": [f"Recent diagnosis: {recent_disease}"] if recent_disease else ["Regular scouting minimizes lateral pathogen propagation", "Canopy aeration suppresses fungal germination"],
                "why_explanation": "Proactive scouting and targeted intervention prevent localized infections from spreading across field zones.",
                "suggested_actions": ["Capture a fresh leaf scan on symptomatic plants", "Inspect field drainage and soil moisture", "Apply recommended preventive treatments"]
            }

    # 3. General agronomic guidance
    if norm_lang == "bn":
        return {
            "answer": f"আপনার প্রশ্নের জন্য ধন্যবাদ। ফসলের সুস্থ বৃদ্ধির জন্য সঠিক সেচ, পর্যাপ্ত সূর্যালোক ও নিয়মিত রোগ পর্যবেক্ষণ অত্যন্ত গুরুত্বপূর্ণ।{' আপনার সাম্প্রতিক স্ক্যানে ' + recent_disease + ' শনাক্ত হয়েছিল, সেটির প্রতি যত্নশীল থাকুন।' if recent_disease else ''} পাতার কোনো সমস্যা দেখা দিলে দ্রুত এগ্রিসাইটে স্ক্যান করুন।",
            "is_grounded": bool(recent_disease),
            "confidence_tier": "High" if recent_disease else "Guidance",
            "evidence_points": [f"সাম্প্রতিক স্ক্যান: {recent_disease}"] if recent_disease else ["নিয়মিত মনিটরিং ফসলের ফলন রক্ষা করে"],
            "why_explanation": "সঠিক আর্দ্রতা ব্যবস্থাপনা ও প্রাথমিক পর্যায়ে রোগ শনাক্তকরণ ফসলের ক্ষতি কমায়।",
            "suggested_actions": ["আক্রান্ত পাতার নতুন ছবি তুলে স্ক্যান করুন", "মাটির আর্দ্রতা পরীক্ষা করে সেচ দিন", "প্রয়োজনে কৃষি কর্মকর্তার সাথে যোগাযোগ করুন"]
        }
    elif norm_lang == "hi":
        return {
            "answer": f"आपके सवाल के लिए धन्यवाद। फसल की सही देखभाल के लिए पत्तियों के निचले हिस्से और तने में नमी व कीटों की जांच करें।{' आपके पिछले स्कैन में ' + recent_disease + ' का पता चला था, उस पर ध्यान दें।' if recent_disease else ''} किसी भी लक्षण के लिए तुरंत पत्ती की फोटो स्कैन करें।",
            "is_grounded": bool(recent_disease),
            "confidence_tier": "High" if recent_disease else "Guidance",
            "evidence_points": [f"नवीनतम स्कैन: {recent_disease}"] if recent_disease else ["नियमित निगरानी से फसल सुरक्षित रहती है"],
            "why_explanation": "शुरुआती अवस्था में पहचान और सही जल प्रबंधन से रोग का प्रसार रुकता है।",
            "suggested_actions": ["लक्षण दिखने वाली पत्ती का नया स्कैन करें", "मिट्टी में नमी की जांच करें", "उचित जैविक या अनुशंसित उपचार लागू करें"]
        }
    else:
        return {
            "answer": f"Thank you for your question. For general crop vigor and protection, regularly inspect leaf undersides and stem junctions for pests or moisture imbalance.{' Your recent scan noted ' + recent_disease + ' — ensure treatment follow-up.' if recent_disease else ''} If symptoms appear, run a leaf scan for detailed AI diagnostics.",
            "is_grounded": bool(recent_disease),
            "confidence_tier": "High" if recent_disease else "Guidance",
            "evidence_points": [f"Recent diagnosis: {recent_disease}"] if recent_disease else ["Regular crop scouting prevents widespread infestation"],
            "why_explanation": "Proactive scouting and balanced moisture management maintain robust plant immunity.",
            "suggested_actions": ["Capture a high-resolution leaf scan in AgriSight", "Inspect soil moisture levels before watering", "Follow recommended intervention schedules"]
        }


class GeminiService:
    def __init__(self):
        try:
            self.client = genai.Client(
                api_key=settings.GEMINI_API_KEY,
                http_options=types.HttpOptions(timeout=15000)
            )
            self.model_name = 'gemini-3.5-flash-lite'
            self.fallback_models = [
                'gemini-3.5-flash-lite',
                'gemini-2.5-flash',
                'gemini-flash-latest',
                'gemini-2.5-flash-lite',
            ]
        except Exception as e:
            logger.error(f"Failed to initialize Gemini Client: {str(e)}")
            self.client = None
            self.fallback_models = []

    def analyze_image(
        self,
        image_bytes: bytes,
        question: str = "What disease is this?",
        lat: str = "22.57",
        lon: str = "88.36",
        language: str = "en"
    ) -> AnalyzeResultData:
        norm_lang = normalize_language(language, question)
        if not self.client:
            logger.warning("Gemini client not available. Using agronomic vision fallback.")
            return _get_agronomic_vision_fallback(question, norm_lang)

        if norm_lang == "bn":
            target_lang_desc = "Bengali (বাংলা)"
            system_instruction = (
                "You are an expert agricultural plant pathologist and diagnostic AI for AgriSight.\n"
                "CRITICAL MANDATORY LANGUAGE REQUIREMENT: The farmer's language is BENGALI (বাংলা).\n"
                "You MUST write ALL natural language explanation fields entirely in clear, simple, natural Bengali (বাংলা script).\n"
                "This applies strictly to: summary, actions, water_advice, nutrition_advice, ipm_advice, symptoms, "
                "possible_causes, immediate_actions, management, cautions, prevention_steps, follow_up, terrain_insight, "
                "cause, treatment, prevention, soil_test_recommendation, fertilizer_recommendations, ipm_recommendations, "
                "prediction descriptions, farmer_answer, and farmer_answer_bn.\n"
                "DO NOT use English in any of these descriptive strings. Translate all terms into natural Bengali (e.g. ছত্রাকজনিত রোগ, পাতা পোড়া, জাবপোকা, ইত্যাদি).\n"
                "Internal enum codes (status, validation_status, severity, health_status, category, image_type) must remain the exact schema English codes."
            )
            lang_instruction = (
                "LANGUAGE REQUIREMENT (CRITICAL):\n"
                "The farmer has selected BENGALI (বাংলা).\n"
                "You MUST write all natural language explanation fields entirely in clear, simple, natural Bengali (বাংলা).\n"
                "Never output English for summary, actions, symptoms, causes, immediate_actions, water_advice, nutrition_advice, or ipm_advice."
            )
        elif norm_lang == "hi":
            target_lang_desc = "Hindi (हिन्दी)"
            system_instruction = (
                "You are an expert agricultural plant pathologist and diagnostic AI for AgriSight.\n"
                "CRITICAL MANDATORY LANGUAGE REQUIREMENT: The farmer's language is HINDI (हिन्दी).\n"
                "You MUST write ALL natural language explanation fields entirely in clear, simple, natural Hindi (हिन्दी script).\n"
                "This applies strictly to: summary, actions, water_advice, nutrition_advice, ipm_advice, symptoms, "
                "possible_causes, immediate_actions, management, cautions, prevention_steps, follow_up, terrain_insight, "
                "cause, treatment, prevention, soil_test_recommendation, fertilizer_recommendations, ipm_recommendations, "
                "prediction descriptions, farmer_answer, and farmer_answer_hi.\n"
                "DO NOT use English in any of these descriptive strings. Translate all terms into natural Hindi.\n"
                "Internal enum codes (status, validation_status, severity, health_status, category, image_type) must remain the exact schema English codes."
            )
            lang_instruction = (
                "LANGUAGE REQUIREMENT (CRITICAL):\n"
                "The farmer has selected HINDI (हिन्दी).\n"
                "You MUST write all natural language explanation fields entirely in clear, simple, natural Hindi (हिन्दी).\n"
                "Never output English for summary, actions, symptoms, causes, immediate_actions, water_advice, nutrition_advice, or ipm_advice."
            )
        else:
            target_lang_desc = "English"
            system_instruction = (
                "You are an expert agricultural plant pathologist and diagnostic AI for AgriSight.\n"
                "Provide all natural-language explanations in simple, practical, farmer-friendly English."
            )
            lang_instruction = (
                "LANGUAGE REQUIREMENT:\n"
                "Provide all natural-language explanations in simple, practical, farmer-friendly English."
            )

        prompt = f"""
You are an expert agricultural crop-image validation and plant pathology diagnosis system for AgriSight.

CRITICAL STEP 1: IMAGE VALIDATION & AGRICULTURAL CLASSIFICATION
Before diagnosing any disease or crop, determine whether this image actually contains a valid crop, plant, leaf, stem, fruit, or agricultural field.
- HARD REJECTION RULE: If the image primarily contains:
  * A person, face, selfie, crowd, or human body part -> set "status": "non_crop", "is_agricultural": false, "image_type": "HUMAN", "validation_status": "NON_CROP"
  * An animal or pet -> set "status": "non_crop", "is_agricultural": false, "image_type": "ANIMAL", "validation_status": "NON_CROP"
  * Common non-crop objects (laptop, computer, mobile phone, car, vehicle, furniture, building, room, food plate, document, screenshot, random object) -> set "status": "non_crop", "is_agricultural": false, "image_type": "OBJECT", "validation_status": "NON_CROP"
  * Unrelated non-farm scenery, sky, or completely unidentifiable blurred/dark imagery -> set "status": "non_crop", "is_agricultural": false, "image_type": "NON_CROP", "validation_status": "NON_CROP"
- If rejected as NON_CROP:
  * "status": "non_crop"
  * "crop_detected": false
  * "crop": null
  * "diagnosis": null
  * "condition": null
  * "disease": null
  * "health_status": null
  * "severity": null
  * "confidence": null
  * "risk_score": null
  * "summary": "This image does not appear to contain a crop or plant suitable for agricultural analysis."
  * "actions": []
  * "water_advice": ""
  * "nutrition_advice": ""
  * "ipm_advice": ""
  * "rejection_reason": "HUMAN_DETECTED" | "OBJECT_DETECTED" | "ANIMAL_DETECTED" | "NON_CROP_DETECTED"
  * "farmer_answer": Polite explanation stating that the image does not contain a crop and asking for a clear photo of a plant leaf/stem.

CRITICAL STEP 2: CROP IDENTIFICATION, PATHOLOGY, PEST & NUTRIENT DIAGNOSIS (ONLY IF "is_agricultural" IS TRUE)
- Identify the crop species accurately (e.g. Tomato, Rice, Potato, Wheat, Maize, Cotton, Chili, Apple, etc.). NEVER default to Tomato unless genuine tomato foliage/fruit is visible.
- If crop is genuinely ambiguous/unidentifiable, set "crop_detected": false and "crop": null.
- Determine whether the image displays:
  A) PEST INFESTATION / INSECT DAMAGE (e.g. Aphids, Fall Armyworm, Whitefly, Spider Mites, Thrips, Stem Borer, Cutworm, Leafminer, Mealybugs, or direct insect feeding, eggs, webbing, frass):
     * Set "category": "pest", "is_pest_detected": true, "pest_name": "<Specific Pest Name in English>", "pest_type": "<Sucking Pest | Chewing / Borer | Defoliator | Mite>"
     * "diagnosis": "<Pest Name in English>", "condition": "<Pest Name in English>"
     * "ipm_recommendations": ["<Biological/organic control practice in {target_lang_desc}>", "<Mechanical/cultural practice in {target_lang_desc}>"]
  B) PATHOGEN / PLANT DISEASE (e.g. Early Blight, Late Blight, Powdery Mildew, Rust, Leaf Spot, Wilt, Mosaic Virus):
     * Set "category": "disease", "is_pest_detected": false, "pest_name": null, "pest_type": null, "ipm_recommendations": []
     * "diagnosis": "<Disease Name in English>", "condition": "<Disease Name in English>"
  C) NUTRIENT DEFICIENCY / PHYSIOLOGICAL DISORDER (e.g. Nitrogen Deficiency, Phosphorus Deficiency, Potassium Deficiency, Iron Chlorosis, Magnesium Deficiency, Calcium Deficiency, Zinc Deficiency):
     * Set "category": "nutrient_deficiency", "is_nutrient_deficiency": true, "nutrient_name": "<Element Name e.g. Nitrogen (N)>", "nutrient_type": "<Macronutrient (Mobile) | Macronutrient (Immobile) | Micronutrient>"
     * "diagnosis": "Possible <Nutrient Element> Deficiency", "condition": "Possible <Nutrient Element> Deficiency" (CRITICAL: MUST include "Possible " prefix to acknowledge visual screening limits)
     * "fertilizer_recommendations": ["<Foliar/organic correction step 1 in {target_lang_desc}>", "<Step 2 in {target_lang_desc}>"]
     * "soil_test_recommendation": "<Soil and leaf tissue testing recommendation in {target_lang_desc}>"
  D) HEALTHY PLANT (No pests, pathogens, or nutrient deficiency chlorosis):
     * Set "category": "healthy", "diagnosis": "Healthy Plant", "condition": "Healthy Plant", "severity": "Low", "health_status": "Healthy", "risk_score": 0, "is_pest_detected": false, "is_nutrient_deficiency": false

CRITICAL STEP 3: UNCERTAINTY & HONEST CONFIDENCE HANDLING (a2.md Section 6)
- If the visual symptoms are ambiguous, unclear, low resolution, or cannot be identified with high certainty:
  * Set "status": "uncertain"
  * Set "validation_status": "UNCERTAIN_CROP"
  * Set "diagnosis": "Diagnosis Uncertain"
  * Set "condition": "Diagnosis Uncertain"
  * Set "health_status": "At Risk"
  * Set "confidence": <integer percentage 30-49 or null>
  * Set "summary": Honest explanation stating that symptoms are ambiguous and recommending a clearer photo or field inspection in {target_lang_desc}.
  * Never fabricate certainty or guess a disease without clear visual evidence.
- If diagnosis is clear and confident:
  * Set "status": "success"
  * Set "validation_status": "VALID"

Farmer's question/note: "{question}"
Location: lat={lat}, lon={lon}

{lang_instruction}

JSON SCHEMA REQUIRED (respond ONLY with valid JSON):
{{
  "status": "<success | uncertain | non_crop>",
  "is_agricultural": <true | false>,
  "image_type": "<LEAF | PLANT | STEM | FRUIT | CROP_FIELD | HUMAN | ANIMAL | OBJECT | DOCUMENT | SCREENSHOT | NON_CROP | UNCERTAIN>",
  "validation_status": "<VALID | NON_CROP | UNCERTAIN_CROP | LOW_IMAGE_QUALITY | REJECTED>",
  "category": "<disease | pest | nutrient_deficiency | healthy | non_crop>",
  "is_pest_detected": <true | false>,
  "pest_name": "<Pest species name in English or null>",
  "pest_type": "<Sucking Pest | Chewing / Borer | Defoliator | Mite | null>",
  "ipm_recommendations": ["<IPM Practice 1 in {target_lang_desc}>", "<IPM Practice 2 in {target_lang_desc}>"],
  "is_nutrient_deficiency": <true | false>,
  "nutrient_name": "<Nutrient element in English or null>",
  "nutrient_type": "<Macronutrient (Mobile) | Macronutrient (Immobile) | Micronutrient | null>",
  "fertilizer_recommendations": ["<Fertilizer recommendation 1 in {target_lang_desc}>", "<Step 2 in {target_lang_desc}>"],
  "soil_test_recommendation": "<Soil test recommendation in {target_lang_desc}>",
  "crop_detected": <true | false>,
  "crop_confidence": <integer 0-100 or null>,
  "rejection_reason": "<HUMAN_DETECTED | OBJECT_DETECTED | ANIMAL_DETECTED | NON_CROP_DETECTED | null>",
  "crop": "<Identified plant/crop, e.g. Tomato, Potato, Rice, or null if rejected>",
  "diagnosis": "<Specific disease/pest/deficiency name in English, e.g. Early Blight, Aphids, Possible Nitrogen (N) Deficiency, Healthy Plant, or null if rejected>",
  "condition": "<Specific disease/pest/deficiency name in English, synonymous with diagnosis>",
  "confidence": <integer percentage 50-99, or null if rejected/uncertain>,
  "severity": "<Low | Medium | High | Critical | null if rejected>",
  "health_status": "<Healthy | Unhealthy | At Risk | null if rejected>",
  "risk_score": <integer percentage 0-100, or null if rejected>,
  "summary": "<Concise 1-2 sentence diagnosis summary in {target_lang_desc}>",
  "actions": ["<Priority Action 1 in {target_lang_desc}>", "<Priority Action 2 in {target_lang_desc}>"],
  "water_advice": "<Practical irrigation/water management advice for this condition in {target_lang_desc}>",
  "nutrition_advice": "<Practical plant nutrition and fertilizer advice for this condition in {target_lang_desc}>",
  "ipm_advice": "<Practical Integrated Pest Management and cultural control advice in {target_lang_desc}>",
  "symptoms": ["<Observed symptom 1 in {target_lang_desc}>", "<Observed symptom 2 in {target_lang_desc}>"],
  "possible_causes": ["<Underlying cause 1 in {target_lang_desc}>", "<Underlying cause 2 in {target_lang_desc}>"],
  "immediate_actions": ["<Urgent action step 1 in {target_lang_desc}>", "<Urgent action step 2 in {target_lang_desc}>"],
  "management": ["<Treatment or management practice 1 in {target_lang_desc}>", "<Practice 2 in {target_lang_desc}>"],
  "cautions": ["<Safety warning or common mistake to avoid in {target_lang_desc}>"],
  "prevention_steps": ["<Long-term prevention practice 1 in {target_lang_desc}>", "<Practice 2 in {target_lang_desc}>"],
  "follow_up": "<Recommended follow-up timeframe and specific check in {target_lang_desc}>",
  "terrain_insight": "<Microclimate and field insight based on location and disease nature in {target_lang_desc}>",
  "prediction": {{
    "next_3_days": "<Expected disease progression in 3 days if untreated in {target_lang_desc}>",
    "next_7_days": "<Expected disease progression in 7 days if untreated in {target_lang_desc}>",
    "recovery_chance": <integer percentage 0-100>,
    "critical_warning": "<True or False boolean - True only if crop loss is imminent within 48-72h>"
  }},
  "cause": "<Concise summary of disease pathogen or environmental trigger in {target_lang_desc}>",
  "treatment": "<Concise primary treatment method in {target_lang_desc}>",
  "prevention": "<Concise prevention recommendation in {target_lang_desc}>",
  "farmer_answer": "<Direct, farmer-friendly explanation answer in {target_lang_desc}>",
  "farmer_answer_hi": "<Direct, farmer-friendly explanation answer translated to Hindi (हिन्दी)>",
  "farmer_answer_bn": "<Direct, farmer-friendly explanation answer translated to Bengali (বাংলা)>"
}}
"""

        try:
            from PIL import ImageOps
            image = Image.open(io.BytesIO(image_bytes))
            # Auto-orient based on EXIF tag (critical for smartphone photos)
            image = ImageOps.exif_transpose(image)
            # Ensure RGB color mode (handles RGBA, Palette, Grayscale)
            if image.mode != "RGB":
                image = image.convert("RGB")
            # Downscale if excessively large to ensure fast transmission
            max_dimension = 1200
            if max(image.width, image.height) > max_dimension:
                image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        except Exception as e:
            logger.warning(f"Invalid image format or decoding error ({e}). Using vision fallback.")
            return _get_agronomic_vision_fallback(question, norm_lang)

        last_error = None
        for model in self.fallback_models:
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=[image, prompt],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json"
                    )
                )
                if not response or not response.text:
                    continue
                clean_text = _clean_json_str(response.text)
                data = json.loads(clean_text)
                return _normalize_analysis_data(data, norm_lang)
            except Exception as e:
                last_error = e
                logger.warning(f"Vision model {model} attempt failed: {e}")

        logger.warning(f"All Gemini vision models exhausted ({last_error}). Providing agronomic vision fallback.")
        return _get_agronomic_vision_fallback(question, norm_lang)

    def chat_with_context(
        self,
        message: str,
        crops: list,
        analyses: list,
        fields: list = None,
        interventions: list = None,
        language: str = "en",
        context_text: str = ""
    ) -> dict:
        norm_lang = normalize_language(language, message)
        if not self.client:
            return _get_agronomic_fallback(message, crops, analyses, norm_lang)

        fields = fields or []
        interventions = interventions or []

        # Build context blocks
        crop_lines = []
        for c in crops[:6]:
            name = c.get("name", "Unknown crop")
            variety = c.get("variety", "")
            stage = c.get("growth_stage", "")
            field_name = c.get("field_name", "")
            line = f"  - Crop: {name}"
            if variety: line += f", Variety: {variety}"
            if stage: line += f", Stage: {stage}"
            if field_name: line += f", Field: {field_name}"
            crop_lines.append(line)
        crops_block = "\n".join(crop_lines) if crop_lines else "  (no crops registered yet)"

        field_lines = []
        for f in fields[:6]:
            name = f.get("name", "Field")
            acres = f.get("area_acres", "")
            soil = f.get("soil_type", "")
            irr = f.get("irrigation_type", "")
            line = f"  - Field: {name}"
            if acres: line += f", {acres} acres"
            if soil: line += f", Soil: {soil}"
            if irr: line += f", Irrigation: {irr}"
            field_lines.append(line)
        fields_block = "\n".join(field_lines) if field_lines else "  (no fields registered yet)"

        # a5.md Section 12: Structured Scan Context
        scan_lines = []
        if analyses:
            latest = analyses[0]
            l_id = latest.get("id") or "scan_latest"
            l_disease = latest.get("disease") or latest.get("condition") or "Healthy Plant"
            l_sev = latest.get("severity") or "Low"
            l_date = str(latest.get("created_at", ""))[:10]
            l_rj = latest.get("result_json") or {}
            l_crop = latest.get("crop") or l_rj.get("crop", "") or latest.get("crop_id", "")
            l_field = latest.get("field_name") or latest.get("field_id", "")
            l_actions = l_rj.get("actions") or l_rj.get("recommended_actions") or []
            l_rec = l_actions[0] if isinstance(l_actions, list) and l_actions else ""
            l_obs = l_rj.get("observations") or ([l_rj.get("summary")] if l_rj.get("summary") else [])
            l_obs_str = "; ".join(l_obs) if isinstance(l_obs, list) and l_obs else (l_rj.get("summary") or "")

            scan_lines.append("Latest completed scan:")
            scan_lines.append(f"- Scan ID: {l_id}")
            if l_field:
                scan_lines.append(f"- Field: {l_field}")
            scan_lines.append(f"- Crop: {l_crop or 'Specified crop'}")
            scan_lines.append(f"- Date: {l_date}")
            scan_lines.append(f"- Condition: {l_disease}")
            scan_lines.append(f"- Severity: {l_sev}")
            if l_obs_str:
                scan_lines.append(f"- Observations: {l_obs_str}")
            if l_rec:
                scan_lines.append(f"- Recommendations: {l_rec}")

            if len(analyses) > 1:
                scan_lines.append("\nRecent scans:")
                for a in analyses[1:6]:
                    prev_id = a.get("id", "")
                    prev_disease = a.get("disease") or a.get("condition") or "Healthy Plant"
                    prev_sev = a.get("severity", "Low")
                    prev_date = str(a.get("created_at", ""))[:10]
                    prev_rj = a.get("result_json") or {}
                    prev_crop = a.get("crop") or prev_rj.get("crop", "") or a.get("crop_id", "")
                    scan_lines.append(f"- Scan ID: {prev_id} | Date: {prev_date} | Crop: {prev_crop or 'Crop'} | Condition: {prev_disease} | Severity: {prev_sev}")
        scans_block = "\n".join(scan_lines) if scan_lines else "  (no scan history recorded yet)"

        intervention_lines = []
        for inv in interventions[:6]:
            date = str(inv.get("created_at", ""))[:10]
            action = inv.get("action", "") or inv.get("title", "")
            notes = inv.get("notes", "")
            intervention_lines.append(f"  - [{date}] {action}{' - ' + notes if notes else ''}")
        interventions_block = "\n".join(intervention_lines) if intervention_lines else "  (no interventions recorded)"

        # a5.md Section 13: Gemini System Instruction
        if norm_lang == "bn":
            target_lang_name = "Bengali (বাংলা)"
            system_instruction = (
                "You are AgriSight Assistant.\n"
                "You are an agricultural assistant operating inside the AgriSight application.\n"
                "The application provides verified user-specific context with each request.\n"
                "Use the supplied AgriSight context as the source of truth for: scans, scan history, fields, crops, alerts, recommendations, sensor readings, weather.\n"
                "The user's selected language is Bengali (বাংলা).\n"
                "Respond in Bengali (বাংলা) using natural standard Bengali script.\n"
                "CRITICAL INSTRUCTIONS (ABSOLUTE MANDATES):\n"
                "1. Never invent a scan.\n"
                "2. Never invent a diagnosis.\n"
                "3. Never invent field or crop information.\n"
                "4. Never invent sensor readings.\n"
                "5. Never claim the user scanned something unless it exists in the supplied context.\n"
                "6. If the requested historical information is not available, clearly state that it is unavailable.\n"
                "7. When the user asks about a previous scan, use the supplied scan history.\n"
                "8. Keep answers concise and useful for a farmer.\n"
                "9. Write ALL output fields ('answer', 'evidence_points', 'why_explanation', 'more_details', 'suggested_actions') 100% ENTIRELY in natural Bengali script (বাংলা).\n"
                "10. Keep 'confidence_tier' as one of 'High', 'Moderate', or 'Guidance'."
            )
            lang_instruction = """The user's target language is Bengali (বাংলা).
Respond entirely in natural, farmer-friendly Bengali script (বাংলা) for 'answer', 'evidence_points', 'why_explanation', 'more_details', and 'suggested_actions'.
Do not return English explanations. Keep 'confidence_tier' as one of 'High', 'Moderate', 'Guidance'."""
        elif norm_lang == "hi":
            target_lang_name = "Hindi (हिन्दी)"
            system_instruction = (
                "You are AgriSight Assistant.\n"
                "You are an agricultural assistant operating inside the AgriSight application.\n"
                "The application provides verified user-specific context with each request.\n"
                "Use the supplied AgriSight context as the source of truth for: scans, scan history, fields, crops, alerts, recommendations, sensor readings, weather.\n"
                "The user's selected language is Hindi (हिन्दी).\n"
                "Respond in Hindi (हिन्दी) using natural Devanagari script.\n"
                "CRITICAL INSTRUCTIONS (ABSOLUTE MANDATES):\n"
                "1. Never invent a scan.\n"
                "2. Never invent a diagnosis.\n"
                "3. Never invent field or crop information.\n"
                "4. Never invent sensor readings.\n"
                "5. Never claim the user scanned something unless it exists in the supplied context.\n"
                "6. If the requested historical information is not available, clearly state that it is unavailable.\n"
                "7. When the user asks about a previous scan, use the supplied scan history.\n"
                "8. Keep answers concise and useful for a farmer.\n"
                "9. Write ALL output fields ('answer', 'evidence_points', 'why_explanation', 'more_details', 'suggested_actions') 100% ENTIRELY in natural Devanagari script (हिन्दी).\n"
                "10. Keep 'confidence_tier' as one of 'High', 'Moderate', or 'Guidance'."
            )
            lang_instruction = """The user's target language is Hindi (हिन्दी).
Respond entirely in natural, farmer-friendly Devanagari script (हिन्दी) for 'answer', 'evidence_points', 'why_explanation', 'more_details', and 'suggested_actions'.
Do not return English explanations. Keep 'confidence_tier' as one of 'High', 'Moderate', 'Guidance'."""
        else:
            target_lang_name = "English"
            system_instruction = (
                "You are AgriSight Assistant.\n"
                "You are an agricultural assistant operating inside the AgriSight application.\n"
                "The application provides verified user-specific context with each request.\n"
                "Use the supplied AgriSight context as the source of truth for: scans, scan history, fields, crops, alerts, recommendations, sensor readings, weather.\n"
                "The user's selected language is English.\n"
                "Respond in clear, farmer-friendly English.\n"
                "CRITICAL INSTRUCTIONS (ABSOLUTE MANDATES):\n"
                "1. Never invent a scan.\n"
                "2. Never invent a diagnosis.\n"
                "3. Never invent field or crop information.\n"
                "4. Never invent sensor readings.\n"
                "5. Never claim the user scanned something unless it exists in the supplied context.\n"
                "6. If the requested historical information is not available, clearly state that it is unavailable.\n"
                "7. When the user asks about a previous scan, use the supplied scan history.\n"
                "8. Keep answers concise and useful for a farmer.\n"
                "9. Keep 'confidence_tier' as one of 'High', 'Moderate', or 'Guidance'."
            )
            lang_instruction = """The user's target language is English.
Respond in clear, farmer-friendly English for 'answer', 'evidence_points', 'why_explanation', 'more_details', and 'suggested_actions'.
Keep 'confidence_tier' as one of 'High', 'Moderate', 'Guidance'."""

        client_ctx_segment = f"\nVERIFIED CLIENT APPLICATION CONTEXT:\n{context_text}\n" if context_text else ""

        prompt = f"""You are AgriSight Assistant, an expert agricultural decision intelligence AI assistant helping smallholder farmers.

You have access to the following REAL DATA from this farmer's AgriSight account:

AGRICULTURAL FIELDS:
{fields_block}

CROPS REGISTERED:
{crops_block}

RECENT SCAN HISTORY (newest first):
{scans_block}

RECENT FIELD INTERVENTIONS & TREATMENTS:
{interventions_block}
{client_ctx_segment}
FARMER'S QUESTION: "{message}"

LANGUAGE & BEHAVIOR DIRECTIVES:
1. {lang_instruction}
2. Ground your reasoning in the actual AgriSight data whenever relevant.
3. If grounded in account data, cite the specific crop, field, or scan in evidence_points (in {target_lang_name}).
4. Never invent scan results or disease names that do not exist in the history above.
5. Provide a transparent "why_explanation" detailing the agronomic reasoning (in {target_lang_name}).
6. CRISP ACTION-FIRST FORMAT (MANDATORY):
   - Keep 'answer' short and actionable (2–4 short lines stating what is happening, the risk, and today's summary).
   - Provide 1–3 clear, numbered actionable steps in 'suggested_actions'.
   - Put deeper explanations, IPM details, and chemical/biological science in 'more_details' for progressive disclosure.
7. AGRICULTURAL FOCUS: You are strictly an agricultural assistant. If the farmer asks something unrelated to farming, crops, weather, soil, pests, or field management, politely acknowledge and redirect them to asking about their crops and farm health in {target_lang_name}.
8. RECENT SCAN MEMORY DIRECTIVE (a5.md Sections 5, 12, 14, 17, 39):
   If the farmer asks:
   - "What did I scan most recently?" / "What did I just scan?" / "What was scanned?"
   - "What did you find in my last scan?" / "What disease was found?"
   - "Which crop did I scan?" / "What crop was scanned?"
   - "What was the condition?" / "What was the severity?"
   - "আমি সর্বশেষ কী স্ক্যান করেছিলাম?" / "আমার শেষ স্ক্যানে কী ধরা পড়েছিল?" / "কোন ফসল স্ক্যান করেছিলাম?" / "কী অবস্থা ছিল?"
   - "मैंने आखिरी बार क्या स्कैन किया था?" / "मेरे पिछले स्कैन में क्या मिला?" / "मैंने कौन सी फसल स्कैन की थी?" / "फसल की स्थिति क्या थी?"
   or any inquiry regarding past scan records:
   You MUST answer strictly and truthfully using the actual crop, condition, severity, date, and recommendations from the "Latest completed scan" above in {target_lang_name}.
   If no scan exists in history, explicitly state in {target_lang_name} that no scans have been performed yet. Never invent or hallucinate a scan!

Return ONLY a valid JSON object matching this schema:
{{
  "answer": "Your crisp 2-4 line direct response in {target_lang_name}",
  "is_grounded": true or false,
  "confidence_tier": "High" or "Moderate" or "Guidance",
  "evidence_points": ["Specific fact in {target_lang_name}", "Fact 2 in {target_lang_name}"],
  "why_explanation": "1-2 sentence explanation of why this advice was chosen in {target_lang_name}",
  "more_details": "Detailed progressive-disclosure explanation and IPM science in {target_lang_name}",
  "suggested_actions": ["Actionable step 1 in {target_lang_name}", "Actionable step 2 in {target_lang_name}"]
}}"""

        for model in self.fallback_models:
            try:
                response = self.client.models.generate_content(
                    model=model,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json"
                    )
                )
                clean_text = _clean_json_str(response.text)
                result = json.loads(clean_text)
                return {
                    "answer": result.get("answer", ""),
                    "is_grounded": result.get("is_grounded", False),
                    "confidence_tier": result.get("confidence_tier", "High" if result.get("is_grounded") else "Guidance"),
                    "evidence_points": result.get("evidence_points", []),
                    "why_explanation": result.get("why_explanation", ""),
                    "more_details": result.get("more_details", result.get("why_explanation", "")),
                    "suggested_actions": result.get("suggested_actions", []),
                }
            except Exception as e:
                logger.warning(f"Assistant model {model} attempt failed: {e}")

        # If all API calls fail, return reliable agronomic fallback
        logger.warning(f"All Gemini models failed in assistant. Generating agronomic fallback for: {message}")
        return _get_agronomic_fallback(message, crops, analyses, norm_lang)

gemini_service = GeminiService()
