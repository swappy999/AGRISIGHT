"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";

export interface Alert {
  id: string;
  type: "warning" | "optimal" | "alert" | "critical";
  title: string;
  message: string;
  timeLabel: string;
  isNew?: boolean;
  is_read: boolean;
  scanId?: string;
}

export interface AlertStats {
  total: number;
  unread: number;
  critical: number;
  totalScans: number;
  activeThreats: number;
}

function buildAlertsFromScans(analyses: any[], language: string): Alert[] {
  const alerts: Alert[] = [];
  for (const record of analyses) {
    const r = record.result_json || record.result || {};
    const severity = (r.severity || record.severity || "").toLowerCase();
    const condition = r.disease || r.condition || record.disease || "";
    const crop = r.crop || record.crop_name || (language === "bn" ? "ফসল" : language === "hi" ? "फसल" : "Crop");
    const condLower = condition.toLowerCase();
    const isAgri = r.is_agricultural !== false && !condLower.includes("non-crop") && !condLower.includes("not applicable");
    const category = (r.category || "").toLowerCase();
    const isNonCrop = !isAgri || category === "non_crop" || (r.validation_status || "").toUpperCase() === "NON_CROP" || condLower.includes("not applicable") || condLower.includes("non-crop");
    if (isNonCrop || !condition) continue;

    let type: Alert["type"] = "optimal";
    let title = "";
    let message = "";

    if (severity === "high" || severity === "critical" || severity === "severe") {
      type = "critical";
      if (language === "bn") {
        title = "গুরুতর রোগ সতর্কতা";
        message = `আপনার ${crop} গাছে ${condition} শনাক্ত হয়েছে। অবিলম্বে ব্যবস্থা নিন।`;
      } else if (language === "hi") {
        title = "गंभीर रोग चेतावनी";
        message = `आपकी ${crop} में ${condition} का गंभीर जोखिम पाया गया है। तुरंत उपाय करें।`;
      } else {
        title = "Critical Crop Threat";
        message = `${condition} detected on ${crop}. Immediate agronomic action recommended.`;
      }
    } else if (severity === "medium" || severity === "moderate") {
      type = "alert";
      if (language === "bn") {
        title = "ফসলের রোগ সতর্কতা";
        message = `${crop} গাছে ${condition} দেখা গেছে (মাঝারি ঝুঁকি)। সময়মতো চিকিৎসা করুন।`;
      } else if (language === "hi") {
        title = "फसल रोग चेतावनी";
        message = `${crop} में ${condition} पाया गया है (मध्यम जोखिम)। समय पर उपचार करें।`;
      } else {
        title = "Crop Health Alert";
        message = `${condition} observed on ${crop} (moderate risk). Action recommended.`;
      }
    } else if (r.health_status === "Healthy" || condLower.includes("healthy") || condLower.includes("routine")) {
      type = "optimal";
      if (language === "bn") {
        title = "সুস্থ ফসল";
        message = `আপনার ${crop} সুস্থ ও রোগমুক্ত অবস্থায় রয়েছে।`;
      } else if (language === "hi") {
        title = "स्वस्थ फसल";
        message = `आपकी ${crop} पूरी तरह स्वस्थ और रोगमुक्त है।`;
      } else {
        title = "Healthy Crop";
        message = `${crop} is healthy with no disease symptoms detected.`;
      }
    } else {
      type = "warning";
      if (language === "bn") {
        title = "ফসল পর্যবেক্ষণ";
        message = `${crop} গাছে ${condition} দেখা গেছে। নজর রাখুন।`;
      } else if (language === "hi") {
        title = "फसल निगरानी";
        message = `${crop} में ${condition} देखा गया है। निगरानी जारी रखें।`;
      } else {
        title = "Crop Monitoring";
        message = `${condition} detected on ${crop}. Routine surveillance advised.`;
      }
    }

    alerts.push({
      id: record.id,
      scanId: record.id,
      type,
      title,
      message,
      timeLabel: record.created_at
        ? new Date(record.created_at).toLocaleDateString(language === "bn" ? "bn-IN" : language === "hi" ? "hi-IN" : "en-IN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      is_read: false,
    });
  }

  const order: Record<string, number> = { critical: 0, alert: 1, warning: 2, optimal: 3 };
  alerts.sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));
  return alerts;
}

export function RealtimeAlerts({ onStatsChange }: { onStatsChange?: (stats: AlertStats) => void }) {
  const { t, language } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    audioRef.current = new Audio("/alert.mp3");
    audioRef.current.volume = 0.5;

    const fetchAlerts = async () => {
      setLoadingAlerts(true);
      try {
        const [notifData, analysesData] = await Promise.all([
          api.getNotifications().catch(async () => {
            const { data } = await supabase
              .from("notifications")
              .select("*")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(50);
            return data || [];
          }),
          api.getAnalyses().catch(() => []),
        ]);

        const savedRead = (() => {
          try {
            return new Set<string>(JSON.parse(localStorage.getItem("agrisight_read_alerts") || "[]"));
          } catch {
            return new Set<string>();
          }
        })();

        let combinedAlerts: Alert[] = [];
        const seenIds = new Set<string>();

        // 1. Process explicit notifications
        if (Array.isArray(notifData)) {
          for (const n of notifData) {
            seenIds.add(n.id);
            combinedAlerts.push({
              id: n.id,
              type: (n.type as Alert["type"]) || "alert",
              title:
                n.title ||
                (n.type === "critical"
                  ? "criticalAlert"
                  : n.type === "alert"
                  ? "cropAlert"
                  : "systemNotification"),
              message: n.message,
              timeLabel: n.created_at
                ? new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "",
              is_read: Boolean(n.is_read) || savedRead.has(n.id),
            });
          }
        }

        // 2. Build alerts from empirical crop scans (threats, diseases, inspections)
        if (Array.isArray(analysesData) && analysesData.length > 0) {
          const scanAlerts = buildAlertsFromScans(analysesData, language);
          for (const sa of scanAlerts) {
            if (!seenIds.has(sa.id)) {
              seenIds.add(sa.id);
              combinedAlerts.push({
                ...sa,
                is_read: sa.is_read || savedRead.has(sa.id),
              });
            }
          }
        }

        const order: Record<string, number> = { critical: 0, alert: 1, warning: 2, optimal: 3 };
        combinedAlerts.sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));

        setAlerts(combinedAlerts);

        // Calculate and emit stats
        const activeThreatsCount = Array.isArray(analysesData)
          ? analysesData.filter((s: any) => {
              const r = s.result_json || s.result || {};
              const sev = (r.severity || s.severity || "").toLowerCase();
              const cond = (r.disease || r.condition || s.disease || "").toLowerCase();
              const isAgri = r.is_agricultural !== false && !cond.includes("non-crop") && !cond.includes("not applicable");
              const isHealthy = cond.includes("healthy") || cond.includes("routine");
              return isAgri && !isHealthy && (sev === "critical" || sev === "high" || sev === "medium" || sev === "moderate" || sev === "severe");
            }).length
          : 0;

        if (onStatsChange) {
          onStatsChange({
            total: combinedAlerts.length,
            unread: combinedAlerts.filter((a) => !a.is_read).length,
            critical: combinedAlerts.filter((a) => a.type === "critical").length,
            totalScans: Array.isArray(analysesData) ? analysesData.length : 0,
            activeThreats: activeThreatsCount,
          });
        }
      } catch (e) {
        console.warn("Failed to load alerts:", e);
      } finally {
        setLoadingAlerts(false);
      }
    };

    fetchAlerts();

    const channel = supabase
      .channel(`user_notifs_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;
          setAlerts((prev) => {
            if (prev.some((a) => a.id === n.id)) return prev;
            const isCritical = n.type === "critical";
            if (isCritical) {
              audioRef.current?.play().catch(() => {});
            }
            const newAlert: Alert = {
              id: n.id,
              type: n.type as Alert["type"],
              title: isCritical ? "criticalAlert" : "newAlert",
              message: n.message,
              timeLabel: "justNow",
              isNew: true,
              is_read: false,
            };
            return [newAlert, ...prev].slice(0, 50);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, language]);

  const markRead = async (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
    );
    try {
      const saved = new Set<string>(JSON.parse(localStorage.getItem("agrisight_read_alerts") || "[]"));
      saved.add(id);
      localStorage.setItem("agrisight_read_alerts", JSON.stringify([...saved]));
    } catch {}
    try {
      await api.markNotificationRead(id).catch(() => {});
    } catch {}
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    } catch {}
  };

  const displayed = showUnreadOnly ? alerts.filter((a) => !a.is_read) : alerts;
  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="col-span-12 lg:col-span-5 flex flex-col space-y-3 lg:space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xl lg:text-2xl font-bold text-on-surface tracking-tight">
          {t("realtimeAlerts")}
          {unreadCount > 0 && (
            <span className="ml-2 bg-error text-on-error text-xs font-black px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowUnreadOnly((v) => !v)}
          title={showUnreadOnly ? t("showAll") : t("showUnreadOnly")}
          className={`p-2 rounded-full transition-colors active:scale-95 ${
            showUnreadOnly
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-highest"
          }`}
          aria-label={showUnreadOnly ? t("showAll") : t("showUnreadOnly")}
        >
          <span className="material-symbols-outlined text-xl">
            {showUnreadOnly ? "filter_list_off" : "tune"}
          </span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-[2rem] p-3 lg:p-6 space-y-3 flex-1 shadow-sm border border-outline-variant/10 max-h-[420px] lg:max-h-[500px] overflow-y-auto">
        {!authLoading && !user && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant">lock</span>
            <p className="font-bold text-on-surface-variant">{t("signInToSeeAlerts")}</p>
          </div>
        )}
        {(authLoading || loadingAlerts) && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface-container-high rounded-2xl" />
            ))}
          </div>
        )}
        {!authLoading && !loadingAlerts && user && displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant">
              {showUnreadOnly ? "done_all" : "notifications_none"}
            </span>
            <p className="font-bold text-on-surface-variant">
              {showUnreadOnly ? t("noUnreadNotifications") : t("noAlertsYet")}
            </p>
          </div>
        )}
        {!authLoading && !loadingAlerts && user && displayed.map((alert) => (
          <AlertItem key={alert.id} alert={alert} onMarkRead={markRead} />
        ))}
      </div>
    </div>
  );
}

function AlertItem({ alert, onMarkRead }: { alert: Alert; onMarkRead: (id: string) => void }) {
  const { t, language } = useTranslation();
  const [flashing, setFlashing] = useState(alert.isNew && alert.type === "critical");

  useEffect(() => {
    if (flashing) {
      const timer = setTimeout(() => setFlashing(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [flashing]);

  const configs: Record<Alert["type"], { border: string; bg: string; text: string; icon: string }> = {
    critical: { border: "border-error/40", bg: "bg-error", text: "text-on-error", icon: "campaign" },
    warning: { border: "border-outline-variant/30", bg: "bg-surface-dim", text: "text-on-surface", icon: "warning" },
    alert: { border: "border-secondary-container", bg: "bg-secondary-container", text: "text-on-secondary-container", icon: "bug_report" },
    optimal: { border: "border-primary-container", bg: "bg-primary-container", text: "text-on-primary-container", icon: "check_circle" },
  };

  const config = configs[alert.type] || configs.warning;
  const knownKeys = ["criticalAlert", "cropAlert", "newAlert", "systemNotification"];
  const displayTitle = knownKeys.includes(alert.title) ? t(alert.title as any) : alert.title;
  const displayTime = alert.timeLabel === "justNow" ? t("justNow") : alert.timeLabel;

  return (
    <div
      className={`bg-surface p-3 lg:p-4 rounded-2xl flex gap-3 items-start shadow-sm border-2 ${config.border} transition-all duration-500 hover:shadow-md ${
        flashing ? "animate-pulse shadow-error/50 shadow-xl scale-[1.02] border-error" : ""
      } ${alert.is_read ? "opacity-60" : ""}`}
      onClick={() => !alert.is_read && onMarkRead(alert.id)}
      role={!alert.is_read ? "button" : undefined}
      aria-label={!alert.is_read ? `Mark "${displayTitle}" as read` : undefined}
      style={{ cursor: alert.is_read ? "default" : "pointer" }}
    >
      <div className={`w-10 h-10 lg:w-12 lg:h-12 shrink-0 rounded-xl lg:rounded-2xl flex items-center justify-center ${config.bg} ${config.text}`}>
        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {config.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h5 className="font-extrabold text-on-surface text-sm tracking-tight leading-tight">
            {displayTitle}
            {!alert.is_read && (
              <span className="inline-block w-2 h-2 rounded-full bg-primary ml-1.5 align-middle" />
            )}
          </h5>
          <span className="text-[10px] font-bold text-on-surface-variant/50 whitespace-nowrap bg-surface-container-high px-2 py-0.5 rounded-full shrink-0">
            {displayTime}
          </span>
        </div>
        <p className="text-xs lg:text-sm font-medium text-on-surface-variant mt-1 line-clamp-2">
          {alert.message}
        </p>
        {alert.scanId && (
          <div className="mt-2.5 flex items-center gap-2">
            <Link
              href={`/analysis/${alert.scanId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-lg transition-colors hover:bg-primary/20"
            >
              <span>{language === "bn" ? "রিপোর্ট দেখুন" : language === "hi" ? "रिपोर्ट देखें" : "View Report"}</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
