from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any

class AnalyzeResultPrediction(BaseModel):
    next_3_days: str = ""
    next_7_days: str = ""
    recovery_chance: Union[int, float, str] = 0
    critical_warning: Union[bool, str] = False

    model_config = {"extra": "allow"}

class AnalyzeResultData(BaseModel):
    # ── Response Status & Validation (a2.md Section 6) ──────────────────────────
    status: str = "success"                 # "success" | "uncertain" | "non_crop"
    is_agricultural: bool = True
    image_type: str = "LEAF"
    validation_status: str = "VALID"
    category: str = "disease"
    rejection_reason: Optional[str] = None
    crop_detected: bool = True
    crop_confidence: int = 90

    # ── Core diagnosis & Contract ───────────────────────────────────────────────
    crop: Optional[str] = None              # Identified crop type (e.g. "Tomato", "Rice")
    diagnosis: Optional[str] = None         # Specific diagnosis name (e.g. "Early Blight")
    condition: Optional[str] = None         # Disease / health condition name (synonymous with diagnosis)
    disease: Optional[str] = None           # Synonymous with condition
    health_status: Optional[str] = "Healthy" # "Healthy" | "Unhealthy" | "At Risk"
    severity: Optional[str] = "Low"       # "Low" | "Medium" | "High" | "Critical"
    confidence: Optional[Union[int, float, str]] = None
    risk_score: Optional[Union[int, float, str]] = 0

    # ── Actionable Guidance & Advice (a2.md Section 6) ──────────────────────────
    summary: str = ""                       # Concise diagnosis summary
    actions: List[str] = Field(default_factory=list) # Immediate prioritized actions
    water_advice: str = ""                  # Specific irrigation / water stress advice
    nutrition_advice: str = ""              # Specific nutrient / fertilizer advice
    ipm_advice: str = ""                    # Integrated pest management advice

    # ── Pest & IPM Screening ───────────────────────────────────────────────────
    is_pest_detected: bool = False
    pest_name: Optional[str] = None
    pest_type: Optional[str] = None
    ipm_recommendations: List[str] = Field(default_factory=list)
    pest_detected: Optional[str] = None          # e.g. "Aphid Infestation", "Whitefly"
    pest_confidence: int = 0                     # 0-100

    # ── Nutrient Screening ─────────────────────────────────────────────────────
    is_nutrient_deficiency: bool = False
    nutrient_name: Optional[str] = None
    nutrient_type: Optional[str] = None
    fertilizer_recommendations: List[str] = Field(default_factory=list)
    soil_test_recommendation: Optional[str] = None
    nutrient_deficiency: Optional[str] = None    # e.g. "Possible Nitrogen Deficiency"
    is_uncertain: bool = False                   # True if visual symptoms are ambiguous
    expert_review_recommended: bool = False      # True if confidence is below threshold (<65%)

    # ── Structured arrays ───────────────────────────────────────────────────────
    symptoms: List[str] = Field(default_factory=list)          # Observed visual symptoms
    possible_causes: List[str] = Field(default_factory=list)   # Why this may be happening
    immediate_actions: List[str] = Field(default_factory=list) # What to do right now
    management: List[str] = Field(default_factory=list)        # Ongoing treatment steps
    cautions: List[str] = Field(default_factory=list)          # What to avoid
    prevention_steps: List[str] = Field(default_factory=list)  # Long-term prevention
    follow_up: str = ""                                        # Re-scan / follow-up advice

    # ── Legacy single-string fields ────────────────────────────────────────────
    cause: str = ""
    treatment: str = ""
    prevention: str = ""

    # ── Environmental context ───────────────────────────────────────────────────
    terrain_insight: str = ""
    prediction: Optional[AnalyzeResultPrediction] = Field(default_factory=AnalyzeResultPrediction)

    # ── Multilingual farmer answer ──────────────────────────────────────────────
    farmer_answer: str = ""
    farmer_answer_en: str = ""
    farmer_answer_bn: str = ""
    farmer_answer_hi: str = ""

    model_config = {"extra": "allow"}

# ── Field Management Schemas (M7) ──────────────────────────────────────────────
class FieldCreate(BaseModel):
    name: str
    location_name: str = ""
    latitude: float = 22.57
    longitude: float = 88.36
    area_acres: float = 1.0
    soil_type: str = "Alluvial"
    irrigation_type: str = "Drip"
    notes: str = ""

class FieldUpdate(BaseModel):
    name: str = ""
    location_name: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    area_acres: float = 0.0
    soil_type: str = ""
    irrigation_type: str = ""
    notes: str = ""

# ── Crop Management Schemas (M3, Phase 5) ──────────────────────────────────────
class CropCreate(BaseModel):
    name: str
    variety: str = ""
    planting_date: str = ""   # ISO date string "YYYY-MM-DD"
    growth_stage: str = "Vegetative" # "Seed" | "Germination" | "Vegetative" | "Flowering" | "Fruiting" | "Harvest"
    field_name: str = ""
    field_id: str = ""
    notes: str = ""

class CropUpdate(BaseModel):
    name: str = ""
    variety: str = ""
    planting_date: str = ""
    growth_stage: str = ""
    field_name: str = ""
    field_id: str = ""
    notes: str = ""

# ── AI Assistant Schema (M10, Phase 13, a5.md Sections 6, 11, 12) ─────────────
class AssistantScanContext(BaseModel):
    id: Optional[str] = None
    crop: Optional[str] = None
    condition: Optional[str] = None
    disease: Optional[str] = None
    severity: Optional[str] = None
    confidence: Optional[Union[float, int]] = None
    field_id: Optional[str] = None
    crop_id: Optional[str] = None
    field_name: Optional[str] = None
    crop_name: Optional[str] = None
    created_at: Optional[str] = None
    observations: Optional[List[str]] = None
    possible_causes: Optional[List[str]] = None
    recommended_actions: Optional[List[str]] = None
    prevention: Optional[List[str]] = None
    result_json: Optional[Dict[str, Any]] = None

class AssistantChatRequest(BaseModel):
    message: str                                          # The farmer's question
    language: str = "en"                                  # "en" | "bn" | "hi" — response language hint
    field_id: str = ""                                    # Optional field ID to anchor discussion
    crop_id: str = ""                                     # Optional crop ID to anchor discussion
    latest_scan: Optional[AssistantScanContext] = None    # Direct authoritative latest scan from device
    recent_scans: Optional[List[AssistantScanContext]] = None # Recent completed scans from device
    context_text: Optional[str] = None                    # Structured AgriSight context block

# ── Intervention & Action Tracking Schema (Phase J) ────────────────────────────
class InterventionCreate(BaseModel):
    action_type: str = "Inspection" # "Fungicide Spray" | "Pruning" | "Irrigation" | "Fertilizer" | "Field Scouting" | "Inspection"
    action_title: str
    crop_id: str = ""
    field_id: str = ""
    notes: str = ""
    performed_at: str = ""

# ── Digital Twin Simulation Request (Phase 20) ─────────────────────────────────
class DigitalTwinSimulationRequest(BaseModel):
    field_id: str = ""
    crop_id: str = ""
    days_without_water: int = 0
    temperature_delta: float = 0.0
    rainfall_mm: float = 0.0
    pesticide_applied: bool = False
    language: str = "en"

# ── Expert Review Escalation Schema (Phase 17) ─────────────────────────────────
class ExpertEscalationCreate(BaseModel):
    scan_id: Optional[str] = None
    image_url: str = ""
    suspected_issue: str = ""
    confidence: int = 50
    farmer_note: str = ""
    field_id: str = ""
    crop_id: str = ""
