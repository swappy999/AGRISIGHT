"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { api } from "@/lib/apiClient";
import Link from "next/link";

interface OfficerOverview {
  region_name: string;
  total_fields: number;
  healthy_fields: number;
  at_risk_fields: number;
  critical_fields: number;
  regional_health_index: number;
  active_hotspots: Array<{
    disease: string;
    detections: number;
    severity: string;
    last_detected?: string;
  }>;
  priority_recommendation: string;
}

export default function OfficerDashboardPage() {
  const { language, t } = useTranslation();

  const [overview, setOverview] = useState<OfficerOverview | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "healthy" | "at_risk" | "critical">("all");
  const [triageNote, setTriageNote] = useState<Record<string, string>>({});
  const [resolvedEscalations, setResolvedEscalations] = useState<Set<string>>(new Set());

  const loadOfficerData = async () => {
    try {
      setLoading(true);
      const [ovData, fData, escData] = await Promise.all([
        api.getOfficerOverview().catch(() => null),
        api.getOfficerFields().catch(() => []),
        api.getExpertEscalations().catch(() => []),
      ]);

      if (ovData) {
        setOverview(ovData);
      } else {
        setOverview({
          region_name: "Eastern Agro-Climatic Zone (Cluster 4)",
          total_fields: 18,
          healthy_fields: 12,
          at_risk_fields: 4,
          critical_fields: 2,
          regional_health_index: 82,
          active_hotspots: [
            { disease: "Early Blight", detections: 7, severity: "High", last_detected: new Date().toISOString() },
            { disease: "Aphid Infestation", detections: 5, severity: "Medium", last_detected: new Date().toISOString() },
            { disease: "Leaf Spot", detections: 3, severity: "Low", last_detected: new Date().toISOString() },
          ],
          priority_recommendation: "Coordinate targeted fungicide spray advisory across Zone A & C to halt early fungal blight transmission.",
        });
      }

      setFields(Array.isArray(fData) && fData.length > 0 ? fData : [
        { id: "f-1", name: "North Plot - Alpha", area_acres: 2.5, soil_type: "Alluvial", irrigation_type: "Drip", health_score: 92, location_name: "Sector 3" },
        { id: "f-2", name: "Riverside Tomato Plot", area_acres: 1.8, soil_type: "Loamy", irrigation_type: "Sprinkler", health_score: 68, location_name: "Sector 1" },
        { id: "f-3", name: "Eastern Ridge Plot", area_acres: 3.2, soil_type: "Clay Loam", irrigation_type: "Flood", health_score: 48, location_name: "Sector 4" },
      ]);

      setEscalations(Array.isArray(escData) ? escData : []);
    } catch (err) {
      console.warn("Failed to load officer dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfficerData();
  }, []);

  const handleResolveEscalation = (id: string) => {
    setResolvedEscalations((prev) => new Set(prev).add(id));
  };

  const filteredFields = fields.filter((f) => {
    const matchesSearch = (f.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.location_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const score = f.health_score ?? 85;
    if (statusFilter === "healthy") return score >= 80;
    if (statusFilter === "at_risk") return score >= 55 && score < 80;
    if (statusFilter === "critical") return score < 55;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-pulse">
        <div className="h-44 bg-surface-container-low rounded-[2.5rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-surface-container-low rounded-[2rem]" />
          <div className="lg:col-span-2 h-64 bg-surface-container-low rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* ── Top Regional Overview Banner ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/95 to-primary-container p-6 sm:p-10 text-on-primary shadow-xl">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white">
                  {language === "bn" ? "কৃষি সম্প্রসারণ কর্মকর্তা ভিউ" : language === "hi" ? "कृषि विस्तार अधिकारी" : "Extension Officer Station"}
                </span>
                <span className="flex items-center gap-1 text-xs text-white/80 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Regional Telemetry
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                {overview?.region_name || "Regional Agro-Climatic Zone"}
              </h1>
            </div>

            {/* Health Index Meter */}
            <div className="bg-white/15 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 flex items-center gap-4 self-start md:self-auto">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-white/80">Regional Health Index</p>
                <p className="text-3xl font-black text-white">{overview?.regional_health_index ?? 84}/100</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield_with_heart
                </span>
              </div>
            </div>
          </div>

          {/* Regional Summary Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-white/70">Monitored Fields</p>
              <p className="text-2xl font-black text-white mt-1">{overview?.total_fields ?? 0}</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Healthy Plots</p>
              <p className="text-2xl font-black text-emerald-300 mt-1">{overview?.healthy_fields ?? 0}</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">At-Risk Plots</p>
              <p className="text-2xl font-black text-amber-300 mt-1">{overview?.at_risk_fields ?? 0}</p>
            </div>
            <div className="bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-wider text-rose-300">Critical Attention</p>
              <p className="text-2xl font-black text-rose-300 mt-1">{overview?.critical_fields ?? 0}</p>
            </div>
          </div>

          {/* Priority Advisory Banner */}
          {overview?.priority_recommendation && (
            <div className="bg-black/25 backdrop-blur-sm p-4 rounded-2xl border border-white/15 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-300 text-xl shrink-0 mt-0.5">campaign</span>
              <p className="text-xs sm:text-sm font-semibold text-white/95 leading-relaxed">
                <strong className="text-amber-300 uppercase tracking-wider text-xs mr-2">Officer Action Advisory:</strong>
                {overview.priority_recommendation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Hotspot Radar & Escalations Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Regional Hotspots Radar */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">radar</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-on-surface">Pathogen Radar</h3>
                <p className="text-[11px] text-on-surface-variant font-medium">Aggregated Disease Hotspots</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {overview?.active_hotspots && overview.active_hotspots.length > 0 ? (
              overview.active_hotspots.map((hs, i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/20 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-on-surface">{hs.disease}</p>
                    <p className="text-[10px] font-bold text-on-surface-variant">
                      {hs.detections} cluster detections in region
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      hs.severity === "Critical" || hs.severity === "High"
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                        : hs.severity === "Medium"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    }`}
                  >
                    {hs.severity}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-on-surface-variant text-center py-6">No high-severity outbreaks reported.</p>
            )}
          </div>
        </div>

        {/* 2. Expert Review Escalation Queue */}
        <div className="lg:col-span-2 bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">assignment_late</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-on-surface">Expert Escalation Queue</h3>
                <p className="text-[11px] text-on-surface-variant font-medium">Ambiguous or Low-Confidence Farmer Scans</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {escalations.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/15 space-y-1">
                <span className="material-symbols-outlined text-3xl text-emerald-600">task_alt</span>
                <p className="text-xs font-bold text-on-surface">Escalation Queue Clear</p>
                <p className="text-[11px] text-on-surface-variant">No pending low-confidence diagnoses requiring agronomist review.</p>
              </div>
            ) : (
              escalations.map((esc) => {
                const isResolved = resolvedEscalations.has(esc.id);
                return (
                  <div
                    key={esc.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isResolved
                        ? "bg-emerald-500/5 border-emerald-500/30 opacity-75"
                        : "bg-surface-container-lowest border-outline-variant/20"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 text-[10px] font-black uppercase">
                            AI Confidence: {esc.confidence}%
                          </span>
                          <h4 className="text-xs font-extrabold text-on-surface">{esc.suspected_issue}</h4>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Farmer Note: &ldquo;{esc.farmer_note || "Leaf discoloration observed on lower branches"}&rdquo;
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isResolved ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Reviewed
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleResolveEscalation(esc.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                          >
                            Prescribe Advisory
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Regional Fields Registry & Inspector ── */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-on-surface">Regional Field Registry</h3>
            <p className="text-xs text-on-surface-variant font-medium">
              Inspect and monitor field health scores, irrigation methods, and soil profiles across all registered plots.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Search plot or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  statusFilter === "all" ? "bg-primary text-on-primary" : "text-on-surface-variant"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("healthy")}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  statusFilter === "healthy" ? "bg-emerald-600 text-white" : "text-on-surface-variant"
                }`}
              >
                Healthy
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("at_risk")}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  statusFilter === "at_risk" ? "bg-amber-600 text-white" : "text-on-surface-variant"
                }`}
              >
                At Risk
              </button>
            </div>
          </div>
        </div>

        {/* Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFields.map((field) => {
            const score = field.health_score ?? 85;
            const isGood = score >= 80;
            const isAtRisk = score >= 55 && score < 80;

            return (
              <div
                key={field.id}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 hover:border-primary/40 transition-all hover:shadow-md space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-on-surface">{field.name}</h4>
                    <p className="text-[11px] text-on-surface-variant font-medium">
                      {field.location_name || "Regional Cluster"} · {field.area_acres || 1.0} Acres
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      isGood
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : isAtRisk
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {isGood ? "Healthy" : isAtRisk ? "At Risk" : "Critical"}
                  </span>
                </div>

                {/* Health Meter Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-on-surface-variant">Plot Health Index</span>
                    <span className={isGood ? "text-emerald-600" : isAtRisk ? "text-amber-600" : "text-rose-600"}>
                      {score}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isGood ? "bg-emerald-500" : isAtRisk ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
                    />
                  </div>
                </div>

                {/* Soil & Irrigation Tags */}
                <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                    {field.soil_type || "Alluvial Soil"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                    {field.irrigation_type || "Drip System"}
                  </span>
                </div>

                <div className="pt-2 border-t border-outline-variant/15 flex justify-end">
                  <Link
                    href={`/fields?id=${field.id}`}
                    className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Field Telemetry</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
