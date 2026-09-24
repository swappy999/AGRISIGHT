"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useTranslation } from "@/context/LanguageContext";
import { InterventionTracker } from "@/components/InterventionTracker";
import { SmartIrrigationCard } from "@/components/SmartIrrigationCard";
import { PestAndIPMCard } from "@/components/PestAndIPMCard";
import { NutrientAdvisoryCard } from "@/components/NutrientAdvisoryCard";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface FieldDetail {
  id: string;
  name: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  area_acres: number;
  soil_type: string;
  irrigation_type: string;
  notes: string;
  created_at: string;
  health_score: number;
  status: string;
  status_color: string;
  active_hotspots: number;
  survival_estimate: number;
  crops: any[];
  analyses: any[];
  hotspots?: any[];
  zones?: any[];
}

interface FieldAnalytics {
  health_score: number;
  scan_count: number;
  latest_analysis?: {
    condition: string;
    severity: string;
    confidence_score: number;
  };
  ai_insight?: string;
  sensor_data?: {
    soil_moisture?: number;
    temperature?: number;
    humidity?: number;
    soil_ph?: number;
    water_flow?: number;
    last_updated?: string;
    node_status?: "connected" | "offline" | "not_attached";
  };
}

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
function healthBadgeClass(score: number | null): string {
  if (score == null) return "bg-surface-container-high text-on-surface-variant";
  if (score >= 80) return "bg-emerald-500/15 text-emerald-700";
  if (score >= 55) return "bg-amber-500/15 text-amber-700";
  return "bg-rose-500/20 text-rose-700";
}

function getScanStatusIcon(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "none" || s === "healthy") return "check_circle";
  if (s === "low") return "info";
  if (s === "moderate") return "warning";
  return "dangerous";
}

function getScanStatusColor(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "none" || s === "healthy") return "text-emerald-600";
  if (s === "low") return "text-blue-600";
  if (s === "moderate") return "text-amber-600";
  return "text-rose-600";
}

function formatTimeAgo(dateStr: string, language: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (language === "bn") {
    if (diffMins < 1) return "এইমাত্র";
    if (diffMins < 60) return `${diffMins} মিনিট আগে`;
    if (diffHrs < 24) return `${diffHrs} ঘণ্টা আগে`;
    return `${diffDays} দিন আগে`;
  } else if (language === "hi") {
    if (diffMins < 1) return "अभी";
    if (diffMins < 60) return `${diffMins} मिनट पहले`;
    if (diffHrs < 24) return `${diffHrs} घंटे पहले`;
    return `${diffDays} दिन पहले`;
  }
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${diffDays}d ago`;
}

// ────────────────────────────────────────────────
// Section: Field Hero Header
// ────────────────────────────────────────────────
function FieldHero({
  field,
  analytics,
  onEdit,
  onDelete,
  language,
  t,
  formatNumber,
  translateDynamic,
}: {
  field: FieldDetail;
  analytics: FieldAnalytics | null;
  onEdit: () => void;
  onDelete: () => void;
  language: string;
  t: (key: any, params?: any) => string;
  formatNumber: (n: any) => string;
  translateDynamic: (s: string) => string;
}) {
  const score = analytics?.health_score ?? field.health_score ?? null;

  return (
    <div className="rounded-[2.5rem] bg-surface-container-low border border-outline-variant/20 overflow-hidden">
      {/* Color band for health */}
      <div
        className={`h-1.5 w-full ${
          score != null && score >= 80
            ? "bg-emerald-500"
            : score != null && score >= 55
            ? "bg-amber-400"
            : score != null
            ? "bg-rose-500"
            : "bg-outline-variant"
        }`}
      />
      <div className="p-6 space-y-4">
        {/* Breadcrumb */}
        <Link
          href="/fields"
          className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          {t("myFields")}
        </Link>

        {/* Field identity row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
                {translateDynamic(field.name)}
              </h1>
              {score != null && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${healthBadgeClass(
                    score
                  )}`}
                >
                  {formatNumber(score)}% {t("fieldHealth")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium flex-wrap">
              <span className="material-symbols-outlined text-xs">pin_drop</span>
              <span>{translateDynamic(field.location_name || "Plot Location")}</span>
              <span className="opacity-40">·</span>
              <span className="material-symbols-outlined text-xs">landscape</span>
              <span>
                {formatNumber(field.area_acres)} {t("acres")}
              </span>
              <span className="opacity-40">·</span>
              <span>{translateDynamic(field.soil_type)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEdit}
              className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              {t("edit")}
            </button>
            <button
              onClick={onDelete}
              className="p-2.5 text-rose-600 hover:bg-rose-500/10 rounded-2xl transition-colors border border-rose-500/20"
              title="Delete Field"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Section: Dominant Scan Leaf CTA
// ────────────────────────────────────────────────
function ScanLeafCTA({
  fieldId,
  fieldName,
  cropName,
  language,
  t,
}: {
  fieldId: string;
  fieldName: string;
  cropName?: string;
  language: string;
  t: (key: any, params?: any) => string;
}) {
  return (
    <Link
      href={`/scan?fieldId=${fieldId}`}
      className="block w-full rounded-[2rem] bg-primary text-on-primary p-6 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] group"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              energy_savings_leaf
            </span>
            <span className="text-lg font-extrabold tracking-tight">{t("scanLeaf")}</span>
          </div>
          <p className="text-sm font-medium opacity-80 truncate">
            {cropName
              ? language === "bn"
                ? `${cropName} ফসলের পাতা স্ক্যান করুন`
                : language === "hi"
                ? `${cropName} की पत्ती स्कैन करें`
                : `Scan a ${cropName} leaf`
              : t("checkCropHealth")}
          </p>
          <p className="text-[11px] font-bold opacity-60 truncate">
            {language === "bn"
              ? `📍 ${fieldName}`
              : language === "hi"
              ? `📍 ${fieldName}`
              : `📍 ${fieldName}`}
          </p>
        </div>
        <div className="shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              photo_camera
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ────────────────────────────────────────────────
// Section: Crop Card
// ────────────────────────────────────────────────
function CropCard({
  crops,
  fieldId,
  language,
  t,
  translateDynamic,
}: {
  crops: any[];
  fieldId: string;
  language: string;
  t: (key: any, params?: any) => string;
  translateDynamic: (s: string) => string;
}) {
  if (crops.length === 0) {
    return (
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">spa</span>
          </div>
          <div>
            <p className="font-extrabold text-sm text-on-surface">{t("noCropLinked")}</p>
            <p className="text-xs text-on-surface-variant font-medium">
              {language === "bn"
                ? "আপনার ফসল যোগ করুন"
                : language === "hi"
                ? "फसल जोड़ने से AI बेहतर सलाह देगा"
                : "Add a crop for better AI guidance"}
            </p>
          </div>
        </div>
        <Link
          href={`/crops/new?fieldId=${fieldId}`}
          className="px-4 py-2 bg-primary text-on-primary rounded-2xl font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            add
          </span>
          {t("addCropToField")}
        </Link>
      </div>
    );
  }

  const crop = crops[0];
  const daysSincePlanting = crop.planting_date
    ? Math.floor((Date.now() - new Date(crop.planting_date).getTime()) / 86400000)
    : null;

  return (
    <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          spa
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-sm text-on-surface">{translateDynamic(crop.name)}</p>
        {crop.variety && (
          <p className="text-xs text-on-surface-variant font-medium">{crop.variety}</p>
        )}
        {daysSincePlanting !== null && (
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            {language === "bn"
              ? `🌱 ${daysSincePlanting} দিন হয়েছে`
              : language === "hi"
              ? `🌱 ${daysSincePlanting} दिन हुए`
              : `🌱 Day ${daysSincePlanting}`}
          </p>
        )}
      </div>
      {crops.length > 1 && (
        <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-full shrink-0">
          +{crops.length - 1}
        </span>
      )}
      <Link
        href={`/crops`}
        className="p-2 text-on-surface-variant hover:text-primary transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-lg">chevron_right</span>
      </Link>
    </div>
  );
}

// ────────────────────────────────────────────────
// Section: Field Conditions (Sensor Data)
// ────────────────────────────────────────────────
function FieldConditionsCard({
  analytics,
  language,
  t,
}: {
  analytics: FieldAnalytics | null;
  language: string;
  t: (key: any, params?: any) => string;
}) {
  const sensors = analytics?.sensor_data;
  const nodeStatus = sensors?.node_status ?? "not_attached";

  const readings: Array<{
    key: string;
    label: string;
    value: string | null;
    icon: string;
    unit: string;
  }> = [
    {
      key: "soil_moisture",
      label: t("soilMoisture"),
      value: sensors?.soil_moisture != null ? String(sensors.soil_moisture) : null,
      icon: "water_drop",
      unit: "%",
    },
    {
      key: "temperature",
      label: t("temperature"),
      value: sensors?.temperature != null ? String(sensors.temperature) : null,
      icon: "thermostat",
      unit: "°C",
    },
    {
      key: "humidity",
      label: t("humidity"),
      value: sensors?.humidity != null ? String(sensors.humidity) : null,
      icon: "humidity_percentage",
      unit: "%",
    },
    {
      key: "soil_ph",
      label: t("soilPh"),
      value: sensors?.soil_ph != null ? String(sensors.soil_ph) : null,
      icon: "science",
      unit: "",
    },
  ];

  return (
    <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-5 space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            sensors
          </span>
          <h2 className="font-extrabold text-sm text-on-surface">{t("fieldConditions")}</h2>
        </div>
        {/* Node status badge */}
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
            nodeStatus === "connected"
              ? "bg-emerald-500/15 text-emerald-700"
              : nodeStatus === "offline"
              ? "bg-rose-500/15 text-rose-700"
              : "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            nodeStatus === "connected"
              ? "bg-emerald-500 animate-pulse"
              : nodeStatus === "offline"
              ? "bg-rose-500"
              : "bg-on-surface-variant/30"
          }`} />
          {nodeStatus === "connected"
            ? t("fieldNodeConnected")
            : nodeStatus === "offline"
            ? t("fieldNodeOffline")
            : t("fieldNodeNotAttached")}
        </span>
      </div>

      {/* Sensor grid */}
      {sensors && nodeStatus === "connected" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {readings.map((r) => (
              <div
                key={r.key}
                className="bg-surface-container-high rounded-2xl p-3.5 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {r.icon}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">
                    {r.label}
                  </p>
                  <p className="text-base font-extrabold text-on-surface">
                    {r.value != null ? `${r.value}${r.unit}` : t("notAvailable")}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {sensors.last_updated && (
            <p className="text-[10px] font-bold text-on-surface-variant/50 text-right">
              {t("fieldNodeLastUpdate")}: {formatTimeAgo(sensors.last_updated, language)}
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center py-4 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-on-surface-variant/40">sensors_off</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant">
              {nodeStatus === "offline" ? t("fieldNodeOffline") : t("noSensorData")}
            </p>
            <p className="text-xs text-on-surface-variant/60 font-medium mt-1">
              {t("yourFieldCanStillBeUsed")}
            </p>
          </div>
          <p className="text-xs font-bold text-primary cursor-pointer hover:underline">
            {t("connectYourFieldNode")}
          </p>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Section: Recent Scans (field-filtered history)
// ────────────────────────────────────────────────
function RecentScansSection({
  analyses,
  fieldId,
  language,
  t,
  translateDynamic,
}: {
  analyses: any[];
  fieldId: string;
  language: string;
  t: (key: any, params?: any) => string;
  translateDynamic: (s: string) => string;
}) {
  const shown = analyses.slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-lg text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            history
          </span>
          <h2 className="font-extrabold text-sm text-on-surface">{t("recentScans")}</h2>
        </div>
        <Link
          href={`/scan?fieldId=${fieldId}`}
          className="px-3 py-1.5 bg-primary text-on-primary rounded-xl font-bold text-[10px] flex items-center gap-1 shadow-sm shadow-primary/20"
        >
          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
            energy_savings_leaf
          </span>
          {t("scanLeafCta")}
        </Link>
      </div>

      {shown.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-8 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">
            photo_camera
          </span>
          <p className="text-sm font-bold text-on-surface-variant">
            {language === "bn"
              ? "এই জমিতে এখনো কোনো স্ক্যান নেই"
              : language === "hi"
              ? "इस खेत में अभी तक कोई स्कैन नहीं"
              : "No scans from this field yet"}
          </p>
          <p className="text-xs text-on-surface-variant/60 font-medium">
            {language === "bn"
              ? "পাতা স্ক্যান করে ফসলের স্বাস্থ্য জানুন"
              : language === "hi"
              ? "पत्ती स्कैन करके फसल का स्वास्थ्य जानें"
              : "Scan a leaf to check crop health instantly"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((scan: any) => {
            const severity = scan.severity || scan.condition_severity || "none";
            const condition = scan.identified_condition || scan.condition || translateDynamic("Healthy");
            return (
              <Link
                key={scan.id}
                href={`/analysis/${scan.id}`}
                className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-4 flex items-center gap-3 hover:border-primary/40 transition-all group"
              >
                <span
                  className={`material-symbols-outlined text-xl shrink-0 ${getScanStatusColor(severity)}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {getScanStatusIcon(severity)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-xs text-on-surface truncate">{translateDynamic(condition)}</p>
                  <p className="text-[10px] font-medium text-on-surface-variant mt-0.5">
                    {scan.crop_name && <span className="mr-2">🌿 {translateDynamic(scan.crop_name)}</span>}
                    {scan.created_at && formatTimeAgo(scan.created_at, language)}
                  </p>
                </div>
                <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary transition-colors shrink-0">
                  chevron_right
                </span>
              </Link>
            );
          })}
          {analyses.length > 4 && (
            <Link
              href={`/history?fieldId=${fieldId}`}
              className="block w-full py-3 text-center text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              {language === "bn"
                ? `আরও ${analyses.length - 4}টি স্ক্যান দেখুন`
                : language === "hi"
                ? `और ${analyses.length - 4} स्कैन देखें`
                : `View ${analyses.length - 4} more scans`}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Section: AgriSight Insight (AI summary)
// ────────────────────────────────────────────────
function AgriSightInsightCard({
  analytics,
  fieldId,
  language,
  t,
}: {
  analytics: FieldAnalytics | null;
  fieldId: string;
  language: string;
  t: (key: any, params?: any) => string;
}) {
  const insight = analytics?.ai_insight;

  return (
    <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_awesome
          </span>
        </div>
        <h2 className="font-extrabold text-sm text-on-surface">{t("agriSightInsight")}</h2>
      </div>

      {insight ? (
        <p className="text-sm text-on-surface-variant leading-relaxed font-medium">{insight}</p>
      ) : (
        <p className="text-sm text-on-surface-variant/60 font-medium italic">
          {language === "bn"
            ? "আরও স্ক্যান করলে AI পরামর্শ পাবেন।"
            : language === "hi"
            ? "अधिक स्कैन करने पर AI अंतर्दृष्टि मिलेगी।"
            : "Scan your crops to receive AI insights for this field."}
        </p>
      )}

      <Link
        href={`/assistant?fieldId=${fieldId}`}
        className="w-full py-3 border border-outline-variant/30 rounded-2xl text-xs font-bold text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          chat_bubble
        </span>
        {t("askAboutThisField")}
      </Link>
    </div>
  );
}

// ────────────────────────────────────────────────
// Section: Field Analytics KPIs
// ────────────────────────────────────────────────
function FieldKPIStrip({
  field,
  analytics,
  language,
  t,
  formatNumber,
}: {
  field: FieldDetail;
  analytics: FieldAnalytics | null;
  language: string;
  t: (key: any, params?: any) => string;
  formatNumber: (n: any) => string;
}) {
  const kpis = [
    {
      label: t("totalScans"),
      value: formatNumber(analytics?.scan_count ?? field.analyses?.length ?? 0),
      icon: "photo_camera",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t("activeRisks"),
      value: formatNumber(field.active_hotspots || 0),
      icon: field.active_hotspots > 0 ? "warning" : "verified",
      color: field.active_hotspots > 0 ? "text-rose-600" : "text-emerald-600",
      bg: field.active_hotspots > 0 ? "bg-rose-500/10" : "bg-emerald-500/10",
    },
    {
      label: t("area"),
      value: `${formatNumber(field.area_acres)} ${t("acres")}`,
      icon: "landscape",
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-4 flex flex-col items-center text-center gap-2"
        >
          <div className={`w-9 h-9 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {kpi.icon}
            </span>
          </div>
          <p className="text-base font-extrabold text-on-surface leading-tight">{kpi.value}</p>
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────
// Edit Field Form (inline drawer)
// ────────────────────────────────────────────────
function EditFieldForm({
  field,
  onSave,
  onCancel,
  t,
}: {
  field: FieldDetail;
  onSave: (data: Partial<FieldDetail>) => Promise<void>;
  onCancel: () => void;
  t: (key: any, params?: any) => string;
}) {
  const [form, setForm] = useState({
    name: field.name,
    location_name: field.location_name,
    area_acres: field.area_acres,
    soil_type: field.soil_type,
    irrigation_type: field.irrigation_type,
    notes: field.notes,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 space-y-4 animate-in fade-in duration-200"
    >
      <h3 className="font-extrabold text-on-surface text-base">
        {t("edit")} — {t("fields")}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-black text-on-surface-variant uppercase tracking-wider mb-1">
            {t("fieldName")}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2.5 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
          />
        </div>
        <div>
          <label className="block text-[11px] font-black text-on-surface-variant uppercase tracking-wider mb-1">
            {t("location")}
          </label>
          <input
            type="text"
            value={form.location_name}
            onChange={(e) => setForm({ ...form, location_name: e.target.value })}
            className="w-full px-3 py-2.5 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
          />
        </div>
        <div>
          <label className="block text-[11px] font-black text-on-surface-variant uppercase tracking-wider mb-1">
            {t("area")} ({t("acres")})
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={form.area_acres}
            onChange={(e) => setForm({ ...form, area_acres: parseFloat(e.target.value) || 1 })}
            className="w-full px-3 py-2.5 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
          />
        </div>
        <div>
          <label className="block text-[11px] font-black text-on-surface-variant uppercase tracking-wider mb-1">
            {t("soilType")}
          </label>
          <select
            value={form.soil_type}
            onChange={(e) => setForm({ ...form, soil_type: e.target.value })}
            className="w-full px-3 py-2.5 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
          >
            <option value="Alluvial">Alluvial (Loamy)</option>
            <option value="Black Soil">Black / Regur</option>
            <option value="Red / Laterite">Red / Laterite</option>
            <option value="Clay">Clay Heavy</option>
            <option value="Sandy Loam">Sandy Loam</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-black text-on-surface-variant uppercase tracking-wider mb-1">
            {t("irrigationType")}
          </label>
          <select
            value={form.irrigation_type}
            onChange={(e) => setForm({ ...form, irrigation_type: e.target.value })}
            className="w-full px-3 py-2.5 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
          >
            <option value="Drip">Drip Irrigation</option>
            <option value="Sprinkler">Sprinkler Overhead</option>
            <option value="Furrow / Flood">Furrow / Channel</option>
            <option value="Rainfed">Rainfed (Natural)</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-black text-on-surface-variant uppercase tracking-wider mb-1">
            {t("notes")}
          </label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2.5 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl font-bold text-xs text-on-surface-variant hover:bg-surface-container-highest border border-outline-variant/30"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {saving ? t("loading") : t("save")}
        </button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────
// Main FieldDetailClient Component
// ────────────────────────────────────────────────
export function FieldDetailClient() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { t, language, translateDynamic, formatNumber } = useTranslation();

  const [field, setField] = useState<FieldDetail | null>(null);
  const [analytics, setAnalytics] = useState<FieldAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Expanded section tabs for the lower "more details" area
  const [activeSection, setActiveSection] = useState<
    "overview" | "ipm" | "irrigation" | "nutrition" | "interventions"
  >("overview");

  const loadData = async () => {
    if (!id || id === "preview") {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [fieldData, analyticsData] = await Promise.all([
        api.getField(id),
        api.getFieldAnalytics(id).catch(() => null),
      ]);
      setField(fieldData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(err.message || "Failed to load field details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSave = async (data: Partial<FieldDetail>) => {
    if (!field) return;
    await api.updateField(field.id, data as any);
    setEditing(false);
    await loadData();
  };

  const handleDelete = async () => {
    if (!field) return;
    if (
      !confirm(
        language === "bn"
          ? `আপনি কি "${field.name}" মুছে ফেলতে নিশ্চিত?`
          : language === "hi"
          ? `क्या आप "${field.name}" को हटाना चाहते हैं?`
          : `Are you sure you want to delete "${field.name}"?`
      )
    )
      return;
    try {
      await api.deleteField(field.id);
      router.push("/fields");
    } catch (err: any) {
      alert(err.message || "Failed to delete field.");
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin">
            progress_activity
          </span>
          <p className="text-sm font-bold text-on-surface-variant">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !field) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/30 text-center max-w-md space-y-4">
          <span className="material-symbols-outlined text-4xl text-rose-500">error</span>
          <h2 className="text-xl font-black text-on-surface">{t("errorOccurred")}</h2>
          <p className="text-xs text-on-surface-variant">{error || "Could not retrieve field data."}</p>
          <Link
            href="/fields"
            className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs inline-block"
          >
            {t("myFields")}
          </Link>
        </div>
      </div>
    );
  }

  const primaryCrop = field.crops?.[0];

  // Section tabs config
  const sectionTabs = [
    { key: "overview", label: language === "bn" ? "সংক্ষিপ্ত" : language === "hi" ? "सारांश" : "Overview", icon: "dashboard" },
    { key: "ipm", label: language === "bn" ? "IPM" : "IPM", icon: "pest_control" },
    { key: "irrigation", label: language === "bn" ? "সেচ" : language === "hi" ? "सिंचाई" : "Water", icon: "water_drop" },
    { key: "nutrition", label: language === "bn" ? "পুষ্টি" : language === "hi" ? "पोषण" : "Nutrition", icon: "science" },
    { key: "interventions", label: language === "bn" ? "কার্যক্রম" : language === "hi" ? "कार्य" : "Actions", icon: "task_alt" },
  ] as const;

  return (
    <div className="space-y-6 p-4 lg:p-12 max-w-[1200px] mx-auto pb-28 xl:pb-12">
      {/* ── Field Hero ── */}
      <FieldHero
        field={field}
        analytics={analytics}
        onEdit={() => setEditing(!editing)}
        onDelete={handleDelete}
        language={language}
        t={t}
        formatNumber={formatNumber}
        translateDynamic={translateDynamic}
      />

      {/* ── Edit Form ── */}
      {editing && (
        <EditFieldForm field={field} onSave={handleSave} onCancel={() => setEditing(false)} t={t} />
      )}

      {/* ── Primary Field Actions: Scan Leaf CTA ── */}
      <ScanLeafCTA
        fieldId={field.id}
        fieldName={translateDynamic(field.name)}
        cropName={primaryCrop ? translateDynamic(primaryCrop.name) : undefined}
        language={language}
        t={t}
      />

      {/* ── Crop Card ── */}
      <CropCard
        crops={field.crops || []}
        fieldId={field.id}
        language={language}
        t={t}
        translateDynamic={translateDynamic}
      />

      {/* ── KPI Strip ── */}
      <FieldKPIStrip
        field={field}
        analytics={analytics}
        language={language}
        t={t}
        formatNumber={formatNumber}
      />

      {/* ── Two-column layout on desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field Conditions (sensor data) */}
        <FieldConditionsCard analytics={analytics} language={language} t={t} />

        {/* AgriSight Insight */}
        <AgriSightInsightCard analytics={analytics} fieldId={field.id} language={language} t={t} />
      </div>

      {/* ── Recent Scans ── */}
      <RecentScansSection
        analyses={field.analyses || []}
        fieldId={field.id}
        language={language}
        t={t}
        translateDynamic={translateDynamic}
      />

      {/* ── More Details Tabs ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-on-surface">
            {language === "bn" ? "বিস্তারিত তথ্য" : language === "hi" ? "विस्तृत जानकारी" : "Field Intelligence"}
          </h2>
        </div>

        {/* Tab strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {sectionTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSection(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all shrink-0 ${
                activeSection === tab.key
                  ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                  : "bg-surface-container-low text-on-surface-variant border border-outline-variant/20 hover:border-primary/40"
              }`}
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: activeSection === tab.key ? "'FILL' 1" : "'FILL' 0" }}
              >
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeSection === "overview" && (
          <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm text-on-surface">
              {language === "bn" ? "জমির বিস্তারিত" : language === "hi" ? "खेत का विवरण" : "Field Profile"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {[
                { label: t("soilType"), value: translateDynamic(field.soil_type), icon: "layers" },
                { label: t("irrigationType"), value: translateDynamic(field.irrigation_type), icon: "water_drop" },
                {
                  label: language === "bn" ? "তৈরির তারিখ" : language === "hi" ? "बनाई गई" : "Created",
                  value: new Date(field.created_at).toLocaleDateString(),
                  icon: "calendar_today",
                },
                ...(field.notes
                  ? [{ label: t("notes"), value: field.notes, icon: "notes" }]
                  : []),
              ].map((item) => (
                <div key={item.label} className="bg-surface-container-high rounded-2xl p-3 space-y-1">
                  <div className="flex items-center gap-1 text-on-surface-variant/60">
                    <span className="material-symbols-outlined text-xs">{item.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                  </div>
                  <p className="font-extrabold text-on-surface">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "ipm" && (
          <PestAndIPMCard
            cropName={primaryCrop ? primaryCrop.name : "Crop"}
            growthStage={primaryCrop?.stage || "Vegetative"}
            fieldId={field.id}
          />
        )}

        {activeSection === "irrigation" && (
          <SmartIrrigationCard
            fieldId={field.id}
            fieldName={field.name}
            cropName={primaryCrop ? primaryCrop.name : "Crop"}
            growthStage={primaryCrop?.stage || "Vegetative"}
            soilType={field.soil_type}
            irrigationType={field.irrigation_type}
          />
        )}

        {activeSection === "nutrition" && (
          <NutrientAdvisoryCard
            cropName={primaryCrop ? primaryCrop.name : "Crop"}
            growthStage={primaryCrop?.stage || "Vegetative"}
            fieldId={field.id}
          />
        )}

        {activeSection === "interventions" && (
          <InterventionTracker fieldId={field.id} />
        )}
      </div>
    </div>
  );
}
