"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useTranslation } from "@/context/LanguageContext";

interface ScanDetail {
  id: string;
  disease: string;
  severity: string;
  created_at: string;
  image_url: string;
  crop_id?: string;
  result_json?: any;
}

interface ComparisonResult {
  has_previous: boolean;
  progression_status: "improving" | "worsening" | "persistent" | "stable" | "healthy_stable" | "initial_scan";
  progression_label: string;
  progression_desc: string;
  severity_delta: number;
  days_elapsed: number;
  is_recurrence: boolean;
  smart_follow_up?: {
    recommended_days: number;
    urgency: "High" | "Medium" | "Low";
    action_text: string;
    check_target: string;
  };
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, t, translateDynamic } = useTranslation();

  const scan1Id = searchParams.get("scan1");
  const scan2Id = searchParams.get("scan2");

  const [scan1, setScan1] = useState<ScanDetail | null>(null);
  const [scan2, setScan2] = useState<ScanDetail | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allScans, setAllScans] = useState<ScanDetail[]>([]);
  const [selected1, setSelected1] = useState<string>(scan1Id || "");
  const [selected2, setSelected2] = useState<string>(scan2Id || "");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (scan1Id && scan2Id) {
        const res = await api.compareAnalyses(scan1Id, scan2Id);
        setScan1(res.previous_scan);
        setScan2(res.current_scan);
        setComparison(res.comparison);
        setSelected1(res.previous_scan?.id || scan1Id);
        setSelected2(res.current_scan?.id || scan2Id);
      } else {
        const scans = await api.getAnalyses();
        if (Array.isArray(scans)) {
          setAllScans(scans);
          if (scans.length >= 2) {
            const s1 = scan1Id || scans[1]?.id;
            const s2 = scan2Id || scans[0]?.id;
            setSelected1(s1);
            setSelected2(s2);
            const res = await api.compareAnalyses(s1, s2);
            setScan1(res.previous_scan);
            setScan2(res.current_scan);
            setComparison(res.comparison);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to compare scans");
    } finally {
      setLoading(false);
    }
  }, [scan1Id, scan2Id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunComparison = () => {
    if (!selected1 || !selected2 || selected1 === selected2) {
      alert(language === "bn" ? "তুলনা করতে অনুগ্রহ করে দুটি ভিন্ন স্ক্যান নির্বাচন করুন।" : language === "hi" ? "तुलना करने के लिए कृपया दो अलग-अलग स्कैन चुनें।" : "Please select two different scans to compare.");
      return;
    }
    router.push(`/analysis/compare?scan1=${selected1}&scan2=${selected2}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
            compare
          </span>
        </div>
        <p className="text-sm font-bold text-on-surface-variant">{t("loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl">warning</span>
        </div>
        <h2 className="text-xl font-black text-on-surface mb-2">{t("errorOccurred")}</h2>
        <p className="text-sm text-on-surface-variant max-w-sm mb-6">{error}</p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => loadData()}
            className="btn-farmer-primary text-sm px-6 py-3"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            <span>{t("retry")}</span>
          </button>
          <Link href="/history" className="btn-farmer-secondary text-sm px-6 py-3">
            {t("analysisHistory")}
          </Link>
        </div>
      </div>
    );
  }

  if (!scan1 || !scan2 || !comparison) {
    const emptyTitle =
      language === "bn"
        ? "তুলনা করতে কমপক্ষে ২টি স্ক্যান প্রয়োজন"
        : language === "hi"
        ? "तुलना के लिए कम से कम 2 स्कैन आवश्यक हैं"
        : "At least 2 scans required for comparison";

    const emptyDesc =
      language === "bn"
        ? "রোগের লক্ষণ উপশম, ওষুধের কার্যকারিতা এবং উদ্ভিদের স্বাস্থ্য পরিবর্তন পর্যবেক্ষণ করতে পর্যায়ক্রমে স্ক্যান করুন।"
        : language === "hi"
        ? "रोग सुधार, उपचार प्रभावशीलता और फसल की प्रगति की तुलना करने के लिए विभिन्न समय पर स्कैन करें।"
        : "Scan your crops periodically to track disease progression, treatment effectiveness, and recovery trends.";

    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-18 h-18 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5 shadow-xs">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            compare_arrows
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-on-surface mb-2 tracking-tight">{emptyTitle}</h2>
        <p className="text-sm text-on-surface-variant max-w-md mb-8 leading-relaxed font-medium">{emptyDesc}</p>
        <div className="flex flex-col sm:flex-row items-center gap-3.5">
          <Link href="/scan" className="btn-farmer-primary text-sm px-6 py-3.5 shadow-md">
            <span className="material-symbols-outlined text-lg">photo_camera</span>
            <span>{t("scanLeaf")}</span>
          </Link>
          <Link href="/history" className="btn-farmer-secondary text-sm px-6 py-3.5">
            <span className="material-symbols-outlined text-lg">history</span>
            <span>{t("analysisHistory")}</span>
          </Link>
        </div>
      </div>
    );
  }

  const isImproving = comparison.progression_status === "improving";
  const isWorsening = comparison.progression_status === "worsening";

  const s1Symptoms = Array.isArray(scan1.result_json?.symptoms) ? scan1.result_json.symptoms : [];
  const s2Symptoms = Array.isArray(scan2.result_json?.symptoms) ? scan2.result_json.symptoms : [];

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              aria-label={t("back")}
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <h1 className="text-base font-extrabold text-on-surface tracking-tight truncate">
              {t("scanComparison")}
            </h1>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
            isImproving ? "bg-primary text-on-primary" : isWorsening ? "bg-error text-on-error" : "bg-primary-container text-on-primary-container"
          }`}>
            {translateDynamic(comparison.progression_label)}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Selector Bar if allScans are available */}
        {allScans.length > 2 && (
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-bold text-on-surface">{t("compareButton")}:</span>
              <select
                value={selected1}
                onChange={(e) => setSelected1(e.target.value)}
                className="bg-surface-container-high rounded-xl px-2.5 py-1.5 font-bold text-on-surface outline-none"
              >
                {allScans.map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.created_at).toLocaleDateString(language)} — {translateDynamic(s.disease || "Healthy")}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-on-surface-variant font-black">VS</span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selected2}
                onChange={(e) => setSelected2(e.target.value)}
                className="bg-surface-container-high rounded-xl px-2.5 py-1.5 font-bold text-on-surface outline-none"
              >
                {allScans.map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.created_at).toLocaleDateString(language)} — {translateDynamic(s.disease || "Healthy")}
                  </option>
                ))}
              </select>

              <button
                onClick={handleRunComparison}
                className="px-4 py-1.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90"
              >
                {t("compareButton")}
              </button>
            </div>
          </div>
        )}

        {/* Trajectory Banner (Section 10 of a4.md) */}
        <div className={`p-5 sm:p-6 rounded-[2rem] border flex items-start gap-4 shadow-sm ${
          isImproving
            ? "bg-emerald-500/10 border-emerald-500/25"
            : isWorsening
            ? "bg-error/5 border-error/20"
            : "bg-surface-container-lowest border-outline-variant/20"
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            isImproving ? "bg-emerald-600/15 text-emerald-800" : isWorsening ? "bg-error/15 text-error" : "bg-primary/10 text-primary"
          }`}>
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isImproving ? "trending_down" : isWorsening ? "trending_up" : "trending_flat"}
            </span>
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-on-surface">{translateDynamic(comparison.progression_label)}</h2>
              <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                isImproving
                  ? "bg-emerald-500/20 text-emerald-800 border border-emerald-500/30"
                  : isWorsening
                  ? "bg-rose-500/20 text-rose-800 border border-rose-500/30"
                  : "bg-surface-container-high text-on-surface border border-outline-variant/30"
              }`}>
                {isImproving ? "↓ Reduced" : isWorsening ? "↑ Increased" : "→ No major change"}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">{translateDynamic(comparison.progression_desc)}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant font-semibold pt-1">
              <span>
                {t("timeElapsed")}: <strong className="text-on-surface">{comparison.days_elapsed} {t("daysAgo")}</strong>
              </span>
              <span>
                Risk Shift: <strong className="text-on-surface">{translateDynamic(scan1.severity || "Low")} → {translateDynamic(scan2.severity || "Low")}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Baseline / Previous Scan */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] overflow-hidden shadow-sm space-y-4">
            <div className="relative aspect-[4/3] bg-surface-container-low">
              <Image
                src={scan1.image_url || "https://images.unsplash.com/photo-1592843987019-21b3334201c1?auto=format&fit=crop&q=80&w=600"}
                alt="Previous scan"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                {t("previousScan")}
              </div>
              <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-surface-container-highest text-on-surface">
                {translateDynamic(scan1.severity || "Low")}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">{t("scanDate")}</p>
                <p className="text-sm font-bold text-on-surface">{new Date(scan1.created_at).toLocaleDateString(language, { dateStyle: "long" })}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">{t("identifiedCondition")}</p>
                <h3 className="text-xl font-black text-on-surface">{translateDynamic(scan1.disease || "Healthy")}</h3>
              </div>

              {s1Symptoms.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest mb-2">{t("symptoms")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s1Symptoms.map((s: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-xs font-medium rounded-lg">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={`/analysis/${scan1.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-2"
              >
                <span>{t("viewFullReport")}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Current / Follow-Up Scan */}
          <div className="bg-surface-container-lowest border-2 border-primary/30 rounded-[2rem] overflow-hidden shadow-sm space-y-4">
            <div className="relative aspect-[4/3] bg-surface-container-low">
              <Image
                src={scan2.image_url || "https://images.unsplash.com/photo-1592843987019-21b3334201c1?auto=format&fit=crop&q=80&w=600"}
                alt="Current scan"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="absolute top-3 left-3 bg-primary text-on-primary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">
                {t("currentScan")}
              </div>
              <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md ${
                isImproving ? "bg-primary text-on-primary" : isWorsening ? "bg-error text-on-error" : "bg-primary-container text-on-primary-container"
              }`}>
                {translateDynamic(scan2.severity || "Low")}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">{t("scanDate")}</p>
                <p className="text-sm font-bold text-on-surface">{new Date(scan2.created_at).toLocaleDateString(language, { dateStyle: "long" })}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest">{t("identifiedCondition")}</p>
                <h3 className="text-xl font-black text-on-surface">{translateDynamic(scan2.disease || "Healthy")}</h3>
              </div>

              {s2Symptoms.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest mb-2">{t("symptoms")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s2Symptoms.map((s: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-xs font-medium rounded-lg">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={`/analysis/${scan2.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-2"
              >
                <span>{t("viewFullReport")}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Smart Follow-Up Section */}
        {comparison.smart_follow_up && (
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  event_repeat
                </span>
                <h3 className="text-xs font-black text-on-surface uppercase tracking-widest">
                  {t("smartFollowUp")}
                </h3>
              </div>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-xs font-extrabold rounded-full">
                {comparison.smart_follow_up.recommended_days} Days
              </span>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 space-y-2 border border-outline-variant/10">
              <p className="text-sm font-extrabold text-on-surface">
                {translateDynamic(comparison.smart_follow_up.action_text)}
              </p>
              <p className="text-xs text-on-surface-variant font-medium">
                <strong>{t("cautions")}:</strong> {translateDynamic(comparison.smart_follow_up.check_target)}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href={scan2.crop_id ? `/scan?crop_id=${scan2.crop_id}` : "/scan"}
                className="flex-1 py-3.5 bg-primary text-on-primary font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 text-sm"
              >
                <span className="material-symbols-outlined text-lg">add_a_photo</span>
                {t("newAnalysis")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">compare</span>
          </div>
          <p className="text-sm font-bold text-on-surface-variant">Loading comparison...</p>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
