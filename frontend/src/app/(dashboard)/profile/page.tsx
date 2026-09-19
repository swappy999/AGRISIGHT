"use client";

import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { Language, LANGUAGE_CONFIG } from "@/translations";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NOTIF_PREFS_KEY = "agrisight_notif_prefs";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (raw) return JSON.parse(raw) as { criticalAlerts: boolean; weeklySummaries: boolean };
  } catch {}
  return { criticalAlerts: true, weeklySummaries: true };
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const [prefsSaved, setPrefsSaved] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const togglePref = (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated));
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(language, { year: "numeric", month: "short", day: "numeric" })
    : t("recent");

  return (
    <div className="p-4 lg:p-12 max-w-[1200px] mx-auto space-y-8 lg:space-y-12 pb-24 xl:pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-5xl font-black text-on-surface tracking-tight">
            {t("profile")}
          </h1>
          <p className="text-on-surface-variant font-medium text-sm lg:text-base italic">
            {t("manageProfileSettings")}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-error-container text-error font-extrabold rounded-full flex items-center gap-2 hover:bg-error/20 active:scale-95 transition-all shadow-sm w-fit"
          aria-label="Sign out of AgriSight"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          {t("logout")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        {/* Account Info */}
        <div className="bg-surface-container-low p-8 lg:p-12 rounded-[2.5rem] shadow-sm border border-outline-variant/10 space-y-8 group">
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-on-surface tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">person</span>
              {t("accountStatus")}
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-2xl lg:text-3xl font-extrabold shadow-inner border border-outline-variant/20 group-hover:scale-105 transition-transform shrink-0">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-lg lg:text-xl font-extrabold text-on-surface truncate">
                  {user?.email}
                </p>
                <p className="text-on-surface-variant font-medium opacity-70 text-sm">
                  {t("memberSince", { date: formattedDate })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center bg-surface-container p-4 lg:p-5 rounded-[1.5rem] border border-outline-variant/10">
              <p className="font-bold text-on-surface text-sm">{t("dataSync")}</p>
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {t("active")}
              </div>
            </div>
            <div className="flex justify-between items-center bg-surface-container p-4 lg:p-5 rounded-[1.5rem] border border-outline-variant/10">
              <p className="font-bold text-on-surface text-sm">{t("subscription")}</p>
              <p className="font-extrabold text-secondary text-sm">{t("freeTier")}</p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-surface-container-lowest p-8 lg:p-12 rounded-[2.5rem] shadow-sm border border-outline-variant/10 space-y-8">
          {/* Language */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-on-surface tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">translate</span>
              {t("languageLabel")}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {(["en", "hi", "bn"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  aria-pressed={language === lang}
                  className={`px-6 py-4 rounded-[1.5rem] font-extrabold transition-all duration-300 text-left flex justify-between items-center ${
                    language === lang
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="text-base">
                    {LANGUAGE_CONFIG[lang]?.nativeName || lang}
                  </span>
                  {language === lang && (
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Preferences — H9: now stored in localStorage */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-on-surface tracking-tight flex items-center gap-2 pt-2">
              <span className="material-symbols-outlined text-primary text-3xl">notifications</span>
              {t("notificationPreferences")}
              {prefsSaved && (
                <span className="text-xs font-bold text-primary bg-primary-container px-2 py-0.5 rounded-full ml-auto">
                  {t("savedSuccess")}
                </span>
              )}
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 lg:p-5 bg-surface-container-low rounded-[1.5rem] cursor-pointer hover:bg-surface-container-high transition-colors">
                <div>
                  <span className="font-bold text-on-surface block text-sm">{t("criticalAlertsPref")}</span>
                  <span className="text-xs text-on-surface-variant">{t("criticalAlertsSub")}</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.criticalAlerts}
                  onChange={() => togglePref("criticalAlerts")}
                  className="w-5 h-5 accent-primary"
                  aria-label="Enable critical alerts"
                />
              </label>
              <label className="flex items-center justify-between p-4 lg:p-5 bg-surface-container-low rounded-[1.5rem] cursor-pointer hover:bg-surface-container-high transition-colors">
                <div>
                  <span className="font-bold text-on-surface block text-sm">{t("weeklySummariesPref")}</span>
                  <span className="text-xs text-on-surface-variant">{t("weeklySummariesSub")}</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.weeklySummaries}
                  onChange={() => togglePref("weeklySummaries")}
                  className="w-5 h-5 accent-primary"
                  aria-label="Enable weekly summaries"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* H10: Contact Support — mailto link */}
      <div className="p-8 lg:p-10 bg-emerald-900 text-on-primary rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-6 shadow-xl shadow-emerald-900/10">
        <div className="w-16 h-16 rounded-full bg-emerald-800 flex items-center justify-center text-primary-fixed-dim shrink-0">
          <span className="material-symbols-outlined text-4xl">eco</span>
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h3 className="text-xl font-extrabold">{t("needSupport")}</h3>
          <p className="text-emerald-100/70 font-medium text-sm">
            {t("supportSub")}
          </p>
        </div>
        <a
          href="mailto:support@agrisight.app"
          className="px-8 py-4 bg-white text-emerald-900 font-black rounded-full hover:scale-105 active:scale-95 transition-all whitespace-nowrap shadow-lg text-sm"
          aria-label="Contact AgriSight support via email"
        >
          {t("contactSupport")}
        </a>
      </div>
    </div>
  );
}
