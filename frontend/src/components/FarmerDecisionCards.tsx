"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { api } from "@/lib/apiClient";

interface DecisionCard {
  id: string;
  priority: number; // 1, 2, 3
  title: string;
  category: "irrigation" | "disease" | "pest" | "weather" | "general";
  action_text: string;
  impact: string;
  rationale: string;
  confidence: number;
  completed?: boolean;
}

interface FarmerDecisionCardsProps {
  onOpenDigitalTwin?: () => void;
}

export function FarmerDecisionCards({ onOpenDigitalTwin }: FarmerDecisionCardsProps) {
  const { language, t } = useTranslation();
  const [decisions, setDecisions] = useState<DecisionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      const data = await api.getFarmerDecisions(language);
      if (Array.isArray(data) && data.length > 0) {
        setDecisions(data);
      } else {
        // Fallback agronomic default decisions if no recent triggers
        setDecisions([
          {
            id: "dec-1",
            priority: 1,
            title: language === "bn"
              ? "সকালের সেচ সূচি মেনে চলুন"
              : language === "hi"
              ? "सुबह की सिंचाई समय सारणी का पालन करें"
              : "Morning Irrigation Protocol",
            category: "irrigation",
            action_text: language === "bn" ? "সেচ সম্পন্ন মার্ক করুন" : language === "hi" ? "सिंचाई पूर्ण चिह्नित करें" : "Mark Irrigation Done",
            impact: language === "bn" ? "পানির অপচয় ৩০% হ্রাস" : language === "hi" ? "जल अपव्यय में 30% कमी" : "Reduces water stress by 30%",
            rationale: language === "bn"
              ? "মাটির তাপমাত্রা কম থাকায় সকালে সেচ দিলে বাষ্পীভবন হ্রাস পায় এবং শিকড় সঠিকভাবে পানি শোষণ করতে পারে।"
              : language === "hi"
              ? "कम तापमान के कारण सुबह की सिंचाई से वाष्पीकरण घटता है और जड़ों को पूरा पोषण मिलता है।"
              : "Early morning watering minimizes evaporation and allows deep root penetration before peak midday temperatures.",
            confidence: 94,
          },
          {
            id: "dec-2",
            priority: 2,
            title: language === "bn"
              ? "ছত্রাক ও রোগ নজরদারি"
              : language === "hi"
              ? "फंगल व रोग निगरानी"
              : "Fungal Spore Scouting",
            category: "disease",
            action_text: language === "bn" ? "নতুন স্ক্যান করুন" : language === "hi" ? "नया स्कैन करें" : "Scan Field Plot",
            impact: language === "bn" ? "প্রাথমিক রোগ প্রতিরোধ" : language === "hi" ? "प्रारंभिक रोग नियंत्रण" : "Early containment",
            rationale: language === "bn"
              ? "আর্দ্রতা বৃদ্ধির কারণে পাতার নিচে ছত্রাকের দাগ দেখা দিতে পারে। অবিলম্বে পর্যবেক্ষণ করুন।"
              : language === "hi"
              ? "नमी में वृद्धि के कारण पत्तियों के निचले हिस्से पर धब्बों की नियमित जांच करें।"
              : "High relative humidity promotes fungal sporulation. Inspect lower leaf surfaces in vulnerable zones.",
            confidence: 88,
          },
        ]);
      }
    } catch (err) {
      console.warn("Error loading farmer decision cards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, [language]);

  const handleComplete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    try {
      const dec = decisions.find((d) => d.id === id);
      if (dec && !completedIds.has(id)) {
        await api.createIntervention({
          action_type: dec.category === "irrigation" ? "Irrigation" : "Inspection",
          action_title: dec.title,
          notes: `Completed farmer decision card: ${dec.title}`,
          performed_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn("Failed to record decision completion:", err);
    }
  };

  const getCategoryConfig = (cat: string) => {
    switch (cat) {
      case "irrigation":
        return {
          icon: "water_drop",
          badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
          label: language === "bn" ? "সেচ ব্যবস্থাপনা" : language === "hi" ? "सिंचाई" : "Irrigation",
        };
      case "disease":
        return {
          icon: "coronavirus",
          badgeBg: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
          label: language === "bn" ? "রোগ নিয়ন্ত্রণ" : language === "hi" ? "रोग नियंत्रण" : "Disease Alert",
        };
      case "pest":
        return {
          icon: "bug_report",
          badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
          label: language === "bn" ? "কীটপতঙ্গ সতর্কতা" : language === "hi" ? "कीट चेतावनी" : "Pest Alert",
        };
      case "weather":
        return {
          icon: "cloud_sync",
          badgeBg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
          label: language === "bn" ? "আবহাওয়া" : language === "hi" ? "मौसम" : "Weather",
        };
      default:
        return {
          icon: "agriculture",
          badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
          label: language === "bn" ? "সাধারণ কৃষি" : language === "hi" ? "कृषि कार्य" : "Farm Advisory",
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-6 space-y-4 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-surface-container-high rounded-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-surface-container-lowest rounded-2xl" />
          <div className="h-32 bg-surface-container-lowest rounded-2xl" />
        </div>
      </div>
    );
  }

  if (decisions.length === 0) return null;

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-5 sm:p-7 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-on-surface tracking-tight">
                {language === "bn"
                  ? "আজকের অগ্রাধিকার কৃষক সিদ্ধান্ত"
                  : language === "hi"
                  ? "आज के प्राथमिकता किसान निर्णय"
                  : "Today's Actionable Decisions"}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-black tracking-wider">
                {decisions.length} ACTIVE
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">
              {language === "bn"
                ? "বাস্তব আবহাওয়া ও ফসল মডেলের ওপর ভিত্তি করে শীর্ষ পদক্ষেপ"
                : language === "hi"
                ? "मौसम व फसल के वास्तविक आंकड़ों पर आधारित महत्वपूर्ण कदम"
                : "Priority operations calculated from weather, crop cycle, and recent scans"}
            </p>
          </div>
        </div>

        {onOpenDigitalTwin && (
          <button
            type="button"
            onClick={onOpenDigitalTwin}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-surface-container-highest hover:bg-surface-container-high border border-outline-variant/30 text-xs font-bold text-primary flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">science</span>
            <span>{t("simulateScenario")}</span>
          </button>
        )}
      </div>

      {/* Decision Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {decisions.map((card, idx) => {
          const isDone = completedIds.has(card.id);
          const isExpanded = expandedId === card.id;
          const catConfig = getCategoryConfig(card.category);

          return (
            <div
              key={card.id || idx}
              onClick={() => setExpandedId(isExpanded ? null : card.id)}
              className={`group relative rounded-2xl p-5 border transition-all duration-200 cursor-pointer ${
                isDone
                  ? "bg-surface-container-lowest/60 border-emerald-500/30 opacity-75"
                  : "bg-surface-container-lowest border-outline-variant/20 hover:border-primary/40 hover:shadow-md"
              }`}
            >
              {/* Card Top Row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${catConfig.badgeBg}`}
                  >
                    <span className="material-symbols-outlined text-xs">{catConfig.icon}</span>
                    <span>{catConfig.label}</span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      card.priority === 1
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                        : card.priority === 2
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    }`}
                  >
                    P{card.priority}
                  </span>
                </div>

                <div className="text-[11px] font-extrabold text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">verified</span>
                  <span>{card.confidence}%</span>
                </div>
              </div>

              {/* Title & Impact */}
              <div className="mt-3 space-y-1">
                <h4
                  className={`text-sm font-extrabold tracking-tight transition-colors ${
                    isDone ? "line-through text-on-surface-variant" : "text-on-surface group-hover:text-primary"
                  }`}
                >
                  {card.title}
                </h4>
                <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-emerald-600">trending_up</span>
                  <span>{card.impact}</span>
                </p>
              </div>

              {/* Agronomic Rationale (Collapsible) */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-outline-variant/15 text-xs text-on-surface-variant leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="font-semibold text-on-surface mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">info</span>
                    <span>
                      {language === "bn"
                        ? "কৃষিগত কারণ ও প্রেক্ষাপট"
                        : language === "hi"
                        ? "कृषि कारण व पृष्ठभूमि"
                        : "Agronomic Context"}
                    </span>
                  </p>
                  <p>{card.rationale}</p>
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="mt-4 pt-3 flex items-center justify-between border-t border-outline-variant/15">
                <span className="text-[11px] font-bold text-primary flex items-center gap-0.5">
                  <span>{isExpanded ? (language === "bn" ? "সংক্ষেপ করুন" : language === "hi" ? "संक्षेप" : "Less") : (language === "bn" ? "বিশদ কারণ" : language === "hi" ? "कारण देखें" : "Why this action?")}</span>
                  <span className={`material-symbols-outlined text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </span>

                <button
                  type="button"
                  onClick={(e) => handleComplete(card.id, e)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                    isDone
                      ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                      : "bg-primary text-on-primary hover:bg-primary/90"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isDone ? "check_circle" : "check"}
                  </span>
                  <span>
                    {isDone
                      ? (language === "bn" ? "সম্পন্ন" : language === "hi" ? "पूर्ण" : "Done")
                      : (card.action_text || (language === "bn" ? "সম্পন্ন করুন" : language === "hi" ? "पूरा करें" : "Execute"))}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
