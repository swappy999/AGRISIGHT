"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/context/LanguageContext";
import { api } from "@/lib/apiClient";
import Link from "next/link";

interface TimelineEvent {
  id: string;
  event_type: "scan" | "intervention" | "alert";
  title: string;
  detail: string;
  timestamp: string;
  image_url?: string;
  category_badge: string;
  severity?: string;
}

interface FarmTimelineProps {
  fieldId?: string;
  limit?: number;
}

export function FarmTimeline({ fieldId, limit = 15 }: FarmTimelineProps) {
  const { language, t } = useTranslation();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "scan" | "intervention">("all");

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const data = await api.getFarmTimeline(fieldId);
      if (Array.isArray(data)) {
        setEvents(data);
      }
    } catch (err) {
      console.warn("Failed to load timeline events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [fieldId]);

  const filteredEvents = events.filter((ev) => {
    if (filter === "all") return true;
    return ev.event_type === filter;
  }).slice(0, limit);

  const formatEventDate = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(
        language === "bn" ? "bn-BD" : language === "hi" ? "hi-IN" : "en-US",
        {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return isoStr;
    }
  };

  const getEventStyle = (type: string, severity?: string) => {
    if (type === "scan") {
      if (severity === "Critical" || severity === "High") {
        return {
          icon: "biotech",
          dotBg: "bg-rose-500 text-white",
          badgeBg: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
        };
      }
      return {
        icon: "psychiatry",
        dotBg: "bg-primary text-on-primary",
        badgeBg: "bg-primary/15 text-primary border-primary/30",
      };
    }
    if (type === "intervention") {
      return {
        icon: "checklist",
        dotBg: "bg-emerald-600 text-white",
        badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      };
    }
    return {
      icon: "notifications",
      dotBg: "bg-amber-500 text-white",
      badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    };
  };

  if (loading) {
    return (
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-6 space-y-4 shadow-sm animate-pulse">
        <div className="h-6 w-40 bg-surface-container-high rounded-full" />
        <div className="space-y-3">
          <div className="h-16 bg-surface-container-lowest rounded-2xl" />
          <div className="h-16 bg-surface-container-lowest rounded-2xl" />
          <div className="h-16 bg-surface-container-lowest rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-5 sm:p-7 space-y-5 shadow-sm">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              history
            </span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-on-surface tracking-tight">
              {t("farmTimeline")}
            </h3>
            <p className="text-xs text-on-surface-variant font-medium">
              {language === "bn"
                ? "স্ক্যান ও কৃষি চিকিৎসা কার্যক্রমের সমন্বিত সময়রেখা"
                : language === "hi"
                ? "स्कैन व उपचार गतिविधियों की एकीकृत समयरेखा"
                : "Chronological log of diagnostic scans, treatments, and interventions"}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-container-lowest rounded-xl border border-outline-variant/20 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
              filter === "all"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {language === "bn" ? "সকল" : language === "hi" ? "सभी" : "All"}
          </button>
          <button
            type="button"
            onClick={() => setFilter("scan")}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
              filter === "scan"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {language === "bn" ? "স্ক্যান" : language === "hi" ? "स्कैन" : "Scans"}
          </button>
          <button
            type="button"
            onClick={() => setFilter("intervention")}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
              filter === "intervention"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {language === "bn" ? "চিকিৎসা" : language === "hi" ? "उपचार" : "Actions"}
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-10 px-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 space-y-2">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">timeline</span>
          <p className="text-sm font-bold text-on-surface">{t("noHistory")}</p>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {language === "bn"
              ? "পাতা স্ক্যান করুন অথবা সেচ ও কীটনাশক প্রয়োগের তথ্য সংরক্ষণ করলে এখানে স্বয়ংক্রিয়ভাবে যুক্ত হবে।"
              : language === "hi"
              ? "पत्ती स्कैन करें या सिंचाई/दवा छिड़काव दर्ज करें, वे यहां दिखाई देंगे।"
              : "Perform a leaf scan or log field treatments to track your agronomic history."}
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-outline-variant/30">
          {filteredEvents.map((ev, idx) => {
            const style = getEventStyle(ev.event_type, ev.severity);
            const isScan = ev.event_type === "scan";

            return (
              <div key={ev.id || idx} className="relative group">
                {/* Node Dot */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-sm ring-4 ring-surface-container-low transition-transform group-hover:scale-110 ${style.dotBg}`}
                >
                  <span className="material-symbols-outlined text-xs sm:text-sm">{style.icon}</span>
                </div>

                {/* Event Card */}
                <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant/20 hover:border-primary/40 transition-all hover:shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider ${style.badgeBg}`}>
                        {ev.category_badge}
                      </span>
                      <h4 className="text-sm font-extrabold text-on-surface">{ev.title}</h4>
                    </div>

                    <span className="text-[11px] font-semibold text-on-surface-variant/80 shrink-0">
                      {formatEventDate(ev.timestamp)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-start justify-between gap-4">
                    <p className="text-xs text-on-surface-variant leading-relaxed">{ev.detail}</p>

                    {isScan && ev.image_url && (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-outline-variant/30 bg-surface-container-high">
                        <img
                          src={ev.image_url}
                          alt="Leaf crop scan"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                  </div>

                  {isScan && (
                    <div className="mt-3 pt-2 border-t border-outline-variant/15 flex justify-end">
                      <Link
                        href={`/analysis/${ev.id}`}
                        className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>{t("viewFullReport")}</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
