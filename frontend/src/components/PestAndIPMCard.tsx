"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { api } from "@/lib/apiClient";
import { getCropPestProfiles, PestProfile } from "@/lib/pestIntelligence";

interface PestAndIPMCardProps {
  cropName: string;
  growthStage?: string;
  cropId?: string;
  fieldId?: string;
  onLoggedIntervention?: () => void;
}

export function PestAndIPMCard({
  cropName,
  growthStage = "Vegetative",
  cropId,
  fieldId,
  onLoggedIntervention,
}: PestAndIPMCardProps) {
  const { language } = useTranslation();
  const pestList = getCropPestProfiles(cropName);
  const [selectedPestIndex, setSelectedPestIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"biological" | "mechanical" | "chemical">("biological");
  const [logging, setLogging] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);

  const pest: PestProfile = pestList[selectedPestIndex] || pestList[0];

  const pestName =
    language === "bn" ? pest.nameBn : language === "hi" ? pest.nameHi : pest.name;

  const symptoms =
    language === "bn" ? pest.symptomsBn : language === "hi" ? pest.symptomsHi : pest.symptoms;

  const etl =
    language === "bn"
      ? pest.economicThresholdBn
      : language === "hi"
      ? pest.economicThresholdHi
      : pest.economicThreshold;

  const biological =
    language === "bn"
      ? pest.ipmProtocol.biologicalBn
      : language === "hi"
      ? pest.ipmProtocol.biologicalHi
      : pest.ipmProtocol.biological;

  const mechanical =
    language === "bn"
      ? pest.ipmProtocol.mechanicalBn
      : language === "hi"
      ? pest.ipmProtocol.mechanicalHi
      : pest.ipmProtocol.mechanical;

  const chemical =
    language === "bn"
      ? pest.ipmProtocol.chemicalSafeguardBn
      : language === "hi"
      ? pest.ipmProtocol.chemicalSafeguardHi
      : pest.ipmProtocol.chemicalSafeguard;

  const pollinatorCaution =
    language === "bn"
      ? pest.ipmProtocol.pollinatorCautionBn
      : language === "hi"
      ? pest.ipmProtocol.pollinatorCautionHi
      : pest.ipmProtocol.pollinatorCaution;

  const handleLogIntervention = async (type: string, title: string) => {
    try {
      setLogging(true);
      await api.createIntervention({
        action_type: type === "biological" ? "Bio-Pesticide / Neem Spray" : type === "mechanical" ? "Pheromone / Sticky Trap" : "Targeted IPM Treatment",
        action_title: `IPM Measure: ${pest.name} (${type})`,
        crop_id: cropId || "",
        field_id: fieldId || "",
        notes: `Applied IPM measure for ${pest.name}: ${title}`,
        performed_at: new Date().toISOString(),
      });
      setLoggedSuccess(true);
      if (onLoggedIntervention) onLoggedIntervention();
      setTimeout(() => setLoggedSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to log pest control intervention:", err);
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
            <span className="px-3 py-1 bg-amber-500/15 text-amber-800 border border-amber-500/30 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                pest_control
              </span>
              {language === "bn" ? "কীটপতঙ্গ ও সমন্বিত বালাই দমন (IPM)" : language === "hi" ? "कीट एवं एकीकृत प्रबंधन (IPM)" : "Pest & IPM Intelligence"}
            </span>

            <span className="px-2.5 py-0.5 bg-surface-container-highest text-on-surface-variant text-[11px] font-black uppercase tracking-wider rounded-full">
              {cropName}
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
            {language === "bn" ? "প্রতিরোধ ও সমন্বিত দমন নির্দেশিকা" : language === "hi" ? "कीट निवारण एवं संपूर्ण IPM मार्गदर्शिका" : "Crop Pest Advisory & IPM Playbook"}
          </h2>
        </div>

        {/* Scan CTA */}
        <Link
          href={`/scan?crop=${encodeURIComponent(cropName)}${cropId ? `&cropId=${cropId}` : ""}`}
          className="self-start sm:self-auto px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm">photo_camera</span>
          {language === "bn" ? "পোকা স্ক্যান করুন" : language === "hi" ? "कीट फोटो स्कैन करें" : "Scan Pests on Camera"}
        </Link>
      </div>

      {/* Interactive Pest Selector Pills */}
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">
          {language === "bn" ? "ফসল সুরক্ষার প্রধান কীটসমূহ:" : language === "hi" ? "फसल के प्रमुख कीट:" : "Major Threat Pests for This Crop:"}
        </p>
        <div className="flex flex-wrap gap-2">
          {pestList.map((p, idx) => {
            const isSelected = idx === selectedPestIndex;
            const pName = language === "bn" ? p.nameBn : language === "hi" ? p.nameHi : p.name;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPestIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-primary text-on-primary border-primary shadow-sm"
                    : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border-outline-variant/30"
                }`}
              >
                <span>🐛</span>
                <span>{pName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? "bg-on-primary/20 text-on-primary" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {p.pestType}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Pest Deep-Dive Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 space-y-4">
        {/* Pest Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-on-surface">{pestName}</h3>
              <span className="text-xs text-on-surface-variant/60 italic">({pest.scientificName})</span>
            </div>
            <p className="text-xs font-semibold text-on-surface-variant mt-0.5">
              {language === "bn" ? "সংবেদনশীল পর্যায়:" : language === "hi" ? "संवेदनशील अवस्थाएं:" : "Critical Stages:"}{" "}
              <span className="text-primary font-bold">{pest.growthStagesAtRisk.join(", ")}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant">
              {language === "bn" ? "আবহাওয়া প্রভাব:" : language === "hi" ? "मौसम जोखिम:" : "Weather Trigger:"}
            </span>
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-800 border border-amber-500/20 rounded-lg text-xs font-bold">
              {pest.favorableWeather.tempRange}
            </span>
          </div>
        </div>

        {/* Observed Symptoms */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">
            {language === "bn" ? "গাছের লক্ষণ ও চেনার উপায়:" : language === "hi" ? "लक्षण व पहचान:" : "Diagnostic Field Signs:"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {symptoms.map((sym, i) => (
              <div key={i} className="bg-surface-container-low p-2.5 rounded-xl text-xs font-medium text-on-surface flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>{sym}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Economic Threshold (ETL) Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            balance
          </span>
          <div className="text-xs">
            <span className="font-extrabold text-primary uppercase tracking-wide">
              {language === "bn" ? "অর্থনৈতিক ক্ষতি সীমা (ETL):" : language === "hi" ? "आर्थिक नुकसान सीमा (ETL):" : "Economic Threshold Level (ETL):"}{" "}
            </span>
            <span className="font-medium text-on-surface">{etl}</span>
          </div>
        </div>

        {/* IPM 3-Tier Strategy Tabs */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 border-b border-outline-variant/15 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("biological")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "biological"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>🌿</span>
              <span>{language === "bn" ? "জৈবিক ও প্রাকৃতিক" : language === "hi" ? "जैविक व मित्र कीट" : "Biological & Organic"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("mechanical")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "mechanical"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>🪤</span>
              <span>{language === "bn" ? "ফাঁদ ও দমন ব্যবস্থা" : language === "hi" ? "ट्रैप व यांत्रिक" : "Traps & Cultural"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("chemical")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "chemical"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span>🧪</span>
              <span>{language === "bn" ? "নিরাপদ রাসায়নিক" : language === "hi" ? "सुरक्षित रासायनिक" : "Chemical Safeguards"}</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="space-y-2">
            {activeTab === "biological" && (
              <div className="space-y-2">
                {biological.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-surface-container-low text-xs font-medium text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "mechanical" && (
              <div className="space-y-2">
                {mechanical.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-surface-container-low text-xs font-medium text-on-surface">
                    <span className="w-5 h-5 rounded-full bg-tertiary/15 text-tertiary font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "chemical" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {chemical.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-surface-container-low text-xs font-medium text-on-surface">
                      <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {pollinatorCaution && (
                  <div className="p-2.5 rounded-xl bg-error-container/40 border border-error/20 flex items-start gap-2 text-xs font-semibold text-error">
                    <span className="material-symbols-outlined text-sm shrink-0">warning</span>
                    <span>{pollinatorCaution}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 1-Click Action Logger */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-outline-variant/15">
          <button
            type="button"
            disabled={logging}
            onClick={() => handleLogIntervention(activeTab, pest.name)}
            className="px-4 py-2 bg-surface-container-highest hover:bg-surface-container text-on-surface font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-sm text-primary">add_task</span>
            <span>
              {logging
                ? language === "bn" ? "রেকর্ড হচ্ছে..." : language === "hi" ? "दर्ज हो रहा है..." : "Logging..."
                : language === "bn" ? "বালাই দমন রেকর্ড করুন" : language === "hi" ? "IPM छिड़काव दर्ज करें" : "Log IPM Treatment Applied"}
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
