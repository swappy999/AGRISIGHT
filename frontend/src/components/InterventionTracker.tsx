"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/apiClient";
import { useTranslation } from "@/context/LanguageContext";

interface Intervention {
  id: string;
  action_type: string;
  action_title: string;
  notes: string;
  performed_at: string;
  created_at: string;
}

interface InterventionTrackerProps {
  cropId?: string;
  fieldId?: string;
  title?: string;
}

export function InterventionTracker({
  cropId,
  fieldId,
  title,
}: InterventionTrackerProps) {
  const { t, language, translateDynamic } = useTranslation();
  const displayTitle = title || t("actionChecklistTitle");
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    action_type: "Fungicide Spray",
    action_title: "",
    notes: "",
    performed_at: new Date().toISOString().split("T")[0],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getInterventions({ crop_id: cropId, field_id: fieldId });
      if (Array.isArray(data)) {
        setInterventions(data);
      }
    } catch {
      // Fallback gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cropId, fieldId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.action_title.trim()) return;

    try {
      setSubmitting(true);
      await api.createIntervention({
        action_type: form.action_type,
        action_title: form.action_title.trim(),
        notes: form.notes.trim(),
        crop_id: cropId,
        field_id: fieldId,
        performed_at: new Date(form.performed_at).toISOString(),
      });
      setShowAddModal(false);
      setForm({
        action_type: "Fungicide Spray",
        action_title: "",
        notes: "",
        performed_at: new Date().toISOString().split("T")[0],
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to log farming action.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteIntervention(id);
      setInterventions((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to remove action log.");
    }
  };

  const getActionIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("spray") || t.includes("fungicide")) return "sanitizer";
    if (t.includes("pruning") || t.includes("prune")) return "content_cut";
    if (t.includes("irrigation") || t.includes("water")) return "water_drop";
    if (t.includes("fertilizer") || t.includes("nutrient")) return "compost";
    return "checklist";
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2.25rem] p-6 lg:p-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              task_alt
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-on-surface text-base">{displayTitle}</h3>
            <p className="text-xs text-on-surface-variant font-medium">
              {t("actionChecklistSubtext")}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-base">add_task</span>
          {t("logAction")}
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      )}

      {!loading && interventions.length === 0 && (
        <div className="p-6 rounded-2xl bg-surface-container-highest/40 border border-outline-variant/20 text-center space-y-2">
          <p className="text-xs font-bold text-on-surface">{t("noActionsRecorded")}</p>
          <p className="text-[11px] text-on-surface-variant max-w-sm mx-auto">
            {t("noActionsSubtext")}
          </p>
        </div>
      )}

      {!loading && interventions.length > 0 && (
        <div className="space-y-2.5">
          {interventions.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-surface-container-high/60 border border-outline-variant/20 flex items-start justify-between gap-3 group transition-colors hover:bg-surface-container-highest"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {getActionIcon(item.action_type)}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                      {translateDynamic(item.action_type)}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-medium">
                      {new Date(item.performed_at).toLocaleDateString(language)}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-on-surface text-xs mt-1 truncate">{item.action_title}</h4>
                  {item.notes && (
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5 line-clamp-2 leading-relaxed">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-on-surface-variant/40 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete entry"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Log Action Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[2rem] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">add_task</span>
                <h3 className="font-extrabold text-on-surface text-base">{t("recordFarmingAction")}</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-on-surface-variant hover:bg-surface-container-highest rounded-lg"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === "bn" ? "পদক্ষেপের ধরন" : language === "hi" ? "कार्य श्रेणी" : "Action Category"}
                </label>
                <select
                  value={form.action_type}
                  onChange={(e) => setForm({ ...form, action_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-high rounded-xl text-xs font-bold text-on-surface outline-none border border-outline-variant/30"
                >
                  <option value="Fungicide Spray">
                    {language === "bn" ? "🌿 জৈব / ছত্রাকনাশক স্প্রে" : language === "hi" ? "🌿 जैविक / फफूंदनाशक छिड़काव" : "🌿 Biocontrol / Fungicide Spray"}
                  </option>
                  <option value="Pruning">
                    {language === "bn" ? "✂️ আক্রান্ত পাতা ছাঁটাই" : language === "hi" ? "✂️ छंटाई व स्वच्छता" : "✂️ Pruning & Sanitation"}
                  </option>
                  <option value="Irrigation">
                    {language === "bn" ? "💧 সেচ সমন্বয়" : language === "hi" ? "💧 सिंचाई समायोजन" : "💧 Irrigation Adjustment"}
                  </option>
                  <option value="Fertilizer">
                    {language === "bn" ? "🧪 সার ও পুষ্টি প্রয়োগ" : language === "hi" ? "🧪 उर्वरक / मृदा उपचार" : "🧪 Fertilizer / Soil Amendment"}
                  </option>
                  <option value="Field Scouting">
                    {language === "bn" ? "🔍 মাঠ পরিদর্শন" : language === "hi" ? "🔍 खेत निरीक्षण" : "🔍 Physical Field Scouting"}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === "bn" ? "পদক্ষেপের শিরোনাম *" : language === "hi" ? "कार्य शीर्षक *" : "Action Title *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === "bn" ? "যেমন: নিম তেল বা কপার স্প্রে প্রয়োগ করা হয়েছে" : language === "hi" ? "जैसे: नीम तेल या कॉपर स्प्रे का प्रयोग किया" : "e.g. Applied copper spray to lower leaves"}
                  value={form.action_title}
                  onChange={(e) => setForm({ ...form, action_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-high rounded-xl text-xs font-bold text-on-surface outline-none border border-outline-variant/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === "bn" ? "সম্পাদনের তারিখ" : language === "hi" ? "कार्य तिथि" : "Date Performed"}
                </label>
                <input
                  type="date"
                  value={form.performed_at}
                  onChange={(e) => setForm({ ...form, performed_at: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-high rounded-xl text-xs font-bold text-on-surface outline-none border border-outline-variant/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-on-surface-variant uppercase tracking-wider mb-1">
                  {language === "bn" ? "পর্যবেক্ষণ ও নোট" : language === "hi" ? "अवलोकन / नोट्स" : "Observations / Notes"}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === "bn" ? "যেমন: পাতা শুকনো ছিল; বিকেলে স্প্রে করা হয়েছে।" : language === "hi" ? "जैसे: पत्तियां सूखी थीं; दोपहर में छिड़काव किया गया।" : "e.g. Foliage was dry; sprayed during afternoon window."}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-container-high rounded-xl text-xs font-medium text-on-surface outline-none border border-outline-variant/30 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? t("loading") : t("logAction")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
