import pytest
from app.services.gemini_service import _get_agronomic_fallback, gemini_service

def test_assistant_fallback_english():
    crops = [{"name": "Rice", "variety": "Swarna", "growth_stage": "Vegetative"}]
    analyses = [{"disease": "Bacterial Leaf Blight", "severity": "Medium", "created_at": "2026-03-01T10:00:00Z"}]
    
    res = _get_agronomic_fallback("What is the disease risk for my farm?", crops, analyses, language="en")
    assert "answer" in res
    assert isinstance(res["answer"], str)
    assert len(res["answer"]) > 10
    assert "suggested_actions" in res
    assert isinstance(res["suggested_actions"], list)
    assert len(res["suggested_actions"]) > 0
    assert "why_explanation" in res
    assert "evidence_points" in res
    assert "Bacterial Leaf Blight" in str(res["evidence_points"])
    print("[PASS] test_assistant_fallback_english passed")

def test_assistant_fallback_bengali():
    crops = [{"name": "ধান", "variety": "স্বর্ণা", "growth_stage": "কুশি পর্যায়"}]
    analyses = [{"disease": "ব্লাইট", "severity": "মাঝারি", "created_at": "2026-03-01T10:00:00Z"}]
    
    res = _get_agronomic_fallback("আমার ফসলের রোগ ঝুঁকি কেমন?", crops, analyses, language="bn")
    assert "answer" in res
    assert "খামার" in res["answer"] or "রোগ" in res["answer"] or "ঝুঁকি" in res["answer"]
    assert len(res["suggested_actions"]) > 0
    print("[PASS] test_assistant_fallback_bengali passed")

def test_assistant_fallback_hindi():
    crops = [{"name": "धान", "variety": "पूसा", "growth_stage": "वानस्पतिक"}]
    analyses = [{"disease": "झुलसा", "severity": "मध्यम", "created_at": "2026-03-01T10:00:00Z"}]
    
    res = _get_agronomic_fallback("मेरे खेत में रोग का क्या जोखिम है?", crops, analyses, language="hi")
    assert "answer" in res
    assert "खेत" in res["answer"] or "रोग" in res["answer"] or "जोखिम" in res["answer"]
    assert len(res["suggested_actions"]) > 0
    print("[PASS] test_assistant_fallback_hindi passed")

def test_broken_plant_guidance():
    res_en = _get_agronomic_fallback("My plant branch broke in the storm. What should I do?", [], [], language="en")
    assert "splint" in res_en["answer"].lower() or "stake" in res_en["answer"].lower() or "broken" in res_en["answer"].lower()
    assert len(res_en["suggested_actions"]) >= 2

    res_bn = _get_agronomic_fallback("গাছের ডাল ভেঙে গেছে, কী করব?", [], [], language="bn")
    assert "ডাল" in res_bn["answer"] or "ভাঙা" in res_bn["answer"]

    res_hi = _get_agronomic_fallback("पौधे की टहनी टूट गई है, क्या करूं?", [], [], language="hi")
    assert "टूट" in res_hi["answer"] or "शाखा" in res_hi["answer"]
def test_assistant_chat_contract_fields():
    crops = [{"name": "Rice", "variety": "Swarna", "growth_stage": "Vegetative"}]
    analyses = [{"disease": "Bacterial Leaf Blight", "severity": "Medium", "created_at": "2026-03-01T10:00:00Z"}]
    fields = [{"name": "North Field", "area_acres": 2.5, "soil_type": "Clay Loam", "irrigation_type": "Drip"}]
    
    # Test chat_with_context returns full structured schema
    res = gemini_service.chat_with_context(
        message="My rice leaves are yellow. What should I check?",
        crops=crops,
        analyses=analyses,
        fields=fields,
        interventions=[],
        language="en"
    )
    
    # Verify contract keys
    assert "answer" in res, "Missing 'answer' in assistant response"
    assert isinstance(res["answer"], str) and len(res["answer"]) > 0
    
    assert "is_grounded" in res, "Missing 'is_grounded'"
    assert isinstance(res["is_grounded"], bool)
    
    assert "confidence_tier" in res, "Missing 'confidence_tier'"
    assert res["confidence_tier"] in ["High", "Moderate", "Guidance"]
    
    assert "suggested_actions" in res, "Missing 'suggested_actions'"
    assert isinstance(res["suggested_actions"], list)
    assert len(res["suggested_actions"]) > 0
    
    assert "why_explanation" in res, "Missing 'why_explanation'"
    assert isinstance(res["why_explanation"], str)
    
    assert "evidence_points" in res, "Missing 'evidence_points'"
    assert isinstance(res["evidence_points"], list)
    
    print("[PASS] test_assistant_chat_contract_fields passed")

def test_recent_scan_memory_query_english():
    crops = [{"name": "Tomato", "variety": "Pusa Ruby", "growth_stage": "Fruiting"}]
    analyses = [{
        "disease": "Early Blight",
        "severity": "Medium",
        "created_at": "2026-03-20T10:00:00Z",
        "result_json": {"crop": "Tomato", "actions": ["Apply copper fungicide"]}
    }]
    res = _get_agronomic_fallback("What did you find in my last scan?", crops, analyses, language="en")
    assert "Early Blight" in res["answer"]
    assert "Tomato" in res["answer"] or "crop" in res["answer"]
    assert res["is_grounded"] is True
    assert "2026-03-20" in str(res["evidence_points"])
    print("[PASS] test_recent_scan_memory_query_english passed")

def test_recent_scan_memory_query_bengali():
    crops = [{"name": "টমেটো", "variety": "পুসা রুবি", "growth_stage": "ফল ধারণ"}]
    analyses = [{
        "disease": "আর্লি ব্লাইট",
        "severity": "মাঝারি",
        "created_at": "2026-03-20T10:00:00Z",
        "result_json": {"crop": "টমেটো", "actions": ["কপার ছত্রাকনাশক স্প্রে করুন"]}
    }]
    res = _get_agronomic_fallback("আমার শেষ স্ক্যানে আপনি কী পেয়েছিলেন?", crops, analyses, language="bn")
    assert "আর্লি ব্লাইট" in res["answer"]
    assert "টমেটো" in res["answer"]
    assert res["is_grounded"] is True
    print("[PASS] test_recent_scan_memory_query_bengali passed")

def test_recent_scan_memory_query_hindi():
    crops = [{"name": "टमाटर", "variety": "पूसा रूबी", "growth_stage": "फलन"}]
    analyses = [{
        "disease": "अगेती झुलसा",
        "severity": "मध्यम",
        "created_at": "2026-03-20T10:00:00Z",
        "result_json": {"crop": "टमाटर", "actions": ["कॉपर कवकनाशी का छिड़काव करें"]}
    }]
    res = _get_agronomic_fallback("मेरे पिछले स्कैन में क्या बीमारी पाई गई?", crops, analyses, language="hi")
    assert "अगेती झुलसा" in res["answer"]
    assert "टमाटर" in res["answer"]
    assert res["is_grounded"] is True
    print("[PASS] test_recent_scan_memory_query_hindi passed")

def test_recent_scan_memory_empty_history():
    res_en = _get_agronomic_fallback("What did you find in my last scan?", [], [], language="en")
    assert "haven't completed a leaf scan yet" in res_en["answer"]

    res_bn = _get_agronomic_fallback("আমার শেষ স্ক্যানে কী ছিল?", [], [], language="bn")
    assert "স্ক্যান সম্পন্ন করেননি" in res_bn["answer"]

    res_hi = _get_agronomic_fallback("मेरे पिछले स्कैन में क्या मिला?", [], [], language="hi")
    assert "स्कैन नहीं किया है" in res_hi["answer"]
    print("[PASS] test_recent_scan_memory_empty_history passed")

if __name__ == "__main__":
    test_assistant_fallback_english()
    test_assistant_fallback_bengali()
    test_assistant_fallback_hindi()
    test_broken_plant_guidance()
    test_recent_scan_memory_query_english()
    test_recent_scan_memory_query_bengali()
    test_recent_scan_memory_query_hindi()
    test_recent_scan_memory_empty_history()
    test_assistant_chat_contract_fields()
    print("\nALL ASSISTANT TESTS PASSED!")

