"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export interface ProgressionData {
  has_previous: boolean;
  progression_status: "improving" | "worsening" | "persistent" | "stable" | "healthy_stable" | "initial_scan";
  progression_label: string;
  progression_desc: string;
  severity_delta: number;
  days_elapsed: number;
  is_recurrence: boolean;
  previous_scan: {
    id: string;
    disease: string;
    severity: string;
    created_at: string;
    image_url: string;
  } | null;
  smart_follow_up?: {
    recommended_days: number;
    urgency: "High" | "Medium" | "Low";
    action_text: string;
    check_target: string;
  };
}

interface ScanComparisonCardProps {
  currentScan: {
    id: string;
    disease: string;
    severity: string;
    created_at: string;
    image_url: string;
    crop?: string;
  };
  progression: ProgressionData;
}

export function ScanComparisonCard({ currentScan, progression }: ScanComparisonCardProps) {
  const { t, language, translateDynamic } = useTranslation();

  if (!progression.has_previous || !progression.previous_scan) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-[1.75rem] p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            history
          </span>
          <h3 className="text-xs font-black text-on-surface uppercase tracking-widest">{t("scanComparison")}</h3>
        </div>
        <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
          {language === "bn"
            ? "এই ফসলের প্রোফাইলের জন্য এটি প্রথম সংরক্ষিত স্ক্যান। পরবর্তী স্ক্যানগুলি স্বয়ংক্রিয়ভাবে তুলনামূলক অগ্রগতি প্রদর্শন করবে।"
            : language === "hi"
            ? "इस फसल प्रोफाइल के लिए यह पहला रिकॉर्ड किया गया स्कैन है। भविष्य के स्कैन स्वचालित रूप से तुलना समयरेखा तैयार करेंगे।"
            : "This is the first recorded scan for this crop profile. Future scans will automatically generate comparison timelines and health trajectories."}
        </p>
      </div>
    );
  }

  const prev = progression.previous_scan;
  const isImproving = progression.progression_status === "improving";
  const isWorsening = progression.progression_status === "worsening";
  const isHealthyStable = progression.progression_status === "healthy_stable";

  const statusBadgeColor = isImproving
    ? "bg-primary text-on-primary"
    : isWorsening
    ? "bg-error text-on-error"
    : isHealthyStable
    ? "bg-primary-container text-on-primary-container"
    : "bg-tertiary-container text-on-tertiary-container";

  const statusIcon = isImproving
    ? "trending_down"
    : isWorsening
    ? "trending_up"
    : isHealthyStable
    ? "check_circle"
    : "horizontal_rule";

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/15 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              compare
            </span>
            <h3 className="text-xs font-black text-on-surface uppercase tracking-widest">
              {t("whatChanged")}
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant font-medium">
            {new Date(prev.created_at).toLocaleDateString(language, { dateStyle: "medium" })} ({progression.days_elapsed} {t("daysAgo")})
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${statusBadgeColor}`}>
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              {statusIcon}
            </span>
            {translateDynamic(progression.progression_label)}
          </span>
          <Link
            href={`/analysis/compare?scan1=${prev.id}&scan2=${currentScan.id}`}
            className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold rounded-full transition-colors inline-flex items-center gap-1"
          >
            <span>{t("compareButton")}</span>
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </Link>
        </div>
      </div>

      {/* Side-by-Side Visual Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Previous Scan Card */}
        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              {t("previousScan")}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">
              {new Date(prev.created_at).toLocaleDateString(language, { month: "short", day: "numeric" })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant/20">
              <Image
                src={prev.image_url || "https://images.unsplash.com/photo-1592843987019-21b3334201c1?auto=format&fit=crop&q=80&w=200"}
                alt="Previous leaf scan"
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-extrabold text-on-surface truncate">
                {translateDynamic(prev.disease || "Healthy")}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface-variant">
                  {translateDynamic(prev.severity || "Low")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Scan Card */}
        <div className="bg-surface-container-low rounded-2xl p-4 border border-primary/20 space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              {t("currentScan")}
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">
              {new Date(currentScan.created_at).toLocaleDateString(language, { month: "short", day: "numeric" })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-container-high shrink-0 border-2 border-primary/30">
              <Image
                src={currentScan.image_url || "https://images.unsplash.com/photo-1592843987019-21b3334201c1?auto=format&fit=crop&q=80&w=200"}
                alt="Current leaf scan"
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-extrabold text-on-surface truncate">
                {translateDynamic(currentScan.disease || "Healthy")}
              </p>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  isImproving ? "bg-primary/20 text-primary" : isWorsening ? "bg-error/20 text-error" : "bg-surface-container-highest text-on-surface-variant"
                }`}>
                  {translateDynamic(currentScan.severity || "Low")}
                </span>
                {progression.is_recurrence && (
                  <span className="text-[10px] font-extrabold text-tertiary px-2 py-0.5 rounded-md bg-tertiary-container/30">
                    {t("persistentCondition")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trajectory Explanation */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
        isImproving
          ? "bg-primary/5 border-primary/15 text-on-surface"
          : isWorsening
          ? "bg-error/5 border-error/20 text-on-surface"
          : "bg-surface-container-low border-outline-variant/15 text-on-surface"
      }`}>
        <span className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${
          isImproving ? "text-primary" : isWorsening ? "text-error" : "text-tertiary"
        }`}>
          {isImproving ? "task_alt" : isWorsening ? "warning" : "info"}
        </span>
        <div className="space-y-0.5">
          <p className="text-xs font-bold leading-relaxed">{translateDynamic(progression.progression_desc)}</p>
        </div>
      </div>
    </div>
  );
}
