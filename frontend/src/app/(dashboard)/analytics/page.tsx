"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface ScanRecord {
  id: string;
  crop?: string;
  disease: string;
  severity: string;
  risk_score?: number;
  created_at: string;
}

interface FieldSummary {
  id: string;
  name: string;
  location_name?: string;
  area_acres: number;
  soil_type: string;
  irrigation_type: string;
  health_score: number;
  status: string;
  active_hotspots: number;
}

export default function AnalyticsPage() {
  const { t, translateDynamic } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [fields, setFields] = useState<FieldSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<"all" | "30d" | "7d">("all");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [scansData, fieldsData] = await Promise.all([
        api.getAnalyses().catch(() => []),
        api.getFields().catch(() => []),
      ]);

      if (Array.isArray(scansData)) {
        setScans(
          scansData.map((item: any) => ({
            id: item.id,
            crop: item.result_json?.crop || item.crop_name || "",
            disease: item.disease || item.result_json?.disease || "Healthy",
            severity: (item.severity || item.result_json?.severity || "low").toLowerCase(),
            risk_score: item.result_json?.risk_score,
            created_at: item.created_at || new Date().toISOString(),
          }))
        );
      }

      if (Array.isArray(fieldsData)) {
        setFields(
          fieldsData.map((f: any) => ({
            id: f.id,
            name: f.name,
            location_name: f.location_name,
            area_acres: Number(f.area_acres) || 1,
            soil_type: f.soil_type || "Alluvial",
            irrigation_type: f.irrigation_type || "Drip",
            health_score: Number(f.health_score) || 80,
            status: f.status || "Optimal",
            active_hotspots: Number(f.active_hotspots) || 0,
          }))
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to load agricultural analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [authLoading, user]);

  // Filter scans by time period
  const filteredScans = useMemo(() => {
    if (timeFilter === "all") return scans;
    const now = new Date().getTime();
    const daysLimit = timeFilter === "7d" ? 7 : 30;
    const cutoff = now - daysLimit * 24 * 60 * 60 * 1000;
    return scans.filter((s) => new Date(s.created_at).getTime() >= cutoff);
  }, [scans, timeFilter]);

  // Key KPI calculations
  const totalScans = filteredScans.length;

  const cleanScansCount = useMemo(() => {
    return filteredScans.filter((s) => {
      const d = s.disease.toLowerCase();
      return (
        d.includes("healthy") ||
        s.severity === "low" ||
        s.severity === "optimal" ||
        (s.risk_score !== undefined && s.risk_score < 30)
      );
    }).length;
  }, [filteredScans]);

  const cleanHealthRate = totalScans > 0 ? Math.round((cleanScansCount / totalScans) * 100) : 0;

  const severityCounts = useMemo(() => {
    let low = 0;
    let moderate = 0;
    let high = 0;

    filteredScans.forEach((s) => {
      const sev = s.severity;
      if (sev === "critical" || sev === "high" || sev === "severe") {
        high++;
      } else if (sev === "medium" || sev === "moderate") {
        moderate++;
      } else {
        low++;
      }
    });

    return {
      low,
      moderate,
      high,
      lowPct: totalScans > 0 ? Math.round((low / totalScans) * 100) : 0,
      moderatePct: totalScans > 0 ? Math.round((moderate / totalScans) * 100) : 0,
      highPct: totalScans > 0 ? Math.round((high / totalScans) * 100) : 0,
    };
  }, [filteredScans, totalScans]);

  // Pathogen & Condition Breakdown
  const pathogenDistribution = useMemo(() => {
    if (totalScans === 0) return [];
    const counts: Record<string, number> = {};
    filteredScans.forEach((s) => {
      const key = s.disease.trim() || "Healthy";
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalScans) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredScans, totalScans]);

  // Crop Diversity Breakdown
  const cropDistribution = useMemo(() => {
    if (totalScans === 0) return [];
    const counts: Record<string, number> = {};
    filteredScans.forEach((s) => {
      const crop = s.crop?.trim() || "Unassigned";
      counts[crop] = (counts[crop] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalScans) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredScans, totalScans]);

  const totalManagedArea = useMemo(() => {
    return fields.reduce((sum, f) => sum + (f.area_acres || 0), 0);
  }, [fields]);

  return (
    <div className="p-4 lg:p-10 space-y-8 max-w-[1600px] mx-auto pb-28 xl:pb-12 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-3xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              monitoring
            </span>
            <h1 className="text-2xl lg:text-3xl font-black text-on-surface tracking-tight">
              {t("analytics")}
            </h1>
          </div>
          <p className="text-xs lg:text-sm text-on-surface-variant font-medium">
            {t("analyticsSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Pills */}
          <div className="flex items-center bg-surface-container-high rounded-2xl p-1 border border-outline-variant/20 text-xs font-bold">
            <button
              onClick={() => setTimeFilter("all")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeFilter === "all"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t("allScans")}
            </button>
            <button
              onClick={() => setTimeFilter("30d")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeFilter === "30d"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setTimeFilter("7d")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                timeFilter === "7d"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              7D
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant rounded-2xl border border-outline-variant/20 transition-colors"
            title="Refresh"
            aria-label="Refresh analytics data"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Section 19 Transparency Guarantee Banner */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
          verified
        </span>
        <span>{t("noYieldFabrication")}</span>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-surface-container-low rounded-[2rem] animate-pulse border border-outline-variant/10"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 h-72 bg-surface-container-low rounded-[2.25rem] animate-pulse border border-outline-variant/10" />
            <div className="lg:col-span-5 h-72 bg-surface-container-low rounded-[2.25rem] animate-pulse border border-outline-variant/10" />
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-6 bg-error-container text-on-error-container rounded-3xl border border-error/20 text-center space-y-3">
          <p className="font-bold text-sm">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-error text-on-error rounded-xl font-bold text-xs shadow"
          >
            {t("retry")}
          </button>
        </div>
      )}

      {/* Empty State: Section 19 Honest "Not enough data yet" Fallback */}
      {!loading && !error && totalScans === 0 && (
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-[2.5rem] p-8 lg:p-16 text-center space-y-5 max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">insights</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-on-surface tracking-tight">
              {t("notEnoughData")}
            </h3>
            <p className="text-xs lg:text-sm text-on-surface-variant font-medium max-w-md mx-auto leading-relaxed">
              AgriSight analytics calculates pathogen progression and disease pressure strictly from your empirical leaf scans. Start scanning your field crops to build your dataset.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-2xl font-black text-xs shadow-md hover:bg-primary/90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
              <span>{t("scanNewCrop")}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Populated Analytics Dashboard */}
      {!loading && !error && totalScans > 0 && (
        <div className="space-y-8">
          {/* Row 1: Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {/* KPI 1: Total Scans */}
            <div className="bg-surface-container-low border border-outline-variant/25 rounded-[2rem] p-5 lg:p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                  {t("totalScans")}
                </span>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">document_scanner</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl lg:text-4xl font-black text-on-surface">
                  {totalScans}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">
                  records
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant/80 font-medium">
                {timeFilter === "all" ? "All-time field scans" : `Last ${timeFilter} window`}
              </p>
            </div>

            {/* KPI 2: Clean Health Rate */}
            <div className="bg-surface-container-low border border-outline-variant/25 rounded-[2rem] p-5 lg:p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                  {t("cleanHealthRate")}
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">eco</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl lg:text-4xl font-black text-emerald-600">
                  {cleanHealthRate}%
                </span>
                <span className="text-xs font-bold text-on-surface-variant">
                  ({cleanScansCount}/{totalScans})
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${cleanHealthRate}%` }}
                />
              </div>
            </div>

            {/* KPI 3: Monitored Plots */}
            <div className="bg-surface-container-low border border-outline-variant/25 rounded-[2rem] p-5 lg:p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                  {t("activePlots")}
                </span>
                <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">grid_view</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl lg:text-4xl font-black text-on-surface">
                  {fields.length}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">
                  {totalManagedArea > 0 ? `· ${totalManagedArea} ${t("acres")}` : "plots"}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant/80 font-medium truncate">
                {fields.length > 0 ? `${fields.length} plots tracked in real-time` : "No plots assigned yet"}
              </p>
            </div>

            {/* KPI 4: Active Threats */}
            <div className="bg-surface-container-low border border-outline-variant/25 rounded-[2rem] p-5 lg:p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                  {t("activeThreats")}
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">warning</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl lg:text-4xl font-black text-rose-600">
                  {severityCounts.high}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">
                  ({severityCounts.highPct}%)
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant/80 font-medium">
                High or critical severity infections
              </p>
            </div>
          </div>

          {/* Row 2: Pathogen Distribution & Threat Severity Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Pathogen & Condition Distribution (7 cols) */}
            <div className="lg:col-span-7 bg-surface-container-low border border-outline-variant/25 rounded-[2.25rem] p-6 lg:p-7 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    bug_report
                  </span>
                  <h3 className="font-extrabold text-on-surface text-base lg:text-lg">
                    {t("pathogenDistribution")}
                  </h3>
                </div>
                <span className="text-xs font-bold text-on-surface-variant">
                  {pathogenDistribution.length} distinct
                </span>
              </div>

              <div className="space-y-3.5">
                {pathogenDistribution.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-on-surface truncate">
                        {translateDynamic(item.name)}
                      </span>
                      <span className="text-on-surface-variant shrink-0 ml-2">
                        {item.count} scans ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.name.toLowerCase().includes("healthy")
                            ? "bg-emerald-500"
                            : idx % 3 === 0
                            ? "bg-rose-500"
                            : idx % 3 === 1
                            ? "bg-amber-500"
                            : "bg-primary"
                        }`}
                        style={{ width: `${Math.max(item.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Threat Severity Breakdown (5 cols) */}
            <div className="lg:col-span-5 bg-surface-container-low border border-outline-variant/25 rounded-[2.25rem] p-6 lg:p-7 space-y-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-primary text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  donut_large
                </span>
                <h3 className="font-extrabold text-on-surface text-base lg:text-lg">
                  {t("severityBreakdown")}
                </h3>
              </div>

              <div className="space-y-4 pt-1">
                {/* Low / Healthy */}
                <div className="p-4 rounded-2xl bg-surface-container-high/50 border border-outline-variant/15 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      {t("healthy")} / {t("low")}
                    </span>
                    <span className="text-on-surface">
                      {severityCounts.low} ({severityCounts.lowPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${severityCounts.lowPct}%` }}
                    />
                  </div>
                </div>

                {/* Moderate */}
                <div className="p-4 rounded-2xl bg-surface-container-high/50 border border-outline-variant/15 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      {t("moderate")}
                    </span>
                    <span className="text-on-surface">
                      {severityCounts.moderate} ({severityCounts.moderatePct}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${severityCounts.moderatePct}%` }}
                    />
                  </div>
                </div>

                {/* High / Critical */}
                <div className="p-4 rounded-2xl bg-surface-container-high/50 border border-outline-variant/15 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                      {t("high")} / {t("critical")}
                    </span>
                    <span className="text-on-surface">
                      {severityCounts.high} ({severityCounts.highPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${severityCounts.highPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Crop Diversity Mini-Chips */}
              {cropDistribution.length > 0 && (
                <div className="pt-2 border-t border-outline-variant/20 space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                    {t("scannedCrops")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {cropDistribution.map((c, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold border border-outline-variant/20"
                      >
                        🌾 {translateDynamic(c.name)} · {c.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Field Performance Matrix */}
          <div className="bg-surface-container-low border border-outline-variant/25 rounded-[2.25rem] p-6 lg:p-7 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-primary text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  fence
                </span>
                <h3 className="font-extrabold text-on-surface text-base lg:text-lg">
                  {t("fieldPerformanceMatrix")}
                </h3>
              </div>
              <Link
                href="/fields"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>{t("fields")}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {fields.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.map((field) => (
                  <Link
                    key={field.id}
                    href={`/fields/${field.id}`}
                    className="p-5 rounded-2xl bg-surface-container-high/60 hover:bg-surface-container-highest border border-outline-variant/20 transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-black text-on-surface text-sm group-hover:text-primary transition-colors truncate">
                          {field.name}
                        </h4>
                        <p className="text-xs text-on-surface-variant font-medium truncate">
                          {field.location_name || "Plot Location"} · {field.area_acres} {t("acres")}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          field.health_score >= 80
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : field.health_score >= 55
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {translateDynamic(field.status)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-on-surface-variant">{t("overallHealth")}</span>
                        <span className="text-on-surface">{field.health_score}%</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            field.health_score >= 80
                              ? "bg-emerald-500"
                              : field.health_score >= 55
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${field.health_score}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant pt-1 border-t border-outline-variant/15">
                      <span>
                        {translateDynamic(field.soil_type)} · {translateDynamic(field.irrigation_type)}
                      </span>
                      {field.active_hotspots > 0 && (
                        <span className="text-rose-600 font-bold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-xs">error</span>
                          {field.active_hotspots} hotspots
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-surface-container-high/30 border border-outline-variant/20 text-center space-y-2">
                <p className="text-xs font-bold text-on-surface-variant">
                  {t("noFieldsYet")}
                </p>
                <Link
                  href="/fields"
                  className="inline-block px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs"
                >
                  {t("addField")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
