import sys
from app.services.gemini_service import _normalize_analysis_data, _get_agronomic_vision_fallback
from app.schemas.requests import AnalyzeResultData

def test_non_crop_human():
    raw = {
        "is_agricultural": False,
        "image_type": "HUMAN",
        "validation_status": "NON_CROP",
        "crop_detected": False,
        "crop": None,
        "condition": None,
        "rejection_reason": "HUMAN_DETECTED"
    }
    res = _normalize_analysis_data(raw, "en")
    assert res.is_agricultural == False, "Must not be agricultural"
    assert res.validation_status == "NON_CROP", "Status must be NON_CROP"
    assert res.category == "non_crop", "Category must be non_crop"
    assert res.is_pest_detected == False, "is_pest_detected must be False"
    assert res.is_nutrient_deficiency == False, "is_nutrient_deficiency must be False"
    assert res.crop is None, "Crop must be None"
    assert res.disease is None, "Disease must be None"
    assert res.confidence is None, "Confidence must be None"
    assert "not appear to contain a crop" in res.farmer_answer, "Farmer answer should explain non-crop"
    print("[PASS] test_non_crop_human passed")

def test_non_crop_object():
    raw = {
        "is_agricultural": False,
        "image_type": "OBJECT",
        "validation_status": "NON_CROP",
        "crop_detected": False,
        "crop": None,
        "condition": None,
        "rejection_reason": "OBJECT_DETECTED"
    }
    res = _normalize_analysis_data(raw, "en")
    assert res.is_agricultural == False
    assert res.validation_status == "NON_CROP"
    assert res.crop is None
    assert res.disease is None
    print("[PASS] test_non_crop_object passed")

def test_valid_crop_early_blight():
    raw = {
        "is_agricultural": True,
        "image_type": "LEAF",
        "validation_status": "VALID",
        "category": "disease",
        "is_pest_detected": False,
        "crop_detected": True,
        "crop": "Potato",
        "condition": "Early Blight",
        "severity": "Medium",
        "confidence": 91,
        "risk_score": 65,
        "symptoms": ["Brown spots with concentric rings"]
    }
    res = _normalize_analysis_data(raw, "en")
    assert res.is_agricultural == True
    assert res.category == "disease"
    assert res.is_pest_detected == False
    assert res.is_nutrient_deficiency == False
    assert res.crop == "Potato"
    assert res.condition == "Early Blight"
    assert res.severity == "Medium"
    assert res.confidence == 91
    assert res.risk_score == 65
    print("[PASS] test_valid_crop_early_blight passed")

def test_pest_detection_and_ipm():
    raw = {
        "is_agricultural": True,
        "image_type": "LEAF",
        "validation_status": "VALID",
        "category": "pest",
        "is_pest_detected": True,
        "pest_name": "Aphids",
        "pest_type": "Sucking Pest",
        "crop_detected": True,
        "crop": "Chili",
        "condition": "Aphids",
        "severity": "Moderate",
        "confidence": 89,
        "risk_score": 58,
        "symptoms": ["Leaf curling", "Sticky honeydew secretions on foliage"],
        "ipm_recommendations": [
            "Apply 0.5% cold-pressed neem oil spray during late afternoon",
            "Introduce or conserve biological predators such as ladybird beetles (Coccinellidae)",
            "Install yellow sticky traps (10-15 per acre) for continuous population monitoring"
        ]
    }
    res = _normalize_analysis_data(raw, "en")
    assert res.is_agricultural == True
    assert res.category == "pest", "Category must be pest"
    assert res.is_pest_detected == True, "is_pest_detected must be True"
    assert res.is_nutrient_deficiency == False
    assert res.pest_name == "Aphids", "Pest name must be Aphids"
    assert res.pest_type == "Sucking Pest", "Pest type must be Sucking Pest"
    assert len(res.ipm_recommendations) == 3, "Must parse 3 IPM steps"
    assert res.crop == "Chili"
    assert res.confidence == 89
    print("[PASS] test_pest_detection_and_ipm passed")

def test_nutrient_nitrogen_deficiency():
    raw = {
        "is_agricultural": True,
        "image_type": "LEAF",
        "validation_status": "VALID",
        "category": "nutrient_deficiency",
        "is_nutrient_deficiency": True,
        "nutrient_name": "Nitrogen (N)",
        "nutrient_type": "Macronutrient (Mobile)",
        "crop_detected": True,
        "crop": "Tomato",
        "condition": "Nitrogen Deficiency",
        "severity": "Medium",
        "confidence": 86,
        "symptoms": ["General pale-yellow chlorosis beginning on oldest bottom leaves"],
        "fertilizer_recommendations": [
            "Apply well-decomposed farmyard manure (FYM) or vermicompost as organic side-dressing",
            "Foliar spray of 1% water-soluble urea during cool morning hours for rapid absorption"
        ],
        "soil_test_recommendation": "Confirm with lab soil analysis to determine electrical conductivity (EC) and available nitrogen."
    }
    res = _normalize_analysis_data(raw, "en")
    assert res.is_agricultural == True
    assert res.category == "nutrient_deficiency", "Category must be nutrient_deficiency"
    assert res.is_nutrient_deficiency == True, "is_nutrient_deficiency must be True"
    assert res.nutrient_name == "Nitrogen (N)"
    assert res.nutrient_type == "Macronutrient (Mobile)"
    assert res.condition.startswith("Possible "), "Condition MUST have 'Possible ' prefix per Phase 4 safety rules"
    assert len(res.fertilizer_recommendations) == 2
    assert "soil" in res.soil_test_recommendation.lower()
    print("[PASS] test_nutrient_nitrogen_deficiency passed")

def test_nutrient_iron_chlorosis():
    raw = {
        "is_agricultural": True,
        "image_type": "LEAF",
        "validation_status": "VALID",
        "category": "nutrient_deficiency",
        "is_nutrient_deficiency": True,
        "nutrient_name": "Iron (Fe)",
        "nutrient_type": "Micronutrient",
        "crop_detected": True,
        "crop": "Rice",
        "condition": "Iron Chlorosis",
        "severity": "Low",
        "confidence": 84,
        "symptoms": ["Interveinal chlorosis on youngest top leaves while veins stay dark green"],
        "fertilizer_recommendations": [
            "Foliar spray of 0.5% Ferrous Sulfate (FeSO4) + 0.1% Citric Acid",
            "Check and reduce soil alkalinity (pH > 7.8 blocks iron uptake)"
        ]
    }
    res = _normalize_analysis_data(raw, "en")
    assert res.category == "nutrient_deficiency"
    assert res.is_nutrient_deficiency == True
    assert res.condition.startswith("Possible ")
    assert res.nutrient_name == "Iron (Fe)"
    print("[PASS] test_nutrient_iron_chlorosis passed")

def test_healthy_crop_evidence():
    raw = {
        "is_agricultural": True,
        "image_type": "LEAF",
        "validation_status": "VALID",
        "crop_detected": True,
        "crop": "Rice",
        "condition": "Healthy Plant",
        "health_status": "Healthy",
        "confidence": 88
    }
    res = _normalize_analysis_data(raw, "en")
    assert res.is_agricultural == True
    assert res.category == "healthy"
    assert res.is_pest_detected == False
    assert res.is_nutrient_deficiency == False
    assert res.crop == "Rice"
    assert res.condition == "Healthy Plant"
    assert res.health_status == "Healthy"
    assert res.risk_score == 0, "Healthy crop risk_score must be 0"
    print("[PASS] test_healthy_crop_evidence passed")

def test_uncertain_inspection():
    raw = {
        "is_agricultural": True,
        "image_type": "UNCERTAIN",
        "validation_status": "UNCERTAIN_CROP",
        "crop_detected": False,
        "crop": None,
        "condition": None
    }
    res = _normalize_analysis_data(raw, "en")
    assert res.crop is None, "Crop must not default to tomato"
    assert res.condition is None, "Condition must be None when crop is not detected"
    assert res.validation_status == "UNCERTAIN_CROP"
    print("[PASS] test_uncertain_inspection passed")

def test_agronomic_vision_fallback():
    res = _get_agronomic_vision_fallback("What is this?", "en")
    assert res.crop is None, "Crop must be None in fallback"
    assert res.condition == "Inspection Pending"
    assert res.confidence is None, "Confidence must be None in fallback"
    assert res.status == "uncertain", "Fallback status must be uncertain"
    assert res.diagnosis == "Inspection Pending"
    assert len(res.actions) > 0, "Fallback must provide actionable guidance"
    assert res.water_advice != "", "Fallback must provide water advice"
    assert res.nutrition_advice != "", "Fallback must provide nutrition advice"
    assert res.ipm_advice != "", "Fallback must provide IPM advice"
    print("[PASS] test_agronomic_vision_fallback passed")

def test_structured_response_contract_section_6():
    """Verify compliance with a2.md Section 6 contract schema."""
    raw = {
        "status": "success",
        "is_agricultural": True,
        "image_type": "LEAF",
        "validation_status": "VALID",
        "category": "disease",
        "crop": "Rice",
        "condition": "Possible bacterial leaf blight",
        "diagnosis": "Possible bacterial leaf blight",
        "confidence": 0.87,
        "severity": "medium",
        "summary": "Symptoms may indicate bacterial leaf blight.",
        "actions": [
            "Inspect nearby plants.",
            "Avoid excessive nitrogen application.",
            "Monitor spread over the next few days."
        ],
        "water_advice": "Maintain shallow field water; avoid flooding until lesion spread stops.",
        "nutrition_advice": "Postpone urea top-dressing to suppress bacterial virulence.",
        "ipm_advice": "Sanitize field tools between rows to prevent pathogen transmission."
    }
    res = _normalize_analysis_data(raw, "en")
    assert res.status == "success"
    assert res.crop == "Rice"
    assert res.diagnosis == "Possible bacterial leaf blight"
    assert res.condition == "Possible bacterial leaf blight"
    assert res.confidence == 87, "Float confidence (0.87) must be normalized to percentage (87)"
    assert res.severity == "medium"
    assert res.summary == "Symptoms may indicate bacterial leaf blight."
    assert len(res.actions) == 3
    assert res.actions[0] == "Inspect nearby plants."
    assert "shallow field water" in res.water_advice
    assert "urea" in res.nutrition_advice.lower()
    assert "field tools" in res.ipm_advice
    print("[PASS] test_structured_response_contract_section_6 passed")

def test_uncertain_diagnosis_contract():
    """Verify compliance with a2.md Section 6 uncertain diagnosis handling."""
    raw = {
        "status": "uncertain",
        "is_agricultural": True,
        "image_type": "LEAF",
        "validation_status": "UNCERTAIN_CROP",
        "crop": "Potato",
        "condition": "Diagnosis Uncertain",
        "confidence": 32,
        "summary": "Symptoms are ambiguous; visual confirmation requires higher resolution.",
        "actions": ["Capture a clearer close-up of the leaf.", "Inspect field for uniform patterns."]
    }
    res = _normalize_analysis_data(raw, "en")
    assert res.status == "uncertain"
    assert res.validation_status == "UNCERTAIN_CROP"
    assert res.condition == "Diagnosis Uncertain"
    assert res.confidence == 32
    assert res.health_status == "At Risk"
    assert len(res.actions) >= 2
    print("[PASS] test_uncertain_diagnosis_contract passed")

def test_all_ten_contract_fields_section_6():
    """Verify all 10 core fields specified in a2.md Section 6 are always present in the returned model dump."""
    required_fields = [
        "status",
        "crop",
        "diagnosis",
        "confidence",
        "severity",
        "summary",
        "actions",
        "water_advice",
        "nutrition_advice",
        "ipm_advice",
    ]
    # 1. Disease payload
    raw_disease = {
        "status": "success",
        "is_agricultural": True,
        "crop": "Rice",
        "diagnosis": "Possible bacterial leaf blight",
        "confidence": 0.87,
        "severity": "medium",
        "summary": "Symptoms may indicate bacterial leaf blight.",
        "actions": ["Inspect nearby plants.", "Avoid excessive nitrogen."],
        "water_advice": "Maintain shallow water.",
        "nutrition_advice": "Hold urea application.",
        "ipm_advice": "Sanitize tools."
    }
    res_disease = _normalize_analysis_data(raw_disease).model_dump()
    for field in required_fields:
        assert field in res_disease, f"Missing required field {field} in disease response"

    # 2. Non-crop payload
    raw_non_crop = {
        "is_agricultural": False,
        "image_type": "HUMAN",
        "validation_status": "NON_CROP"
    }
    res_non_crop = _normalize_analysis_data(raw_non_crop).model_dump()
    for field in required_fields:
        assert field in res_non_crop, f"Missing required field {field} in non-crop response"
    assert res_non_crop["status"] == "non_crop"
    assert res_non_crop["crop"] is None
    assert res_non_crop["diagnosis"] is None

    # 3. Uncertain payload
    raw_uncertain = {
        "status": "uncertain",
        "is_agricultural": True,
        "validation_status": "UNCERTAIN_CROP"
    }
    res_uncertain = _normalize_analysis_data(raw_uncertain).model_dump()
    for field in required_fields:
        assert field in res_uncertain, f"Missing required field {field} in uncertain response"
    assert res_uncertain["status"] == "uncertain"
    assert res_uncertain["diagnosis"] == "Diagnosis Uncertain"
    print("[PASS] test_all_ten_contract_fields_section_6 passed")

def test_gemini_fallback_models():
    """Verify GeminiService fallback models sequence."""
    from app.services.gemini_service import gemini_service
    assert gemini_service.model_name == "gemini-2.5-flash"
    assert "gemini-2.5-flash" in gemini_service.fallback_models
    assert "gemini-3.5-flash-lite" in gemini_service.fallback_models
    assert "gemini-3.5-flash" in gemini_service.fallback_models
    print("[PASS] test_gemini_fallback_models passed")

if __name__ == "__main__":
    test_non_crop_human()
    test_non_crop_object()
    test_valid_crop_early_blight()
    test_pest_detection_and_ipm()
    test_nutrient_nitrogen_deficiency()
    test_nutrient_iron_chlorosis()
    test_healthy_crop_evidence()
    test_uncertain_inspection()
    test_agronomic_vision_fallback()
    test_structured_response_contract_section_6()
    test_uncertain_diagnosis_contract()
    test_all_ten_contract_fields_section_6()
    test_gemini_fallback_models()
    print("\nALL SCAN, PEST, NUTRIENT, SECTION 6 & VALIDATION TESTS PASSED SUCCESSFULLY!")
