"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";
import { useTranslation } from "@/context/LanguageContext";

function CropCard({ crop, onDelete }: { crop: any; onDelete: (id: string) => void }) {
  const { t, language, translateDynamic, formatNumber } = useTranslation();

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-[2rem] p-5 sm:p-6 shadow-sm hover:shadow-md transition-all group relative">
      <Link href={`/crops/${crop.id}`} className="block space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              eco
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-on-surface tracking-tight truncate group-hover:text-primary transition-colors">
              {translateDynamic(crop.name)}
            </h2>
            {crop.variety && <p className="text-xs text-on-surface-variant font-medium truncate">{translateDynamic(crop.variety)}</p>}
          </div>
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-2">
          {crop.growth_stage && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">energy_savings_leaf</span>
              {translateDynamic(crop.growth_stage)}
            </span>
          )}
          {crop.field_name && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">landscape</span>
              {translateDynamic(crop.field_name)}
            </span>
          )}
          {crop.planting_date && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              {new Date(crop.planting_date).toLocaleDateString(language, { month: "short", day: "numeric" })}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant opacity-70">{t("analysisHistory")}</span>
            <span className="text-sm font-black text-primary">{formatNumber(crop.scan_count ?? 0)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-primary font-bold text-sm group-hover:gap-2.5 transition-all">
            <span className="text-xs">{t("viewDetails")}</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </div>
        </div>
      </Link>

      {/* Delete button */}
      <button
        onClick={(e) => { e.preventDefault(); onDelete(crop.id); }}
        aria-label={`Delete ${crop.name}`}
        className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant/60 hover:text-error hover:bg-error-container opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
      >
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>
    </div>
  );
}

export default function CropsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { t, language } = useTranslation();
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCrops(forceRefresh);
      setCrops(data || []);
    } catch (e: any) {
      setError(
        e.message ||
          (language === "bn"
            ? "ফসলের তালিকা লোড করতে সমস্যা হয়েছে।"
            : language === "hi"
            ? "फसल सूची लोड करने में असमर्थ।"
            : "Failed to load crops list.")
      );
    } finally {
      setLoading(false);
    }
  }, [user, language]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    load();
  }, [user, authLoading, load]);

  const handleDelete = async (id: string) => {
    if (!confirm(language === "bn" ? "এই ফসল মুছে ফেলতে চান?" : language === "hi" ? "क्या आप इस फसल को हटाना चाहते हैं?" : "Delete this crop?")) return;
    setDeletingId(id);
    try {
      await api.deleteCrop(id);
      setCrops((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      alert("Failed to delete: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 lg:p-12 max-w-[1400px] mx-auto space-y-8 pb-24 xl:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-6">
        <div className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all mb-2 w-fit">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            {t("home")}
          </Link>
          <h1 className="text-3xl lg:text-5xl font-black text-on-surface tracking-tight">{t("crops")}</h1>
          <p className="text-on-surface-variant text-sm font-medium">{t("cropIntelligence")}</p>
        </div>
        <Link
          href="/crops/new"
          className="flex items-center gap-2 px-5 py-3 bg-primary text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all shrink-0 text-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {t("addCrop")}
        </Link>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <div className="bg-error-container/40 border border-error/30 text-on-surface p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              error
            </span>
            <p className="font-semibold text-xs sm:text-sm">{error}</p>
          </div>
          <button
            onClick={() => load(true)}
            className="btn-farmer-primary text-xs px-4 py-2 shrink-0 flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>{t("retry")}</span>
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-container-low h-48 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && crops.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
          <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              eco
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-on-surface">{t("noCropsYet")}</h2>
            <p className="text-on-surface-variant font-medium text-sm max-w-xs">
              {t("noHistory")}
            </p>
          </div>
          <Link
            href="/crops/new"
            className="px-6 py-3.5 bg-primary text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {t("addCrop")}
          </Link>
        </div>
      )}

      {/* Crop grid */}
      {!loading && !error && crops.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {crops.map((crop) => (
            <CropCard key={crop.id} crop={crop} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
