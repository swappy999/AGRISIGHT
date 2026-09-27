"use client";

import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { useTheme, Theme } from "@/context/ThemeContext";
import { Language, LANGUAGE_CONFIG } from "@/translations";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { AppUpdateService, UpdateInfo, CURRENT_APP_VERSION, CURRENT_VERSION_CODE } from "@/lib/updateService";

const NOTIF_PREFS_KEY = "agrisight_notif_prefs";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (raw) return JSON.parse(raw) as { criticalAlerts: boolean; weeklySummaries: boolean };
  } catch {}
  return { criticalAlerts: true, weeklySummaries: true };
}

export default function ProfilePage() {
  const { user, profile, isVerified, logout, updateProfile, checkUsernameAvailable } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const router = useRouter();

  // Notification prefs
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Profile edit state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // App Update state (a2.md Section 29)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>(() => AppUpdateService.getCachedInfo());
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateCheckedMsg, setUpdateCheckedMsg] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync profile details when loaded
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setUsername(profile.username || "");
    }
  }, [profile]);

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

  const handleUsernameChange = (val: string) => {
    const cleaned = val.replace(/\s+/g, "");
    setUsername(cleaned);
    setProfileMessage(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!cleaned) {
      setUsernameStatus("idle");
      return;
    }

    // If unchanged from current profile username, it's valid
    if (profile?.username && cleaned.toLowerCase() === profile.username.toLowerCase()) {
      setUsernameStatus("available");
      return;
    }

    const clean = cleaned.trim();
    if (clean.length < 3 || clean.length > 20 || !/^[a-zA-Z0-9_]+$/.test(clean)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    debounceTimerRef.current = setTimeout(async () => {
      const isAvailable = await checkUsernameAvailable(clean);
      setUsernameStatus(isAvailable ? "available" : "taken");
    }, 400);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    if (username && usernameStatus === "taken") {
      setProfileMessage({ type: "error", text: t("usernameTaken") });
      return;
    }

    if (username && usernameStatus === "invalid") {
      setProfileMessage({ type: "error", text: t("usernameInvalid") });
      return;
    }

    setProfileSaving(true);
    setProfileMessage(null);

    const { error } = await updateProfile({
      fullName: fullName.trim(),
      username: username ? username.trim().toLowerCase() : undefined,
    });

    setProfileSaving(false);

    if (error) {
      setProfileMessage({ type: "error", text: error.message || t("profileUpdateFailed") });
    } else {
      setProfileMessage({ type: "success", text: t("profileUpdated") });
      setTimeout(() => setProfileMessage(null), 3500);
    }
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
        {/* Account Info & Profile Form */}
        <div className="bg-surface-container-low p-8 lg:p-12 rounded-[2.5rem] shadow-sm border border-outline-variant/10 space-y-8">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-on-surface tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-3xl">person</span>
                {t("accountStatus")}
              </h2>
              {/* Verification status badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isVerified
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {isVerified ? "verified" : "warning"}
                </span>
                <span>{isVerified ? t("verifiedAccount") : t("unverifiedAccount")}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-2xl lg:text-3xl font-extrabold shadow-inner border border-outline-variant/20 shrink-0">
                {profile?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <p className="text-lg lg:text-xl font-extrabold text-on-surface truncate">
                  {profile?.fullName || user?.email}
                </p>
                {profile?.username && (
                  <p className="text-primary font-bold text-sm">
                    @{profile.username}
                  </p>
                )}
                <p className="text-on-surface-variant font-medium opacity-70 text-xs">
                  {user?.email} • {t("memberSince", { date: formattedDate })}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="pt-2 border-t border-outline-variant/20 space-y-4">
            <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">edit</span>
              {t("editProfile")}
            </h3>

            {profileMessage && (
              <div
                className={`p-3.5 rounded-xl text-sm font-bold flex items-center gap-2 border ${
                  profileMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-error-container text-on-error-container border-error/20"
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {profileMessage.type === "success" ? "check_circle" : "error"}
                </span>
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="profile-fullname" className="text-xs font-bold text-on-surface ml-1">
                  {t("fullName")}
                </label>
                <input
                  id="profile-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container border border-outline-variant/40 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold text-on-surface transition-all"
                  placeholder="Farmer Ravi"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-username" className="text-xs font-bold text-on-surface ml-1">
                  {t("username")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant text-sm select-none">
                    @
                  </span>
                  <input
                    id="profile-username"
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    maxLength={20}
                    autoCapitalize="none"
                    spellCheck="false"
                    className={`w-full pl-8 pr-10 py-3 bg-surface-container border rounded-xl outline-none text-sm font-semibold text-on-surface transition-all ${
                      usernameStatus === "available"
                        ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        : usernameStatus === "taken" || usernameStatus === "invalid"
                        ? "border-error focus:ring-2 focus:ring-error/20"
                        : "border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    }`}
                    placeholder="kisan_ravi"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    {usernameStatus === "checking" && (
                      <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    )}
                    {usernameStatus === "available" && (
                      <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                    )}
                    {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                      <span className="material-symbols-outlined text-error text-lg">cancel</span>
                    )}
                  </div>
                </div>

                {usernameStatus !== "idle" && (
                  <p className="text-xs px-1 font-medium">
                    {usernameStatus === "checking" && (
                      <span className="text-primary">{t("usernameChecking")}</span>
                    )}
                    {usernameStatus === "available" && (
                      <span className="text-emerald-600 font-bold">{t("usernameAvailable")}</span>
                    )}
                    {usernameStatus === "taken" && (
                      <span className="text-error font-bold">{t("usernameTaken")}</span>
                    )}
                    {usernameStatus === "invalid" && (
                      <span className="text-error">{t("usernameInvalid")}</span>
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  id="btn-save-profile"
                  type="submit"
                  disabled={profileSaving || usernameStatus === "checking" || usernameStatus === "taken" || usernameStatus === "invalid"}
                  className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:bg-primary-hover active:scale-95 transition-all text-sm outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {profileSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>{t("saveProfile")}</span>
                      <span className="material-symbols-outlined text-lg">save</span>
                    </>
                  )}
                </button>

                <Link
                  href="/forgot-password"
                  className="px-5 py-3 bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-bold rounded-xl transition-all text-sm flex items-center gap-1.5 border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined text-lg">lock_reset</span>
                  <span>{t("changePassword")}</span>
                </Link>
              </div>
            </form>
          </div>

          <div className="space-y-3 pt-2">
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
          {/* Appearance (Theme) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-on-surface tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-3xl">palette</span>
                {t("appearance")}
              </h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
                {theme === "system"
                  ? `${t("themeSystem")} (${resolvedTheme === "dark" ? t("themeDark") : t("themeLight")})`
                  : theme === "dark"
                  ? t("themeDark")
                  : t("themeLight")}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label={t("appearance")}>
              {[
                {
                  id: "system" as Theme,
                  label: t("themeSystem"),
                  desc: t("themeSystemDesc"),
                  icon: "brightness_auto",
                },
                {
                  id: "light" as Theme,
                  label: t("themeLight"),
                  desc: t("themeLightDesc"),
                  icon: "light_mode",
                },
                {
                  id: "dark" as Theme,
                  label: t("themeDark"),
                  desc: t("themeDarkDesc"),
                  icon: "dark_mode",
                },
              ].map((opt) => {
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setTheme(opt.id)}
                    className={`p-4 lg:p-5 rounded-[1.5rem] font-bold transition-all duration-200 text-left flex items-center justify-between gap-4 border cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary text-on-surface ring-2 ring-primary/30"
                        : "bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high hover:border-outline-variant/40"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {opt.icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-sm sm:text-base text-on-surface block">
                          {opt.label}
                        </span>
                        <span className="text-xs text-on-surface-variant/80 font-medium block truncate">
                          {opt.desc}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-on-primary"
                            : "border-outline-variant/60 bg-transparent"
                        }`}
                      >
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-on-primary" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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

          {/* Notification Preferences */}
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

          {/* ── App Version & Updates (a2.md Section 27, 28, 29) ── */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xl font-extrabold text-on-surface tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">system_update</span>
              {language === "bn" ? "অ্যাপ সংস্করণ ও আপডেট" : language === "hi" ? "ऐप संस्करण एवं अपडेट" : "App Version & Updates"}
            </h2>

            <div className="p-5 lg:p-6 bg-surface-container-low rounded-[1.5rem] border border-outline-variant/15 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-on-surface block text-sm">
                    AgriSight Mobile {CURRENT_APP_VERSION}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Build {CURRENT_VERSION_CODE} · {language === "bn" ? "অনলাইন ও অফলাইন ইঞ্জিনিয়ারিং" : language === "hi" ? "ऑनलाइन व ऑफलाइन सिस्टम" : "Online & Offline Production Build"}
                  </span>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full uppercase tracking-wider">
                  v{CURRENT_APP_VERSION}
                </span>
              </div>

              {updateCheckedMsg && (
                <div className="p-3 bg-surface-container-highest/60 rounded-xl text-xs font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">info</span>
                  <span>{updateCheckedMsg}</span>
                </div>
              )}

              {updateInfo.updateAvailable && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">download</span>
                    {language === "bn" ? "নতুন আপডেট উপলব্ধ" : language === "hi" ? "नया अपडेट उपलब्ध है" : "New Update Available"}
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {updateInfo.releaseNotes}
                  </p>
                  {updateInfo.downloadUrl && (
                    <a
                      href={updateInfo.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl shadow-md shadow-primary/25 hover:bg-primary/90 transition-all mt-1"
                    >
                      <span className="material-symbols-outlined text-sm">cloud_download</span>
                      {language === "bn" ? "আপডেট ডাউনলোড করুন" : language === "hi" ? "अपडेट डाउनलोड करें" : "Download Update"}
                    </a>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={isCheckingUpdate}
                onClick={async () => {
                  setIsCheckingUpdate(true);
                  setUpdateCheckedMsg(null);
                  try {
                    const info = await AppUpdateService.checkForUpdates();
                    setUpdateInfo(info);
                    if (!info.updateAvailable) {
                      setUpdateCheckedMsg(
                        language === "bn"
                          ? "আপনার অ্যাপটি সর্বশেষ সংস্করণে রয়েছে।"
                          : language === "hi"
                          ? "आपका ऐप नवीनतम संस्करण पर है।"
                          : "You are running the latest version."
                      );
                    }
                  } catch {
                    setUpdateCheckedMsg(
                      language === "bn"
                        ? "আপডেট যাচাই করতে ব্যর্থ হয়েছে।"
                        : language === "hi"
                        ? "अपडेट जांचने में विफल।"
                        : "Failed to check for updates."
                    );
                  } finally {
                    setIsCheckingUpdate(false);
                  }
                }}
                className="w-full py-3 px-4 bg-surface-container-highest text-on-surface font-bold text-xs rounded-xl hover:bg-surface-dim active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className={`material-symbols-outlined text-base ${isCheckingUpdate ? "animate-spin" : ""}`}>
                  sync
                </span>
                {isCheckingUpdate
                  ? (language === "bn" ? "যাচাই করা হচ্ছে..." : language === "hi" ? "जाँच हो रही है..." : "Checking for Updates...")
                  : (language === "bn" ? "আপডেট পরীক্ষা করুন" : language === "hi" ? "अपडेट की जाँच करें" : "Check for Updates")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support */}
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
