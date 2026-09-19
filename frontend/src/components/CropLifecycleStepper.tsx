"use client";

import { useState } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { api } from "@/lib/apiClient";
import {
  CROP_LIFECYCLE_STAGES,
  LifecycleStageConfig,
  calculateDAP,
  getStageById,
} from "@/lib/cropLifecycleIntelligence";

interface CropLifecycleStepperProps {
  cropId: string;
  cropName: string;
  growthStage?: string;
  plantingDate?: string | null;
  onStageUpdated?: (newStageName: string) => void;
}

export function CropLifecycleStepper({
  cropId,
  cropName,
  growthStage,
  plantingDate,
  onStageUpdated,
}: CropLifecycleStepperProps) {
  const { language } = useTranslation();
  const [currentStageName, setCurrentStageName] = useState(growthStage || "Vegetative");
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dap = calculateDAP(plantingDate);
  const activeStage = getStageById(currentStageName);

  const currentIndex = CROP_LIFECYCLE_STAGES.findIndex((s) => s.id === activeStage.id);
  const nextStage = currentIndex < CROP_LIFECYCLE_STAGES.length - 1 ? CROP_LIFECYCLE_STAGES[currentIndex + 1] : null;

  const handleStageChange = async (targetStage: LifecycleStageConfig) => {
    try {
      setIsUpdating(true);
      await api.updateCrop(cropId, { growth_stage: targetStage.name });
      setCurrentStageName(targetStage.name);
      if (onStageUpdated) onStageUpdated(targetStage.name);
      
      const successText =
        language === "bn"
          ? `ধাপ সফলভাবে পরিবর্তন করা হয়েছে: ${targetStage.nameBn}`
          : language === "hi"
          ? `अवस्था सफलतापूर्वक अपडेट की गई: ${targetStage.nameHi}`
          : `Stage updated to: ${targetStage.name}`;
      setSuccessMessage(successText);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      console.error("Failed to update crop growth stage:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getWaterBadgeColor = (p: LifecycleStageConfig["waterPriority"]) => {
    switch (p) {
      case "Critical":
        return "bg-error/15 text-error border-error/30";
      case "High":
        return "bg-amber-500/15 text-amber-800 border-amber-500/30";
      case "Moderate":
        return "bg-primary/15 text-primary border-primary/30";
      case "Withhold / Drydown":
        return "bg-purple-500/15 text-purple-800 border-purple-500/30";
      default:
        return "bg-surface-container-highest text-on-surface-variant";
    }
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-6 lg:p-7 space-y-6 shadow-sm">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary/15 text-primary border border-primary/30 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                timeline
              </span>
              {language === "bn" ? "ফসলের জীবনচক্র ধাপ" : language === "hi" ? "फसल जीवनचक्र एवं अवस्था" : "Crop Lifecycle Intelligence"}
            </span>

            {plantingDate && (
              <span className="px-3 py-1 bg-surface-container-highest text-on-surface text-xs font-black rounded-full border border-outline-variant/20">
                {language === "bn" ? `রোপণের পর: ${dap} দিন` : language === "hi" ? `बुवाई के बाद: ${dap} दिन` : `Day ${dap} (DAP)`}
              </span>
            )}
          </div>

          <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
            {cropName} ·{" "}
            <span className="text-primary">
              {language === "bn" ? activeStage.nameBn : language === "hi" ? activeStage.nameHi : activeStage.name}
            </span>
          </h2>
        </div>

        {/* 1-Click Advance Stage Button */}
        {nextStage && (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleStageChange(nextStage)}
            className="self-start sm:self-auto px-4 py-2.5 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-primary/20 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">fast_forward</span>
            <span>
              {isUpdating
                ? language === "bn" ? "আপডেট হচ্ছে..." : language === "hi" ? "अपडेट हो रहा है..." : "Updating..."
                : language === "bn"
                ? `পরবর্তী ধাপে যান (${nextStage.nameBn})`
                : language === "hi"
                ? `अगली अवस्था में बदलें (${nextStage.nameHi})`
                : `Advance to ${nextStage.name}`}
            </span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl text-xs font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Interactive 6-Stage Visual Timeline Stepper ── */}
      <div className="space-y-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">
          {language === "bn" ? "জীবনচক্রের পর্যায়সমূহ (পরিবর্তন করতে ক্লিক করুন):" : language === "hi" ? "जीवनचक्र चरण (बदलने हेतु टैप करें):" : "Lifecycle Timeline (Click to Update Stage):"}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {CROP_LIFECYCLE_STAGES.map((s, idx) => {
            const isActive = s.id === activeStage.id;
            const isPast = idx < currentIndex;

            return (
              <button
                key={s.id}
                type="button"
                disabled={isUpdating}
                onClick={() => handleStageChange(s)}
                className={`p-3 rounded-2xl text-left transition-all border relative flex flex-col justify-between gap-2.5 ${
                  isActive
                    ? "bg-primary text-on-primary border-primary shadow-md ring-2 ring-primary/30 scale-[1.02]"
                    : isPast
                    ? "bg-surface-container-high/80 text-on-surface border-outline-variant/30 hover:bg-surface-container-highest"
                    : "bg-surface-container-lowest text-on-surface-variant/80 border-outline-variant/20 hover:bg-surface-container-high"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm ${
                      isActive
                        ? "bg-on-primary text-primary font-black"
                        : isPast
                        ? "bg-primary/20 text-primary"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isPast ? "check" : s.icon}
                    </span>
                  </span>

                  <span className={`text-[10px] font-black ${isActive ? "text-on-primary/80" : "text-on-surface-variant/60"}`}>
                    {s.dapRange[0]}-{s.dapRange[1]}d
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-black leading-snug">
                    {language === "bn" ? s.nameBn : language === "hi" ? s.nameHi : s.name}
                  </h4>
                  <p className={`text-[10px] font-semibold mt-0.5 ${isActive ? "text-on-primary/75" : "text-on-surface-variant/70"}`}>
                    ~{s.typicalDurationDays} {language === "bn" ? "দিন" : language === "hi" ? "दिन" : "days"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stage-Specific Agronomic Guidance Matrix ── */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
          <div className="space-y-0.5">
            <h3 className="text-base font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">verified</span>
              <span>
                {language === "bn"
                  ? `${activeStage.nameBn} নির্দেশিকা`
                  : language === "hi"
                  ? `${activeStage.nameHi} प्रबंधन गाइड`
                  : `${activeStage.name} Agronomic Directives`}
              </span>
            </h3>
            <p className="text-xs font-semibold text-on-surface-variant">
              {language === "bn"
                ? `প্রত্যাশিত সময়সীমা: রোপণের ${activeStage.dapRange[0]} থেকে ${activeStage.dapRange[1]} দিন`
                : language === "hi"
                ? `अपेक्षित अवधि: बुवाई के ${activeStage.dapRange[0]} से ${activeStage.dapRange[1]} दिन`
                : `Expected timeframe: Day ${activeStage.dapRange[0]} to Day ${activeStage.dapRange[1]} (DAP)`}
            </p>
          </div>

          <span className={`self-start sm:self-auto px-3.5 py-1 text-xs font-black uppercase tracking-wider rounded-full border ${getWaterBadgeColor(activeStage.waterPriority)}`}>
            {language === "bn" ? "পানির প্রয়োজনীয়তা:" : language === "hi" ? "जल प्राथमिकता:" : "Water Priority:"}{" "}
            {activeStage.waterPriority}
          </span>
        </div>

        {/* 4-Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Irrigation Guidance */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <span className="material-symbols-outlined text-sm">water_drop</span>
              <span>{language === "bn" ? "সেচ ও আর্দ্রতা নির্দেশিকা" : language === "hi" ? "सिंचाई एवं नमी प्रबंधन" : "Moisture & Irrigation Strategy"}</span>
            </div>
            <p className="text-xs text-on-surface font-medium leading-relaxed">
              {language === "bn"
                ? activeStage.waterGuidance.bn
                : language === "hi"
                ? activeStage.waterGuidance.hi
                : activeStage.waterGuidance.en}
            </p>
          </div>

          {/* 2. Nutrient Demands */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <span className="material-symbols-outlined text-sm">science</span>
                <span>{language === "bn" ? "পুষ্টি ও সার প্রয়োগ" : language === "hi" ? "पोषक तत्व व उर्वरक खुराक" : "Nutrient Target"}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-800 px-2 py-0.5 rounded-md">
                {activeStage.nutrientFocus.recommendedRatio}
              </span>
            </div>
            <p className="text-xs text-on-surface font-medium leading-relaxed">
              {language === "bn"
                ? activeStage.nutrientFocus.bn
                : language === "hi"
                ? activeStage.nutrientFocus.hi
                : activeStage.nutrientFocus.en}
            </p>
          </div>

          {/* 3. Key Pests & Disease Scouting Watchlist */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <span className="material-symbols-outlined text-sm">pest_control</span>
              <span>{language === "bn" ? "বিশেষ নজরদারি (কীটপতঙ্গ ও রোগ)" : language === "hi" ? "निरीक्षण प्राथमिकता (कीट व रोग)" : "Priority Scouting Watchlist"}</span>
            </div>
            <div className="space-y-1">
              {(language === "bn"
                ? activeStage.scoutingPriorities.bn
                : language === "hi"
                ? activeStage.scoutingPriorities.hi
                : activeStage.scoutingPriorities.en
              ).map((pest, i) => (
                <div key={i} className="text-xs font-medium text-on-surface flex items-start gap-1.5">
                  <span className="text-amber-700 font-bold">•</span>
                  <span>{pest}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Critical Warning */}
          <div className="p-4 rounded-xl bg-error/5 border border-error/20 space-y-2">
            <div className="flex items-center gap-2 text-error font-bold text-xs">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
              <span>{language === "bn" ? "গুরুত্বপূর্ণ সতর্কতা" : language === "hi" ? "अति-महत्वपूर्ण चेतावनी" : "Critical Stage Warning"}</span>
            </div>
            <p className="text-xs text-on-surface font-medium leading-relaxed">
              {language === "bn"
                ? activeStage.criticalWarnings.bn
                : language === "hi"
                ? activeStage.criticalWarnings.hi
                : activeStage.criticalWarnings.en}
            </p>
          </div>
        </div>

        {/* 5. Stage Field Task Checklist */}
        <div className="pt-2 border-t border-outline-variant/15 space-y-2.5">
          <p className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">
            {language === "bn" ? "মাঠের করণীয় চেকলিস্ট:" : language === "hi" ? "खेत प्रबंधन कार्य सूची:" : "Actionable Agronomic Checklist:"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(language === "bn"
              ? activeStage.managementChecklist.bn
              : language === "hi"
              ? activeStage.managementChecklist.hi
              : activeStage.managementChecklist.en
            ).map((task, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-container-high/50 text-xs font-medium text-on-surface">
                <span className="material-symbols-outlined text-primary text-base shrink-0">check_box</span>
                <span>{task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
