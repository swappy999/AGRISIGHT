"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { api } from "@/lib/apiClient";
import { fetchWeatherIntelligence } from "@/lib/weatherIntelligence";
import {
  computeIrrigationRecommendation,
  IrrigationRecommendation,
} from "@/lib/irrigationIntelligence";

interface SmartIrrigationCardProps {
  cropName: string;
  growthStage: string;
  fieldId?: string;
  fieldName?: string;
  soilType?: string;
  irrigationType?: string;
  cropId?: string;
  onLoggedIntervention?: () => void;
}

export function SmartIrrigationCard({
  cropName,
  growthStage,
  fieldId,
  fieldName,
  soilType = "Alluvial",
  irrigationType = "Drip",
  cropId,
  onLoggedIntervention,
}: SmartIrrigationCardProps) {
  const { language } = useTranslation();
  const [recommendation, setRecommendation] = useState<IrrigationRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);
  const [showFactors, setShowFactors] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadIrrigationContext() {
      try {
        setLoading(true);

        // Fetch live weather and recent interventions in parallel
        const [weather, interventions] = await Promise.all([
          fetchWeatherIntelligence().catch(() => null),
          api.getInterventions().catch(() => []),
        ]);

        if (cancelled) return;

        // Check if user recently logged an irrigation for this crop/field
        let lastIrrigatedHoursAgo: number | null = null;
        if (Array.isArray(interventions)) {
          const recentIrrigations = interventions
            .filter((it: any) => {
              const matchesCrop = cropId ? it.crop_id === cropId : true;
              const matchesField = fieldId ? it.field_id === fieldId : true;
              const isIrr =
                (it.action_type || "").toLowerCase().includes("irrigation") ||
                (it.action_title || "").toLowerCase().includes("water") ||
                (it.action_title || "").toLowerCase().includes("irrigation");
              return (matchesCrop || matchesField) && isIrr;
            })
            .sort(
              (a: any, b: any) =>
                new Date(b.created_at || b.performed_at).getTime() -
                new Date(a.created_at || a.performed_at).getTime()
            );

          if (recentIrrigations.length > 0) {
            const lastDate = new Date(
              recentIrrigations[0].performed_at || recentIrrigations[0].created_at
            );
            const diffMs = Date.now() - lastDate.getTime();
            lastIrrigatedHoursAgo = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
          }
        }

        const temp = weather?.temp ?? 29;
        const humidity = weather?.humidity ?? 65;
        const rainProb = weather?.rainProb ?? 10;
        const precipitation = weather?.precipitation ?? 0;
        const forecastRainSum = weather?.forecast?.reduce((acc, f) => acc + (f.precipitation || 0), 0) ?? 0;

        const rec = computeIrrigationRecommendation({
          cropName,
          growthStage,
          soilType,
          irrigationType,
          temp,
          humidity,
          rainProb,
          precipitation,
          forecastRainSum,
          lastIrrigatedHoursAgo,
        });

        setRecommendation(rec);
      } catch (err) {
        console.warn("[IRRIGATION] Calculation error", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadIrrigationContext();
    return () => {
      cancelled = true;
    };
  }, [cropName, growthStage, soilType, irrigationType, cropId, fieldId]);

  const handleLogIrrigation = async () => {
    try {
      setLogging(true);
      await api.createIntervention({
        action_type: "Irrigation",
        action_title: `Irrigation completed for ${cropName}`,
        crop_id: cropId || "",
        field_id: fieldId || "",
        notes: `Recorded smart irrigation cycle (${recommendation?.recommendedVolume.en || "Standard watering"})`,
        performed_at: new Date().toISOString(),
      });

      setLoggedSuccess(true);
      if (onLoggedIntervention) onLoggedIntervention();
      setTimeout(() => setLoggedSuccess(false), 4000);
    } catch (err) {
      console.warn("Failed to log irrigation", err);
    } finally {
      setLogging(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-container-low h-48 rounded-[2rem] animate-pulse flex items-center justify-center border border-outline-variant/20">
        <span className="material-symbols-outlined text-3xl text-primary animate-spin">water_drop</span>
      </div>
    );
  }

  if (!recommendation) return null;

  const title =
    language === "bn"
      ? recommendation.statusTitle.bn
      : language === "hi"
      ? recommendation.statusTitle.hi
      : recommendation.statusTitle.en;

  const windowText =
    language === "bn"
      ? recommendation.recommendedWindow.bn
      : language === "hi"
      ? recommendation.recommendedWindow.hi
      : recommendation.recommendedWindow.en;

  const volumeText =
    language === "bn"
      ? recommendation.recommendedVolume.bn
      : language === "hi"
      ? recommendation.recommendedVolume.hi
      : recommendation.recommendedVolume.en;

  const reasoningText =
    language === "bn"
      ? recommendation.reasoning.bn
      : language === "hi"
      ? recommendation.reasoning.hi
      : recommendation.reasoning.en;

  const isPostpone = recommendation.status === "POSTPONE_RAIN";
  const isRecommended = recommendation.status === "RECOMMENDED";

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-5 sm:p-7 space-y-5 shadow-sm">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isPostpone
                ? "bg-amber-500/15 text-amber-700"
                : isRecommended
                ? "bg-primary text-on-primary shadow-primary/20"
                : "bg-emerald-500/15 text-emerald-700"
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPostpone ? "water_damage" : "water_drop"}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-on-surface tracking-tight">
                {title}
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">
              {cropName} · {growthStage} {fieldName ? `· ${fieldName}` : ""}
            </p>
          </div>
        </div>

        {/* Estimated Water-Stress Index Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
              recommendation.waterStressRisk === "High"
                ? "bg-rose-500/15 text-rose-700 border-rose-500/30"
                : recommendation.waterStressRisk === "Moderate"
                ? "bg-amber-500/15 text-amber-700 border-amber-500/30"
                : "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
            }`}
          >
            <span className="material-symbols-outlined text-sm">speed</span>
            <span>
              {language === "bn" ? "পানির চাপ ঝুঁকি" : language === "hi" ? "जल-तनाव जोखिम" : "Water-Stress Risk"}: {recommendation.waterStressRisk}
            </span>
          </div>
        </div>
      </div>

      {/* ── Recommended Timing & Volume Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Recommended Window */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15 space-y-1 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">schedule</span>
            {language === "bn" ? "অনুকূল সেচ সময়" : language === "hi" ? "अनुशंसित समय" : "Recommended Window"}
          </p>
          <p className="text-sm font-extrabold text-on-surface">{windowText}</p>
        </div>

        {/* Recommended Application Method / Volume */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15 space-y-1 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">opacity</span>
            {language === "bn" ? "প্রয়োগ মাত্রা ও পদ্ধতি" : language === "hi" ? "मात्रा व विधि" : "Volume & Method"}
          </p>
          <p className="text-sm font-extrabold text-on-surface">{volumeText}</p>
        </div>
      </div>

      {/* ── Explainable Agronomic Rationale ── */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border-l-4 border-primary space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
              psychiatry
            </span>
            {language === "bn" ? "কৃষি বিশ্লেষণ ও কারণ" : language === "hi" ? "कृषि विश्लेषण व कारण" : "Agronomic Rationale"}
          </h4>

          <button
            type="button"
            onClick={() => setShowFactors((prev) => !prev)}
            className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-0.5"
          >
            <span>{showFactors ? (language === "bn" ? "কারণ বন্ধ করুন" : language === "hi" ? "कारक छुपाएं" : "Hide Inputs") : (language === "bn" ? "মূল কারণসমূহ" : language === "hi" ? "मुख्य कारक" : "View Factors")}</span>
            <span className={`material-symbols-outlined text-xs transition-transform ${showFactors ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-on-surface leading-relaxed">
          {reasoningText}
        </p>
      </div>

      {/* ── Transparent Factors Accordion ── */}
      {showFactors && (
        <div className="pt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {recommendation.keyFactors.map((kf, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/15 text-center space-y-0.5"
            >
              <p className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">
                {kf.label}
              </p>
              <p className="text-xs font-black text-on-surface">{kf.value}</p>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant uppercase tracking-wider inline-block">
                {kf.impact} Impact
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Log Irrigation Action Button ── */}
      <div className="pt-2 flex items-center justify-between border-t border-outline-variant/20">
        <p className="text-[11px] text-on-surface-variant font-medium">
          {language === "bn"
            ? "সেচ সম্পন্ন হলে রেকর্ড সংরক্ষণ করুন"
            : language === "hi"
            ? "सिंचाई पूरी होने पर रिकॉर्ड दर्ज करें"
            : "Record your irrigation event to maintain treatment history"}
        </p>

        {loggedSuccess ? (
          <span className="px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5 animate-in fade-in">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{language === "bn" ? "সেচ সংরক্ষিত হয়েছে" : language === "hi" ? "रिकॉर्ड सहेजा गया" : "Irrigation Logged"}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleLogIrrigation}
            disabled={logging}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">water_drop</span>
            <span>
              {logging
                ? (language === "bn" ? "সংরক্ষণ হচ্ছে..." : language === "hi" ? "सहेजा जा रहा है..." : "Logging...")
                : (language === "bn" ? "সেচ সম্পন্ন রেকর্ড করুন" : language === "hi" ? "सिंचाई दर्ज करें" : "Log Irrigation")}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
