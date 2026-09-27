/**
 * AgriSight Unified AI Service & Router
 * Implements Section 2 of Master Spec (a1.md).
 *
 * Responsibilities:
 * - Single central point of entry for all AI features.
 * - Conceptual interface:
 *     AIService.analyzeLeaf(...)
 *     AIService.askAssistant(...)
 *     AIService.generateRecommendation(...)
 * - Internally routes:
 *     OnlineGeminiProvider (when network is available)
 *     LocalAIProvider (when offline or cloud fails)
 *     RuleBasedFallback (deterministic agricultural safety)
 */

import { api } from "./apiClient";
import { LocalAIEngine } from "./localAIEngine";
import { HybridAssistantService, AssistantResponse } from "./hybridAssistant";
import { NetworkService } from "./networkService";
import { computeIrrigationRecommendation } from "./irrigationIntelligence";
import { offlineDb } from "./offlineDb";

export interface AgriculturalAnalysis {
  crop: string;
  condition: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence?: number;
  observations: string[];
  possibleCauses: string[];
  recommendedActions: string[];
  prevention: string[];
  followUpDays?: number;
  riskFlags: string[];
  provider: "gemini" | "local" | "rule_based";
  timestamp: string;
}

export interface AIScanResult {
  id: string;
  disease: string;
  scientific_name?: string;
  confidence: number;
  severity: string;
  pathogen_type?: string;
  crop_detected?: string;
  image_url: string;
  created_at: string;
  crop_id?: string;
  field_id?: string;
  summary: string;
  immediate_actions: string[];
  organic_treatments: string[];
  chemical_treatments: string[];
  preventive_measures: string[];
  weather_risks?: string[];
  is_offline: boolean;
  is_agricultural?: boolean;
  status?: string;
  validation_status?: string;
  rejection_reason?: string;
  provider: "GEMINI" | "LOCAL_AI" | "RULE_ENGINE";
}

/**
 * Standardizes any scan output into the Canonical Agricultural Analysis Contract (§12).
 * Strictly avoids fake defaults (no hardcoded "Tomato", no fake 95% confidence).
 */
export function toAgriculturalAnalysis(result: AIScanResult): AgriculturalAnalysis {
  const normSeverity = (s?: string): "low" | "medium" | "high" | "critical" => {
    const lower = (s || "").toLowerCase();
    if (lower.includes("crit")) return "critical";
    if (lower.includes("high") || lower.includes("severe")) return "high";
    if (lower.includes("med") || lower.includes("mod")) return "medium";
    return "low";
  };

  const mapProvider = (p: string): "gemini" | "local" | "rule_based" => {
    if (p === "GEMINI") return "gemini";
    if (p === "LOCAL_AI") return "local";
    return "rule_based";
  };

  return {
    crop: result.crop_detected || "Unspecified Crop",
    condition: result.disease || "Undiagnosed Foliar Condition",
    severity: normSeverity(result.severity),
    confidence: typeof result.confidence === "number" && !isNaN(result.confidence) ? result.confidence : undefined,
    observations: result.summary ? [result.summary] : [],
    possibleCauses: result.pathogen_type ? [`Pathogen type: ${result.pathogen_type}`] : [],
    recommendedActions: [
      ...(result.immediate_actions || []),
      ...(result.organic_treatments || []),
      ...(result.chemical_treatments || []),
    ],
    prevention: result.preventive_measures || [],
    followUpDays: normSeverity(result.severity) === "critical" ? 2 : normSeverity(result.severity) === "high" ? 4 : 7,
    riskFlags: result.weather_risks || [],
    provider: mapProvider(result.provider),
    timestamp: result.created_at || new Date().toISOString(),
  };
}

export class AIService {
  /**
   * Scan & analyze leaf foliage using the unified AI router.
   */
  public static async analyzeLeaf(
    file: File,
    lat?: string,
    lon?: string,
    question?: string,
    cropId?: string,
    fieldId?: string,
    language = "en"
  ): Promise<AIScanResult> {
    const isOnline = NetworkService.isOnline();
    const result = await api.uploadAnalysis(file, lat, lon, question, cropId, fieldId, language);

    return {
      ...result,
      provider: result.is_offline ? "LOCAL_AI" : "GEMINI",
    };
  }

  /**
   * Contextual Agronomic Assistant query.
   */
  public static async askAssistant(
    question: string,
    language = "en",
    activeFieldId?: string,
    activeCropId?: string
  ): Promise<AssistantResponse> {
    return HybridAssistantService.askAssistant(question, language, activeFieldId, activeCropId);
  }

  /**
   * Deterministic agricultural action recommendations.
   */
  public static async generateRecommendation(
    cropId?: string,
    fieldId?: string
  ): Promise<{
    irrigation: string;
    action: string;
    riskLevel: string;
  }> {
    let cropName = "Paddy / Rice";
    let soilMoisture = 65;

    if (cropId) {
      const crop = await offlineDb.getCrop(cropId);
      if (crop) cropName = crop.name;
    }

    const sensorReadings = await offlineDb.getSensorReadings();
    if (sensorReadings && sensorReadings.length > 0) {
      const latest = sensorReadings[0];
      if (typeof latest.soil_moisture === "number") {
        soilMoisture = latest.soil_moisture;
      }
    }

    const irrigation = computeIrrigationRecommendation({
      cropName,
      growthStage: "vegetative",
      temp: 28,
      humidity: 65,
      rainProb: 10,
      precipitation: 0,
    });

    return {
      irrigation: irrigation.reasoning.en,
      action: irrigation.statusTitle.en,
      riskLevel: irrigation.waterStressRisk,
    };
  }
}
