"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { api } from "@/lib/apiClient";
import { NUTRIENT_PROFILES, NutrientProfile } from "@/lib/nutrientIntelligence";

interface NutrientAdvisoryCardProps {
  cropName: string;
  growthStage?: string;
  cropId?: string;
  fieldId?: string;
  onLoggedIntervention?: () => void;
}

export function NutrientAdvisoryCard({
  cropName,
  growthStage = "Vegetative",
  cropId,
  fieldId,
  onLoggedIntervention,
}: NutrientAdvisoryCardProps) {
  const { language } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [logging, setLogging] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  const nutrient: NutrientProfile = NUTRIENT_PROFILES[selectedIndex] || NUTRIENT_PROFILES[0];

  const title =
    language === "bn"
      ? nutrient.deficiencyTitleBn
      : language === "hi"
      ? nutrient.deficiencyTitleHi
      : nutrient.deficiencyTitleEn;

  const symptoms =
    language === "bn"
      ? nutrient.diagnosticSymptomsBn
      : language === "hi"
      ? nutrient.diagnosticSymptomsHi
      : nutrient.diagnosticSymptoms;

  const corrections =
    language === "bn"
      ? nutrient.foliarAndOrganicCorrectionBn
      : language === "hi"
      ? nutrient.foliarAndOrganicCorrectionHi
      : nutrient.foliarAndOrganicCorrection;

  const soilAdvice =
    language === "bn"
      ? nutrient.soilTestingAdviceBn
      : language === "hi"
      ? nutrient.soilTestingAdviceHi
      : nutrient.soilTestingAdvice;

  const handleLogIntervention = async () => {
    try {
      setLogging(true);
      await api.createIntervention({
        action_type: "Fertilizer / Nutrient Application",
        action_title: `Nutrient Management: ${nutrient.element} (${nutrient.symbol})`,
        crop_id: cropId || "",
        field_id: fieldId || "",
        notes: `Applied recommended foliar/organic correction for ${nutrient.element} on ${cropName}`,
        performed_at: new Date().toISOString(),
      });
      setLoggedSuccess(true);
      if (onLoggedIntervention) onLoggedIntervention();
      setTimeout(() => setLoggedSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to log nutrient intervention:", err);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-6 lg:p-7 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                science
              </span>
              {language === "bn" ? "পুষ্টি উপাদান ও সার ব্যবস্থাপনা" : language === "hi" ? "पोषक तत्व एवं उर्वरक प्रबंधन" : "Nutrient & Fertilizer Intelligence"}
            </span>

            <span className="px-2.5 py-0.5 bg-surface-container-highest text-on-surface-variant text-[11px] font-black uppercase tracking-wider rounded-full">
              {cropName} · {growthStage}
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
            {language === "bn" ? "পুষ্টি ঘাটতি নির্ণয় ও সংশোধন নির্দেশিকা" : language === "hi" ? "पोषक तत्व कमी पहचान एवं निवारण" : "Visual Deficiency Screening & Nutrition Guide"}
          </h2>
        </div>

        {/* Scan CTA */}
        <Link
          href={`/scan?crop=${encodeURIComponent(cropName)}${cropId ? `&cropId=${cropId}` : ""}`}
          className="self-start sm:self-auto px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm">photo_camera</span>
          {language === "bn" ? "পাতার পুষ্টি স্ক্যান করুন" : language === "hi" ? "पोषक तत्व जांचें" : "Scan Leaf on Camera"}
        </Link>
      </div>

      {/* Interactive Nutrient Element Selector */}
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">
          {language === "bn" ? "প্রয়োজনীয় পুষ্টি উপাদানসমূহ:" : language === "hi" ? "प्रमुख पोषक तत्व:" : "Explore Essential Crop Nutrients:"}
        </p>
        <div className="flex flex-wrap gap-2">
          {NUTRIENT_PROFILES.map((p, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-primary text-on-primary border-primary shadow-sm"
                    : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border-outline-variant/30"
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-on-primary/15 flex items-center justify-center text-[11px] font-black">
                  {p.symbol}
                </span>
                <span>{p.element}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Nutrient Details Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 space-y-5">
        {/* Title and Mobility Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 text-xs font-black rounded-lg">
                {nutrient.symbol}
              </span>
              <h3 className="text-base font-extrabold text-on-surface">{title}</h3>
            </div>
            <p className="text-xs font-semibold text-on-surface-variant mt-1">
              {language === "bn" ? "শ্রেণী:" : language === "hi" ? "श्रेणी:" : "Class:"}{" "}
              <span className="text-primary font-bold">{nutrient.category}</span>
            </p>
          </div>

          <span className="self-start sm:self-auto px-3 py-1 bg-surface-container-high text-on-surface-variant border border-outline-variant/30 rounded-full text-[11px] font-extrabold">
            {nutrient.mobility}
          </span>
        </div>

        {/* Visual Symptoms */}
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">
            {language === "bn" ? "পাতার লক্ষণ ও চেনার উপায়:" : language === "hi" ? "पहचान व दृश्य लक्षण:" : "Visual Diagnostic Signs on Foliage:"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {symptoms.map((sym, i) => (
              <div key={i} className="bg-surface-container-low p-3 rounded-xl text-xs font-medium text-on-surface flex items-start gap-2">
                <span className="text-emerald-700 font-bold">•</span>
                <span>{sym}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Foliar & Organic Correction */}
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
            {language === "bn" ? "জৈব ও ফলিয়ার সার প্রয়োগের সুপারিশ:" : language === "hi" ? "सुझाए गए जैविक व पर्णीय उर्वरक उपाय:" : "Recommended Foliar & Organic Corrections:"}
          </p>
          <div className="space-y-2">
            {corrections.map((corr, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs font-medium text-on-surface">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{corr}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Soil Testing Confirmation Safety Banner */}
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-700 text-lg shrink-0 mt-0.5">
            verified_user
          </span>
          <div className="text-xs leading-relaxed">
            <span className="font-extrabold text-amber-800 uppercase tracking-wide">
              {language === "bn" ? "মাটি পরীক্ষার সতর্কতা:" : language === "hi" ? "मृदा परीक्षण परामर्श:" : "Soil-Test Confirmation Reminder:"}{" "}
            </span>
            <span className="font-medium text-on-surface">{soilAdvice}</span>
          </div>
        </div>

        {/* 1-Click Action Logger */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-outline-variant/15">
          <button
            type="button"
            disabled={logging}
            onClick={handleLogIntervention}
            className="px-4 py-2 bg-surface-container-highest hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-sm text-primary">add_task</span>
            <span>
              {logging
                ? language === "bn" ? "রেকর্ড হচ্ছে..." : language === "hi" ? "दर्ज हो रहा है..." : "Logging..."
                : language === "bn" ? "সার প্রয়োগ রেকর্ড করুন" : language === "hi" ? "उर्वरक प्रयोग दर्ज करें" : "Log Fertilizer Application"}
            </span>
          </button>

          {loggedSuccess && (
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {language === "bn" ? "সফলভাবে রেকর্ড করা হয়েছে!" : language === "hi" ? "सफलतापूर्वक दर्ज किया गया!" : "Logged to farm history!"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
