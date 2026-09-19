"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useTranslation } from "@/context/LanguageContext";

const GROWTH_STAGES = ["Sowing / Seed", "Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"];
const COMMON_CROPS = ["Tomato", "Rice", "Wheat", "Potato", "Maize/Corn", "Onion", "Chili", "Brinjal/Eggplant", "Cucumber", "Cauliflower", "Cabbage", "Spinach", "Other"];

export default function NewCropPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, translateDynamic } = useTranslation();
  const [fields, setFields] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    variety: "",
    planting_date: "",
    growth_stage: "",
    field_name: "",
    field_id: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFields() {
      try {
        const data = await api.getFields();
        if (Array.isArray(data)) {
          setFields(data);
          const paramFieldId = searchParams.get("field_id");
          if (paramFieldId) {
            const matched = data.find((f) => f.id === paramFieldId);
            if (matched) {
              setForm((f) => ({ ...f, field_id: matched.id, field_name: matched.name }));
            }
          }
        }
      } catch {}
    }
    loadFields();
  }, [searchParams]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(t("enterCropName")); return; }
    setSubmitting(true);
    setError(null);
    try {
      const data = await api.createCrop(form);
      router.push(`/crops/${data.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create crop.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="max-w-xl lg:max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/crops" aria-label="Back to crops"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors shrink-0">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-extrabold text-on-surface tracking-tight">{t("addCrop")}</h1>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">{t("cropIntelligence")}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl lg:max-w-3xl mx-auto px-4 py-6 pb-32 space-y-6">

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-2xl text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-error">error</span>
            {error}
          </div>
        )}

        {/* Crop name — required */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[1.5rem] p-5 space-y-3">
          <label className="block text-xs font-black text-on-surface uppercase tracking-widest">
            {t("cropName")} <span className="text-error">*</span>
          </label>
          {/* Quick-pick chips */}
          <div className="flex flex-wrap gap-2">
            {COMMON_CROPS.map((c) => (
              <button key={c} type="button"
                onClick={() => update("name", c === "Other" ? "" : c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  form.name === c ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-dim"
                }`}>
                {translateDynamic(c)}
              </button>
            ))}
          </div>
          <input
            type="text"
            id="crop-name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder={t("enterCropName")}
            className="w-full bg-surface-container-high rounded-2xl px-4 py-3 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            required
            aria-required="true"
          />
        </div>

        {/* Variety — optional */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[1.5rem] p-5 space-y-3">
          <label htmlFor="variety" className="block text-xs font-black text-on-surface uppercase tracking-widest">
            {t("variety")} <span className="text-on-surface-variant/50 font-medium normal-case text-xs">optional</span>
          </label>
          <input
            id="variety"
            type="text"
            value={form.variety}
            onChange={(e) => update("variety", e.target.value)}
            placeholder="e.g. Cherry Tomato, Basmati, Hybrid"
            className="w-full bg-surface-container-high rounded-2xl px-4 py-3 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Growth stage */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[1.5rem] p-5 space-y-3">
          <label className="block text-xs font-black text-on-surface uppercase tracking-widest">
            {t("growthStage")} <span className="text-on-surface-variant/50 font-medium normal-case text-xs">optional</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {GROWTH_STAGES.map((stage) => (
              <button key={stage} type="button"
                onClick={() => update("growth_stage", form.growth_stage === stage ? "" : stage)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  form.growth_stage === stage ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-dim"
                }`}>
                {translateDynamic(stage)}
              </button>
            ))}
          </div>
        </div>

        {/* Planting date + Field selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[1.5rem] p-5 space-y-3">
            <label htmlFor="planting-date" className="block text-xs font-black text-on-surface uppercase tracking-widest">
              {t("plantedOn")} <span className="text-on-surface-variant/50 font-medium normal-case text-xs">optional</span>
            </label>
            <input
              id="planting-date"
              type="date"
              value={form.planting_date}
              onChange={(e) => update("planting_date", e.target.value)}
              className="w-full bg-surface-container-high rounded-2xl px-3 py-3 text-sm font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[1.5rem] p-5 space-y-3">
            <label htmlFor="field-select" className="block text-xs font-black text-on-surface uppercase tracking-widest">
              {t("fields")} <span className="text-on-surface-variant/50 font-medium normal-case text-xs">optional</span>
            </label>
            {fields.length > 0 ? (
              <select
                id="field-select"
                value={form.field_id}
                onChange={(e) => {
                  const fid = e.target.value;
                  const matched = fields.find((f) => f.id === fid);
                  setForm((prev) => ({
                    ...prev,
                    field_id: fid,
                    field_name: matched ? matched.name : "",
                  }));
                }}
                className="w-full bg-surface-container-high rounded-2xl px-3 py-3 text-sm font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              >
                <option value="">{t("noAssignedField")}</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.area_acres} {t("acres")})
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="field-name"
                type="text"
                value={form.field_name}
                onChange={(e) => update("field_name", e.target.value)}
                placeholder="e.g. North Field"
                className="w-full bg-surface-container-high rounded-2xl px-3 py-3 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-[1.5rem] p-5 space-y-3">
          <label htmlFor="notes" className="block text-xs font-black text-on-surface uppercase tracking-widest">
            {t("notes")} <span className="text-on-surface-variant/50 font-medium normal-case text-xs">optional</span>
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            className="w-full bg-surface-container-high rounded-2xl px-4 py-3 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="create-crop-btn"
          disabled={submitting || !form.name.trim()}
          className="w-full py-4 bg-primary text-on-primary font-extrabold rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Create crop profile"
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined text-xl animate-spin">refresh</span>
              {t("loading")}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              {t("addCrop")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
