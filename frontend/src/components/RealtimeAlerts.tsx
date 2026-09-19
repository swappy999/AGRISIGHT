"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface Alert {
  id: string;
  type: "warning" | "optimal" | "alert" | "critical";
  title: string;
  message: string;
  timeLabel: string;
  isNew?: boolean;
  is_read: boolean;
}

export function RealtimeAlerts() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    audioRef.current = new Audio("/alert.mp3");
    audioRef.current.volume = 0.5;

    // Fetch initial notifications
    const fetchInitial = async () => {
      try {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (data) {
          setAlerts(
            data.map((n) => ({
              id: n.id,
              type: n.type as Alert["type"],
              title:
                n.type === "critical"
                  ? "criticalAlert"
                  : n.type === "alert"
                  ? "cropAlert"
                  : "systemNotification",
              message: n.message,
              timeLabel: new Date(n.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              is_read: n.is_read ?? false,
            }))
          );
        }
      } catch (e) {
        console.warn("Failed to fetch notifications (fallback used):", e);
      } finally {
        setLoadingAlerts(false);
      }
    };

    fetchInitial();

    // Subscribe to realtime inserts
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
            return [newAlert, ...prev].slice(0, 20);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading]);

  const markRead = async (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
    );
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
    } catch (e) {
      console.warn("Failed to mark notification as read:", e);
    }
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
        {/* Unauthenticated state */}
        {!authLoading && !user && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant">
              lock
            </span>
            <p className="font-bold text-on-surface-variant">{t("signInToSeeAlerts")}</p>
          </div>
        )}

        {/* Loading skeletons */}
        {(authLoading || loadingAlerts) && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface-container-high rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
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

        {/* Alert list */}
        {!authLoading &&
          !loadingAlerts &&
          user &&
          displayed.map((alert) => (
            <AlertItem key={alert.id} alert={alert} onMarkRead={markRead} />
          ))}
      </div>
    </div>
  );
}

function AlertItem({
  alert,
  onMarkRead,
}: {
  alert: Alert;
  onMarkRead: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [flashing, setFlashing] = useState(alert.isNew && alert.type === "critical");

  useEffect(() => {
    if (flashing) {
      const timer = setTimeout(() => setFlashing(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [flashing]);

  const configs: Record<Alert["type"], { border: string; bg: string; text: string; icon: string }> = {
    critical: {
      border: "border-error/40",
      bg: "bg-error",
      text: "text-on-error",
      icon: "campaign",
    },
    warning: {
      border: "border-outline-variant/30",
      bg: "bg-surface-dim",
      text: "text-on-surface",
      icon: "warning",
    },
    alert: {
      border: "border-secondary-container",
      bg: "bg-secondary-container",
      text: "text-on-secondary-container",
      icon: "bug_report",
    },
    optimal: {
      border: "border-primary-container",
      bg: "bg-primary-container",
      text: "text-on-primary-container",
      icon: "water_drop",
    },
  };

  const config = configs[alert.type] || configs.warning;
  const displayTitle =
    alert.title === "criticalAlert"
      ? t("criticalAlert")
      : alert.title === "cropAlert"
      ? t("cropAlert")
      : alert.title === "newAlert"
      ? t("newAlert")
      : alert.title === "systemNotification"
      ? t("systemNotification")
      : t(alert.title as any) || alert.title;

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
      <div
        className={`w-10 h-10 lg:w-12 lg:h-12 shrink-0 rounded-xl lg:rounded-2xl flex items-center justify-center ${config.bg} ${config.text}`}
      >
        <span
          className="material-symbols-outlined text-xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
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
      </div>
    </div>
  );
}
