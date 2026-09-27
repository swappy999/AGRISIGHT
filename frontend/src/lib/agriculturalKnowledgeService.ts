/**
 * AgriSight Agricultural Knowledge Service
 * Implements Section 13 of AgriSight Hardware-Ready Application Master Specification.
 *
 * Responsibilities:
 * - Deterministic, offline-first domain agronomic knowledge layer.
 * - Powers offline intelligence, validation, and AI assistant grounding.
 * - Subsystems:
 *     1. Crop Knowledge (ideal soil, pH, cycle, temperatures)
 *     2. Disease Knowledge (pathogen, symptoms, favorable weather, IPM)
 *     3. Pest Knowledge (identification, threshold, biological controls)
 *     4. Nutrition Knowledge (deficiency signs, N-P-K & micronutrient treatments)
 *     5. Irrigation Knowledge (crop water requirement, depletion thresholds)
 *     6. IPM Knowledge (Integrated Pest Management protocols)
 *     7. Growth Stages (seedling, vegetative, flowering, fruiting, maturity)
 *     8. Environmental Risk Knowledge (spore germination windows, heat stress)
 */

export interface CropProfile {
  id: string;
  name: string;
  scientificName: string;
  idealSoilTypes: string[];
  phRange: { min: number; max: number; optimal: number };
  tempRangeC: { min: number; max: number; optimal: number };
  waterNeeds: "low" | "medium" | "high" | "flooded";
  growthCycleDays: number;
  stages: {
    stage: string;
    dapRange: [number, number]; // Days After Planting
    waterSensitivity: "low" | "medium" | "high" | "critical";
    focusManagement: string;
  }[];
}

export interface DiseaseProfile {
  id: string;
  name: string;
  scientificName: string;
  affectedCrops: string[];
  pathogenType: "fungal" | "bacterial" | "viral" | "oomycete" | "nematode";
  primarySymptoms: string[];
  weatherConditions: {
    minTempC?: number;
    maxTempC?: number;
    humidityThresholdPct?: number;
    leafWetnessHoursThreshold?: number;
  };
  organicControl: string[];
  chemicalControl: string[];
  ipmProtocol: string[];
}

export interface NutrientProfile {
  nutrient: string;
  type: "macro" | "secondary" | "micronutrient";
  deficiencySymptoms: string;
  affectedLeafArea: "older_leaves" | "newer_leaves" | "entire_plant";
  correctiveAction: string;
}

export class AgriculturalKnowledgeService {
  private static crops: Record<string, CropProfile> = {
    tomato: {
      id: "tomato",
      name: "Tomato",
      scientificName: "Solanum lycopersicum",
      idealSoilTypes: ["Sandy Loam", "Loam", "Well-drained Clay Loam"],
      phRange: { min: 6.0, max: 7.0, optimal: 6.5 },
      tempRangeC: { min: 18, max: 32, optimal: 24 },
      waterNeeds: "medium",
      growthCycleDays: 110,
      stages: [
        { stage: "Seedling", dapRange: [0, 20], waterSensitivity: "medium", focusManagement: "Damping-off prevention, root establishment" },
        { stage: "Vegetative", dapRange: [21, 45], waterSensitivity: "medium", focusManagement: "Canopy development, trellising, balanced N-P-K" },
        { stage: "Flowering", dapRange: [46, 65], waterSensitivity: "critical", focusManagement: "Moisture consistency to prevent blossom drop" },
        { stage: "Fruit Development", dapRange: [66, 90], waterSensitivity: "critical", focusManagement: "Avoid irregular watering to prevent Blossom End Rot" },
        { stage: "Harvest", dapRange: [91, 120], waterSensitivity: "low", focusManagement: "Controlled irrigation to maintain brix and firmness" },
      ],
    },
    paddy: {
      id: "paddy",
      name: "Paddy / Rice",
      scientificName: "Oryza sativa",
      idealSoilTypes: ["Clay", "Clay Loam", "Silty Clay"],
      phRange: { min: 5.5, max: 7.2, optimal: 6.2 },
      tempRangeC: { min: 20, max: 36, optimal: 28 },
      waterNeeds: "flooded",
      growthCycleDays: 135,
      stages: [
        { stage: "Nursery / Seedling", dapRange: [0, 25], waterSensitivity: "medium", focusManagement: "Saturated soil, seedling vigor" },
        { stage: "Tillering", dapRange: [26, 50], waterSensitivity: "high", focusManagement: "Shallow standing water (2-3 cm) to suppress weeds" },
        { stage: "Panicle Initiation", dapRange: [51, 75], waterSensitivity: "critical", focusManagement: "Strict continuous flooding (3-5 cm)" },
        { stage: "Flowering & Milk", dapRange: [76, 100], waterSensitivity: "critical", focusManagement: "Prevent water stress to avoid empty grain (chaffiness)" },
        { stage: "Ripening & Maturity", dapRange: [101, 135], waterSensitivity: "low", focusManagement: "Drain field 10-14 days prior to harvest" },
      ],
    },
    potato: {
      id: "potato",
      name: "Potato",
      scientificName: "Solanum tuberosum",
      idealSoilTypes: ["Loose Sandy Loam", "Rich Loam"],
      phRange: { min: 5.2, max: 6.5, optimal: 5.8 },
      tempRangeC: { min: 12, max: 26, optimal: 20 },
      waterNeeds: "medium",
      growthCycleDays: 95,
      stages: [
        { stage: "Sprouting", dapRange: [0, 20], waterSensitivity: "low", focusManagement: "Moderate moisture, avoid seed-piece rot" },
        { stage: "Vegetative & Tuber Initiation", dapRange: [21, 45], waterSensitivity: "critical", focusManagement: "Earthing up, stable moisture" },
        { stage: "Tuber Bulking", dapRange: [46, 75], waterSensitivity: "critical", focusManagement: "High water demand, prevent late blight" },
        { stage: "Maturity & Skin Set", dapRange: [76, 95], waterSensitivity: "low", focusManagement: "Withhold water 10 days before harvesting" },
      ],
    },
    wheat: {
      id: "wheat",
      name: "Wheat",
      scientificName: "Triticum aestivum",
      idealSoilTypes: ["Loam", "Clay Loam"],
      phRange: { min: 6.0, max: 7.5, optimal: 6.8 },
      tempRangeC: { min: 10, max: 25, optimal: 18 },
      waterNeeds: "medium",
      growthCycleDays: 120,
      stages: [
        { stage: "CRI (Crown Root Initiation)", dapRange: [18, 25], waterSensitivity: "critical", focusManagement: "Essential first irrigation" },
        { stage: "Tillering", dapRange: [26, 45], waterSensitivity: "medium", focusManagement: "Top dressing urea" },
        { stage: "Jointing & Booting", dapRange: [46, 70], waterSensitivity: "high", focusManagement: "Second critical irrigation" },
        { stage: "Heading & Flowering", dapRange: [71, 90], waterSensitivity: "critical", focusManagement: "Grain count determination" },
        { stage: "Milk & Dough", dapRange: [91, 110], waterSensitivity: "medium", focusManagement: "Grain filling, avoid terminal heat" },
      ],
    },
  };

  private static diseases: Record<string, DiseaseProfile> = {
    early_blight: {
      id: "early_blight",
      name: "Early Blight",
      scientificName: "Alternaria solani",
      affectedCrops: ["tomato", "potato"],
      pathogenType: "fungal",
      primarySymptoms: [
        "Concentric target-board rings on older leaves",
        "Yellow chlorotic halos around dark necrotic lesions",
        "Premature defoliation starting from lower canopy",
      ],
      weatherConditions: {
        minTempC: 24,
        maxTempC: 32,
        humidityThresholdPct: 80,
        leafWetnessHoursThreshold: 3,
      },
      organicControl: [
        "Neem oil 0.5% foliar spray every 7 days",
        "Copper oxychloride 50 WP (2.5 g/L)",
        "Trichoderma viride soil application",
      ],
      chemicalControl: [
        "Mancozeb 75 WP (2 g/L) preventative",
        "Azoxystrobin 23 SC (1 ml/L) or Difenoconazole 25 EC (0.5 ml/L) curative",
      ],
      ipmProtocol: [
        "Strictly avoid overhead sprinkler irrigation; keep foliage dry",
        "Prune lower leaves touching soil line",
        "Destroy crop debris post-harvest and practice 3-year solanaceous crop rotation",
      ],
    },
    late_blight: {
      id: "late_blight",
      name: "Late Blight",
      scientificName: "Phytophthora infestans",
      affectedCrops: ["tomato", "potato"],
      pathogenType: "oomycete",
      primarySymptoms: [
        "Water-soaked irregular pale green/brown lesions",
        "White downy fungal growth on leaf undersides in high humidity",
        "Rapid collapse and blackened vine rot",
      ],
      weatherConditions: {
        minTempC: 12,
        maxTempC: 22,
        humidityThresholdPct: 90,
        leafWetnessHoursThreshold: 8,
      },
      organicControl: [
        "Bordeaux mixture 1%",
        "Copper hydroxide 2 g/L",
      ],
      chemicalControl: [
        "Metalaxyl 8% + Mancozeb 64% WP (2.5 g/L)",
        "Cymoxanil 8% + Mancozeb 64% (2 g/L)",
      ],
      ipmProtocol: [
        "Issue emergency alerts when temperatures are 15-20°C with persistent rain or fog",
        "Destroy infected plants immediately in closed bags",
      ],
    },
    bacterial_leaf_blight: {
      id: "bacterial_leaf_blight",
      name: "Bacterial Leaf Blight",
      scientificName: "Xanthomonas oryzae pv. oryzae",
      affectedCrops: ["paddy"],
      pathogenType: "bacterial",
      primarySymptoms: [
        "Wavy yellow-to-white marginal lesions starting from leaf tips",
        "Milky bacterial ooze droplets visible in early morning dew",
        "Kresek phase causing entire seedling wilting",
      ],
      weatherConditions: {
        minTempC: 25,
        maxTempC: 34,
        humidityThresholdPct: 85,
      },
      organicControl: [
        "Pseudomonas fluorescens 20 g/kg seed treatment",
        "Cow dung supernatant foliar spray",
      ],
      chemicalControl: [
        "Streptomycin sulfate + Tetracycline hydrochloride (300 ppm) combined with Copper oxychloride",
      ],
      ipmProtocol: [
        "Drain field water temporarily if outbreak occurs to reduce plant-to-plant transmission",
        "Avoid excess nitrogen fertilizer application during vegetative stage",
      ],
    },
  };

  private static nutrients: NutrientProfile[] = [
    {
      nutrient: "Nitrogen (N)",
      type: "macro",
      deficiencySymptoms: "General chlorosis starting on older leaves; stunted plant vigor; pale green hue across canopy.",
      affectedLeafArea: "older_leaves",
      correctiveAction: "Apply urea or calcium ammonium nitrate top dressing; foliar 2% urea spray.",
    },
    {
      nutrient: "Phosphorus (P)",
      type: "macro",
      deficiencySymptoms: "Purple or bronze pigmentation on leaf undersides; poor root branching; delayed flowering.",
      affectedLeafArea: "older_leaves",
      correctiveAction: "Incorporate Single Super Phosphate (SSP) or DAP banded into root zone.",
    },
    {
      nutrient: "Potassium (K)",
      type: "macro",
      deficiencySymptoms: "Marginal chlorosis turning to necrosis ('leaf burn') on older leaf edges; weak stems; poor fruit set.",
      affectedLeafArea: "older_leaves",
      correctiveAction: "Apply Muriate of Potash (MOP) or foliar Potassium Nitrate (13-0-45) @ 10 g/L.",
    },
    {
      nutrient: "Iron (Fe)",
      type: "micronutrient",
      deficiencySymptoms: "Interveinal chlorosis strictly on youngest emerging leaves; veins remain sharply dark green.",
      affectedLeafArea: "newer_leaves",
      correctiveAction: "Foliar spray of Chelated Iron (Fe-EDTA) @ 1.5 g/L in early morning.",
    },
  ];

  /**
   * Retrieves profile for a specified crop.
   */
  public static getCropProfile(cropNameOrId: string): CropProfile | null {
    const key = cropNameOrId.toLowerCase().trim();
    for (const [id, profile] of Object.entries(this.crops)) {
      if (key.includes(id) || profile.name.toLowerCase().includes(key)) {
        return profile;
      }
    }
    return null;
  }

  /**
   * Retrieves profile for a plant pathogen or disorder.
   */
  public static getDiseaseProfile(diseaseName: string): DiseaseProfile | null {
    const key = diseaseName.toLowerCase().trim();
    for (const [id, profile] of Object.entries(this.diseases)) {
      if (key.includes(id) || profile.name.toLowerCase().includes(key) || key.includes(profile.name.toLowerCase())) {
        return profile;
      }
    }
    return null;
  }

  /**
   * Returns list of nutrient deficiencies matching visual symptoms.
   */
  public static matchNutrientDeficiency(symptomText: string): NutrientProfile[] {
    const lower = symptomText.toLowerCase();
    return this.nutrients.filter(
      (n) =>
        lower.includes(n.nutrient.toLowerCase()) ||
        n.deficiencySymptoms.toLowerCase().split(" ").some((w) => w.length > 5 && lower.includes(w))
    );
  }

  /**
   * Evaluates environmental pathogen risk based on live or cached microclimate.
   */
  public static evaluatePathogenRisk(
    cropName: string,
    tempC: number,
    humidityPct: number,
    leafWetnessHours = 0
  ): { riskLevel: "low" | "medium" | "high" | "critical"; pathogens: string[]; reasoning: string[] } {
    const matchedPathogens: string[] = [];
    const reasoning: string[] = [];
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";

    const crop = this.getCropProfile(cropName);
    const cropId = crop ? crop.id : "tomato";

    for (const disease of Object.values(this.diseases)) {
      if (!disease.affectedCrops.includes(cropId)) continue;

      const cond = disease.weatherConditions;
      const tempMatch =
        (!cond.minTempC || tempC >= cond.minTempC) && (!cond.maxTempC || tempC <= cond.maxTempC);
      const humMatch = !cond.humidityThresholdPct || humidityPct >= cond.humidityThresholdPct;
      const wetMatch =
        !cond.leafWetnessHoursThreshold || leafWetnessHours >= cond.leafWetnessHoursThreshold;

      if (tempMatch && humMatch) {
        matchedPathogens.push(disease.name);
        reasoning.push(
          `${disease.name} risk elevated: Temp ${tempC}°C and Humidity ${humidityPct}% within incubation window.`
        );
        if (wetMatch && leafWetnessHours > 4) {
          riskLevel = "critical";
        } else if (riskLevel !== "critical") {
          riskLevel = "high";
        }
      } else if (humMatch || tempMatch) {
        if (riskLevel === "low") riskLevel = "medium";
      }
    }

    return { riskLevel, pathogens: matchedPathogens, reasoning };
  }
}
