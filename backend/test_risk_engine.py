import sys
from datetime import datetime, timezone, timedelta
from app.services.risk_service import calculate_farm_risk

def test_nominal_risk_empty_data():
    report = calculate_farm_risk(
        analyses=[],
        crops=[],
        fields=[],
        interventions=[]
    )
    assert report["overall_risk_score"] < 30, f"Empty data should yield low risk, got {report['overall_risk_score']}"
    assert report["risk_level"] == "Low"
    assert report["disease_risk"] == 15
    assert len(report["actionable_prescriptions"]) > 0
    print("[PASS] test_nominal_risk_empty_data passed")

def test_high_disease_and_pest_risk_with_flowering():
    analyses = [
        {
            "disease": "Early Blight",
            "severity": "Critical",
            "result_json": {
                "disease": "Early Blight",
                "severity": "Critical",
                "risk_score": 85
            }
        },
        {
            "disease": "Early Blight",
            "severity": "High",
            "result_json": {
                "disease": "Early Blight",
                "severity": "High",
                "risk_score": 75
            }
        },
        {
            "disease": "Aphids",
            "severity": "Moderate",
            "result_json": {
                "category": "pest",
                "is_pest_detected": True,
                "pest_name": "Aphids"
            }
        }
    ]
    crops = [
        {"name": "Tomato", "growth_stage": "Flowering & Panicle Initiation"}
    ]
    fields = [
        {"id": "f1", "name": "North Field"}
    ]
    interventions = []
    weather = {
        "temp": 28,
        "humidity": 82,
        "rain_probability": 65
    }

    report = calculate_farm_risk(analyses, crops, fields, interventions, weather)
    assert report["overall_risk_score"] >= 60, f"Expected High or Critical overall risk, got {report['overall_risk_score']}"
    assert report["risk_level"] in ["High", "Critical"]
    assert report["disease_risk"] >= 60
    assert report["pest_risk"] >= 30
    assert len(report["top_contributors"]) >= 3, "Must produce multiple explainable contributors"
    
    # Check that flowering contributor and humid weather contributor are present
    contrib_factors = [c["factor"] for c in report["top_contributors"]]
    assert any("Flowering" in f for f in contrib_factors), "Flowering stage must be identified as contributor"
    assert any("Incubation" in f or "Severity" in f for f in contrib_factors), "High disease/weather factor must be identified"
    print("[PASS] test_high_disease_and_pest_risk_with_flowering passed")

def test_risk_mitigation_from_recent_interventions():
    analyses = [
        {
            "disease": "Early Blight",
            "severity": "High",
            "result_json": {"disease": "Early Blight", "severity": "High"}
        }
    ]
    crops = [{"name": "Potato", "growth_stage": "Vegetative"}]
    fields = [{"id": "f1", "name": "East Field"}]
    
    # Without intervention
    report_unmitigated = calculate_farm_risk(analyses, crops, fields, [])
    
    # With recent spray and irrigation intervention
    now_str = datetime.now(timezone.utc).isoformat()
    interventions = [
        {"action_type": "Fungicide Spray", "performed_at": now_str},
        {"action_type": "Drip Irrigation", "performed_at": now_str}
    ]
    report_mitigated = calculate_farm_risk(analyses, crops, fields, interventions)
    
    assert report_mitigated["overall_risk_score"] < report_unmitigated["overall_risk_score"], \
        f"Mitigated risk ({report_mitigated['overall_risk_score']}) must be strictly lower than unmitigated ({report_unmitigated['overall_risk_score']})"
    
    mitigation_contributors = [c for c in report_mitigated["top_contributors"] if c["direction"] == "mitigation"]
    assert len(mitigation_contributors) > 0, "Must list logged actions as transparent mitigation contributors"
    print("[PASS] test_risk_mitigation_from_recent_interventions passed")

if __name__ == "__main__":
    test_nominal_risk_empty_data()
    test_high_disease_and_pest_risk_with_flowering()
    test_risk_mitigation_from_recent_interventions()
    print("\nALL AGRICULTURAL RISK ENGINE BACKEND TESTS PASSED SUCCESSFULLY!")
