from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import math
from app.services.weather_service import weather_service
from app.core.logging import logger

# Crop Stage Vulnerability Multipliers
STAGE_VULNERABILITY = {
    "seed": {"disease": 0.8, "water": 1.2, "pest": 0.5},
    "germination": {"disease": 0.9, "water": 1.3, "pest": 0.6},
    "vegetative": {"disease": 1.0, "water": 1.0, "pest": 1.2},
    "flowering": {"disease": 1.3, "water": 1.4, "pest": 1.3},
    "fruiting": {"disease": 1.4, "water": 1.2, "pest": 1.4},
    "harvest": {"disease": 0.7, "water": 0.6, "pest": 0.8}
}

# Soil Water Retention Coefficients
SOIL_RETENTION = {
    "clay": 1.3,
    "alluvial": 1.0,
    "loamy": 1.1,
    "black soil": 1.2,
    "sandy": 0.7,
    "red soil": 0.9
}


class RiskEngine:
    def __init__(self):
        pass

    async def compute_full_assessment(
        self,
        crops: List[Dict[str, Any]],
        fields: List[Dict[str, Any]],
        analyses: List[Dict[str, Any]],
        interventions: List[Dict[str, Any]],
        lat: float = 22.57,
        lon: float = 88.36,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Compute full multi-factor agricultural risk assessment, smart irrigation, and top decision cards."""
        # 1. Fetch agricultural weather intelligence
        weather = await weather_service.get_agricultural_weather(lat, lon, language)

        # 2. Compute Disease Risk (0-100)
        disease_risk, disease_factors = self._compute_disease_risk(analyses, weather, crops)

        # 3. Compute Pest Risk (0-100)
        pest_risk, pest_factors = self._compute_pest_risk(crops, analyses, weather)

        # 4. Compute Water-Stress Risk (0-100) & Smart Irrigation
        water_risk, water_factors, irrigation_rec = self._compute_water_and_irrigation(
            fields, crops, interventions, weather, language
        )

        # 5. Compute Weather Risk (0-100)
        weather_risk, weather_factors = self._compute_weather_risk(weather)

        # 6. Overall Farm Health Score (FHI 0-100)
        # Weighted aggregate: base 100 minus composite risk penalty
        composite_risk = (
            (disease_risk * 0.35) +
            (water_risk * 0.25) +
            (pest_risk * 0.20) +
            (weather_risk * 0.20)
        )
        health_score = max(25, min(100, int(100 - (composite_risk * 0.75))))

        if health_score >= 80:
            health_status = "Optimal"
            status_color = "emerald"
        elif health_score >= 55:
            health_status = "Moderate Stress"
            status_color = "amber"
        else:
            health_status = "High Threat Outbreak"
            status_color = "rose"

        # 7. Generate Consolidated Explainable Contributors
        all_contributors = []
        if disease_factors:
            all_contributors.extend([{"category": "Disease", "text": f} for f in disease_factors])
        if water_factors:
            all_contributors.extend([{"category": "Water", "text": f} for f in water_factors])
        if pest_factors:
            all_contributors.extend([{"category": "Pest", "text": f} for f in pest_factors])
        if weather_factors:
            all_contributors.extend([{"category": "Weather", "text": f} for f in weather_factors])

        # 8. Generate Top 1-3 Farmer Decision Cards
        decision_cards = self._generate_decision_cards(
            health_score, disease_risk, water_risk, pest_risk, weather_risk,
            irrigation_rec, crops, analyses, language
        )

        # 9. Generate Central Alert Engine Items
        alerts = self._generate_central_alerts(
            disease_risk, water_risk, pest_risk, weather_risk, analyses, weather, language
        )

        return {
            "health_score": health_score,
            "health_status": health_status,
            "status_color": status_color,
            "overall_farm_risk": int(composite_risk),
            "disease_risk": disease_risk,
            "water_risk": water_risk,
            "pest_risk": pest_risk,
            "weather_risk": weather_risk,
            "contributors": all_contributors,
            "smart_irrigation": irrigation_rec,
            "decision_cards": decision_cards,
            "central_alerts": alerts,
            "weather_context": {
                "temperature": weather["temperature"],
                "humidity": weather["humidity"],
                "rain_probability": weather["rain_probability"],
                "heat_risk": weather["heat_risk"],
                "rain_risk": weather["rain_risk"],
                "fungal_pressure": weather["fungal_pressure"]
            }
        }

    def _compute_disease_risk(self, analyses: List[dict], weather: dict, crops: List[dict]) -> (int, List[str]):
        score = 10
        factors = []

        # Analyze recent scans
        critical_count = 0
        moderate_count = 0
        for scan in analyses[:5]:
            sev = str(scan.get("severity", "")).lower()
            disease = scan.get("disease", "")
            is_healthy = disease.lower() in ["healthy", "healthy plant", "no disease"]
            
            if not is_healthy and bool(disease):
                if sev in ["critical", "high", "severe"]:
                    critical_count += 1
                elif sev in ["medium", "moderate"]:
                    moderate_count += 1

        if critical_count > 0:
            score += min(50, critical_count * 25)
            factors.append(f"{critical_count} recent scan(s) identified active severe pathogen infections.")
        elif moderate_count > 0:
            score += min(25, moderate_count * 12)
            factors.append(f"{moderate_count} scan(s) indicate moderate symptoms under observation.")
        else:
            factors.append("No active pathogen outbreaks identified in recent scan history.")

        # Weather contribution
        if weather.get("fungal_pressure") == "High":
            score += 20
            factors.append(f"High relative humidity ({weather.get('humidity')}%) accelerates airborne fungal sporulation.")
        elif weather.get("fungal_pressure") == "Moderate":
            score += 10

        # Stage contribution
        has_flowering = any(c.get("growth_stage", "").lower() in ["flowering", "fruiting"] for c in crops)
        if has_flowering:
            score = int(score * 1.15)
            factors.append("Crops in flowering/fruiting stages have heightened pathogen vulnerability.")

        return min(100, max(5, score)), factors

    def _compute_pest_risk(self, crops: List[dict], analyses: List[dict], weather: dict) -> (int, List[str]):
        score = 15
        factors = []

        temp = weather.get("temperature", 30.0)
        # Optimal temperature band for sap-sucking pests (Aphids, Thrips, Whiteflies: 26°C - 34°C)
        if 26.0 <= temp <= 34.0:
            score += 20
            factors.append(f"Ambient temperature ({temp}°C) is in the optimal reproduction range for foliar pests.")

        # Check for pest mentions in scan results
        pest_found = any("pest" in str(a.get("disease", "")).lower() or (a.get("result_json") or {}).get("pest_detected") for a in analyses[:5])
        if pest_found:
            score += 35
            factors.append("Pest activity recorded in recent canopy inspections.")

        if any(c.get("growth_stage", "").lower() in ["vegetative", "flowering"] for c in crops):
            score += 10
            factors.append("Tender vegetative foliage presents prime feeding targets for insects.")

        if not factors:
            factors.append("Pest reproduction pressures remain within safe seasonal baseline.")

        return min(100, max(5, score)), factors

    def _compute_water_and_irrigation(
        self,
        fields: List[dict],
        crops: List[dict],
        interventions: List[dict],
        weather: dict,
        language: str
    ) -> (int, List[str], dict):
        temp = weather.get("temperature", 30.0)
        rain_prob = weather.get("rain_probability", 20)
        rain_3d = weather.get("next_3d_rain_mm", 0.0)
        et0 = weather.get("evapotranspiration_mm_day", 4.5)

        # 1. Soil retention
        soil_type = (fields[0].get("soil_type") if fields else "Alluvial").lower()
        retention = SOIL_RETENTION.get(soil_type, 1.0)

        # 2. Days since last watering
        last_irrigation_date = None
        for inv in interventions:
            action = (inv.get("action_type") or inv.get("action_title") or "").lower()
            if "irrigat" in action or "water" in action:
                last_irrigation_date = inv.get("performed_at") or inv.get("created_at")
                break

        days_dry = 2
        if last_irrigation_date:
            try:
                d_str = str(last_irrigation_date)[:10]
                last_dt = datetime.strptime(d_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                days_dry = max(0, (datetime.now(timezone.utc) - last_dt).days)
            except Exception:
                pass

        # Calculate water-stress score
        base_stress = min(75, int((days_dry * et0 * 3.5) / retention))
        
        # If rain expected soon, stress reduces
        if rain_prob >= 70 or rain_3d >= 20.0:
            water_risk = max(10, base_stress - 35)
            status = "Delayed (Rain Imminent)"
            action_text = "Postpone scheduled irrigation; substantial precipitation forecast."
            urgency = "Low"
        elif base_stress >= 50 or days_dry >= 3:
            water_risk = min(100, base_stress + 15)
            status = "Irrigation Required"
            action_text = f"Apply drip irrigation to replenish root zone after {days_dry} days without water."
            urgency = "High"
        else:
            water_risk = max(10, base_stress)
            status = "Moisture Optimal"
            action_text = "Soil moisture remains sufficient; maintain standard monitoring."
            urgency = "Low"

        factors = []
        factors.append(f"Estimated soil water deficit based on {et0} mm/day evapotranspiration in {soil_type.title()} soil.")
        if days_dry >= 2:
            factors.append(f"{days_dry} days elapsed since last recorded watering intervention.")
        if rain_prob >= 50:
            factors.append(f"Rain probability is {rain_prob}%, modulating irrigation urgency.")

        # Optimal watering window
        if temp >= 32.0:
            window = "5:30 AM – 7:30 AM"
        else:
            window = "6:30 AM – 8:30 AM"

        irrigation_rec = {
            "status": status,
            "water_risk_score": water_risk,
            "urgency": urgency,
            "recommended_window": window,
            "action_text": action_text,
            "days_since_last_watering": days_dry,
            "soil_type": soil_type.title(),
            "evapotranspiration_mm": et0,
            "rain_probability": rain_prob
        }

        return water_risk, factors, irrigation_rec

    def _compute_weather_risk(self, weather: dict) -> (int, List[str]):
        temp = weather.get("temperature", 30.0)
        rain_prob = weather.get("rain_probability", 20)
        wind = weather.get("wind_speed_kmh", 10.0)
        heat_risk = weather.get("heat_risk", "Moderate")

        score = 15
        factors = []

        if heat_risk in ["High", "Critical"]:
            score += 35
            factors.append(f"High thermal stress ({temp}°C) accelerates moisture loss.")
        if rain_prob >= 70:
            score += 25
            factors.append(f"High probability of precipitation ({rain_prob}%) in next 24 hours.")
        if wind >= 25.0:
            score += 20
            factors.append(f"Elevated wind velocity ({wind} km/h) can cause physical lodging and drift.")

        if not factors:
            factors.append("Stable microclimatic conditions with no extreme meteorological risks.")

        return min(100, max(5, score)), factors

    def _generate_decision_cards(
        self,
        health_score: int,
        disease_risk: int,
        water_risk: int,
        pest_risk: int,
        weather_risk: int,
        irrigation: dict,
        crops: List[dict],
        analyses: List[dict],
        language: str
    ) -> List[Dict[str, Any]]:
        """Generate top 1-3 actionable farmer decision cards."""
        cards = []
        lang = str(language or "en").lower()[:2]

        # Card 1: Irrigation priority
        if irrigation.get("urgency") == "High":
            cards.append({
                "id": "action_irrigate",
                "priority": "High",
                "icon": "water_drop",
                "title": "Irrigate Crop Root Zone" if lang == "en" else ("ফসলে সেচ দিন" if lang == "bn" else "फसल में सिंचाई करें"),
                "detail": f"{irrigation.get('action_text')} Recommended window: {irrigation.get('recommended_window')}",
                "action_route": "/fields",
                "action_label": "View Field Water Status"
            })
        elif irrigation.get("status") == "Delayed (Rain Imminent)":
            cards.append({
                "id": "action_delay_water",
                "priority": "Medium",
                "icon": "cloud",
                "title": "Postpone Irrigation" if lang == "en" else ("সেচ স্থগিত রাখুন" if lang == "bn" else "सिंचाई स्थगित करें"),
                "detail": "High rain probability in forecast. Check drainage to prevent root waterlogging.",
                "action_route": "/dashboard",
                "action_label": "Check Weather Radar"
            })

        # Card 2: Pathogen / Disease priority
        if disease_risk >= 50 or (analyses and analyses[0].get("severity") in ["High", "Critical"]):
            recent_d = analyses[0].get("disease", "Crop Pathogen") if analyses else "Pathogen"
            cards.append({
                "id": "action_disease_scout",
                "priority": "High",
                "icon": "coronavirus",
                "title": f"Targeted Scouting for {recent_d}" if lang == "en" else (f"{recent_d} প্রতিরোধে নিরীক্ষণ করুন" if lang == "bn" else f"{recent_d} की निगरानी करें"),
                "detail": "Inspect leaf undersides and stem junctions in infected sectors to stop lateral spread.",
                "action_route": "/scan",
                "action_label": "Scan Scent Leaf"
            })

        # Card 3: Routine Scouting or Pest Check
        if pest_risk >= 45:
            cards.append({
                "id": "action_pest_scout",
                "priority": "Medium",
                "icon": "bug_report",
                "title": "Inspect for Foliar Pests" if lang == "en" else ("পোকা আক্রমণ নিরীক্ষণ করুন" if lang == "bn" else "कीट प्रकोप की जांच करें"),
                "detail": "Warm temperatures favor aphid and whitefly reproduction on young shoots.",
                "action_route": "/scan",
                "action_label": "Capture Leaf Scan"
            })
        elif not cards:
            cards.append({
                "id": "action_routine_monitor",
                "priority": "Low",
                "icon": "verified",
                "title": "Farm Status Optimal" if lang == "en" else ("খামারের অবস্থা স্বাভাবিক" if lang == "bn" else "खेत की स्थिति अनुकूल है"),
                "detail": "All crop zones are operating within healthy agronomic parameters.",
                "action_route": "/dashboard",
                "action_label": "View Field Map"
            })

        return cards[:3]

    def _generate_central_alerts(
        self,
        disease_risk: int,
        water_risk: int,
        pest_risk: int,
        weather_risk: int,
        analyses: List[dict],
        weather: dict,
        language: str
    ) -> List[Dict[str, Any]]:
        """Generate consolidated central alerts across Disease, Pest, Water, Weather."""
        alerts = []

        if disease_risk >= 60:
            alerts.append({
                "category": "Disease",
                "severity": "Critical" if disease_risk >= 75 else "Warning",
                "title": "High Pathogen Transmission Pressure",
                "message": f"Disease risk is elevated at {disease_risk}%. Humid canopy microclimate promotes rapid spore germination."
            })

        if water_risk >= 65:
            alerts.append({
                "category": "Water",
                "severity": "Warning",
                "title": "Soil Moisture Depletion Warning",
                "message": f"Water-stress risk is at {water_risk}%. Root zone moisture is depleting rapidly."
            })

        if pest_risk >= 60:
            alerts.append({
                "category": "Pest",
                "severity": "Warning",
                "title": "Favorable Pest Climate Detected",
                "message": f"Pest risk index at {pest_risk}%. Temperature parameters promote active insect multiplication."
            })

        if weather_risk >= 60:
            alerts.append({
                "category": "Weather",
                "severity": "Warning",
                "title": "Adverse Meteorological Conditions",
                "message": f"Weather risk index at {weather_risk}%. Heat stress / extreme precipitation expected."
            })

        return alerts


risk_engine = RiskEngine()
