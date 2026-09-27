"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useTranslation, Language } from "@/context/LanguageContext";
import { useSpeechOutput } from "@/hooks/useSpeechOutput";
import { ProgressionData } from "@/components/ScanComparisonCard";
import { computeIrrigationRecommendation } from "@/lib/irrigationIntelligence";

// ── Types ──────────────────────────────────────────────────────────────────────
interface AnalysisData {
  id: string;
  isAgricultural: boolean;
  imageType: string;
  validationStatus: string;
  status?: string;
  diagnosis?: string;
  summary?: string;
  actions?: string[];
  waterAdvice?: string;
  nutritionAdvice?: string;
  ipmAdvice?: string;
  rejectionReason: string | null;
  crop: string;
  category?: string;
  isPestDetected?: boolean;
  pestName?: string;
  pestType?: string;
  ipmRecommendations: string[];
  isNutrientDeficiency?: boolean;
  nutrientName?: string;
  nutrientType?: string;
  fertilizerRecommendations: string[];
  soilTestRecommendation?: string;
  cropId: string | null;
  healthStatus: string;
  condition: string;
  severity: string;
  confidence: number | null;
  imageUrl: string;
  scanDate: string;
  symptoms: string[];
  possibleCauses: string[];
  immediateActions: string[];
  management: string[];
  cautions: string[];
  preventionSteps: string[];
  followUp: string;
  cause: string;
  treatment: string;
  prevention: string;
  area: string;
  farmerAnswer: string;
}

type ResultVariant = "healthy" | "disease" | "pest" | "nutrient_deficiency" | "uncertain" | "non_crop";
type ActiveDetailView = "summary" | "crop" | "disease" | "pest" | "nutrition" | "water" | "prevention" | "ipm" | "compare";

interface InnerAnalysisResult {
  is_agricultural?: boolean;
  image_type?: string;
  validation_status?: string;
  category?: string;
  is_pest_detected?: boolean;
  pest_name?: string;
  pest_type?: string;
  ipm_recommendations?: string[];
  is_nutrient_deficiency?: boolean;
  nutrient_name?: string;
  nutrient_type?: string;
  fertilizer_recommendations?: string[];
  soil_test_recommendation?: string;
  rejection_reason?: string | null;
  crop?: string;
  health_status?: string;
  condition?: string;
  disease?: string;
  severity?: string;
  confidence?: number | string | null;
  risk_score?: number | string | null;
  status?: string;
  diagnosis?: string;
  summary?: string;
  actions?: string[];
  water_advice?: string;
  nutrition_advice?: string;
  ipm_advice?: string;
  symptoms?: string[];
  possible_causes?: string[];
  immediate_actions?: string[];
  management?: string[];
  cautions?: string[];
  prevention_steps?: string[];
  follow_up?: string;
  cause?: string;
  treatment?: string;
  prevention?: string;
  terrain_insight?: string;
  farmer_answer?: string;
  farmer_answer_en?: string;
  farmer_answer_hi?: string;
  farmer_answer_bn?: string;
}

interface RawAnalysisRecord {
  id?: string;
  disease?: string;
  severity?: string;
  crop_id?: string | null;
  image_url?: string;
  created_at?: string;
  result?: InnerAnalysisResult;
  result_json?: InnerAnalysisResult;
}

// ── Data Mapping Helpers ───────────────────────────────────────────────────────
function mapAnalysis(data: RawAnalysisRecord, lang: Language = "en"): AnalysisData {
  const r: InnerAnalysisResult = data.result_json || data.result || {};

  const rawImgType = (r.image_type || "LEAF").toString().trim().toUpperCase();
  const rawValStatus = (r.validation_status || "VALID").toString().trim().toUpperCase();
  const isAgri =
    r.is_agricultural !== false &&
    r.status !== "non_crop" &&
    rawValStatus !== "NON_CROP" &&
    rawValStatus !== "REJECTED" &&
    !["HUMAN", "OBJECT", "ANIMAL", "DOCUMENT", "SCREENSHOT", "NON_CROP"].includes(rawImgType) &&
    (data.disease || "").toLowerCase() !== "non-crop image";

  const symptoms = Array.isArray(r.symptoms) && r.symptoms.length > 0 ? r.symptoms : [];
  const possibleCauses =
    Array.isArray(r.possible_causes) && r.possible_causes.length > 0
      ? r.possible_causes
      : r.cause ? [r.cause] : [];
  const immediateActions =
    Array.isArray(r.immediate_actions) && r.immediate_actions.length > 0
      ? r.immediate_actions
      : r.treatment ? [r.treatment] : [];
  const management = Array.isArray(r.management) && r.management.length > 0 ? r.management : [];
  const cautions = Array.isArray(r.cautions) && r.cautions.length > 0 ? r.cautions : [];
  const preventionSteps =
    Array.isArray(r.prevention_steps) && r.prevention_steps.length > 0
      ? r.prevention_steps
      : typeof r.prevention === "string" && r.prevention
      ? [r.prevention]
      : [];

  const isPest = Boolean(r.is_pest_detected) || r.category === "pest";
  const pestName = r.pest_name || (isPest ? (r.condition || r.disease || "Pest") : "");
  const pestType = r.pest_type || "";
  const ipmRecommendations = Array.isArray(r.ipm_recommendations) ? r.ipm_recommendations : [];

  const isNutrient =
    Boolean(r.is_nutrient_deficiency) ||
    r.category === "nutrient_deficiency" ||
    (r.condition || "").toLowerCase().includes("deficiency");

  const nutrientName =
    r.nutrient_name ||
    (isNutrient ? (r.condition || "Nutrient Deficiency").replace("Possible ", "").replace(" Deficiency", "").trim() : "");
  const nutrientType = r.nutrient_type || "";
  const fertilizerRecommendations = Array.isArray(r.fertilizer_recommendations)
    ? r.fertilizer_recommendations
    : immediateActions.length > 0 ? immediateActions : [];
  const soilTestRecommendation =
    r.soil_test_recommendation ||
    "Laboratory soil testing is strongly recommended to confirm active nutrient availability and soil pH.";

  const farmerAnswer =
    lang === "bn"
      ? (r.farmer_answer_bn || r.farmer_answer || r.farmer_answer_en || "")
      : lang === "hi"
      ? (r.farmer_answer_hi || r.farmer_answer || r.farmer_answer_en || "")
      : (r.farmer_answer || r.farmer_answer_en || "");

  const rawConf = r.confidence ?? r.risk_score;
  const confidenceScore = isAgri && typeof rawConf === "number" ? rawConf : isAgri && rawConf ? parseInt(String(rawConf), 10) : null;

  const status = r.status || (isAgri ? "success" : "non_crop");
  const diagnosis = r.diagnosis || (isAgri ? (r.disease || data.disease || r.condition || "Healthy Plant") : "Invalid Crop Image");
  const summary = r.summary || "";
  const actions = Array.isArray(r.actions) && r.actions.length > 0 ? r.actions : immediateActions;
  const waterAdvice = r.water_advice || "";
  const nutritionAdvice = r.nutrition_advice || "";
  const ipmAdvice = r.ipm_advice || "";

  return {
    id: data.id || "",
    isAgricultural: isAgri,
    imageType: rawImgType,
    validationStatus: rawValStatus,
    status,
    diagnosis,
    summary,
    actions,
    waterAdvice,
    nutritionAdvice,
    ipmAdvice,
    category: r.category || (isPest ? "pest" : isNutrient ? "nutrient_deficiency" : "disease"),
    isPestDetected: isPest,
    pestName,
    pestType,
    ipmRecommendations,
    isNutrientDeficiency: isNutrient,
    nutrientName,
    nutrientType,
    fertilizerRecommendations,
    soilTestRecommendation,
    rejectionReason: r.rejection_reason || null,
    crop: isAgri ? (r.crop || "") : "",
    cropId: isAgri ? (data.crop_id || null) : null,
    healthStatus: isAgri ? (r.health_status || "") : "",
    condition: isAgri
      ? (r.disease || data.disease || r.condition || (r.health_status === "Healthy" ? "Healthy Plant" : "Diagnosis Uncertain"))
      : "Invalid Crop Image",
    severity: isAgri ? (r.severity || data.severity || "Low") : "",
    confidence: confidenceScore,
    imageUrl:
      (typeof window !== "undefined" && data.id && sessionStorage.getItem(`agrisight_image_${data.id}`)) ||
      (data.image_url && !data.image_url.includes("1592843987019")
        ? data.image_url.startsWith("/uploads/")
          ? `/api/backend${data.image_url}`
          : data.image_url
        : "") ||
      "",
    scanDate: data.created_at || new Date().toISOString(),
    symptoms,
    possibleCauses,
    immediateActions,
    management,
    cautions,
    preventionSteps,
    followUp: r.follow_up || "",
    cause: r.cause || "",
    treatment: r.treatment || "",
    prevention: typeof r.prevention === "string" ? r.prevention : "",
    area: r.terrain_insight || "",
    farmerAnswer,
  };
}

function getVariant(analysis: AnalysisData | null): ResultVariant {
  if (!analysis) return "uncertain";
  if (
    !analysis.isAgricultural ||
    analysis.status === "non_crop" ||
    analysis.validationStatus === "NON_CROP" ||
    analysis.imageType === "HUMAN" ||
    analysis.imageType === "NON_CROP" ||
    analysis.imageType === "OBJECT" ||
    analysis.imageType === "ANIMAL" ||
    analysis.imageType === "DOCUMENT" ||
    analysis.imageType === "SCREENSHOT"
  ) {
    return "non_crop";
  }
  if (
    analysis.status === "uncertain" ||
    analysis.validationStatus === "UNCERTAIN_CROP" ||
    analysis.imageType === "UNCERTAIN" ||
    analysis.condition === "Diagnosis Uncertain" ||
    analysis.condition === "Inspection Pending"
  ) {
    return "uncertain";
  }
  if (analysis.category === "pest" || analysis.isPestDetected) {
    return "pest";
  }
  if (
    analysis.category === "nutrient_deficiency" ||
    analysis.isNutrientDeficiency ||
    (analysis.condition || "").toLowerCase().includes("deficiency")
  ) {
    return "nutrient_deficiency";
  }
  if (analysis.healthStatus === "Healthy") return "healthy";
  const cond = (analysis.condition || "").toLowerCase();
  if (cond === "healthy plant" || cond === "healthy" || cond === "no disease") return "healthy";
  if (analysis.confidence !== null && analysis.confidence < 35) return "uncertain";
  return "disease";
}

function getSeverityBadge(severity: string | undefined) {
  const s = (severity || "").toLowerCase();
  if (s === "critical" || s === "high" || s === "severe") {
    return { label: "High Risk", bg: "bg-error/15 text-error border border-error/30" };
  }
  if (s === "medium" || s === "moderate") {
    return { label: "Medium Risk", bg: "bg-amber-500/15 text-amber-900 border border-amber-500/30" };
  }
  return { label: "Low Risk", bg: "bg-primary/15 text-primary border border-primary/30" };
}

export function AnalysisDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = (params?.id as string) || searchParams?.get("id") || "";
  const router = useRouter();
  const { language, t, translateDynamic } = useTranslation();
  const speech = useSpeechOutput(language);

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [progression, setProgression] = useState<ProgressionData | null>(null);
  const [availablePriors, setAvailablePriors] = useState<Array<{ id: string; created_at: string; disease: string; severity: string; crop: string; image_url?: string }>>([]);
  const [_crops, setCrops] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparingLoading, setComparingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveDetailView>("summary");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!id || id === "preview") {
        setLoading(false);
        return;
      }

      let loadedData = false;
      try {
        const cachedStr = typeof window !== "undefined" ? sessionStorage.getItem(`agrisight_analysis_${id}`) : null;
        if (cachedStr) {
          const cachedObj = JSON.parse(cachedStr) as RawAnalysisRecord;
          setAnalysis(mapAnalysis(cachedObj, language));
          setLoading(false);
          loadedData = true;
        }
      } catch {}

      try {
        const [progData, cropsList] = await Promise.all([
          api.getAnalysisProgression(id).catch(() => null),
          api.getCrops().catch(() => []),
        ]);
        if (progData && progData.current_analysis) {
          setAnalysis(mapAnalysis(progData.current_analysis as RawAnalysisRecord, language));
          setProgression(progData.progression);
          if (Array.isArray(progData.available_prior_scans)) {
            setAvailablePriors(progData.available_prior_scans);
          }
          setError(null);
          loadedData = true;
        } else {
          const raw = await api.getAnalysis(id);
          setAnalysis(mapAnalysis(raw as RawAnalysisRecord, language));
          setError(null);
          loadedData = true;
        }

        // Resilient fallback for available prior scans if not yet loaded
        if (!progData?.available_prior_scans?.length) {
          api.getAnalyses().then((all) => {
            if (Array.isArray(all)) {
              const others = all
                .filter((s: any) => s.id !== id)
                .slice(0, 10)
                .map((s: any) => ({
                  id: s.id,
                  created_at: s.created_at,
                  disease: s.disease || "Healthy",
                  severity: s.severity || "Low",
                  crop: s.result_json?.crop || s.crop || "Crop",
                  image_url: s.image_url || "",
                }));
              setAvailablePriors(others);
            }
          }).catch(() => {});
        }

        if (Array.isArray(cropsList)) setCrops(cropsList);
      } catch (err: unknown) {
        // Resilient fallback from sessionStorage
        try {
          const cachedStr = typeof window !== "undefined" ? sessionStorage.getItem(`agrisight_analysis_${id}`) : null;
          if (cachedStr) {
            const cachedObj = JSON.parse(cachedStr) as RawAnalysisRecord;
            setAnalysis(mapAnalysis(cachedObj, language));
            setError(null);
            return;
          }
        } catch {}
        if (!loadedData) {
          setError(err instanceof Error ? err.message : "Failed to load analysis");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, language]);

  const handleSelectPriorScan = async (priorId: string) => {
    if (!analysis) return;
    try {
      setComparingLoading(true);
      const res = await api.compareAnalyses(priorId, analysis.id);
      if (res && res.comparison) {
        setProgression({
          ...res.comparison,
          previous_scan: res.previous_scan,
        });
      }
    } catch (err) {
      console.error("Comparison selection error:", err);
    } finally {
      setComparingLoading(false);
    }
  };

  // Agronomic Water & Weather Recommendation (Grounded, no fake sensors)
  const waterRecommendation = useMemo(() => {
    if (!analysis) return null;
    return computeIrrigationRecommendation({
      cropName: analysis.crop || "Crop",
      growthStage: "Vegetative",
      soilType: "Alluvial",
      temp: 29,
      humidity: 62,
      rainProb: 15,
      precipitation: 0,
      forecastRainSum: 0,
    });
  }, [analysis]);

  const variant = getVariant(analysis);
  const _isDiseased = variant === "disease";
  const isPest = variant === "pest";
  const isNutrient = variant === "nutrient_deficiency";
  const isHealthy = variant === "healthy";
  const isUncertain = variant === "uncertain";
  const isNonCrop = variant === "non_crop";

  const severityBadge = getSeverityBadge(analysis?.severity);

  // Pure derived state for localized summary and action (avoids hook order and HMR hook count issues)
  const isScriptMismatched = (() => {
    if (!analysis) return false;
    // Prefer farmer_answer in the current language if it's in the right script, else check summary
    const bestText =
      language === "bn"
        ? (analysis.farmerAnswer || analysis.summary || "")
        : language === "hi"
        ? (analysis.farmerAnswer || analysis.summary || "")
        : (analysis.summary || analysis.farmerAnswer || "");
    const textToCheck = bestText;
    if (!textToCheck) return false;
    const hasBengali = /[\u0980-\u09FF]/.test(textToCheck);
    const hasDevanagari = /[\u0900-\u097F]/.test(textToCheck);
    // If language is hi and text has Bengali but no Devanagari — wrong script
    if (language === "hi" && hasBengali && !hasDevanagari) return true;
    // If language is bn and text has Devanagari but no Bengali — wrong script
    if (language === "bn" && hasDevanagari && !hasBengali) return true;
    // If language is en and text has any non-Latin script — wrong script
    if (language === "en" && (hasBengali || hasDevanagari)) return true;
    // NEW: If language is bn/hi and text has NO non-Latin characters at all — it's plain English, needs localization
    if ((language === "bn" || language === "hi") && !hasBengali && !hasDevanagari && textToCheck.trim().length > 0) return true;
    return false;
  })();

  const displayedSummary = (() => {
    if (!analysis) return "";

    // Try the best language-specific text from the backend first
    const bestBackendText =
      language === "bn"
        ? (analysis.farmerAnswer || analysis.summary || "")
        : language === "hi"
        ? (analysis.farmerAnswer || analysis.summary || "")
        : (analysis.summary || analysis.farmerAnswer || "");

    if (!isScriptMismatched && bestBackendText) {
      return bestBackendText;
    }
    
    const crop = translateDynamic(analysis.crop || "Crop");
    const cond = translateDynamic(analysis.condition || analysis.diagnosis || "");
    const nutrient = analysis.nutrientName ? translateDynamic(analysis.nutrientName) : "";
    const severity = translateDynamic(analysis.severity || "Moderate");

    if (isHealthy) {
      if (language === "hi") return `आपकी ${crop} पूरी तरह स्वस्थ है। पत्तियों पर किसी बीमारी या कीट के लक्षण नहीं हैं।`;
      if (language === "bn") return `আপনার ${crop} সম্পূর্ণ সুস্থ রয়েছে। কোনো রোগ বা পোকার আক্রমণ দেখা যাচ্ছে না।`;
      return `Your ${crop} appears healthy with no visible signs of pest or disease damage.`;
    }

    if (isNutrient) {
      if (language === "hi") {
        return `आपकी ${crop} में ${cond} के लक्षण देखे गए हैं, जो आमतौर पर ${nutrient ? nutrient + ' की कमी और ' : ''}अनियमित सिंचाई के कारण होता है।`;
      }
      if (language === "bn") {
        return `আপনার ${crop} গাছে ${cond}-এর লক্ষণ দেখা যাচ্ছে, যা সাধারণত ${nutrient ? nutrient + '-এর অভাব এবং ' : ''}অনিয়মিত পানি সরবরাহের কারণে হয়।`;
      }
      return `Symptoms of ${cond} observed on ${crop}, typically linked to ${nutrient ? nutrient + ' deficiency and ' : ''}inconsistent soil moisture.`;
    }

    if (isPest) {
      if (language === "hi") {
        return `आपकी ${crop} में ${cond} का प्रकोप देखा गया है (${severity} जोखिम)। शीघ्र रोकथाम आवश्यक है।`;
      }
      if (language === "bn") {
        return `আপনার ${crop} গাছে ${cond}-এর আক্রমণ শনাক্ত হয়েছে (${severity} ঝুঁকি)। অবিলম্বে বিস্তার নিয়ন্ত্রণ করা প্রয়োজন।`;
      }
      return `Active ${cond} observed on ${crop} foliage (${severity} risk). Prompt pest containment is recommended.`;
    }

    if (language === "hi") {
      return `आपकी ${crop} में ${cond} के लक्षण देखे गए हैं (${severity} जोखिम)। फसल को नुकसान से बचाने के लिए समय पर उपचार आवश्यक है।`;
    }
    if (language === "bn") {
      return `আপনার ${crop} গাছে ${cond}-এর লক্ষণ চিহ্নিত হয়েছে (${severity} ঝুঁকি)। ফসলের সুরক্ষায় সময়মতো রোগ প্রতিরোধ ব্যবস্থা নিন।`;
    }
    return `Symptoms of ${cond} identified on ${crop} foliage (${severity} risk). Timely management is advised.`;
  })();

  const displayedAction = (() => {
    if (!analysis) return "";
    const rawAction = analysis.actions?.[0] || analysis.immediateActions[0];
    if (!rawAction) return "";
    
    const hasBengali = /[\u0980-\u09FF]/.test(rawAction);
    const hasDevanagari = /[\u0900-\u097F]/.test(rawAction);
    const isActionMismatched =
      (language === "hi" && hasBengali && !hasDevanagari) ||
      (language === "bn" && hasDevanagari && !hasBengali) ||
      (language === "en" && (hasBengali || hasDevanagari)) ||
      // Plain English text when a non-English language is active
      ((language === "bn" || language === "hi") && !hasBengali && !hasDevanagari && rawAction.trim().length > 0);

    if (!isActionMismatched) {
      return rawAction;
    }

    const nutrient = analysis.nutrientName ? translateDynamic(analysis.nutrientName) : "";

    if (isHealthy) {
      if (language === "hi") return "नियमित सिंचाई और संतुलित पोषण बनाए रखें।";
      if (language === "bn") return "স্বাভাবিক সেচ এবং নিয়মিত পর্যবেক্ষণ অব্যাহত রাখুন।";
      return "Maintain regular watering and balanced plant nutrition.";
    }

    if (isNutrient) {
      if (language === "hi") return `पौधों को नियमित और पर्याप्त पानी दें तथा अनुशंसित ${nutrient || "पोषक तत्वों"} का प्रयोग करें।`;
      if (language === "bn") return `নিয়মিত ও পর্যাপ্ত সেচ নিশ্চিত করুন এবং সুষম ${nutrient || "সার"} দিন।`;
      return `Ensure consistent soil moisture and apply recommended ${nutrient || "balanced nutrients"}.`;
    }

    if (isPest) {
      if (language === "hi") return "नीम तेल या अनुशंसित जैविक कीटनाशक का प्रभावित हिस्सों पर लक्षित छिड़काव करें।";
      if (language === "bn") return "আক্রান্ত অংশে নিমতেল বা অনুমোদিত জৈব বালাইনাশক স্প্রে করুন।";
      return "Apply targeted organic neem spray or approved pest management on affected foliage.";
    }

    if (language === "hi") return "संक्रमित पत्तियों को हटाएं और अनुशंसित कवकनाशी या सुरक्षात्मक उपचार करें।";
    if (language === "bn") return "আক্রান্ত পাতা অপসারণ করুন এবং অনুমোদিত ছত্রাকনাশক স্প্রে করুন।";
    return "Remove severely affected foliage and apply recommended protective treatment.";
  })();

  // Audio speech text
  const speechText = analysis
    ? (isHealthy
        ? `${analysis.crop ? `${translateDynamic(analysis.crop)}. ` : ""}${t("healthy")}. ${displayedSummary}`
        : `${analysis.crop ? `${translateDynamic(analysis.crop)}. ` : ""}${translateDynamic(analysis.condition)}. ${t("risk")}: ${translateDynamic(analysis.severity)}. ${displayedSummary} ${displayedAction ? `${t("immediateActionTitle")}: ${displayedAction}` : ""}`)
    : "";

  const handleShare = async () => {
    const url = window.location.href;
    const text = analysis ? `AgriSight: ${translateDynamic(analysis.condition)} (${analysis.severity}) — ${url}` : url;
    if (navigator.share) {
      try {
        await navigator.share({ title: "AgriSight Scan Result", text, url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied to clipboard!");
        setTimeout(() => setShareMsg(null), 2500);
      } catch {
        setShareMsg("Copy URL from address bar.");
        setTimeout(() => setShareMsg(null), 3500);
      }
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        {/* Top Bar Skeleton */}
        <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/20">
          <div className="max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-surface-container-high animate-pulse" />
              <div className="space-y-1">
                <div className="w-32 h-4 bg-surface-container-high rounded animate-pulse" />
                <div className="w-20 h-3 bg-surface-container-high rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-surface-container-high animate-pulse" />
              <div className="w-9 h-9 rounded-2xl bg-surface-container-high animate-pulse" />
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout Skeleton */}
        <main className="max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-28 xl:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-5 space-y-5">
              <div className="w-full h-72 sm:h-80 bg-surface-container-low border border-outline-variant/20 rounded-3xl animate-pulse" />
              <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/20 space-y-3 animate-pulse">
                <div className="w-24 h-4 bg-surface-container-high rounded-full" />
                <div className="w-48 h-6 bg-surface-container-high rounded" />
                <div className="w-full h-12 bg-surface-container-high rounded-xl" />
              </div>
              <div className="h-24 bg-surface-container-low border border-outline-variant/20 rounded-3xl animate-pulse" />
            </div>

            {/* Right Column Skeleton */}
            <div className="lg:col-span-7 space-y-4">
              <div className="w-52 h-5 bg-surface-container-high rounded animate-pulse mb-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="h-24 bg-surface-container-low border border-outline-variant/20 rounded-2xl animate-pulse" />
                ))}
              </div>
              <div className="h-14 bg-surface-container-low border border-outline-variant/20 rounded-2xl animate-pulse mt-4" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-error-container flex items-center justify-center">
            <span className="material-symbols-outlined text-error text-3xl">warning</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-on-surface">{t("errorOccurred")}</h2>
            <p className="text-sm text-on-surface-variant font-medium">{error || "Record not found."}</p>
          </div>
          <button onClick={() => router.push("/dashboard")} className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all">
            {t("home")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {activeView === "summary" ? (
              <Link
                href="/scan"
                aria-label="Back to scan"
                className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setActiveView("summary")}
                aria-label="Back to summary"
                className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
            )}

            <div className="min-w-0">
              <h1 className="text-base font-black text-on-surface tracking-tight truncate flex items-center gap-1.5">
                <span>{analysis.crop ? `🌿 ${translateDynamic(analysis.crop)}` : t("scanLeaf")}</span>
              </h1>
              <p className="text-[11px] text-on-surface-variant font-medium leading-none">
                {new Date(analysis.scanDate).toLocaleDateString(language, { dateStyle: "medium" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Readout */}
            {speech.isSupported && (
              <button
                type="button"
                onClick={() => (speech.isSpeaking ? speech.stop() : speech.speak(speechText))}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  speech.isSpeaking
                    ? "bg-primary text-on-primary animate-pulse"
                    : "text-on-surface-variant hover:bg-surface-container-highest"
                }`}
                title={speech.isSpeaking ? t("stopSpeaking") : !speech.hasVoiceForLanguage ? t("ttsVoiceUnavailable") : t("speak")}
                aria-label={speech.isSpeaking ? t("stopSpeaking") : t("speak")}
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {speech.isSpeaking ? "stop" : "volume_up"}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              aria-label="Share"
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-xl">share</span>
            </button>
          </div>
        </div>
      </div>

      {shareMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface px-4 py-2.5 rounded-full font-bold shadow-xl z-50 text-xs whitespace-nowrap border border-outline-variant/30 animate-in fade-in">
          {shareMsg}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          NON-CROP REJECTION VIEW (Strict Accuracy per Section 20 of a3.md)
      ═══════════════════════════════════════════════════════════════════════ */}
      {isNonCrop && (
        <div className="max-w-xl lg:max-w-2xl mx-auto px-4 py-6 pb-32 space-y-5 animate-in fade-in duration-300">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2rem] p-6 text-center space-y-4 shadow-sm">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-surface-container-low">
              {analysis.imageUrl && !imgError ? (
                <Image
                  src={analysis.imageUrl}
                  alt="Uploaded subject"
                  fill
                  className="object-cover opacity-60 grayscale-[40%]"
                  sizes="(max-width: 600px) 100vw, 600px"
                  priority
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="absolute inset-0 bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">no_photography</span>
                </div>
              )}
              <div className="absolute top-3 left-3 bg-error text-on-error text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl">
                {analysis.imageType === "HUMAN"
                  ? (language === "bn" ? "মানুষের ছবি শনাক্ত" : language === "hi" ? "मानव चित्र पहचाना गया" : "Human Detected")
                  : (language === "bn" ? "অকৃষি ছবি" : language === "hi" ? "गैर-फसल छवि" : "Non-Crop Image")}
              </div>
            </div>

            <div className="w-14 h-14 mx-auto rounded-full bg-error-container flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-3xl">no_photography</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-on-surface">
                {language === "bn" ? "অবৈধ ফসলের ছবি" : language === "hi" ? "अमान्य फसल छवि" : "Invalid Crop Image"}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed max-w-sm mx-auto">
                {analysis.farmerAnswer ||
                  (language === "bn"
                    ? "এই ছবিটি কোনো ফসল বা উদ্ভিদের নয়। সঠিক কৃষিভিত্তিক ফলাফলের জন্য অনুগ্রহ করে গাছের পাতা, কান্ড বা ফলের ছবি আপলোড করুন।"
                    : language === "hi"
                    ? "यह तस्वीर किसी फसल या पौधे की नहीं है। सटीक कृषि परिणाम के लिए कृपया पत्ती, तने या फल की फोटो अपलोड करें।"
                    : "This image does not contain a recognizable crop or plant. Please upload a clear photo of a crop leaf, stem, or fruit.")}
              </p>
            </div>

            <div className="bg-surface-container-low/70 rounded-2xl p-4 text-left text-xs space-y-1.5">
              <p className="font-extrabold text-on-surface uppercase tracking-wider text-[10px]">
                {language === "bn" ? "সঠিক স্ক্যানের নিয়মাবলী:" : language === "hi" ? "सही स्कैन के लिए सुझाव:" : "Photo Guidelines:"}
              </p>
              <ul className="space-y-1 text-on-surface-variant list-disc list-inside">
                <li>{language === "bn" ? "শুধুমাত্র ফসলের পাতা বা উদ্ভিদের অংশে ক্যামেরা ফোকাস রাখুন" : language === "hi" ? "केवल पत्ती या पौधे पर फोकस रखें" : "Focus directly on a single leaf or plant part"}</li>
                <li>{language === "bn" ? "পর্যাপ্ত প্রাকৃতিক আলোতে ছবি তুলুন" : language === "hi" ? "पर्याप्त रोशनी में फोटो लें" : "Ensure good natural lighting without heavy glare"}</li>
                <li>{language === "bn" ? "মানুষের মুখ বা ঘরের আসবাব পরিহার করুন" : language === "hi" ? "चेहरे या कमरे की फोटो न लें" : "Avoid human faces, screens, or room backgrounds"}</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/scan"
              className="flex-1 py-4 bg-primary text-on-primary font-black rounded-2xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">photo_camera</span>
              {t("reTake")}
            </Link>
            <Link
              href="/scan"
              className="flex-1 py-4 bg-surface-container-highest text-on-surface font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-dim active:scale-95 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">photo_library</span>
              {language === "bn" ? "অন্য ছবি বেছে নিন" : language === "hi" ? "दूसरी फोटो चुनें" : "Upload Another"}
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          UNCERTAIN / INCONCLUSIVE VIEW
      ═══════════════════════════════════════════════════════════════════════ */}
      {isUncertain && (
        <div className="max-w-xl lg:max-w-2xl mx-auto px-4 py-6 pb-32 space-y-5 animate-in fade-in duration-300">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2rem] p-6 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/15 text-amber-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">help</span>
            </div>
            <div className="space-y-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-900">
                {t("low")} {t("confidence")}
              </span>
              <h2 className="text-xl font-black text-on-surface">
                {language === "bn" ? "বিশ্লেষণ অনিশ্চিত" : language === "hi" ? "विश्लेषण अनिश्चित" : "Analysis Inconclusive"}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium leading-relaxed max-w-sm mx-auto">
                {(!analysis.farmerAnswer || isScriptMismatched)
                  ? (language === "bn"
                      ? "পাতার কোণ বা ছবির স্বচ্ছতা নিশ্চিত রোগ নির্ণয়ের জন্য যথেষ্ট ছিল না। একটি স্পষ্ট ও কাছের ছবি তুলুন।"
                      : language === "hi"
                      ? "पत्ती का कोण या फोटो की स्पष्टता निश्चित निदान के लिए पर्याप्त नहीं थी। कृपया एक स्पष्ट और करीब से खींची गई फोटो लें।"
                      : "The leaf angle or photo clarity was insufficient for a definitive diagnosis. Please take a closer photo.")
                  : analysis.farmerAnswer}
              </p>
            </div>
          </div>

          <Link
            href="/scan"
            className="w-full py-4 bg-primary text-on-primary font-black rounded-2xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition-all text-sm text-center"
          >
            <span className="material-symbols-outlined text-lg">photo_camera</span>
            {t("reTake")}
          </Link>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          VALID AGRICULTURAL RESULT: GIST-FIRST SUMMARY (activeView === "summary")
      ═══════════════════════════════════════════════════════════════════════ */}
      {!isNonCrop && !isUncertain && activeView === "summary" && (
        <div className="max-w-xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 py-5 pb-32 space-y-4 animate-in fade-in duration-200">
          {/* ── 2-Column Desktop Grid Layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Hero Card with Leaf Image, Gist, Immediate Action & Voice */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] overflow-hidden shadow-sm">
                {/* Image Preview with overlay */}
                <div className="relative aspect-[16/9] bg-surface-container-low">
                  {analysis.imageUrl && !imgError ? (
                    <Image
                      src={analysis.imageUrl}
                      alt={analysis.crop ? `${analysis.crop} scan` : "Analyzed leaf scan"}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 600px) 100vw, 600px"
                      priority
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-950 flex flex-col items-center justify-center p-6 text-white text-center">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-2 border border-white/20 shadow-inner">
                        <span className="material-symbols-outlined text-3xl text-emerald-300">psychiatry</span>
                      </div>
                      <p className="text-xs font-black tracking-wider uppercase text-emerald-200">
                        {translateDynamic(analysis.crop || "Agricultural Crop")}
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />

                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm text-xs font-black text-on-surface">
                    <span>{analysis.crop ? `🌿 ${translateDynamic(analysis.crop)}` : `🌿 ${t("crops")}`}</span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {analysis.confidence !== null && Number(analysis.confidence) > 0 && (
                      <span className="px-2.5 py-1.5 rounded-xl text-xs font-black tracking-wider bg-surface/90 text-on-surface backdrop-blur-md shadow-sm">
                        {analysis.confidence}% {t("confidence")}
                      </span>
                    )}
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-sm ${
                      isHealthy ? "bg-emerald-600 text-white" : severityBadge.bg
                    }`}>
                      {isHealthy ? `✓ ${t("healthy")}` : `${translateDynamic(analysis.severity)} ${t("risk")}`}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/75 drop-shadow">
                      {t("mainIssue")}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug drop-shadow-md">
                      {isHealthy
                        ? `✓ ${translateDynamic("Healthy Plant")}`
                        : isNutrient
                        ? `🧪 ${translateDynamic(analysis.diagnosis || analysis.condition)}`
                        : isPest
                        ? `🐛 ${translateDynamic(analysis.pestName || analysis.diagnosis || analysis.condition)}`
                        : `⚠ ${translateDynamic(analysis.diagnosis || analysis.condition)}`}
                    </h2>
                  </div>
                </div>

                {/* Crisp 1-Sentence Gist & Immediate Action per Section 4 */}
                <div className="p-5 space-y-3.5">
                  {/* Core Metadata Badges: Crop, Risk, and Confidence */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="px-3 py-1 bg-surface-container-high rounded-xl font-bold text-on-surface flex items-center gap-1.5">
                      <span className="text-primary font-black">🌱 {t("detectedCrop")}:</span>
                      <span>{translateDynamic(analysis.crop || "Identified Crop")}</span>
                    </div>
                    <div className="px-3 py-1 bg-surface-container-high rounded-xl font-bold text-on-surface flex items-center gap-1.5">
                      <span className="text-on-surface-variant font-black">⚠️ {t("risk")}:</span>
                      <span className={isHealthy ? "text-emerald-700" : analysis.severity?.toLowerCase() === "high" || analysis.severity?.toLowerCase() === "critical" ? "text-error" : "text-amber-800"}>
                        {isHealthy ? t("healthy") : `${translateDynamic(analysis.severity)} ${t("risk")}`}
                      </span>
                    </div>
                    {analysis.confidence !== null && Number(analysis.confidence) > 0 && (
                      <div className="px-3 py-1 bg-surface-container-high rounded-xl font-bold text-on-surface flex items-center gap-1.5">
                        <span className="text-on-surface-variant font-black">🎯 {t("confidence")}:</span>
                        <span>{analysis.confidence}%</span>
                      </div>
                    )}
                  </div>

                  {/* Short explanation */}
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">
                      {isHealthy ? "check_circle" : "info"}
                    </span>
                    <p className="text-sm font-bold text-on-surface leading-relaxed">
                      {displayedSummary}
                    </p>
                  </div>

                  {/* Immediate Action per a2.md Section 4 */}
                  {displayedAction && (
                    <div className="p-3.5 bg-primary/8 border border-primary/20 rounded-2xl flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                        bolt
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-primary">
                          {t("immediateActionTitle")}
                        </p>
                        <p className="text-xs font-bold text-on-surface leading-snug">
                          {displayedAction}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Voice Readout CTA button */}
                  {speech.isSupported && (
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => (speech.isSpeaking ? speech.stop() : speech.speak(speechText))}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold border transition-all active:scale-95 shadow-sm ${
                          speech.isSpeaking
                            ? "bg-primary text-on-primary border-primary shadow-primary/20 animate-pulse"
                            : "bg-surface-container-high text-on-surface hover:bg-primary/10 hover:text-primary border-outline-variant/30"
                        }`}
                        title={speech.isSpeaking ? t("stopSpeaking") : !speech.hasVoiceForLanguage ? t("ttsVoiceUnavailable") : t("listenExplanation")}
                        aria-label={speech.isSpeaking ? t("stopSpeaking") : t("listenExplanation")}
                      >
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {speech.isSpeaking ? "stop_circle" : "volume_up"}
                        </span>
                        <span>{speech.isSpeaking ? t("stopSpeaking") : t("listenExplanation")}</span>
                        {!speech.hasVoiceForLanguage && !speech.isSpeaking && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                            title={t("ttsVoiceUnavailable")}
                          />
                        )}
                      </button>
                    </div>
                  )}

                  <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    {t("tapToViewDetails")}:
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Category Detail Buttons Grid & Actions */}
            <div className="lg:col-span-7 space-y-4">
              {/* ── Category Detail Buttons Grid (All 7 views per a2.md Section 4) ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Crop Profile Button */}
                <button
                  id="btn-category-crop"
                  type="button"
                  onClick={() => setActiveView("crop")}
                  aria-label={`${t("btnCrop")}: ${analysis.crop ? `${translateDynamic(analysis.crop)} ${t("profile")}` : t("cropInsights")}`}
                  className="w-full bg-surface-container-lowest hover:bg-surface-container-high active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none border border-outline-variant/25 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        yard
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-on-surface">{t("btnCrop")}</h3>
                      <p className="text-xs font-semibold text-on-surface-variant truncate max-w-[170px]">
                        {analysis.crop ? `${translateDynamic(analysis.crop)} ${t("cropProfileTag")}` : t("cropInsights")}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/60 text-lg" aria-hidden="true">chevron_right</span>
                </button>

                {/* 2. Disease Button */}
                <button
                  id="btn-category-disease"
                  type="button"
                  onClick={() => setActiveView("disease")}
                  aria-label={`${t("btnDisease")}: ${isHealthy ? t("healthy") : translateDynamic(analysis.condition)}`}
                  className="w-full bg-surface-container-lowest hover:bg-surface-container-high active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none border border-outline-variant/25 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        coronavirus
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-on-surface">{t("btnDisease")}</h3>
                      <p className="text-xs font-semibold text-on-surface-variant truncate max-w-[170px]">
                        {isHealthy ? t("healthy") : translateDynamic(analysis.condition)}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/60 text-lg" aria-hidden="true">chevron_right</span>
                </button>

                {/* 3. Pest Button */}
                <button
                  id="btn-category-pest"
                  type="button"
                  onClick={() => setActiveView("pest")}
                  aria-label={`${t("btnPest")}: ${analysis.isPestDetected ? translateDynamic(analysis.pestName || "Pest Detected") : t("noActivePests")}`}
                  className="w-full bg-surface-container-lowest hover:bg-surface-container-high active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none border border-outline-variant/25 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        pest_control
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-on-surface">{t("btnPest")}</h3>
                      <p className="text-xs font-semibold text-on-surface-variant truncate max-w-[170px]">
                        {analysis.isPestDetected ? translateDynamic(analysis.pestName || "Pest Detected") : t("noActivePests")}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/60 text-lg" aria-hidden="true">chevron_right</span>
                </button>

                {/* 4. Water Button */}
                <button
                  id="btn-category-water"
                  type="button"
                  onClick={() => setActiveView("water")}
                  aria-label={`${t("btnWater")}: ${t("waterStressRisk")}: ${translateDynamic(waterRecommendation?.waterStressRisk || "Low")}`}
                  className="w-full bg-surface-container-lowest hover:bg-surface-container-high active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none border border-outline-variant/25 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        water_drop
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-on-surface">{t("btnWater")}</h3>
                      <p className="text-xs font-semibold text-on-surface-variant truncate max-w-[170px]">
                        {t("waterStressRisk")}: {translateDynamic(waterRecommendation?.waterStressRisk || "Low")}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/60 text-lg" aria-hidden="true">chevron_right</span>
                </button>

                {/* 5. Nutrition Button */}
                <button
                  id="btn-category-nutrition"
                  type="button"
                  onClick={() => setActiveView("nutrition")}
                  aria-label={`${t("btnNutrition")}: ${analysis.nutrientName ? `${language === "bn" ? "সম্ভাব্য " : language === "hi" ? "संभावित " : "Possible "}${translateDynamic(analysis.nutrientName)}` : t("soilAndFertilizer")}`}
                  className="w-full bg-surface-container-lowest hover:bg-surface-container-high active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none border border-outline-variant/25 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        science
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-on-surface">{t("btnNutrition")}</h3>
                      <p className="text-xs font-semibold text-on-surface-variant truncate max-w-[170px]">
                        {analysis.nutrientName ? `${language === "bn" ? "সম্ভাব্য " : language === "hi" ? "संभावित " : "Possible "}${translateDynamic(analysis.nutrientName)}` : t("soilAndFertilizer")}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/60 text-lg" aria-hidden="true">chevron_right</span>
                </button>

                {/* 6. IPM Button */}
                <button
                  id="btn-category-ipm"
                  type="button"
                  onClick={() => setActiveView("ipm")}
                  aria-label={`${t("btnIpm")}: ${t("priorityAction")}: ${t("preventAndControl")}`}
                  className="w-full bg-surface-container-lowest hover:bg-surface-container-high active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none border border-outline-variant/25 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        eco
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-on-surface">{t("btnIpm")}</h3>
                      <p className="text-xs font-semibold text-on-surface-variant truncate max-w-[170px]">
                        {t("priorityAction")}: {t("preventAndControl")}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/60 text-lg" aria-hidden="true">chevron_right</span>
                </button>

                {/* 7. Compare Button */}
                <button
                  id="btn-category-compare"
                  type="button"
                  onClick={() => setActiveView("compare")}
                  aria-label={`${t("btnCompare")}: ${progression?.has_previous ? translateDynamic(progression.progression_label) : t("comparePreviousScans")}`}
                  className="w-full bg-surface-container-lowest hover:bg-surface-container-high active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none border border-outline-variant/25 rounded-2xl p-4 flex items-center justify-between text-left transition-all shadow-sm col-span-full sm:col-span-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        compare
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-on-surface">{t("btnCompare")}</h3>
                      <p className="text-xs font-semibold text-on-surface-variant truncate max-w-[280px]">
                        {progression?.has_previous ? translateDynamic(progression.progression_label) : t("comparePreviousScans")}
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/60 text-lg" aria-hidden="true">chevron_right</span>
                </button>
              </div>

              {/* Bottom Actions */}
              <div className="space-y-2.5 pt-2">
                <Link
                  href={`/assistant?q=${encodeURIComponent(
                    language === "bn"
                      ? isHealthy
                        ? `আমি আমার ${analysis.crop || "ফসল"} স্ক্যান করেছি এবং এটি সুস্থ দেখাচ্ছে। নিয়মিত কী পরিচর্যা প্রয়োজন?`
                        : `আমি আমার ${analysis.crop || "ফসলে"} ${translateDynamic(analysis.condition)} (${translateDynamic(analysis.severity)} ঝুঁকি) দেখতে পেয়েছি। অবিলম্বে আমার কী করা উচিত?`
                      : language === "hi"
                      ? isHealthy
                        ? `मैंने अपनी ${analysis.crop || "फसल"} स्कैन की है और यह स्वस्थ दिख रही है। नियमित देखभाल के लिए क्या करना चाहिए?`
                        : `मेरी ${analysis.crop || "फसल"} में ${translateDynamic(analysis.condition)} (${translateDynamic(analysis.severity)} जोखिम) पाया गया है। मुझे आज क्या करना चाहिए?`
                      : isHealthy
                      ? `I scanned a ${analysis.crop || "crop"} and it looks healthy. What routine maintenance is suggested?`
                      : `I scanned my ${analysis.crop || "crop"} and it has ${analysis.condition} (${analysis.severity} severity). What should I do today?`
                  )}`}
                  className="w-full py-3.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary font-black rounded-2xl flex items-center justify-center gap-2 transition-all text-xs"
                >
                  <span className="material-symbols-outlined text-base">support_agent</span>
                  <span>{t("askAgriSight")}</span>
                </Link>

                <div className="flex gap-2">
                  <Link
                    href="/scan"
                    className="flex-1 py-3 bg-surface-container-high text-on-surface font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-dim active:scale-95 transition-all text-xs"
                  >
                    <span className="material-symbols-outlined text-base">add_a_photo</span>
                    {t("newAnalysis")}
                  </Link>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-5 py-3 bg-surface-container-high text-on-surface font-bold rounded-2xl flex items-center justify-center gap-1.5 hover:bg-surface-dim active:scale-95 transition-all text-xs"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    {language === "bn" ? "প্রিন্ট" : language === "hi" ? "प्रिंट" : "Print"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DETAIL VIEW: CROP PROFILE (Per Section 4 of a2.md)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeView === "crop" && (
        <div className="max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-5 pb-32 space-y-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] p-5 sm:p-6 space-y-5 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {t("cropProfile")}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-on-surface mt-0.5">
                  🌿 {translateDynamic(analysis.crop) || t("detectedCrop")}
                </h2>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {analysis.healthStatus ? translateDynamic(analysis.healthStatus) : (isHealthy ? t("healthy") : t("unhealthy"))}
              </span>
            </div>

            {/* Crop Details & Growing Requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-surface-container-low rounded-2xl space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-primary">psychology</span>
                  {t("detectedCrop")}
                </span>
                <p className="text-sm font-bold text-on-surface">
                  {translateDynamic(analysis.crop) || "Foliage Detected"}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {analysis.cropId ? `Crop ID: ${analysis.cropId.slice(0, 8)}...` : t("visualAiClassification")}
                </p>
              </div>

              <div className="p-3.5 bg-surface-container-low rounded-2xl space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-primary">grid_view</span>
                  {t("fieldLocation")}
                </span>
                <p className="text-sm font-bold text-on-surface">
                  {translateDynamic(analysis.area) || "Main Field"}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {new Date(analysis.scanDate).toLocaleDateString(language, { dateStyle: "long" })}
                </p>
              </div>
            </div>

            {/* Agronomic Best Practices for this crop */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">lightbulb</span>
                {t("cropCarePractices")}:
              </h3>
              <ul className="space-y-2 pl-1 text-sm font-medium text-on-surface">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>{t("optimalSunlightTitle")}:</strong> {t("optimalSunlightDesc")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>{t("soilMoistureTitle")}:</strong> {t("soilMoistureDesc")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>{t("scoutingScheduleTitle")}:</strong> {t("scoutingScheduleDesc")}</span>
                </li>
              </ul>
            </div>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => setActiveView("summary")}
              className="w-full py-3.5 bg-surface-container-highest text-on-surface font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-dim transition-all text-xs"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              {t("backToSummary")}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DETAIL VIEW 1: DISEASE / PEST (Per Section 2 in a3.md)
      ═══════════════════════════════════════════════════════════════════════ */}
      {(activeView === "disease" || activeView === "pest") && (
        <div className="max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-5 pb-32 space-y-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] p-5 sm:p-6 space-y-5 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {activeView === "pest" ? t("pestIntelligenceTitle") : t("diseaseDiagnosisTitle")}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-on-surface mt-0.5">
                  {translateDynamic(analysis.pestName || analysis.condition)}
                </h2>
              </div>
              <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${severityBadge.bg}`}>
                {translateDynamic(analysis.severity)} {t("risk")}
              </span>
            </div>

            {/* Why Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">search</span>
                {t("whyHappeningGist")}:
              </h3>
              <ul className="space-y-1.5 pl-1">
                {analysis.symptoms.length > 0 ? (
                  analysis.symptoms.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-sm font-medium text-on-surface flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm font-medium text-on-surface flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>
                      {isHealthy
                        ? t("healthyLeafFoliage")
                        : t("unhealthyLeafFoliage")}
                    </span>
                  </li>
                )}
                {analysis.possibleCauses.slice(0, 2).map((c, i) => (
                  <li key={`cause-${i}`} className="text-sm font-medium text-on-surface-variant flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What to do Section */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/15">
              <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">task_alt</span>
                {t("whatToDoGist")}:
              </h3>
              <ol className="space-y-2">
                {analysis.immediateActions.length > 0 ? (
                  analysis.immediateActions.slice(0, 3).map((act, i) => (
                    <li key={i} className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{act}</span>
                    </li>
                  ))
                ) : isHealthy ? (
                  <>
                    <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>{t("healthyCareStep1")}</span>
                    </li>
                    <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>{t("healthyCareStep2")}</span>
                    </li>
                    <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>{t("healthyCareStep3")}</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>{t("unhealthyCareStep1")}</span>
                    </li>
                    <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>{t("unhealthyCareStep2")}</span>
                    </li>
                    <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>{t("unhealthyCareStep3")}</span>
                    </li>
                  </>
                )}
              </ol>
            </div>

            {/* AI IPM Advice (a2.md Section 6) */}
            {analysis.ipmAdvice && (
              <div className="bg-emerald-600/10 border border-emerald-600/25 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-800 text-lg">eco</span>
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    {language === "bn" ? "AI সমন্বিত বালাই ব্যবস্থাপনা (IPM)" : language === "hi" ? "AI एकीकृत कीट प्रबंधन (IPM)" : "AI IPM & Biological Management"}
                  </h4>
                </div>
                <p className="text-sm font-semibold text-on-surface pl-6 leading-relaxed">
                  {analysis.ipmAdvice}
                </p>
              </div>
            )}

            {/* Cautions */}
            {analysis.cautions.length > 0 && (
              <div className="bg-error/10 border border-error/20 rounded-2xl p-3.5 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-error">⚠ {t("whatToAvoid")}:</p>
                <p className="text-xs font-semibold text-on-surface">{analysis.cautions[0]}</p>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveView("summary")}
              className="w-full py-4 bg-surface-container-high hover:bg-surface-dim active:scale-95 text-on-surface font-black rounded-2xl flex items-center justify-center gap-2 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {t("backToSummary")}
            </button>

            <Link
              href={`/assistant?q=${encodeURIComponent(
                language === "bn"
                  ? `আমার ${translateDynamic(analysis.crop) || "ফসলে"} ${translateDynamic(analysis.pestName || analysis.condition)} মোকাবিলার জন্য সংক্ষেপে ব্যবহারিক করণীয় কী?`
                  : language === "hi"
                  ? `मेरी ${translateDynamic(analysis.crop) || "फसल"} में ${translateDynamic(analysis.pestName || analysis.condition)} से बचाव के लिए संक्षिप्त उपाय क्या हैं?`
                  : `Explain what to do for ${analysis.pestName || analysis.condition} on my ${analysis.crop || "crop"}. Keep it crisp and practical.`
              )}`}
              className="w-full py-4 bg-primary text-on-primary font-black rounded-2xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition-all text-sm text-center"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                support_agent
              </span>
              {t("askAgriSight")}
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DETAIL VIEW 2: NUTRITION (Per Section 3 in a3.md)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeView === "nutrition" && (
        <div className="max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-5 pb-32 space-y-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] p-5 sm:p-6 space-y-5 shadow-sm">
            {/* Header */}
            <div className="border-b border-outline-variant/15 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                {t("nutritionSoilHealth")}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-on-surface mt-0.5">
                {t("possibleNutrientDeficiency")}
              </h2>
              <p className="text-sm font-extrabold text-emerald-900 mt-1">
                {analysis.nutrientName ? `${t("possibleNutrientDeficiency")}: ${translateDynamic(analysis.nutrientName)}` : t("foliarImbalance")}
              </p>
            </div>

            {/* AI Nutrition Guidance (a2.md Section 6) */}
            {analysis.nutritionAdvice && (
              <div className="bg-emerald-600/10 border border-emerald-600/25 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-800 text-lg">science</span>
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    {t("aiNutritionGuidance")}
                  </h4>
                </div>
                <p className="text-sm font-semibold text-on-surface pl-6 leading-relaxed">
                  {analysis.nutritionAdvice}
                </p>
              </div>
            )}

            {/* What to do Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">task_alt</span>
                {t("whatToDoGist")}:
              </h3>
              <ol className="space-y-2">
                <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/15 text-emerald-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>{t("nutritionStep1")}</span>
                </li>
                <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/15 text-emerald-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>{t("nutritionStep2")}</span>
                </li>
                {analysis.fertilizerRecommendations.length > 0 ? (
                  <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600/15 text-emerald-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>{analysis.fertilizerRecommendations[0]}</span>
                  </li>
                ) : (
                  <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600/15 text-emerald-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>{t("nutritionStep3")}</span>
                  </li>
                )}
              </ol>
            </div>

            {/* Mandatory Soil Test Safety Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-800 text-xl shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <div className="text-xs space-y-1">
                <h4 className="font-black text-amber-900 uppercase tracking-wide">
                  {t("soilTestRecommendation")}
                </h4>
                <p className="text-on-surface font-medium leading-relaxed">
                  {analysis.soilTestRecommendation || t("soilTestBannerText")}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveView("summary")}
              className="w-full py-4 bg-surface-container-high hover:bg-surface-dim active:scale-95 text-on-surface font-black rounded-2xl flex items-center justify-center gap-2 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {t("backToSummary")}
            </button>

            <Link
              href={`/assistant?q=${encodeURIComponent(
                language === "bn"
                  ? `আমার ${translateDynamic(analysis.crop || "ফসল")} ${translateDynamic(analysis.nutrientName || "পুষ্টি ঘাটতি")} নিরাপদে সমাধান করার সর্বোত্তম উপায় কী?`
                  : language === "hi"
                  ? `मेरी ${translateDynamic(analysis.crop || "फसल")} में ${translateDynamic(analysis.nutrientName || "पोषक तत्व की कमी")} को सुरक्षित रूप से दूर करने के क्या उपाय हैं?`
                  : `How can I safely treat suspected ${analysis.nutrientName || "nutrient deficiency"} on ${analysis.crop || "crop"}?`
              )}`}
              className="w-full py-4 bg-primary text-on-primary font-black rounded-2xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition-all text-sm text-center"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                support_agent
              </span>
              {t("askAgriSight")}
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DETAIL VIEW 3: WATER & IRRIGATION (Per Section 4 in a3.md)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeView === "water" && (
        <div className="max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-5 pb-32 space-y-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] p-5 sm:p-6 space-y-5 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-700">
                  {t("waterIrrigationTitle")}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-on-surface mt-0.5">
                  {t("waterStressRisk")}: {translateDynamic(waterRecommendation?.waterStressRisk || "Medium")}
                </h2>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-500/15 text-sky-800 border border-sky-500/30">
                {waterRecommendation?.statusTitle[language] || t("waterStressRisk")}
              </span>
            </div>

            {/* Today's Guidance */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
                {t("todaysGuidance")}:
              </h3>
              <p className="text-base font-black text-on-surface">
                {waterRecommendation?.status === "POSTPONE_RAIN"
                  ? t("postponeIrrigationRain")
                  : t("irrigationMayBeNeeded")}
              </p>
            </div>

            {/* AI Water Advice (a2.md Section 6) */}
            {analysis.waterAdvice && (
              <div className="bg-sky-500/10 border border-sky-500/25 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-700 text-lg">water_drop</span>
                  <h4 className="text-xs font-black text-sky-950 uppercase tracking-wider">
                    {t("aiIrrigationGuidance")}
                  </h4>
                </div>
                <p className="text-sm font-semibold text-on-surface pl-6 leading-relaxed">
                  {analysis.waterAdvice}
                </p>
              </div>
            )}

            {/* Best Window */}
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-700 text-lg">schedule</span>
                <h4 className="text-xs font-black text-sky-900 uppercase tracking-wider">{t("bestWindow")}</h4>
              </div>
              <p className="text-sm font-bold text-on-surface pl-6">
                {waterRecommendation?.recommendedWindow[language] || t("weatherReasonMorning")}
              </p>
            </div>

            {/* Why Weather Reasoning */}
            <div className="space-y-2 pt-2 border-t border-outline-variant/15">
              <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">cloud</span>
                {t("whyHappeningGist")}:
              </h3>
              <ul className="space-y-1.5 text-sm font-semibold text-on-surface pl-1">
                <li className="flex items-center gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{t("weatherReasonRain")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{t("weatherReasonTemp")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>{t("weatherReasonMorning")}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Back button */}
          <button
            type="button"
            onClick={() => setActiveView("summary")}
            className="w-full py-4 bg-surface-container-high hover:bg-surface-dim active:scale-95 text-on-surface font-black rounded-2xl flex items-center justify-center gap-2 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            {t("backToSummary")}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DETAIL VIEW 4: IPM & RESOURCE EFFICIENCY (Per Sections 6 & 9 in a4.md)
      ═══════════════════════════════════════════════════════════════════════ */}
      {(activeView === "ipm" || activeView === "prevention") && (
        <div className="max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-5 pb-32 space-y-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] p-5 sm:p-6 space-y-5 shadow-sm">
            {/* Header */}
            <div className="border-b border-outline-variant/15 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                {t("ipmTitle")}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-on-surface mt-0.5">
                {t("priorityAction")}: {t("preventAndControl")}
              </h2>
            </div>

            {/* 6-step IPM Actions Hierarchy */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-primary">checklist</span>
                {t("ipmActionChecklist")}:
              </h3>
              <ol className="space-y-2">
                <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/15 text-emerald-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>{t("ipmStep1")}</span>
                </li>
                <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/15 text-emerald-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>{t("ipmStep2")}</span>
                </li>
                <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/15 text-emerald-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>{t("ipmStep3")}</span>
                </li>
                <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/15 text-emerald-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <span>{t("ipmStep4")}</span>
                </li>
                <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/15 text-emerald-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">5</span>
                  <span>{t("ipmStep5")}</span>
                </li>
                <li className="text-sm font-semibold text-on-surface flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/15 text-emerald-900 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">6</span>
                  <span>{t("ipmStep6")}</span>
                </li>
              </ol>
            </div>

            {/* Resource Efficiency Tip Card (Section 9 of a4.md) */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-800 text-xl shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                savings
              </span>
              <div className="text-xs space-y-1">
                <h4 className="font-black text-emerald-900 uppercase tracking-wide">
                  {t("resourceTip")}
                </h4>
                <p className="text-on-surface font-medium leading-relaxed">
                  {t("ipmResourceTipDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveView("summary")}
              className="w-full py-4 bg-surface-container-high hover:bg-surface-dim active:scale-95 text-on-surface font-black rounded-2xl flex items-center justify-center gap-2 transition-all text-sm"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {t("backToSummary")}
            </button>

            <Link
              href={`/assistant?q=${encodeURIComponent(
                language === "bn"
                  ? `আমার ${translateDynamic(analysis.crop) || "ফসলে"} সমন্বিত বালাই ব্যবস্থাপনা (IPM) ও অ-রাসায়নিক নিয়ন্ত্রণ পদ্ধতি সংক্ষেপে ব্যাখ্যা করুন।`
                  : language === "hi"
                  ? `मेरी ${translateDynamic(analysis.crop) || "फसल"} के लिए सर्वोत्तम एकीकृत कीट प्रबंधन (IPM) और गैर-रासायनिक रोकथाम रणनीति क्या है?`
                  : `Explain the best Integrated Pest Management (IPM) and non-chemical containment strategy for my ${analysis.crop || "crop"}.`
              )}`}
              className="w-full py-4 bg-primary text-on-primary font-black rounded-2xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition-all text-sm text-center"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                support_agent
              </span>
              {t("askAgriSight")}
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DETAIL VIEW 5: COMPARE SCANS (Per Section 6 in a3.md)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeView === "compare" && (
        <div className="max-w-xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-5 pb-32 space-y-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] p-5 sm:p-6 space-y-5 shadow-sm">
            {/* Header */}
            <div className="border-b border-outline-variant/15 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">
                {t("comparePreviousScans")}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-on-surface mt-0.5">
                {progression?.has_previous
                  ? translateDynamic(progression.progression_label)
                  : (language === "bn" ? "প্রথম স্ক্যান রেকর্ড" : language === "hi" ? "पहला स्कैन रिकॉर्ड" : "First Scan Record")}
              </h2>
            </div>

            {/* Current vs Previous Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Current */}
              <div className="bg-surface-container-low border border-primary/20 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    {language === "bn" ? "বর্তমান স্ক্যান" : language === "hi" ? "वर्तमान स्कैन" : "Current Scan"}
                  </span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${severityBadge.bg}`}>
                    {translateDynamic(analysis.severity)}
                  </span>
                </div>

                {analysis.imageUrl && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-surface-container-highest border border-outline-variant/15">
                    <Image src={analysis.imageUrl} alt={analysis.condition} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                  </div>
                )}

                <div>
                  <p className="text-[11px] text-on-surface-variant font-semibold">
                    {new Date(analysis.scanDate).toLocaleDateString(language, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-sm font-extrabold text-on-surface truncate">
                    {translateDynamic(analysis.condition)}
                  </p>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {translateDynamic(analysis.crop)}
                  </p>
                </div>
              </div>

              {/* Previous */}
              <div className="bg-surface-container-low border border-outline-variant/25 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                    {language === "bn" ? "পূর্ববর্তী স্ক্যান" : language === "hi" ? "पिछला स्कैन" : "Previous Scan"}
                  </span>
                  {progression?.has_previous && progression.previous_scan && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-surface-container-highest text-on-surface-variant">
                      {translateDynamic(progression.previous_scan.severity || "Low")}
                    </span>
                  )}
                </div>

                {progression?.has_previous && progression.previous_scan ? (
                  <>
                    {progression.previous_scan.image_url ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden bg-surface-container-highest border border-outline-variant/15">
                        <Image src={progression.previous_scan.image_url} alt={progression.previous_scan.disease || "Previous scan"} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-xl bg-surface-container-highest border border-outline-variant/15 flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-3xl">image</span>
                      </div>
                    )}

                    <div>
                      <p className="text-[11px] text-on-surface-variant font-semibold">
                        {new Date(progression.previous_scan.created_at).toLocaleDateString(language, { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="text-sm font-extrabold text-on-surface truncate">
                        {translateDynamic(progression.previous_scan.disease || "Healthy")}
                      </p>
                      <p className="text-xs text-on-surface-variant font-medium">
                        {translateDynamic(progression.previous_scan.crop || analysis.crop)}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-3 space-y-1.5 bg-surface-container-high/30 rounded-xl border border-dashed border-outline-variant/30">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">history_toggle_off</span>
                    <p className="text-xs font-bold text-on-surface">
                      {language === "bn" ? "কোন পূর্ববর্তী স্ক্যান রেকর্ড নেই" : language === "hi" ? "कोई पिछला स्कैन रिकॉर्ड नहीं" : "No Prior Scan Auto-Linked"}
                    </p>
                    <p className="text-[11px] text-on-surface-variant font-medium max-w-[220px]">
                      {language === "bn" ? "নিচের তালিকা থেকে একটি স্ক্যান নির্বাচন করে তুলনা করুন।" : language === "hi" ? "तुलना करने के लिए नीचे दी गई सूची से एक स्कैन चुनें।" : "Select any scan below to run a direct plant comparison."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Change Indicator */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
              progression?.progression_status === "improving"
                ? "bg-emerald-500/10 border-emerald-500/30"
                : progression?.progression_status === "worsening"
                ? "bg-rose-500/10 border-rose-500/30"
                : "bg-surface-container-high/60 border-outline-variant/20"
            }`}>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                  {language === "bn" ? "স্বাস্থ্য গতিপথ / পরিবর্তন" : language === "hi" ? "स्वास्थ्य प्रक्षेपवक्र / बदलाव" : "Health Trajectory / Change"}
                </p>
                <p className="text-sm font-black text-on-surface">
                  {progression?.progression_status === "improving"
                    ? (language === "bn" ? "↓ রোগের ঝুঁকি হ্রাস পেয়েছে (উন্নতি)" : language === "hi" ? "↓ बीमारी का जोखिम कम हुआ (सुधार)" : "↓ Disease Risk Reduced (Improving)")
                    : progression?.progression_status === "worsening"
                    ? (language === "bn" ? "↑ রোগের ঝুঁকি বৃদ্ধি পেয়েছে (অবনতি)" : language === "hi" ? "↑ बीमारी का जोखिम बढ़ा (बिगड़ रहा है)" : "↑ Disease Risk Increased (Worsening)")
                    : (language === "bn" ? "→ স্থিতিশীল / কোনো বড় পরিবর্তন নেই" : language === "hi" ? "→ स्थिर / कोई बड़ा बदलाव नहीं" : "→ Stable / No Major Change")}
                </p>
                {progression?.progression_desc && (
                  <p className="text-xs text-on-surface-variant font-medium">
                    {progression.progression_desc}
                  </p>
                )}
              </div>
              <span className={`text-2xl font-black ${
                progression?.progression_status === "improving"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : progression?.progression_status === "worsening"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-on-surface-variant"
              }`}>
                {progression?.progression_status === "improving" ? "↓" : progression?.progression_status === "worsening" ? "↑" : "→"}
              </span>
            </div>

            {/* Link to Full Comparison Page */}
            <Link
              href={
                progression?.previous_scan
                  ? `/analysis/compare?scan1=${progression.previous_scan.id}&scan2=${analysis.id}`
                  : `/analysis/compare?scan2=${analysis.id}`
              }
              className="w-full py-3.5 bg-primary text-on-primary font-extrabold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all text-xs shadow-md"
            >
              <span className="material-symbols-outlined text-base">compare_arrows</span>
              <span>{t("viewFullReport")} ({t("scanComparison")})</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>

            {/* Select another prior scan from the farmer's history */}
            {availablePriors.length > 0 && (
              <div className="pt-4 border-t border-outline-variant/15 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">history</span>
                    {language === "bn" ? "অন্য স্ক্যানের সাথে তুলনা করুন" : language === "hi" ? "अन्य स्कैन के साथ तुलना करें" : "Compare With Another Scan"}
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    {language === "bn" ? "ক্লিক করে পরিবর্তন দেখুন" : language === "hi" ? "क्लिक करके बदलाव देखें" : "Click to compare"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {availablePriors.map((prior) => {
                    const isCurrentComparison = progression?.previous_scan?.id === prior.id;
                    const isPriorThreat = prior.severity === "high" || prior.severity === "critical" || prior.severity === "medium" || prior.severity === "moderate";
                    return (
                      <button
                        key={prior.id}
                        type="button"
                        disabled={comparingLoading}
                        onClick={() => handleSelectPriorScan(prior.id)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isCurrentComparison
                            ? "bg-primary/10 border-primary ring-2 ring-primary/20 shadow-xs"
                            : "bg-surface-container-high/40 hover:bg-surface-container-high border-outline-variant/20"
                        }`}
                      >
                        {prior.image_url ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-container-highest">
                            <Image src={prior.image_url} alt={prior.disease} fill className="object-cover" sizes="40px" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 text-on-surface-variant">
                            <span className="material-symbols-outlined text-base">eco</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-on-surface truncate">
                            {translateDynamic(prior.disease)}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                            <span>{new Date(prior.created_at).toLocaleDateString(language, { month: "short", day: "numeric" })}</span>
                            <span>·</span>
                            <span className={`font-black ${isPriorThreat ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {translateDynamic(prior.severity)}
                            </span>
                          </div>
                        </div>
                        {isCurrentComparison ? (
                          <span className="material-symbols-outlined text-primary text-base shrink-0">check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-on-surface-variant/40 text-base shrink-0">swap_horiz</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Back button */}
          <button
            type="button"
            onClick={() => setActiveView("summary")}
            className="w-full py-4 bg-surface-container-high hover:bg-surface-dim active:scale-95 text-on-surface font-black rounded-2xl flex items-center justify-center gap-2 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            {t("backToSummary")}
          </button>
        </div>
      )}
    </div>
  );
}
