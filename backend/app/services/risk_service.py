from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta

def calculate_farm_risk(
    analyses: List[Dict[str, Any]],
    crops: List[Dict[str, Any]],
    fields: List[Dict[str, Any]],
    interventions: List[Dict[str, Any]],
    weather: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Central Agricultural Risk Engine.
    Combines Scans + Crop Stages + Weather + Pests + Nutrient Signals + Interventions.
    Produces an explainable 0-100 composite farm risk score with transparent contributors.
    """
    contributors: List[Dict[str, Any]] = []
    
    # 1. Disease Risk Evaluation
    disease_score = 15  # baseline nominal risk
    high_sev_count = 0
    recurrence_map: Dict[str, int] = {}
    
    for a in analyses[:20]:
        res = a.get("result_json") or {}
        cond = a.get("disease") or res.get("disease") or res.get("condition") or ""
        sev = (a.get("severity") or res.get("severity") or "Low").lower()
        
        if cond and "healthy" not in cond.lower():
            recurrence_map[cond] = recurrence_map.get(cond, 0) + 1
            if sev in ["critical", "high", "severe"]:
                high_sev_count += 1
                
    if high_sev_count > 0:
        pts = min(40, high_sev_count * 20)
        disease_score += pts
        contributors.append({
            "factor": f"Active Pathogen Severity ({high_sev_count} high-severity scan(s))",
            "impact_points": pts,
            "direction": "increase",
            "domain": "Disease",
            "description": "Recent leaf scans detected active fungal/bacterial disease symptoms requiring targeted intervention."
        })
        
    for cond, count in recurrence_map.items():
        if count >= 2:
            disease_score += 15
            contributors.append({
                "factor": f"Pathogen Recurrence ({cond} across {count} scans)",
                "impact_points": 15,
                "direction": "increase",
                "domain": "Disease",
                "description": f"{cond} has been detected repeatedly, indicating residual spores in canopy or soil."
            })
            break

    # 2. Pest & IPM Threat Evaluation
    pest_score = 10
    active_pests = []
    for a in analyses[:15]:
        res = a.get("result_json") or {}
        if res.get("is_pest_detected") or res.get("category") == "pest":
            pname = res.get("pest_name") or res.get("condition") or "Pest Infestation"
            if pname not in active_pests:
                active_pests.append(pname)
                
    if active_pests:
        pts = min(35, len(active_pests) * 18)
        pest_score += pts
        contributors.append({
            "factor": f"Active Pest Pressure ({', '.join(active_pests[:2])})",
            "impact_points": pts,
            "direction": "increase",
            "domain": "Pest",
            "description": "Visual insect pest detection confirmed in recent farm monitoring scans."
        })

    # 3. Crop Lifecycle Stage Vulnerability Multipliers
    flowering_crops = []
    for c in crops:
        stg = (c.get("growth_stage") or "").lower()
        if "flower" in stg or "bloom" in stg or "panicle" in stg:
            flowering_crops.append(c.get("name", "Crop"))
            
    if flowering_crops:
        disease_score = int(disease_score * 1.2)
        pest_score = int(pest_score * 1.15)
        contributors.append({
            "factor": f"Critical Lifecycle Stage ({', '.join(flowering_crops[:2])} in Flowering)",
            "impact_points": 14,
            "direction": "increase",
            "domain": "Lifecycle",
            "description": "Flowering crops have heightened physiological sensitivity to moisture deficit, blossom blight, and borer pests."
        })

    # 4. Weather & Environmental Stress
    weather_score = 15
    water_stress_score = 20
    
    if weather:
        temp = weather.get("temp", 26)
        humidity = weather.get("humidity", 65)
        rain_prob = weather.get("rain_probability", 20)
        
        # High humidity fungal incubator
        if humidity > 75 and 20 <= temp <= 32:
            weather_score += 22
            disease_score += 15
            contributors.append({
                "factor": f"Microclimate Fungal Incubation (Humidity {humidity}%, Temp {temp}°C)",
                "impact_points": 20,
                "direction": "increase",
                "domain": "Weather",
                "description": "Warm ambient temperature combined with sustained high humidity creates optimal conditions for spore germination."
            })
        elif humidity < 35 and temp > 32:
            water_stress_score += 25
            contributors.append({
                "factor": f"Atmospheric Vapor Pressure Deficit (Temp {temp}°C, Humidity {humidity}%)",
                "impact_points": 25,
                "direction": "increase",
                "domain": "Irrigation",
                "description": "High temperature and dry air accelerate plant transpiration and root water exhaustion."
            })

    # 5. Recent Interventions (Risk Dampeners / Mitigations)
    recent_sprays = 0
    recent_irrigations = 0
    now = datetime.now(timezone.utc)
    
    for item in interventions:
        action_type = (item.get("action_type") or "").lower()
        performed = item.get("performed_at")
        if performed:
            try:
                dt = datetime.fromisoformat(performed.replace("Z", "+00:00"))
                if (now - dt) <= timedelta(days=5):
                    if "spray" in action_type or "ipm" in action_type or "pesticide" in action_type or "fungicide" in action_type:
                        recent_sprays += 1
                    elif "irrigation" in action_type or "water" in action_type:
                        recent_irrigations += 1
            except Exception:
                pass
                
    if recent_sprays > 0:
        disease_score = max(5, disease_score - 18)
        pest_score = max(5, pest_score - 18)
        contributors.append({
            "factor": f"Protective Action Logged ({recent_sprays} spray/IPM intervention(s) in last 5 days)",
            "impact_points": -18,
            "direction": "mitigation",
            "domain": "Historical",
            "description": "Recent crop protection or IPM treatment actively reduces active pathogen and insect pest pressure."
        })
        
    if recent_irrigations > 0:
        water_stress_score = max(5, water_stress_score - 20)
        contributors.append({
            "factor": f"Recent Irrigation Logged ({recent_irrigations} watering cycle(s) in last 5 days)",
            "impact_points": -20,
            "direction": "mitigation",
            "domain": "Irrigation",
            "description": "Adequate soil hydration suppresses root stress and wilting vulnerability."
        })

    # Clamp sub-scores 0-100
    disease_score = max(0, min(100, disease_score))
    pest_score = max(0, min(100, pest_score))
    water_stress_score = max(0, min(100, water_stress_score))
    weather_score = max(0, min(100, weather_score))
    
    # Weighted Composite Farm Risk with Peak Hazard Blend (prevents critical threats from being masked)
    weighted_avg = (
        (disease_score * 0.30) +
        (pest_score * 0.25) +
        (water_stress_score * 0.25) +
        (weather_score * 0.20)
    )
    peak_hazard = max(disease_score, pest_score, water_stress_score, weather_score)
    overall_score = int((peak_hazard * 0.45) + (weighted_avg * 0.55))
    overall_score = max(0, min(100, overall_score))
    
    if overall_score >= 80:
        risk_level = "Critical"
    elif overall_score >= 60:
        risk_level = "High"
    elif overall_score >= 30:
        risk_level = "Moderate"
    else:
        risk_level = "Low"

    # Actionable Prescriptions
    prescriptions = []
    if disease_score >= 50:
        prescriptions.append({
            "domain": "Disease Control",
            "urgency": "Immediate" if disease_score >= 70 else "Scheduled",
            "title": "Preventative Bio-Fungicide or Targeted Spray",
            "detail": "Apply Trichoderma viride or copper-based preventative fungicide on dense canopy sectors."
        })
    if pest_score >= 45:
        prescriptions.append({
            "domain": "Pest & IPM",
            "urgency": "Immediate" if pest_score >= 65 else "Scheduled",
            "title": "Install Monitoring Sticky Traps & Neem Spray",
            "detail": "Deploy yellow/blue sticky traps and apply 0.5% cold-pressed neem oil during late afternoon."
        })
    if water_stress_score >= 50:
        prescriptions.append({
            "domain": "Irrigation",
            "urgency": "Immediate" if water_stress_score >= 70 else "Scheduled",
            "title": "Schedule Deep Root Zone Irrigation",
            "detail": "Provide deep watering in early morning to minimize evaporation and relieve moisture deficit."
        })
    if not prescriptions:
        prescriptions.append({
            "domain": "Routine Farm Maintenance",
            "urgency": "Watchlist",
            "title": "Maintain Weekly Foliar Scouting Routine",
            "detail": "No acute emergencies. Continue scanning perimeter crop rows every 7 days."
        })

    # Field-level Breakdown
    field_breakdowns = []
    for f in fields:
        fname = f.get("name", "Field")
        fid = str(f.get("id", ""))
        field_analyses = [a for a in analyses if (a.get("result_json") or {}).get("field_id") == fid or (a.get("result_json") or {}).get("field_name") == fname]
        f_risk = max(10, min(95, overall_score + (10 if len(field_analyses) > 0 and (field_analyses[0].get("severity") or "").lower() in ["high", "critical"] else -5)))
        f_level = "Critical" if f_risk >= 80 else "High" if f_risk >= 60 else "Moderate" if f_risk >= 30 else "Low"
        field_breakdowns.append({
            "field_id": fid,
            "field_name": fname,
            "risk_score": f_risk,
            "risk_level": f_level,
            "top_threat": field_analyses[0].get("disease", "Nominal Risk") if field_analyses else "Nominal Risk"
        })

    return {
        "overall_risk_score": overall_score,
        "risk_level": risk_level,
        "disease_risk": disease_score,
        "pest_risk": pest_score,
        "water_stress_risk": water_stress_score,
        "weather_risk": weather_score,
        "top_contributors": sorted(contributors, key=lambda c: abs(c["impact_points"]), reverse=True)[:5],
        "actionable_prescriptions": prescriptions[:3],
        "field_breakdown": field_breakdowns,
        "calculated_at": datetime.now(timezone.utc).isoformat()
    }
