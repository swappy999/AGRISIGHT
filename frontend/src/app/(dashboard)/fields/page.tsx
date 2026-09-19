"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useTranslation } from "@/context/LanguageContext";

interface FieldItem {
  id: string;
  name: string;
  location_name: string;
  area_acres: number;
  soil_type: string;
  irrigation_type: string;
  health_score: number;
  status: string;
  crop_count: number;
  active_hotspots: number;
  notes?: string;
  created_at: string;
}

export default function FieldsPage() {
  const router = useRouter();
  const { t, language, translateDynamic, formatNumber } = useTranslation();
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    location_name: "",
    area_acres: 2.5,
    soil_type: "Alluvial",
    irrigation_type: "Drip",
    notes: "",
  });

  const loadFields = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await api.getFields(forceRefresh);
      if (Array.isArray(data)) {
        setFields(data);
      }
    } catch (err: any) {
      setLoadError(
        err.message ||
          (language === "bn"
            ? "জমির তথ্য লোড করতে ব্যর্থ হয়েছে। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।"
            : language === "hi"
            ? "खेत डेटा लोड करने में असमर्थ। कृपया अपना इंटरनेट कनेक्शन जांचें।"
            : "Failed to load field data. Please check your network connection.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setCreating(true);
      setFormError(null);
      const newField = await api.createField({
        name: form.name.trim(),
        location_name: form.location_name.trim(),
        area_acres: Number(form.area_acres) || 1.0,
        soil_type: form.soil_type,
        irrigation_type: form.irrigation_type,
        notes: form.notes.trim(),
      });
      setShowAddModal(false);
      setForm({
        name: "",
        location_name: "",
        area_acres: 2.5,
        soil_type: "Alluvial",
        irrigation_type: "Drip",
        notes: "",
      });
      if (newField && newField.id) {
        setFields((prev) => [newField, ...prev]);
        router.push(`/fields/${newField.id}`);
      } else {
        await loadFields();
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to register new field.");
    } finally {
      setCreating(false);
    }
  };

  // Aggregates
  const totalAcreage = fields.reduce((acc, f) => acc + (f.area_acres || 0), 0);
  const totalHotspots = fields.reduce((acc, f) => acc + (f.active_hotspots || 0), 0);
  const avgHealth = fields.length > 0
    ? Math.round(fields.reduce((acc, f) => acc + (f.health_score || 95), 0) / fields.length)
    : 98;

  return (
    <div className="p-4 lg:p-12 space-y-8 max-w-[1600px] mx-auto pb-28 xl:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              map
            </span>
            {t("fieldHealthMap")}
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">{t("fields")}</h1>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            {language === "bn"
              ? "জমির স্থানীয় আবহাওয়া, আর্দ্রতা, রোগের প্রাদুর্ভাব এবং স্বাস্থ্য পর্যবেক্ষণ করুন।"
              : language === "hi"
              ? "खेतों की मिट्टी, आर्द्रता और फसल स्वास्थ्य की निगरानी करें।"
              : "Monitor plot microclimates, disease hotspots, and spatial crop survival rates."}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3.5 bg-primary text-on-primary rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 text-sm"
        >
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            add_location_alt
          </span>
          {t("addField")}
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              landscape
            </span>
          </div>
          <div>
            <p className="text-xs font-black text-on-surface-variant uppercase tracking-wider">{t("area")}</p>
            {loading ? (
              <div className="w-16 h-7 bg-surface-container-high rounded animate-pulse mt-1" />
            ) : (
              <h3 className="text-2xl font-black text-on-surface">{formatNumber(totalAcreage.toFixed(1))} <span className="text-sm font-bold text-on-surface-variant">{t("acres")}</span></h3>
            )}
          </div>
        </div>

        <div className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              health_and_safety
            </span>
          </div>
          <div>
            <p className="text-xs font-black text-on-surface-variant uppercase tracking-wider">{t("overallHealth")}</p>
            {loading ? (
              <div className="w-16 h-7 bg-surface-container-high rounded animate-pulse mt-1" />
            ) : (
              <h3 className="text-2xl font-black text-on-surface">{formatNumber(avgHealth)}% <span className="text-sm font-bold text-emerald-600">{t("healthy")}</span></h3>
            )}
          </div>
        </div>

        <div className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/30 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            totalHotspots > 0 ? "bg-rose-500/20 text-rose-600" : "bg-primary/10 text-primary"
          }`}>
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {totalHotspots > 0 ? "warning" : "verified"}
            </span>
          </div>
          <div>
            <p className="text-xs font-black text-on-surface-variant uppercase tracking-wider">{t("activeRisks")}</p>
            {loading ? (
              <div className="w-16 h-7 bg-surface-container-high rounded animate-pulse mt-1" />
            ) : (
              <h3 className="text-2xl font-black text-on-surface">
                {formatNumber(totalHotspots)} <span className="text-sm font-bold text-on-surface-variant">{language === "bn" ? "টি সমস্যাযুক্ত ক্লাস্টার" : language === "hi" ? "समूह" : t("activeIssuesCount", { count: totalHotspots })}</span>
              </h3>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-low h-64 rounded-3xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error Banner with Retry */}
      {loadError && (
        <div className="bg-error-container/40 border border-error/30 text-on-surface p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              error
            </span>
            <p className="text-xs sm:text-sm font-semibold">{loadError}</p>
          </div>
          <button
            onClick={() => loadFields(true)}
            className="btn-farmer-primary text-xs px-4 py-2 shrink-0 flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>{t("retry")}</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !loadError && fields.length === 0 && (
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2.5rem] p-10 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              grid_view
            </span>
          </div>
          <h2 className="text-xl font-black text-on-surface">{t("noFieldsTitle")}</h2>
          <p className="text-sm text-on-surface-variant">
            {t("noFieldsDescription")}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-md inline-flex items-center gap-2 hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            {t("addField")}
          </button>
        </div>
      )}

      {/* Field Cards Grid */}
      {!loading && fields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => (
            <div
              key={field.id}
              className="bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 rounded-[2.25rem] p-6 space-y-5 transition-all duration-300 hover:shadow-lg flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-on-surface group-hover:text-primary transition-colors">
                      {translateDynamic(field.name)}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">pin_drop</span>
                      {translateDynamic(field.location_name || "Main Plot")}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      field.health_score >= 80
                        ? "bg-emerald-500/15 text-emerald-700"
                        : field.health_score >= 55
                        ? "bg-amber-500/15 text-amber-700"
                        : "bg-rose-500/20 text-rose-700"
                    }`}
                  >
                    {translateDynamic(field.status)}
                  </span>
                </div>

                {/* Quick Attributes */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-surface-container-highest/50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">landscape</span>
                    <div>
                      <p className="text-[10px] text-on-surface-variant/70 font-bold">{t("area")}</p>
                      <p className="font-extrabold text-on-surface">{formatNumber(field.area_acres)} {t("acres")}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-surface-container-highest/50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">eco</span>
                    <div>
                      <p className="text-[10px] text-on-surface-variant/70 font-bold">{t("cropCountLabel")}</p>
                      <p className="font-extrabold text-on-surface">{formatNumber(field.crop_count)} {t("cropCountUnit")}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-surface-container-highest/50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">layers</span>
                    <div>
                      <p className="text-[10px] text-on-surface-variant/70 font-bold">{t("soilType")}</p>
                      <p className="font-extrabold text-on-surface">{translateDynamic(field.soil_type)}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-surface-container-highest/50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">water_drop</span>
                    <div>
                      <p className="text-[10px] text-on-surface-variant/70 font-bold">{t("irrigationType")}</p>
                      <p className="font-extrabold text-on-surface">{translateDynamic(field.irrigation_type)}</p>
                    </div>
                  </div>
                </div>

                {/* Hotspot warning strip */}
                {field.active_hotspots > 0 ? (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-xs text-rose-700 font-bold">
                    <span className="material-symbols-outlined text-base shrink-0 animate-pulse">warning</span>
                    <span>{formatNumber(field.active_hotspots)} {t("activeRisks")}</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-700 font-bold">
                    <span className="material-symbols-outlined text-base shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    <span>{t("healthy")}</span>
                  </div>
                )}
              </div>

              {/* Action link */}
              <Link
                href={`/fields/${field.id}`}
                className="w-full py-3 bg-surface-container-highest hover:bg-primary hover:text-on-primary text-on-surface rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all mt-2"
              >
                <span>{t("viewDetails")}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Add Field Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2.5rem] p-6 lg:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    add_location_alt
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-on-surface">{t("addField")}</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-xl"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateField} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-1.5">
                  {t("fieldName")} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Orchard"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-2xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-1.5">
                    {t("location")}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 4"
                    value={form.location_name}
                    onChange={(e) => setForm({ ...form, location_name: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-high rounded-2xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-1.5">
                    {t("area")} ({t("acres")})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.area_acres}
                    onChange={(e) => setForm({ ...form, area_acres: parseFloat(e.target.value) || 1 })}
                    className="w-full px-4 py-3 bg-surface-container-high rounded-2xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-1.5">
                    {t("soilType")}
                  </label>
                  <select
                    value={form.soil_type}
                    onChange={(e) => setForm({ ...form, soil_type: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-high rounded-2xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                  >
                    <option value="Alluvial">Alluvial (Loamy)</option>
                    <option value="Black Soil">Black / Regur Soil</option>
                    <option value="Red / Laterite">Red / Laterite</option>
                    <option value="Clay">Clay Heavy</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-1.5">
                    {t("irrigationType")}
                  </label>
                  <select
                    value={form.irrigation_type}
                    onChange={(e) => setForm({ ...form, irrigation_type: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-high rounded-2xl text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
                  >
                    <option value="Drip">Drip Irrigation</option>
                    <option value="Sprinkler">Sprinkler Overhead</option>
                    <option value="Furrow / Flood">Furrow / Channel</option>
                    <option value="Rainfed">Rainfed (Natural)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-on-surface-variant uppercase tracking-wider mb-1.5">
                  {t("notes")}
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container-high rounded-2xl text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 rounded-2xl font-bold text-xs text-on-surface-variant hover:bg-surface-container-highest"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-3 bg-primary text-on-primary rounded-2xl font-bold text-xs shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {creating ? t("loading") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
