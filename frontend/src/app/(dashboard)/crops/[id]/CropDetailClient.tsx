"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useTranslation } from "@/context/LanguageContext";
import { InterventionTracker } from "@/components/InterventionTracker";
import { SmartIrrigationCard } from "@/components/SmartIrrigationCard";
import { PestAndIPMCard } from "@/components/PestAndIPMCard";
import { NutrientAdvisoryCard } from "@/components/NutrientAdvisoryCard";
import { CropLifecycleStepper } from "@/components/CropLifecycleStepper";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Crop {
  id: string;
  name: string;
  variety: string;
  planting_date: string | null;
  growth_stage: string;
  field_name: string;
  field_id?: string;
  notes: string;
  created_at: string;
  analyses: ScanRecord[];
}

interface ScanRecord {
  id: string;
  disease: string;
  severity: string;
  created_at: string;
  image_url: string;
  result_json: any;
}

function severityScore(severity: string): number {
  const s = severity?.toLowerCase();
  if (s === "critical") return 4;
  if (s === "high" || s === "severe") return 3;
  if (s === "medium" || s === "moderate") return 2;
  if (s === "low") return 1;
  return 0;
}

function severityBadge(severity: string) {
  const s = severity?.toLowerCase();
  if (s === "critical") return "bg-error text-on-error";
  if (s === "high" || s === "severe") return "bg-error-container text-error";
  if (s === "medium" || s === "moderate") return "bg-tertiary-container text-on-tertiary-container";
  return "bg-primary-container text-on-primary-container";
}

function computeTrend(scans: ScanRecord[]): { label: string; icon: string; color: string; description: string } | null {
  if (scans.length < 2) return null;
  const recent = scans.slice(0, Math.min(3, scans.length));
  const older = scans.slice(Math.min(3, scans.length));

  const recentAvg = recent.reduce((acc, s) => acc + severityScore(s.severity), 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((acc, s) => acc + severityScore(s.severity), 0) / older.length : recentAvg;

  if (recentAvg < olderAvg - 0.5) return { label: "Improving", icon: "trending_up", color: "text-primary", description: "Severity is decreasing — your crop is recovering." };
  if (recentAvg > olderAvg + 0.5) return { label: "Worsening", icon: "trending_down", color: "text-error", description: "Severity is increasing — take action soon." };
  return { label: "Stable", icon: "trending_flat", color: "text-tertiary", description: "No significant change in health detected." };
}

function getRecurringDiseases(scans: ScanRecord[]): { disease: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const s of scans) {
    if (s.disease && !s.disease.toLowerCase().includes("healthy")) {
      counts[s.disease] = (counts[s.disease] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([disease, count]) => ({ disease, count }));
}

function TimelineBar({ scans }: { scans: ScanRecord[] }) {
  const { t, translateDynamic } = useTranslation();
  if (scans.length === 0) return null;
  const reversedScans = [...scans].reverse();

  return (
    <div className="space-y-3">
      <p className="text-xs font-black text-on-surface-variant/60 uppercase tracking-widest">{t("analysisHistory")}</p>
      <div className="flex items-end gap-1.5 h-16">
        {reversedScans.map((scan) => {
          const score = severityScore(scan.severity);
          const heights = ["h-2", "h-4", "h-8", "h-12", "h-16"];
          const heights2 = ["bg-primary/20", "bg-primary/40", "bg-tertiary/60", "bg-error/60", "bg-error"];
          return (
            <Link key={scan.id} href={`/analysis/${scan.id}`}
              title={`${translateDynamic(scan.disease || "Healthy")} · ${translateDynamic(scan.severity)}`}
              className={`flex-1 rounded-lg ${heights[score] || "h-2"} ${heights2[score] || "bg-primary/20"} hover:opacity-80 transition-opacity min-w-0`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function CropDetailClient() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { t, language, translateDynamic } = useTranslation();

  const [crop, setCrop] = useState<Crop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Crop>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || id === "preview") {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const data = await api.getCrop(id);
        setCrop(data);
        setEditForm({ notes: data.notes, growth_stage: data.growth_stage, field_name: data.field_name, field_id: data.field_id });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSave = async () => {
    if (!crop) return;
    setSaving(true);
    try {
      const updatePayload = {
        ...editForm,
        planting_date: editForm.planting_date ?? undefined,
      };
      const updated = await api.updateCrop(crop.id, updatePayload);
      setCrop({ ...crop, ...updated });
      setEditing(false);
    } catch (e: any) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!crop) return;
    if (!confirm(language === "bn" ? `"${crop.name}" মুছে ফেলতে চান?` : language === "hi" ? `क्या आप "${crop.name}" को हटाना चाहते हैं?` : `Delete "${crop.name}"?`)) return;
    try {
      await api.deleteCrop(crop.id);
      router.push("/crops");
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          <p className="text-sm text-on-surface-variant font-medium">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !crop) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-extrabold text-on-surface">{t("errorOccurred")}</h2>
          <p className="text-sm text-on-surface-variant">{error || t("noCropsYet")}</p>
          <Link href="/crops" className="inline-block px-6 py-3 bg-primary text-on-primary font-bold rounded-2xl hover:opacity-90 transition-all">
            {t("crops")}
          </Link>
        </div>
      </div>
    );
  }

  const trend = computeTrend(crop.analyses || []);
  const recurring = getRecurringDiseases(crop.analyses || []);
  const latestScan = crop.analyses?.[0];
  const isHealthy = !latestScan || latestScan.disease?.toLowerCase().includes("healthy");

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/crops" aria-label="Back to crops"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors shrink-0">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-extrabold text-on-surface tracking-tight truncate">{translateDynamic(crop.name)}</h1>
            {crop.variety && <p className="text-xs text-on-surface-variant font-medium truncate">{crop.variety}</p>}
          </div>
          <button onClick={() => setEditing(!editing)} aria-label="Edit crop"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors shrink-0">
            <span className="material-symbols-outlined text-xl">{editing ? "close" : "edit"}</span>
          </button>
          <button onClick={handleDelete} aria-label="Delete crop"
            className="w-9 h-9 rounded-full flex items-center justify-center text-error hover:bg-error-container/30 transition-colors shrink-0">
            <span className="material-symbols-outlined text-xl">delete</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 py-6 pb-32 space-y-6">
        {/* ── Overview card ── */}
        <div className={`rounded-[2rem] p-6 sm:p-8 border ${isHealthy ? "bg-primary/5 border-primary/15" : "bg-surface-container-lowest border-outline-variant/20"} space-y-4`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">{translateDynamic(crop.name)}</h2>
              {crop.variety && <p className="text-sm text-on-surface-variant font-medium">{crop.variety}</p>}
            </div>
            {isHealthy ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-full text-xs font-black">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                {t("healthy")}
              </span>
            ) : (
              <span className={`px-3 py-1.5 rounded-full text-xs font-black ${severityBadge(latestScan?.severity)}`}>
                {translateDynamic(latestScan?.severity || "Unknown")}
              </span>
            )}
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2">
            {crop.growth_stage && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-surface-container-highest rounded-full text-xs font-bold text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">energy_savings_leaf</span>{translateDynamic(crop.growth_stage)}
              </span>
            )}
            {crop.field_name && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-surface-container-highest rounded-full text-xs font-bold text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">landscape</span>{crop.field_name}
              </span>
            )}
            {crop.planting_date && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-surface-container-highest rounded-full text-xs font-bold text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                {new Date(crop.planting_date).toLocaleDateString(language, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>

          {/* Notes */}
          {!editing && crop.notes && (
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">{crop.notes}</p>
          )}

          {/* Edit form */}
          {editing && (
            <div className="space-y-3 pt-2 border-t border-outline-variant/20">
              <input value={editForm.growth_stage || ""} onChange={(e) => setEditForm((f) => ({ ...f, growth_stage: e.target.value }))}
                placeholder={t("growthStage")} className="w-full bg-surface-container-high rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={editForm.field_name || ""} onChange={(e) => setEditForm((f) => ({ ...f, field_name: e.target.value }))}
                placeholder={t("fields")} className="w-full bg-surface-container-high rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30" />
              <textarea value={editForm.notes || ""} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder={t("notes")} rows={3} className="w-full bg-surface-container-high rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 bg-primary text-on-primary font-bold rounded-2xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 text-sm">
                {saving ? t("loading") : t("save")}
              </button>
            </div>
          )}
        </div>

        {/* ── Health Trend ── */}
        {trend && (
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-[1.5rem] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-lg ${trend.color}`}>{trend.icon}</span>
              <h3 className="text-xs font-black text-on-surface uppercase tracking-widest">{t("overallHealth")}</h3>
              <span className={`ml-auto text-xs font-black uppercase tracking-widest ${trend.color}`}>{translateDynamic(trend.label)}</span>
            </div>
            <p className="text-sm text-on-surface-variant font-medium">{translateDynamic(trend.description)}</p>
            <TimelineBar scans={crop.analyses || []} />
          </div>
        )}

        {/* ── Crop Lifecycle & Phenology Intelligence (Phase 5) ── */}
        <CropLifecycleStepper
          cropId={crop.id}
          cropName={crop.name}
          growthStage={crop.growth_stage}
          plantingDate={crop.planting_date}
          onStageUpdated={(newStage) => {
            setCrop((prev) => (prev ? { ...prev, growth_stage: newStage } : prev));
          }}
        />

        {/* ── Smart Irrigation Intelligence (Phase 2) ── */}
        <SmartIrrigationCard
          cropName={crop.name}
          growthStage={crop.growth_stage || "Vegetative"}
          cropId={crop.id}
          fieldName={crop.field_name}
        />

        {/* ── Pest & Integrated Pest Management (IPM) Intelligence (Phase 3) ── */}
        <PestAndIPMCard
          cropName={crop.name}
          growthStage={crop.growth_stage || "Vegetative"}
          cropId={crop.id}
          fieldId={crop.field_id}
        />

        {/* ── Nutrient Deficiency & Fertilizer Intelligence (Phase 4) ── */}
        <NutrientAdvisoryCard
          cropName={crop.name}
          growthStage={crop.growth_stage || "Vegetative"}
          cropId={crop.id}
          fieldId={crop.field_id}
        />

        {/* ── Recurring diseases ── */}
        {recurring.length > 0 && (
          <div className="bg-error-container/20 border border-error/15 rounded-[1.5rem] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <h3 className="text-xs font-black text-on-surface uppercase tracking-widest">{t("persistentCondition")}</h3>
            </div>
            <div className="space-y-2">
              {recurring.map(({ disease, count }) => (
                <div key={disease} className="flex items-center justify-between">
                  <span className="text-sm text-on-surface font-semibold">{translateDynamic(disease)}</span>
                  <span className="px-2 py-0.5 bg-error-container text-error text-xs font-black rounded-full">
                    {count}×
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recent Scans ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-on-surface uppercase tracking-widest">{t("analysisHistory")}</h3>
            <div className="flex items-center gap-2">
              {crop.analyses && crop.analyses.length >= 2 && (
                <Link
                  href={`/analysis/compare?scan1=${crop.analyses[1].id}&scan2=${crop.analyses[0].id}`}
                  className="px-3 py-1 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold rounded-full transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">compare</span>
                  {t("compareButton")}
                </Link>
              )}
              <span className="text-xs text-on-surface-variant font-bold">{crop.analyses?.length || 0}</span>
            </div>
          </div>

          {!crop.analyses || crop.analyses.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-[1.5rem] p-6 flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">photo_camera</span>
              <p className="text-sm text-on-surface-variant font-medium">{t("noHistory")}</p>
              <Link href="/scan" className="text-xs font-bold text-primary hover:underline">{t("scanLeaf")}</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {crop.analyses.map((scan) => (
                <Link key={scan.id} href={`/analysis/${scan.id}`}
                  className="flex items-center gap-4 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-4 hover:shadow-sm hover:border-primary/20 transition-all group">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container-high shrink-0 relative">
                    {scan.image_url && (
                      <Image src={scan.image_url} alt={scan.disease || "Scan"} fill className="object-cover" sizes="56px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                      {translateDynamic(scan.disease || "Healthy")}
                    </p>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                      {new Date(scan.created_at).toLocaleDateString(language, { dateStyle: "medium" })}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 ${severityBadge(scan.severity)}`}>
                    {translateDynamic(scan.severity || "Low")}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant text-lg shrink-0">chevron_right</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Intervention & Treatment Log */}
        <InterventionTracker cropId={crop.id} title={`${t("actionChecklistTitle")} · ${translateDynamic(crop.name)}`} />

        {/* Scan CTA */}
        <Link href={`/scan?crop_id=${crop.id}`}
          className="block w-full py-4 bg-primary text-on-primary font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_a_photo</span>
          {t("scanLeaf")} ({translateDynamic(crop.name)})
        </Link>
      </div>
    </div>
  );
}
