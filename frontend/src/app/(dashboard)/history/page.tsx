"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";

interface AnalysisItem {
  id: string;
  image_url: string;
  crop?: string;
  disease: string;
  severity: string;
  risk_score?: number;
  created_at: string;
}

const fallbackImage =
  "https://images.unsplash.com/photo-1592843987019-21b3334201c1?auto=format&fit=crop&q=80&w=400";

function HistorySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-surface-container-low rounded-[2rem] p-5 animate-pulse space-y-4">
          <div className="w-full h-44 rounded-2xl bg-outline-variant/20" />
          <div className="space-y-2">
            <div className="w-3/4 h-5 rounded-lg bg-outline-variant/20" />
            <div className="w-1/2 h-4 rounded-lg bg-outline-variant/15" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryContent() {
  const { t, language, translateDynamic } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [filterTab, setFilterTab] = useState<"all" | "threats" | "healthy">("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getAnalyses();

        if (data && Array.isArray(data)) {
          setAnalyses(
            data.map((item) => ({
              id: item.id,
              image_url: item.image_url || fallbackImage,
              crop: item.result_json?.crop || "",
              disease: item.disease || item.result_json?.disease || "Healthy",
              severity: (item.severity || item.result_json?.severity || "low").toLowerCase(),
              risk_score: item.result_json?.risk_score,
              created_at: item.created_at || new Date().toISOString(),
            }))
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to load analysis history.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user, authLoading]);

  // Filter logic
  const filtered = analyses.filter((item) => {
    const matchesSearch = !searchTerm || 
      item.disease.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.crop && item.crop.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === "threats") {
      return item.severity === "high" || item.severity === "critical" || item.severity === "severe";
    }
    if (filterTab === "healthy") {
      const d = item.disease.toLowerCase();
      return d.includes("healthy") || item.severity === "low";
    }
    return true;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("q", e.target.value);
    } else {
      params.delete("q");
    }
    router.replace(`/history?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="p-4 lg:p-12 max-w-[1400px] mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-outline-variant/30 pb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all w-fit text-sm"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          {t("home")}
        </Link>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-5xl font-black text-on-surface tracking-tight leading-tight">
              {t("analysisHistory")}
            </h1>
            <p className="text-on-surface-variant text-sm lg:text-base font-medium">
              {t("historySubtitle")}
            </p>
          </div>
          
          {/* Action CTA */}
          <Link
            href="/scan"
            className="px-5 py-3 bg-primary text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 text-sm shrink-0"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>energy_savings_leaf</span>
            {t("scanLeaf")}
          </Link>
        </div>

        {/* Controls: Search + Filter Tabs */}
        <div className="flex flex-col md:flex-row gap-3 pt-2 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              placeholder={t("searchHistoryPlaceholder")}
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Search analysis records"
              className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-primary/50 text-on-surface text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all" as const, label: t("allScans"), count: analyses.length },
              {
                id: "threats" as const,
                label: t("threatsTab"),
                count: analyses.filter(
                  (a) => a.severity === "high" || a.severity === "critical" || a.severity === "severe"
                ).length,
              },
              {
                id: "healthy" as const,
                label: t("healthyTab"),
                count: analyses.filter(
                  (a) => a.disease.toLowerCase().includes("healthy") || a.severity === "low"
                ).length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  filterTab === tab.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    filterTab === tab.id
                      ? "bg-on-primary/20 text-on-primary"
                      : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Unauthenticated */}
      {!authLoading && !user && (
        <div className="text-center py-16 space-y-4">
          <span className="material-symbols-outlined text-6xl text-outline-variant">lock</span>
          <p className="font-bold text-on-surface text-xl">{t("loginWelcome")}</p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-primary text-on-primary font-bold rounded-full shadow-lg hover:opacity-90 transition-all"
          >
            {t("signIn")}
          </Link>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-error-container text-on-error-container p-5 rounded-2xl flex items-center gap-3 font-bold text-sm">
          <span className="material-symbols-outlined text-error">error</span>
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && <HistorySkeleton />}

      {/* Empty State */}
      {!isLoading && !error && user && analyses.length === 0 && (
        <div className="bg-surface-container-low p-10 sm:p-16 rounded-[2rem] text-center border-2 border-dashed border-outline-variant/50 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              energy_savings_leaf
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-on-surface font-extrabold text-xl">{t("noScansYet")}</p>
            <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
              {t("startScanning")}
            </p>
          </div>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-lg">add_a_photo</span>
            {t("scanLeaf")}
          </Link>
        </div>
      )}

      {/* No search/filter results */}
      {!isLoading && !error && user && analyses.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <span className="material-symbols-outlined text-4xl text-outline-variant">search_off</span>
          <p className="font-bold text-on-surface-variant text-sm">
            No analysis matches your current filter or search &quot;{searchTerm}&quot;
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterTab("all");
            }}
            className="text-primary font-bold text-sm hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Grid of Results */}
      {!isLoading && !error && user && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filtered.map((item) => {
            const isSevere = item.severity === "high" || item.severity === "critical" || item.severity === "severe";
            const isMedium = item.severity === "medium" || item.severity === "moderate";
            const severityClass = isSevere
              ? "bg-error-container text-error"
              : isMedium
              ? "bg-tertiary-container text-on-tertiary-container"
              : "bg-primary-container text-on-primary-container";

            return (
              <Link key={item.id} href={`/analysis/${item.id}`} className="group block h-full">
                <div className="bg-surface-container-lowest rounded-[2rem] p-5 shadow-sm border border-outline-variant/15 group-hover:shadow-md group-hover:border-primary/30 transition-all duration-300 flex flex-col h-full">
                  <div className="w-full h-44 relative rounded-2xl overflow-hidden bg-surface-container-low">
                    <Image
                      src={item.image_url}
                      alt={item.disease}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.crop && (
                      <div className="absolute top-2.5 left-2.5 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-on-surface">
                        {item.crop}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-extrabold text-lg text-on-surface tracking-tight group-hover:text-primary transition-colors leading-tight truncate">
                        {translateDynamic(item.disease)}
                      </h3>
                      <p className="text-xs text-on-surface-variant font-medium mt-1">
                        {new Date(item.created_at).toLocaleDateString(language, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${severityClass}`}>
                        {translateDynamic(item.severity)}
                      </span>
                      <div className="flex items-center gap-1 text-primary font-bold text-xs group-hover:gap-2 transition-all">
                        <span>{t("viewDetails")}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <HistoryContent />
    </Suspense>
  );
}
