"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useTranslation } from "@/context/LanguageContext";
import { FieldHealthMap, HotspotPin, ZoneData } from "@/components/FieldHealthMap";

export function DashboardFarmMap() {
  const { t, language } = useTranslation();
  const [fields, setFields] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [fieldDetail, setFieldDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFieldsData() {
      try {
        setLoading(true);
        const data = await api.getFields();
        if (Array.isArray(data) && data.length > 0) {
          setFields(data);
          setSelectedFieldId(data[0].id);
          const detail = await api.getField(data[0].id).catch(() => null);
          setFieldDetail(detail || data[0]);
        }
      } catch (err) {
        console.warn("Dashboard farm map load fallback used:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFieldsData();
  }, []);

  const handleSelectField = async (id: string) => {
    setSelectedFieldId(id);
    try {
      const detail = await api.getField(id).catch(() => null);
      if (detail) setFieldDetail(detail);
    } catch {}
  };

  if (loading) {
    return (
      <div className="bg-surface-container-low h-72 rounded-[2.5rem] animate-pulse" />
    );
  }

  if (fields.length === 0) {
    return (
      <div className="bg-surface-container-low border border-dashed border-outline-variant/30 rounded-[2.5rem] p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            grid_view
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-on-surface">{t("noFieldsTitle")}</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {t("noFieldsDescription")}
          </p>
        </div>
        <Link
          href="/fields"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add_location_alt</span>
          {t("addField")}
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Header with Field Selector Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            grid_view
          </span>
          <h2 className="text-xl lg:text-2xl font-extrabold text-on-surface tracking-tight">
            {t("fieldHealthMap")}
          </h2>
        </div>

        {/* Field Selector */}
        {fields.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {fields.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelectField(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedFieldId === f.id
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {fieldDetail && (
        <FieldHealthMap
          fieldName={fieldDetail.name || "Farm Plot"}
          areaAcres={fieldDetail.area_acres || 1.0}
          healthScore={fieldDetail.health_score || 95}
          hotspots={fieldDetail.hotspots || []}
          zones={fieldDetail.zones || []}
          soilType={fieldDetail.soil_type || "Alluvial"}
          irrigationType={fieldDetail.irrigation_type || "Drip"}
        />
      )}
    </section>
  );
}
