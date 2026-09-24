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
        language: str = "en"
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

        scan_lines = []
        for a in analyses[:8]:
            disease = a.get("disease", "Unknown")
            sev = a.get("severity", "Unknown")
            date = str(a.get("created_at", ""))[:10]
            rj = a.get("result_json") or {}
            crop_name = rj.get("crop", "")
            line = f"  - [{date}] Disease: {disease} (Severity: {sev})"
            if crop_name: line += f" on {crop_name}"
            scan_lines.append(line)
        scans_block = "\n".join(scan_lines) if scan_lines else "  (no scan history yet)"

        intervention_lines = []
        for inv in interventions[:6]:
            date = str(inv.get("created_at", ""))[:10]
            action = inv.get("action", "") or inv.get("title", "")
            notes = inv.get("notes", "")
            intervention_lines.append(f"  - [{date}] {action}{' - ' + notes if notes else ''}")
        interventions_block = "\n".join(intervention_lines) if intervention_lines else "  (no interventions recorded)"

        if norm_lang == "bn":
            target_lang_name = "Bengali (বাংলা)"
            system_instruction = (
                "You are AgriSight AI, an expert agricultural decision advisor helping smallholder farmers.\n"
                "CRITICAL INSTRUCTION (ABSOLUTE MANDATE):\n"
                "The user's language is Bengali (বাংলা).\n"
                "You MUST write ALL natural-language output fields ('answer', 'evidence_points', 'why_explanation', 'more_details', 'suggested_actions') "
                "100% ENTIRELY in fluent, natural, farmer-friendly Bengali script (বাংলা).\n"
                "Under NO circumstances should you output English sentences or Latin-script explanations, "
                "even though the farmer's field history data above is in English.\n"
                "Keep 'confidence_tier' as one of 'High', 'Moderate', or 'Guidance'."
            )
            lang_instruction = """The user's target language is Bengali (বাংলা).
Understand the user's message in Bengali or mixed English-Bengali code-switching (e.g. 'tomato', 'fungus', 'blight', 'fertilizer').
Respond entirely in natural, farmer-friendly Bengali for 'answer', 'evidence_points', 'why_explanation', 'more_details', and 'suggested_actions'.
Do not return English explanations unless an agronomic or chemical name has no common Bengali equivalent.
Keep 'confidence_tier' as one of 'High', 'Moderate', 'Guidance'."""
        elif norm_lang == "hi":
            target_lang_name = "Hindi (हिन्दी)"
            system_instruction = (
                "You are AgriSight AI, an expert agricultural decision advisor helping smallholder farmers.\n"
                "CRITICAL INSTRUCTION (ABSOLUTE MANDATE):\n"
                "The user's language is Hindi (हिन्दी).\n"
                "You MUST write ALL natural-language output fields ('answer', 'evidence_points', 'why_explanation', 'more_details', 'suggested_actions') "
                "100% ENTIRELY in fluent, natural, farmer-friendly Hindi script (हिन्दी).\n"
                "Under NO circumstances should you output English sentences or Latin-script explanations, "
                "even though the farmer's field history data above is in English.\n"
                "Keep 'confidence_tier' as one of 'High', 'Moderate', or 'Guidance'."
            )
            lang_instruction = """The user's target language is Hindi (हिन्दी).
Understand the user's message in Hindi or mixed English-Hindi code-switching.
Respond entirely in natural, farmer-friendly Hindi for 'answer', 'evidence_points', 'why_explanation', 'more_details', and 'suggested_actions'.
Do not return English explanations unless an agronomic or chemical name has no common Hindi equivalent.
Keep 'confidence_tier' as one of 'High', 'Moderate', 'Guidance'."""
        else:
            target_lang_name = "English"
            system_instruction = (
                "You are AgriSight AI, an expert agricultural decision advisor helping smallholder farmers.\n"
                "Respond in clear, farmer-friendly English."
            )
            lang_instruction = """The user's target language is English.
Respond in clear, farmer-friendly English for 'answer', 'evidence_points', 'why_explanation', 'more_details', and 'suggested_actions'.
Keep 'confidence_tier' as one of 'High', 'Moderate', 'Guidance'."""

        prompt = f"""You are AgriSight, an expert agricultural decision intelligence AI assistant helping smallholder farmers.

You have access to the following REAL DATA from this farmer's AgriSight account:

AGRICULTURAL FIELDS:
{fields_block}

CROPS REGISTERED:
{crops_block}

RECENT SCAN HISTORY (newest first):
{scans_block}

RECENT FIELD INTERVENTIONS & TREATMENTS:
{interventions_block}

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
