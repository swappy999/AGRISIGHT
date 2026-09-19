"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { api } from "@/lib/apiClient";

interface DigitalTwinSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  initialFieldId?: string;
  initialCropId?: string;
}

export function DigitalTwinSimulator({
  isOpen,
  onClose,
  initialFieldId,
  initialCropId,
}: DigitalTwinSimulatorProps) {
  const { language, t } = useTranslation();

  const [fields, setFields] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>(initialFieldId || "");
  const [selectedCropId, setSelectedCropId] = useState<string>(initialCropId || "");

  // Simulation Sliders
  const [daysWithoutWater, setDaysWithoutWater] = useState<number>(2);
  const [temperatureDelta, setTemperatureDelta] = useState<number>(2);
  const [rainfallMm, setRainfallMm] = useState<number>(0);
  const [pesticideApplied, setPesticideApplied] = useState<boolean>(false);

  // Result state
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        setLoadingContext(true);
        const [fList, cList] = await Promise.all([
          api.getFields().catch(() => []),
          api.getCrops().catch(() => []),
        ]);
        setFields(fList);
        setCrops(cList);

        if (!selectedFieldId && fList.length > 0) {
          setSelectedFieldId(fList[0].id);
        }
        if (!selectedCropId && cList.length > 0) {
          setSelectedCropId(cList[0].id);
        }
      } catch (err) {
        console.warn("Failed to load digital twin context", err);
      } finally {
        setLoadingContext(false);
      }
    }

    loadData();
  }, [isOpen]);

  const handleRunSimulation = async () => {
    try {
      setSimulating(true);
      const res = await api.simulateDigitalTwin({
        field_id: selectedFieldId,
        crop_id: selectedCropId,
        days_without_water: daysWithoutWater,
        temperature_delta: temperatureDelta,
        rainfall_mm: rainfallMm,
        pesticide_applied: pesticideApplied,
        language: language,
      });
      setSimulationResult(res);
    } catch (err) {
      console.warn("Simulation failed:", err);
    } finally {
      setSimulating(false);
    }
  };

  // Run initial simulation once context is available
  useEffect(() => {
    if (isOpen && !simulationResult) {
      handleRunSimulation();
    }
  }, [isOpen, selectedFieldId, selectedCropId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2.5rem] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                science
              </span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-on-surface tracking-tight">
                {t("digitalTwin")} · {language === "bn" ? "খামার সিমুলেশন" : language === "hi" ? "खेत परिदृश्य सिम्युलेटर" : "Field Scenario Simulator"}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                {language === "bn"
                  ? "আবহাওয়া ও সেচ পরিবর্তনের 'কী হতো যদি' বৈজ্ঞানিক প্রভাব পর্যবেক্ষণ করুন"
                  : language === "hi"
                  ? "मौसम व सिंचाई में बदलाव के कृषि प्रभावों का अग्रिम अनुमान लगाएं"
                  : "Predict crop health and yield impact under custom what-if weather & water scenarios"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Target Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                {t("fieldName")}
              </label>
              <select
                value={selectedFieldId}
                onChange={(e) => setSelectedFieldId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs sm:text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.soil_type || "Alluvial"})
                  </option>
                ))}
                {fields.length === 0 && <option value="">Primary Field Plot (Default)</option>}
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant mb-1.5 block">
                {t("crop")}
              </label>
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs sm:text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.growth_stage || "Flowering"}
                  </option>
                ))}
                {crops.length === 0 && <option value="">Tomato (Flowering Stage)</option>}
              </select>
            </div>
          </div>

          {/* Simulation Sliders Grid */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 space-y-5">
            <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>{language === "bn" ? "সিমুলেশন প্যারামিটার নির্ধারণ" : language === "hi" ? "सिमुलेशन पैरामीटर सेट करें" : "What-If Parameters"}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Slider 1: Days without water */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-on-surface">{t("daysWithoutWater")}</span>
                  <span className="text-primary font-black px-2 py-0.5 rounded bg-primary/10">
                    +{daysWithoutWater} {language === "bn" ? "দিন" : language === "hi" ? "दिन" : "Days"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="7"
                  step="1"
                  value={daysWithoutWater}
                  onChange={(e) => setDaysWithoutWater(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant font-semibold">
                  <span>0d (Optimal)</span>
                  <span>7d (Severe)</span>
                </div>
              </div>

              {/* Slider 2: Temp Delta */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-on-surface">{t("tempChange")}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-black px-2 py-0.5 rounded bg-amber-500/10">
                    {temperatureDelta >= 0 ? `+${temperatureDelta}` : temperatureDelta}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="-4"
                  max="8"
                  step="1"
                  value={temperatureDelta}
                  onChange={(e) => setTemperatureDelta(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant font-semibold">
                  <span>-4°C Cooler</span>
                  <span>+8°C Heatwave</span>
                </div>
              </div>

              {/* Slider 3: Expected Rainfall */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-on-surface">{t("expectedRainfall")}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black px-2 py-0.5 rounded bg-blue-500/10">
                    {rainfallMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={rainfallMm}
                  onChange={(e) => setRainfallMm(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant font-semibold">
                  <span>0 mm (Dry)</span>
                  <span>60 mm (Heavy)</span>
                </div>
              </div>
            </div>

            {/* Treatment Toggle */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-outline-variant/15">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pesticideApplied}
                  onChange={(e) => setPesticideApplied(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-extrabold text-on-surface">
                  {language === "bn"
                    ? "প্রতিরোধমূলক জৈব বালাইনাশক / ছত্রাকনাশক প্রয়োগ করা হয়েছে"
                    : language === "hi"
                    ? "निवारक जैव कीटनाशक / कवकनाशी का प्रयोग किया गया है"
                    : "Simulate with proactive protective fungicide / biocontrol applied"}
                </span>
              </label>

              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={simulating}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-sm ${simulating ? "animate-spin" : ""}`}>
                  {simulating ? "sync" : "play_arrow"}
                </span>
                <span>{simulating ? (language === "bn" ? "গণনা হচ্ছে..." : language === "hi" ? "गणना जारी..." : "Simulating...") : t("runSimulation")}</span>
              </button>
            </div>
          </div>

          {/* Simulation Output Cards */}
          {simulationResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h4 className="text-xs font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-600">analytics</span>
                <span>{language === "bn" ? "প্রত্যাশিত ফলাফল ও বিশ্লেষণ" : language === "hi" ? "अनुमानित परिणाम व विश्लेषण" : "Projected Scenario Outcomes"}</span>
              </h4>

              {/* Metric Bento Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Health Score */}
                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15 space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("projectedHealth")}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-on-surface">
                      {simulationResult.projected_health_score ?? 78}/100
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">arrow_downward</span>
                    <span>{simulationResult.health_delta ?? "-12 pts shift"}</span>
                  </p>
                </div>

                {/* 2. Yield Impact */}
                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15 space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("yieldImpact")}
                  </p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {simulationResult.yield_impact_pct ? `${simulationResult.yield_impact_pct}%` : "-8.5%"}
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-medium">Estimated variance</p>
                </div>

                {/* 3. Water Stress */}
                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15 space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    {t("waterStress")}
                  </p>
                  <p className="text-xl font-black text-rose-600">
                    {simulationResult.water_stress_level || (daysWithoutWater > 3 ? "Critical" : "Elevated")}
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-medium">Root zone depletion</p>
                </div>

                {/* 4. Disease Surge Risk */}
                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/15 space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Fungal Surge Risk
                  </p>
                  <p className="text-xl font-black text-indigo-600">
                    {simulationResult.disease_risk_probability || (rainfallMm > 20 ? "High" : "Moderate")}
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-medium">Microclimate spore load</p>
                </div>
              </div>

              {/* AI Agronomic Insight Box */}
              <div className="p-5 rounded-2xl bg-surface-container-lowest border-l-4 border-primary space-y-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    psychiatry
                  </span>
                  <span>{language === "bn" ? "কৃষি মডেলের সুপারিশ" : language === "hi" ? "कृषि मॉडल की सिफारिश" : "Agronomic AI Advisory"}</span>
                </h5>
                <p className="text-xs sm:text-sm font-semibold text-on-surface leading-relaxed">
                  {simulationResult.explanation ||
                    (language === "bn"
                      ? "পানির ঘাটতি এবং উচ্চ তাপমাত্রার কারণে গাছের পাতার পত্ররন্ধ্র সংকুচিত হতে পারে। অবিলম্বে সকালের দিকে ড্রিপ সেচ প্রয়োগের পরামর্শ দেওয়া হচ্ছে।"
                      : language === "hi"
                      ? "जल की कमी और उच्च तापमान के कारण पत्तियों के रंध्र बंद हो सकते हैं। सुबह के समय ड्रिप सिंचाई करने की सिफारिश की जाती है।"
                      : "Elevated temperature and irrigation delay will trigger stomatal closure and early flower drop. Immediate targeted drip irrigation in early morning is recommended.")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-lowest flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-container-high text-xs font-extrabold text-on-surface transition-colors"
          >
            {t("back")}
          </button>
        </div>
      </div>
    </div>
  );
}
