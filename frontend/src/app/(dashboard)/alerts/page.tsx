"use client";

import Link from "next/link";
import { RealtimeAlerts, AlertStats } from "@/components/RealtimeAlerts";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { useState } from "react";

export default function AlertsPage() {
  const { user } = useAuth();
  const { t, formatNumber } = useTranslation();
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    unread: 0,
    critical: 0,
    totalScans: 0,
    activeThreats: 0,
  });

  return (
    <div className="p-4 lg:p-12 max-w-[1400px] mx-auto space-y-8 lg:space-y-12 pb-24 xl:pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-outline-variant/30 pb-6 lg:pb-12">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all w-fit"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          {t("backToDashboard")}
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-6xl font-black text-on-surface tracking-tight leading-tight">
            {t("notificationsTitle")}
          </h1>
          <p className="text-on-surface-variant text-sm lg:text-lg font-medium mt-1">
            {t("notificationsSubtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 lg:gap-12">
        {/* Alerts feed */}
        <div className="col-span-12 lg:col-span-8">
          <RealtimeAlerts onStatsChange={setStats} />
        </div>

        {/* Sidebar panel — real stats, no fake text */}
        <div className="col-span-12 lg:col-span-4 space-y-4 lg:space-y-8">
          {user && (
            <div className="bg-primary-container/40 border border-primary/10 p-6 lg:p-8 rounded-[2rem] space-y-4">
              <h3 className="text-lg font-extrabold text-on-surface tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  bar_chart
                </span>
                {t("summary")}
              </h3>
              <div className="space-y-3">
                <Link
                  href="/analytics"
                  className="flex justify-between items-center pb-2.5 border-b border-outline-variant/15 group hover:text-primary transition-colors"
                >
                  <span className="text-sm font-bold text-on-surface-variant group-hover:text-primary flex items-center gap-1.5 transition-colors">
                    <span className="material-symbols-outlined text-base text-primary">document_scanner</span>
                    {t("totalScans")}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-black text-on-surface text-lg group-hover:text-primary transition-colors">{formatNumber(stats.totalScans)}</span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                  </div>
                </Link>
                <Link
                  href="/analytics"
                  className="flex justify-between items-center pb-2.5 border-b border-outline-variant/15 group hover:text-error transition-colors"
                >
                  <span className="text-sm font-bold text-on-surface-variant group-hover:text-error flex items-center gap-1.5 transition-colors">
                    <span className="material-symbols-outlined text-base text-error">warning</span>
                    {t("activeThreats")}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`font-black text-lg group-hover:underline ${stats.activeThreats > 0 ? "text-error" : "text-on-surface-variant"}`}>
                      {formatNumber(stats.activeThreats)}
                    </span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-error group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                  </div>
                </Link>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-on-surface-variant">{t("totalAlerts")}</span>
                  <span className="font-black text-on-surface text-lg">{formatNumber(stats.total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-on-surface-variant">{t("unread")}</span>
                  <span className={`font-black text-lg ${stats.unread > 0 ? "text-primary" : "text-on-surface-variant"}`}>
                    {formatNumber(stats.unread)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-on-surface-variant">{t("critical")}</span>
                  <span className={`font-black text-lg ${stats.critical > 0 ? "text-error" : "text-on-surface-variant"}`}>
                    {formatNumber(stats.critical)}
                  </span>
                </div>
              </div>

              {stats.activeThreats > 0 && (
                <div className="pt-2">
                  <Link
                    href="/analytics"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <span>View Threat Breakdown in Analytics</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="bg-surface-container p-6 lg:p-8 rounded-[2rem] space-y-4 border border-outline-variant/20">
            <h3 className="text-base font-extrabold text-on-surface tracking-tight">
              {t("aboutAlerts")}
            </h3>
            <div className="space-y-3 text-sm text-on-surface-variant font-medium leading-relaxed">
              <p>
                🔴 <strong className="text-on-surface">{t("critical")}</strong> — {t("criticalAlertsDesc")}
              </p>
              <p>
                🟡 <strong className="text-on-surface">{t("alerts")}</strong> — {t("warningAlertsDesc")}
              </p>
              <p>
                🟢 <strong className="text-on-surface">{t("healthy")}</strong> — {t("optimalAlertsDesc")}
              </p>
            </div>
          </div>

          <Link
            href="/scan"
            className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-on-primary font-bold rounded-[2rem] shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add_a_photo</span>
            {t("scanNewCrop")}
          </Link>
        </div>
      </div>
    </div>
  );
}
