from typing import Dict, Any

class DigitalTwinService:
    def __init__(self):
        pass

    async def simulate_field_scenario(
        self,
        base_field: Dict[str, Any],
        crop: Dict[str, Any],
        days_without_water: int = 0,
        temperature_delta: float = 0.0,
        rainfall_mm: float = 0.0,
        pesticide_applied: bool = False,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Model-based what-if simulation engine for field digital twin."""
        base_health = base_field.get("health_score", 90)
        base_soil = base_field.get("soil_type", "Alluvial").lower()
        crop_name = crop.get("name", "Crop") if crop else "Crop"
        stage = crop.get("growth_stage", "Vegetative") if crop else "Vegetative"

        # 1. Water Stress Projection
        water_stress_delta = days_without_water * 14.0
        if rainfall_mm > 0:
            water_stress_delta -= min(water_stress_delta, rainfall_mm * 2.2)

        projected_water_risk = max(10, min(100, int(30 + water_stress_delta)))

        # 2. Disease Outbreak Projection
        disease_risk_delta = 0.0
        if rainfall_mm >= 15.0:
            disease_risk_delta += 28.0 # Rain wetness fosters fungal sporulation
        if temperature_delta >= 3.0 and rainfall_mm > 5.0:
            disease_risk_delta += 20.0
        if pesticide_applied:
            disease_risk_delta -= 35.0

        projected_disease_risk = max(5, min(100, int(25 + disease_risk_delta)))

        # 3. Pest Pressure Projection
        pest_risk_delta = 0.0
        if 1.0 <= temperature_delta <= 5.0:
            pest_risk_delta += 22.0
        if pesticide_applied:
            pest_risk_delta -= 45.0

        projected_pest_risk = max(5, min(100, int(20 + pest_risk_delta)))

        # 4. Projected Composite Field Health
        composite_stress = (
            (projected_water_risk * 0.35) +
            (projected_disease_risk * 0.35) +
            (projected_pest_risk * 0.30)
        )
        projected_health = max(15, min(100, int(100 - (composite_stress * 0.8))))

        # 5. Yield Impact Projection (Estimated percentage reduction)
        if projected_health >= 80:
            yield_impact = 0.0
        elif projected_health >= 60:
            yield_impact = round((80 - projected_health) * 0.6, 1)
        else:
            yield_impact = round(12.0 + (60 - projected_health) * 0.9, 1)

        # 6. Natural Language Simulation Summary
        lang = str(language or "en").lower()[:2]
        if lang == "bn":
            summary = f"সিমুলেশন ফলাফল: {days_without_water} দিন সেচ না দিলে এবং {temperature_delta:+.1f}°C তাপমাত্রা বাড়লে স্বাস্থ্য সূচক {projected_health}% এ নামতে পারে। আনুমানিক ফলন ক্ষতি {yield_impact}%।"
        elif lang == "hi":
            summary = f"सिमुलेशन परिणाम: {days_without_water} दिन बिना पानी और {temperature_delta:+.1f}°C तापमान वृद्धि से फसल स्वास्थ्य {projected_health}% तक गिर सकता है। अनुमानित उपज प्रभाव {yield_impact}%।"
        else:
            summary = f"Simulation Projection: {days_without_water} days without irrigation with {temperature_delta:+.1f}°C temperature variance projects a health index of {projected_health}%. Estimated yield impact: -{yield_impact}%."

        return {
            "field_name": base_field.get("name", "Field"),
            "crop_name": crop_name,
            "crop_stage": stage,
            "inputs": {
                "days_without_water": days_without_water,
                "temperature_delta": temperature_delta,
                "rainfall_mm": rainfall_mm,
                "pesticide_applied": pesticide_applied
            },
            "baseline": {
                "health_score": base_health
            },
            "projected": {
                "health_score": projected_health,
                "water_stress_risk": projected_water_risk,
                "disease_risk": projected_disease_risk,
                "pest_risk": projected_pest_risk,
                "yield_loss_percent": yield_impact
            },
            "summary": summary
        }

digital_twin_service = DigitalTwinService()
