"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useTranslation } from "@/context/LanguageContext";
import { FieldHealthMap, HotspotPin, ZoneData } from "@/components/FieldHealthMap";
import { InterventionTracker } from "@/components/InterventionTracker";
import { SmartIrrigationCard } from "@/components/SmartIrrigationCard";
import { PestAndIPMCard } from "@/components/PestAndIPMCard";
import { NutrientAdvisoryCard } from "@/components/NutrientAdvisoryCard";

interface FieldDetail {
  id: string;
  name: string;
  location_name: string;
  latitude: number;
  longitude: number;
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
  hotspots: HotspotPin[];
  zones: ZoneData[];
}

export function FieldDetailClient() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { t, language, translateDynamic, formatNumber } = useTranslation();

  // Tab Filter Navigation (Section 16 of a4.md)
  const [activeTab, setActiveTab] = useState<"all" | "map" | "water_soil" | "ipm" | "scans">("all");

  const [field, setField] = useState<FieldDetail | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FieldDetail>>({});
  const [saving, setSaving] = useState(false);

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
      setEditForm({
        name: fieldData.name,
        location_name: fieldData.location_name,
        area_acres: fieldData.area_acres,
        soil_type: fieldData.soil_type,
        irrigation_type: fieldData.irrigation_type,
        notes: fieldData.notes,
      });
    } catch (err: any) {
      setError(err.message || "Failed to load field details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!field) return;
    try {
      setSaving(true);
      await api.updateField(field.id, editForm as any);
      setEditing(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update field profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!field) return;
    if (!confirm(language === "bn" ? `আপনি কি "${field.name}" মুছে ফেলতে নিশ্চিত?` : language === "hi" ? `क्या आप "${field.name}" को हटाना चाहते हैं?` : `Are you sure you want to delete "${field.name}"?`)) return;
    try {
      await api.deleteField(field.id);
      router.push("/fields");
    } catch (err: any) {
      alert(err.message || "Failed to delete field.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
          <p className="text-sm font-bold text-on-surface-variant">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/30 text-center max-w-md space-y-4">
          <span className="material-symbols-outlined text-4xl text-rose-500">error</span>
          <h2 className="text-xl font-black text-on-surface">{t("errorOccurred")}</h2>
          <p className="text-xs text-on-surface-variant">{error || "Could not retrieve field data."}</p>
          <Link href="/fields" className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs inline-block">
            {t("fields")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-12 space-y-8 max-w-[1600px] mx-auto pb-28 xl:pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/fields"
            className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            {t("fields")}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-on-surface">{translateDynamic(field.name)}</h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                field.health_score >= 80
                  ? "bg-emerald-500/15 text-emerald-700"
                  : field.health_score >= 55
                  ? "bg-amber-500/15 text-amber-700"
                  : "bg-rose-500/20 text-rose-700"
              }`}
            >
              {translateDynamic(field.status)} · {formatNumber(field.health_score)}% FHI
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-medium">
            {translateDynamic(field.location_name || "Plot Location")} · {formatNumber(field.area_acres)} {t("acres")} · {t("soilType")}: {translateDynamic(field.soil_type)} · {t("irrigationType")}: {translateDynamic(field.irrigation_type)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            {editing ? t("cancel") : t("edit")}
          </button>
          <button
            onClick={handleDelete}
            className="p-2.5 text-rose-600 hover:bg-rose-500/10 rounded-2xl transition-colors border border-rose-500/20"
            title="Delete Field"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>

      {/* Edit Form Modal Drawer */}
      {editing && (
        <form onSubmit={handleUpdate} className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 space-y-4 animate-in fade-in duration-200">
          <h3 className="font-extrabold text-on-surface text-base">{t("edit")} {t("fields")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-black text-on-surface-variant uppercase tracking-wider mb-1">{t("fieldName")}</label>
              <input
                type="text"
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface outline-none border border-outline-variant/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-on-surface-variant uppercase tracking-wider mb-1">{t("location")}</label>
              <input
                type="text"
                value={editForm.location_name || ""}
                onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface outline-none border border-outline-variant/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-on-surface-variant uppercase tracking-wider mb-1">{t("area")} ({t("acres")})</label>
              <input
                type="number"
                step="0.1"
                value={editForm.area_acres || 1}
                onChange={(e) => setEditForm({ ...editForm, area_acres: parseFloat(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface outline-none border border-outline-variant/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-on-surface-variant uppercase tracking-wider mb-1">{t("soilType")}</label>
              <input
                type="text"
                value={editForm.soil_type || ""}
                onChange={(e) => setEditForm({ ...editForm, soil_type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface outline-none border border-outline-variant/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-on-surface-variant uppercase tracking-wider mb-1">{t("irrigationType")}</label>
              <input
                type="text"
                value={editForm.irrigation_type || ""}
                onChange={(e) => setEditForm({ ...editForm, irrigation_type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-container-high rounded-xl text-sm font-bold text-on-surface outline-none border border-outline-variant/30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs shadow-md hover:bg-primary/90"
            >
              {saving ? t("loading") : t("save")}
            </button>
          </div>
        </form>
      )}

      {/* Top Filter Tabs (Section 16 of a4.md) */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-container-high rounded-2xl border border-outline-variant/30 text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "all"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
          }`}
        >
          <span className="material-symbols-outlined text-sm">dashboard</span>
          <span>{language === "bn" ? "সারসংক্ষেপ" : language === "hi" ? "सारांश" : "Overview"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("map")}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "map"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
          }`}
        >
          <span className="material-symbols-outlined text-sm">map</span>
          <span>{t("fieldHealthMap")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("water_soil")}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "water_soil"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
          }`}
        >
          <span className="material-symbols-outlined text-sm">water_drop</span>
          <span>{language === "bn" ? "সেচ ও পুষ্টি" : language === "hi" ? "सिंचाई व पोषण" : "Water & Soil"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ipm")}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "ipm"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
          }`}
        >
          <span className="material-symbols-outlined text-sm">eco</span>
          <span>{t("btnIpm")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("scans")}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "scans"
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
          }`}
        >
          <span className="material-symbols-outlined text-sm">history</span>
          <span>{t("analysisHistory")} ({field.analyses?.length || 0})</span>
        </button>
      </div>

      {/* 1. Crop + Growth Stage Banner */}
      {(activeTab === "all" || activeTab === "ipm") && (
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
              <h3 className="font-extrabold text-on-surface text-base">{t("crops")} ({field.crops?.length || 0})</h3>
            </div>

            <Link
              href="/crops/new"
              className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t("addCrop")}
            </Link>
          </div>

          {field.crops && field.crops.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {field.crops.map((crop) => (
                <Link
                  key={crop.id}
                  href={`/crops/${crop.id}`}
                  className="p-3.5 rounded-2xl bg-surface-container-high/60 hover:bg-surface-container-highest border border-outline-variant/20 transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-on-surface text-sm group-hover:text-primary transition-colors truncate">
                      🌿 {translateDynamic(crop.name)}
                    </h4>
                    <p className="text-xs text-on-surface-variant font-semibold truncate">
                      {crop.variety ? `${translateDynamic(crop.variety)} · ` : ""}{translateDynamic(crop.growth_stage) || translateDynamic("Active Growth")}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform text-base shrink-0">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant font-medium py-1">
              {t("noCropsYet")}
            </p>
          )}
        </div>
      )}

      {/* 2. Health Summary & Survival Metrics */}
      {(activeTab === "all" || activeTab === "map") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Health Score & Survival Probability */}
          <div className="lg:col-span-5 bg-surface-container-low border border-outline-variant/30 rounded-[2.25rem] p-6 space-y-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                analytics
              </span>
              <h3 className="font-extrabold text-on-surface text-base">{t("overallHealth")}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-highest/40 p-4 rounded-2xl border border-outline-variant/20">
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">{t("overallHealth")}</p>
                <p className="text-3xl font-black text-primary mt-1">{field.health_score}%</p>
              </div>

              <div className="bg-surface-container-highest/40 p-4 rounded-2xl border border-outline-variant/20">
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">{t("recoveryChance")}</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">{field.survival_estimate}%</p>
              </div>
            </div>

            {/* Quadrant Health Bars */}
            <div className="space-y-2.5 pt-1">
              <p className="text-xs font-black text-on-surface uppercase tracking-wider">{t("fieldHealthMap")}</p>
              {(field.zones || []).map((zone, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-on-surface">
                    <span>{translateDynamic(zone.name)}</span>
                    <span className={zone.health >= 80 ? "text-emerald-600" : "text-amber-600"}>{formatNumber(zone.health)}% · {translateDynamic(zone.status)}</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        zone.health >= 80 ? "bg-emerald-500" : zone.health >= 55 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${zone.health}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Targeted Field Action Checklist */}
          <div className="lg:col-span-7 bg-surface-container-low border border-outline-variant/30 rounded-[2.25rem] p-6 space-y-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                checklist
              </span>
              <h3 className="font-extrabold text-on-surface text-base">{t("actionChecklistTitle")}</h3>
            </div>

            <div className="space-y-3">
              {analytics?.action_checklist && analytics.action_checklist.length > 0 ? (
                analytics.action_checklist.map((act: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                      act.priority === "High"
                        ? "bg-rose-500/10 border-rose-500/25 text-on-surface"
                        : "bg-surface-container-highest/40 border-outline-variant/20 text-on-surface"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                        act.priority === "High"
                          ? "bg-rose-600 text-white"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm">{act.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            act.priority === "High"
                              ? "bg-rose-500/20 text-rose-700"
                              : "bg-primary/15 text-primary"
                          }`}
                        >
                          {act.priority}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant font-medium mt-1 leading-relaxed">{act.detail}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-700 font-bold">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  <span>{t("healthy")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Spatial Field Health Map Canvas */}
      {(activeTab === "all" || activeTab === "map") && (
        <FieldHealthMap
          fieldName={field.name}
          areaAcres={field.area_acres}
          healthScore={field.health_score}
          hotspots={field.hotspots || []}
          zones={field.zones || []}
          soilType={field.soil_type}
          irrigationType={field.irrigation_type}
        />
      )}

      {/* 4. Smart Irrigation Intelligence */}
      {(activeTab === "all" || activeTab === "water_soil") && (
        <SmartIrrigationCard
          cropName={field.crops?.[0]?.name || "Field Crops"}
          growthStage={field.crops?.[0]?.growth_stage || "Active Growth"}
          fieldId={field.id}
          fieldName={field.name}
          soilType={field.soil_type}
          irrigationType={field.irrigation_type}
        />
      )}

      {/* 5. Pest & Integrated Pest Management (IPM) Intelligence */}
      {(activeTab === "all" || activeTab === "ipm") && (
        <PestAndIPMCard
          cropName={field.crops?.[0]?.name || "Tomato"}
          growthStage={field.crops?.[0]?.growth_stage || "Active Growth"}
          fieldId={field.id}
          cropId={field.crops?.[0]?.id}
        />
      )}

      {/* 6. Nutrient Deficiency & Fertilizer Advisory */}
      {(activeTab === "all" || activeTab === "water_soil") && (
        <NutrientAdvisoryCard
          cropName={field.crops?.[0]?.name || "Tomato"}
          growthStage={field.crops?.[0]?.growth_stage || "Active Growth"}
          fieldId={field.id}
          cropId={field.crops?.[0]?.id}
        />
      )}

      {/* 7. Geotagged Scans History */}
      {(activeTab === "all" || activeTab === "scans") && (
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2.25rem] p-6 lg:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                history
              </span>
              <h3 className="font-extrabold text-on-surface text-lg">{t("analysisHistory")} ({field.analyses?.length || 0})</h3>
            </div>

            <Link
              href="/scan"
              className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-sm">energy_savings_leaf</span>
              {t("scanLeaf")}
            </Link>
          </div>

          {field.analyses && field.analyses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {field.analyses.map((scan) => (
                <Link
                  key={scan.id}
                  href={`/analysis/${scan.id}`}
                  className="p-4 rounded-2xl bg-surface-container-high/60 hover:bg-surface-container-highest border border-outline-variant/20 transition-all flex items-center gap-3.5 group"
                >
                  {scan.image_url ? (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-outline-variant/20">
                      <Image
                        src={scan.image_url}
                        alt={scan.disease || "Leaf scan"}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">energy_savings_leaf</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-on-surface text-xs truncate group-hover:text-primary transition-colors">
                        {translateDynamic(scan.disease || "Healthy")}
                      </h4>
                      <span className="text-[10px] text-on-surface-variant font-medium shrink-0">
                        {scan.created_at ? new Date(scan.created_at).toLocaleDateString(language) : ""}
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant font-bold capitalize mt-0.5">
                      {t("risk")}: {translateDynamic(scan.severity || "Low")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant font-medium py-2">
              {t("noHistory")}
            </p>
          )}
        </div>
      )}

      {/* 8. Plot Intervention & Treatment Actions */}
      {(activeTab === "all" || activeTab === "scans") && (
        <InterventionTracker fieldId={field.id} title={`${t("actionChecklistTitle")} · ${translateDynamic(field.name)}`} />
      )}
    </div>
  );
}
