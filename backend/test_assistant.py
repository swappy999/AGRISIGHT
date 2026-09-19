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

if __name__ == "__main__":
    test_assistant_fallback_english()
    test_assistant_fallback_bengali()
    test_assistant_fallback_hindi()
    test_broken_plant_guidance()
    test_assistant_chat_contract_fields()
    print("\nALL ASSISTANT TESTS PASSED!")

