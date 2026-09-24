"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

// Common crop options as per master prompt §4
const CROP_OPTIONS = [
  { name: "Rice", emoji: "🌾", value: "Rice" },
  { name: "Maize", emoji: "🌽", value: "Maize" },
  { name: "Tomato", emoji: "🍅", value: "Tomato" },
  { name: "Potato", emoji: "🥔", value: "Potato" },
  { name: "Wheat", emoji: "🌾", value: "Wheat" },
  { name: "Cotton", emoji: "🌿", value: "Cotton" },
  { name: "Soybean", emoji: "🫛", value: "Soybean" },
  { name: "Other", emoji: "🥬", value: "Other" },
];

type Step = 1 | 2 | 3 | 4;

export default function CreateFieldPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFieldId, setCreatedFieldId] = useState<string | null>(null);
  const [createdFieldName, setCreatedFieldName] = useState<string>("");
  const [createdCropName, setCreatedCropName] = useState<string | null>(null);

  // Step 1: Field details
  const [fieldForm, setFieldForm] = useState({
    name: "",
    area_acres: "2.5",
    area_unit: "Acres",
    location_name: "",
    soil_type: "Alluvial",
    irrigation_type: "Drip",
  });

  // Step 2: Crop details
  const [cropForm, setCropForm] = useState({
    name: "",
    variety: "",
    planting_date: "",
  });
  const [skipCrop, setSkipCrop] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFieldForm((f) => ({
          ...f,
          location_name: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        }));
      },
      () => {}
    );
  };

  // Step 1 → create field
  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldForm.name.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const field = await api.createField({
        name: fieldForm.name.trim(),
        location_name: fieldForm.location_name.trim(),
        area_acres: parseFloat(fieldForm.area_acres) || 1.0,
        soil_type: fieldForm.soil_type,
        irrigation_type: fieldForm.irrigation_type,
      });
      setCreatedFieldId(field.id);
      setCreatedFieldName(field.name);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to create field.");
    } finally {
      setSaving(false);
    }
  };

  // Step 2 → add crop (or skip)
  const handleAddCrop = async (skip = false) => {
    if (!createdFieldId) return;
    setError(null);
    if (skip) {
      setSkipCrop(true);
      setStep(3);
      return;
    }
    if (!cropForm.name) {
      setError("Please select a crop.");
      return;
    }
    setSaving(true);
    try {
      await api.createCrop({
        name: cropForm.name,
        variety: cropForm.variety || undefined,
        planting_date: cropForm.planting_date || undefined,
        field_id: createdFieldId,
        field_name: createdFieldName,
      });
      setCreatedCropName(cropForm.name);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to add crop.");
    } finally {
      setSaving(false);
    }
  };

  // Step 3 → skip hardware / proceed to ready
  const handleSkipNode = () => {
    setStep(4);
  };

  // Step 4 → navigate to field
  const handleOpenField = () => {
    if (createdFieldId) {
      router.push(`/fields/${createdFieldId}`);
    }
  };

  const handleScanLeaf = () => {
    if (createdFieldId) {
      router.push(`/scan?fieldId=${createdFieldId}`);
    }
  };

  // Progress dots
  const stepLabels = [
    language === "bn" ? "জমি" : language === "hi" ? "खेत" : "Field",
    language === "bn" ? "ফসল" : language === "hi" ? "फसल" : "Crop",
    language === "bn" ? "ফিল্ড নোড" : language === "hi" ? "फील्ड नोड" : "Field Node",
    language === "bn" ? "সম্পন্ন" : language === "hi" ? "पूर्ण" : "Ready",
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-start py-8 px-4 pb-28 xl:pb-8">
      {/* Back link */}
      <div className="w-full max-w-lg mb-6">
        <Link
          href="/fields"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          {t("fields")}
        </Link>
      </div>

      {/* Progress Steps */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between">
          {stepLabels.map((label, idx) => {
            const stepNum = (idx + 1) as Step;
            const isCompleted = step > stepNum;
            const isCurrent = step === stepNum;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isCompleted
                      ? "bg-primary text-on-primary"
                      : isCurrent
                      ? "bg-primary text-on-primary ring-4 ring-primary/20"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check
                    </span>
                  ) : (
                    stepNum
                  )}
                </div>
                <span className={`text-[10px] font-black tracking-tight ${isCurrent ? "text-primary" : "text-on-surface-variant/50"}`}>
                  {label}
                </span>
                {idx < stepLabels.length - 1 && (
                  <div
                    className={`absolute h-0.5 w-full transition-all ${isCompleted ? "bg-primary" : "bg-outline-variant/30"}`}
                    style={{ display: "none" }}
                  />
                )}
              </div>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="w-full max-w-lg mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-base shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP 1: Create Field ── */}
      {step === 1 && (
        <div className="w-full max-w-lg bg-surface-container-low border border-outline-variant/30 rounded-[2.5rem] p-7 space-y-6 animate-in fade-in duration-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary mb-1">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                landscape
              </span>
              <span className="text-xs font-black uppercase tracking-widest">
                {language === "bn" ? "ধাপ ১" : language === "hi" ? "चरण १" : "Step 1"}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-on-surface">{t("fieldSetupStep1")}</h1>
            <p className="text-sm text-on-surface-variant">
              {language === "bn"
                ? "আপনার জমির নাম, আয়তন এবং অবস্থান দিন।"
                : language === "hi"
                ? "अपने खेत का नाम, क्षेत्र और स्थान दर्ज करें।"
                : "Give your field a name, size, and location."}
            </p>
          </div>

          <form onSubmit={handleCreateField} className="space-y-5">
            {/* Field name */}
            <div>
              <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-2">
                {language === "bn" ? "জমির নাম" : language === "hi" ? "खेत का नाम" : "What do you call this field?"} *
              </label>
              <input
                type="text"
                required
                placeholder={t("fieldNamePlaceholder")}
                value={fieldForm.name}
                onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                className="w-full px-4 py-3.5 bg-surface-container-high rounded-2xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 placeholder:font-medium placeholder:text-on-surface-variant/50"
              />
            </div>

            {/* Area */}
            <div>
              <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-2">
                {t("fieldAreaLabel")}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={fieldForm.area_acres}
                  onChange={(e) => setFieldForm({ ...fieldForm, area_acres: e.target.value })}
                  className="flex-1 px-4 py-3.5 bg-surface-container-high rounded-2xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                />
                <select
                  value={fieldForm.area_unit}
                  onChange={(e) => setFieldForm({ ...fieldForm, area_unit: e.target.value })}
                  className="px-4 py-3.5 bg-surface-container-high rounded-2xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                >
                  <option>Acres</option>
                  <option>Hectares</option>
                  <option>Bigha</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-2">
                {t("fieldLocationLabel")}
              </label>
              <input
                type="text"
                placeholder={language === "bn" ? "অবস্থান বা এলাকার নাম" : language === "hi" ? "स्थान का नाम" : "Location name or area"}
                value={fieldForm.location_name}
                onChange={(e) => setFieldForm({ ...fieldForm, location_name: e.target.value })}
                className="w-full px-4 py-3.5 bg-surface-container-high rounded-2xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 mb-2 placeholder:font-medium placeholder:text-on-surface-variant/50"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full py-3 border border-outline-variant/40 rounded-2xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-high flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-base">my_location</span>
                {t("useMyLocation")}
              </button>
            </div>

            <button
              type="submit"
              disabled={saving || !fieldForm.name.trim()}
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-extrabold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  {language === "bn" ? "তৈরি হচ্ছে..." : language === "hi" ? "बन रहा है..." : "Creating..."}
                </>
              ) : (
                <>
                  {language === "bn" ? "চালিয়ে যান" : language === "hi" ? "जारी रखें" : "Continue"}
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ── STEP 2: Add Crop ── */}
      {step === 2 && (
        <div className="w-full max-w-lg bg-surface-container-low border border-outline-variant/30 rounded-[2.5rem] p-7 space-y-6 animate-in fade-in duration-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary mb-1">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
              <span className="text-xs font-black uppercase tracking-widest">
                {language === "bn" ? "ধাপ ২" : language === "hi" ? "चरण २" : "Step 2"}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface">{t("fieldSetupStep2")}</h2>
            <p className="text-sm text-on-surface-variant">
              <span className="font-bold text-on-surface">🌾 {createdFieldName}</span>
            </p>
          </div>

          {/* Crop picker */}
          <div>
            <p className="text-xs font-black text-on-surface-variant uppercase tracking-wider mb-3">
              {t("whatAreYouGrowing")}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {CROP_OPTIONS.map((crop) => (
                <button
                  key={crop.value}
                  type="button"
                  onClick={() => setCropForm({ ...cropForm, name: crop.value })}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    cropForm.name === crop.value
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-surface-container-high border-outline-variant/20 text-on-surface hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl">{crop.emoji}</span>
                  <span className="font-extrabold text-sm">{crop.name}</span>
                  {cropForm.name === crop.value && (
                    <span
                      className="material-symbols-outlined text-sm ml-auto"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Variety */}
          <div>
            <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-2">
              {t("cropVarietyOptional")}
            </label>
            <input
              type="text"
              placeholder={language === "bn" ? "যেমন বাসমতি" : language === "hi" ? "जैसे बासमती" : "e.g. Basmati, Sona Masoori"}
              value={cropForm.variety}
              onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })}
              className="w-full px-4 py-3.5 bg-surface-container-high rounded-2xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 placeholder:font-medium placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Planting date */}
          <div>
            <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-2">
              {t("whenDidYouPlant")}
            </label>
            <input
              type="date"
              value={cropForm.planting_date}
              onChange={(e) => setCropForm({ ...cropForm, planting_date: e.target.value })}
              className="w-full px-4 py-3.5 bg-surface-container-high rounded-2xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              disabled={saving || !cropForm.name}
              onClick={() => handleAddCrop(false)}
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-extrabold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  {language === "bn" ? "যোগ করা হচ্ছে..." : language === "hi" ? "जोड़ा जा रहा है..." : "Adding..."}
                </>
              ) : (
                <>
                  {language === "bn" ? "চালিয়ে যান" : language === "hi" ? "जारी रखें" : "Continue"}
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleAddCrop(true)}
              className="w-full py-3.5 border border-outline-variant/30 rounded-2xl font-bold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              {t("skipForNow")}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Field Node (optional) ── */}
      {step === 3 && (
        <div className="w-full max-w-lg space-y-4 animate-in fade-in duration-300">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2.5rem] p-7 space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary mb-1">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  router
                </span>
                <span className="text-xs font-black uppercase tracking-widest">
                  {language === "bn" ? "ধাপ ৩ · ঐচ্ছিক" : language === "hi" ? "चरण ३ · वैकल्पिक" : "Step 3 · Optional"}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-on-surface">{t("fieldSetupStep3")}</h2>
              <p className="text-sm text-on-surface-variant">{t("fieldNodeDescription")}</p>
            </div>

            {/* Field Node visual */}
            <div className="bg-surface-container-high border border-outline-variant/20 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    sensors
                  </span>
                </div>
                <div>
                  <p className="font-extrabold text-on-surface text-sm">AGRISIGHT NODE</p>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {language === "bn" ? "হার্ডওয়্যার সংযুক্ত করুন" : language === "hi" ? "हार्डवेयर कनेक्ट करें" : "Connect via WiFi / Bluetooth"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {["Soil Moisture", "Temperature", "Humidity", "Soil pH"].map((sensor) => (
                  <div key={sensor} className="flex items-center gap-1.5 text-xs text-on-surface-variant font-bold">
                    <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    {sensor}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-on-surface-variant/70 font-medium text-center">
              {language === "bn"
                ? "হার্ডওয়্যার না থাকলে এখন বাদ দিন। পরে যেকোনো সময় যোগ করা যাবে।"
                : language === "hi"
                ? "हार्डवेयर न हो तो अभी छोड़ें। बाद में कभी भी जोड़ें।"
                : "Hardware is optional. You can connect a Field Node later from your Field page."}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleSkipNode}
              className="w-full py-4 bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-2xl font-bold text-sm hover:bg-surface-container-high transition-colors"
            >
              {t("skipForNow")}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Field Ready ── */}
      {step === 4 && (
        <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-400">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2.5rem] p-8 text-center space-y-6">
            {/* Success icon */}
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <span
                className="material-symbols-outlined text-4xl text-emerald-600"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-on-surface">{t("fieldReady")}</h2>
              <div className="space-y-1 text-sm text-on-surface-variant font-medium">
                <p className="text-lg font-extrabold text-on-surface">🌾 {createdFieldName}</p>
                {createdCropName && !skipCrop && (
                  <p className="font-bold text-primary">{createdCropName}</p>
                )}
                <p>{fieldForm.area_acres} {fieldForm.area_unit}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={handleOpenField}
                className="w-full py-4 bg-primary text-on-primary rounded-2xl font-extrabold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  landscape
                </span>
                {t("openField")}
              </button>
              <button
                type="button"
                onClick={handleScanLeaf}
                className="w-full py-4 bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-2xl font-bold text-sm hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  energy_savings_leaf
                </span>
                {t("scanLeaf")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
