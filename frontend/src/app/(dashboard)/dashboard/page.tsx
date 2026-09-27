"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { api } from "@/lib/apiClient";
import { WeatherCard } from "@/components/WeatherCard";
import { UploadCard } from "@/components/UploadCard";
import { SensorService } from "@/lib/sensorService";
import { SensorReading, HardwareStatus } from "@/lib/hardwareContracts";

interface AlertItem {
  id: string;
  type: string;
  title: string;
  message: string;
  timeLabel: string;
  is_read: boolean;
}

export default function DashboardHome() {
  const { profile } = useAuth();
  const { t, language, translateDynamic, formatNumber } = useTranslation();
  const [farmHealth, setFarmHealth] = useState<number | null>(null);
  const [totalFields, setTotalFields] = useState<number>(0);
  const [fields, setFields] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [totalScans, setTotalScans] = useState<number>(0);
  const [activeThreats, setActiveThreats] = useState<number>(0);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(true);
  const [loadingFields, setLoadingFields] = useState<boolean>(true);
  const [sensorReading, setSensorReading] = useState<SensorReading | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMinimalMetrics() {
      try {
        const [fieldsData, notifsData, analysesData, readingsData, hwStatusData] = await Promise.all([
          api.getFields().catch(() => []),
          api.getNotifications().catch(() => []),
          api.getAnalyses().catch(() => []),
          SensorService.getLatestReadings().catch(() => []),
          SensorService.getFieldHardwareStatus().catch(() => null),
        ]);

        if (cancelled) return;

        if (Array.isArray(readingsData) && readingsData.length > 0) {
          setSensorReading(readingsData[0]);
        } else {
          setSensorReading(null);
        }
        setHardwareStatus(hwStatusData);

        if (Array.isArray(fieldsData) && fieldsData.length > 0) {
          setTotalFields(fieldsData.length);
          setFields(fieldsData.slice(0, 3));
          const totalScore = fieldsData.reduce((acc: number, f: any) => acc + (f.health_score ?? 85), 0);
          setFarmHealth(Math.round(totalScore / fieldsData.length));
        } else {
          setTotalFields(0);
          setFields([]);
          setFarmHealth(null);
        }
        if (Array.isArray(analysesData)) {
          setTotalScans(analysesData.length);
          const threatsCount = analysesData.filter((s: any) => {
            const r = s.result_json || s.result || {};
            const sev = (r.severity || s.severity || "").toLowerCase();
            const cond = (r.disease || r.condition || s.disease || "").toLowerCase();
            const isAgri = r.is_agricultural !== false && !cond.includes("non-crop") && !cond.includes("not applicable");
            const isHealthy = cond.includes("healthy") || cond.includes("routine");
            return isAgri && !isHealthy && (sev === "critical" || sev === "high" || sev === "medium" || sev === "moderate" || sev === "severe");
          }).length;
          setActiveThreats(threatsCount);
        }

        const combinedAlerts: AlertItem[] = [];
        const seenIds = new Set<string>();

        if (Array.isArray(notifsData) && notifsData.length > 0) {
          for (const n of notifsData) {
            seenIds.add(n.id);
            combinedAlerts.push({
              id: n.id,
              type: n.type || "alert",
              title:
                n.title ||
                (n.type === "critical"
                  ? (language === "bn" ? "জরুরি সতর্কবার্তা" : language === "hi" ? "गंभीर चेतावनी" : "Critical Issue")
                  : n.type === "alert"
                  ? (language === "bn" ? "রোগ সতর্কতা" : language === "hi" ? "फसल चेतावनी" : "Crop Alert")
                  : (language === "bn" ? "বিজ্ঞপ্তি" : language === "hi" ? "सूचना" : "Notification")),
              message: n.message || "",
              timeLabel: n.created_at
                ? new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "",
              is_read: Boolean(n.is_read),
            });
          }
        }

        if (Array.isArray(analysesData) && analysesData.length > 0) {
          for (const s of analysesData) {
            const r = s.result_json || s.result || {};
            const sev = (r.severity || s.severity || "").toLowerCase();
            const cond = r.disease || r.condition || s.disease || "";
            const crop = r.crop || s.crop_name || (language === "bn" ? "ফসল" : language === "hi" ? "फसल" : "Crop");
            const condLower = cond.toLowerCase();
            const isAgri = r.is_agricultural !== false && !condLower.includes("non-crop") && !condLower.includes("not applicable");
            const isHealthy = condLower.includes("healthy") || condLower.includes("routine");
            if (!isAgri || isHealthy || !cond) continue;

            const isCritical = sev === "critical" || sev === "high" || sev === "severe";
            if (!seenIds.has(s.id)) {
              seenIds.add(s.id);
              combinedAlerts.push({
                id: s.id,
                type: isCritical ? "critical" : "alert",
                title: isCritical
                  ? (language === "bn" ? "জরুরি রোগ সতর্কতা" : language === "hi" ? "गंभीर रोग चेतावनी" : "Critical Crop Threat")
                  : (language === "bn" ? "রোগ সতর্কতা" : language === "hi" ? "फसल रोग चेतावनी" : "Crop Health Alert"),
                message: `${cond} detected in ${crop}.`,
                timeLabel: s.created_at
                  ? new Date(s.created_at).toLocaleDateString(language === "bn" ? "bn-IN" : language === "hi" ? "hi-IN" : "en-IN", {
                      month: "short",
                      day: "numeric",
                    })
                  : "",
                is_read: false,
              });
            }
          }
        }
        setAlerts(combinedAlerts.slice(0, 5));
      } catch {
        // Fallback silently without blocking UI shell
      } finally {
        if (!cancelled) {
          setLoadingAlerts(false);
          setLoadingFields(false);
        }
      }
    }

    loadMinimalMetrics();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return language === "bn" ? "শুভ সকাল" : language === "hi" ? "शुभ प्रभात" : "Good Morning";
    if (hour < 17) return language === "bn" ? "শুভ দুপুর" : language === "hi" ? "शुभ दोपहर" : "Good Afternoon";
    return language === "bn" ? "শুভ সন্ধ্যা" : language === "hi" ? "शुभ संध्या" : "Good Evening";
  };

  const farmerName = profile?.fullName?.split(" ")[0] || (language === "bn" ? "কৃষক" : language === "hi" ? "किसान" : "Farmer");
  const unreadAlertsCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl xl:max-w-[1440px] mx-auto pb-24 xl:pb-12">
      {/* ── 1. Minimal Command Header ── */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xs">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-live-pulse" />
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              spa
            </span>
            <span>{t("cropIntelligence")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            {getGreeting()}, {farmerName} 🌱
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed">
            {language === "bn"
              ? "আজকের আবহাওয়া ও গুরুত্বপূর্ণ সতর্কতা দেখে সরাসরি আপনার ফসল স্ক্যান করুন।"
              : language === "hi"
              ? "आज का मौसम और महत्वपूर्ण अलर्ट देखें और सीधे अपनी फसल स्कैन करें।"
              : "Here is what needs your attention today. Check weather, alerts, or scan your crop."}
          </p>
        </div>

        {/* Minimal Health Dial / Indicator */}
        <div className="flex flex-wrap items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 md:border-l border-outline-variant/20 pt-4 md:pt-0 md:pl-6 shrink-0">
          {loadingFields ? (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-surface-container-high" />
              <div className="space-y-1.5">
                <div className="w-16 h-3 bg-surface-container-high rounded" />
                <div className="w-20 h-4 bg-surface-container-high rounded" />
              </div>
            </div>
          ) : farmHealth !== null ? (
            <div className="flex items-center gap-3.5">
              <div
                className="relative w-14 h-14 sm:w-15 sm:h-15 shrink-0"
                role="progressbar"
                aria-valuenow={farmHealth}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Farm Health: ${farmHealth}% (${farmHealth >= 80 ? t("healthy") : farmHealth >= 55 ? t("moderate") : t("critical")})`}
              >
                <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90" aria-hidden="true">
                  <circle cx="44" cy="44" r="36" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-container-high" />
                  <circle
                    cx="44"
                    cy="44"
                    r="36"
                    fill="none"
                    stroke={farmHealth >= 80 ? "#16a34a" : farmHealth >= 55 ? "#d97706" : "#dc2626"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 36}
                    strokeDashoffset={2 * Math.PI * 36 - (Math.min(farmHealth, 100) / 100) * 2 * Math.PI * 36}
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <span className="text-sm font-black text-on-surface">{formatNumber(farmHealth)}%</span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">
                  {t("overallHealth")}
                </p>
                <h3 className="text-sm font-extrabold text-on-surface">
                  {farmHealth >= 80 ? t("healthy") : farmHealth >= 55 ? t("moderate") : t("critical")}
                </h3>
                <p className="text-[11px] text-on-surface-variant font-semibold">
                  {formatNumber(totalFields)} {t("fields")}
                </p>
              </div>
            </div>
          ) : (
            <Link
              href="/fields"
              className="btn-farmer-secondary text-xs"
            >
              <span className="material-symbols-outlined text-base text-primary">add_location_alt</span>
              <span>{t("addField")}</span>
            </Link>
          )}

          {totalScans > 0 && (
            <Link
              href="/analytics"
              className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl hover:border-primary/40 transition-all shadow-2xs"
              title={t("totalScans")}
            >
              <span className="material-symbols-outlined text-primary text-base">document_scanner</span>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant block leading-tight">{t("totalScans")}</span>
                <span className="text-xs font-black text-on-surface leading-tight">{formatNumber(totalScans)}</span>
              </div>
            </Link>
          )}

          {activeThreats > 0 && (
            <Link
              href="/alerts"
              className="flex items-center gap-2 px-3 py-2 bg-error/10 border border-error/30 rounded-2xl hover:border-error transition-all shadow-2xs"
              title={t("activeThreats")}
            >
              <span className="material-symbols-outlined text-error text-base animate-pulse">warning</span>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-error block leading-tight">{t("activeThreats")}</span>
                <span className="text-xs font-black text-error leading-tight">{formatNumber(activeThreats)}</span>
              </div>
            </Link>
          )}

          {unreadAlertsCount > 0 && (
            <Link
              href="/alerts"
              className="badge-critical py-2 px-3 text-xs shrink-0 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-base animate-pulse">notifications_active</span>
              <span>{formatNumber(unreadAlertsCount)} {t("alerts")}</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Desktop 2-Column Responsive Layout (§3) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Leaf Scan Centerpiece, Weather, Field Status */}
        <div className="xl:col-span-7 xl:self-start space-y-6">
          {/* ── 2. Quick Scan CTA (Centerpiece Action) ── */}
          <UploadCard />

          {/* ── 3. Weather Context Card ── */}
          <WeatherCard />

          {/* ── 4. Field Status Summary (§3 Priority 5) ── */}
          <div className="farmer-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    grid_view
                  </span>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-on-surface tracking-tight">
                    {language === "bn" ? "জমির অবস্থা" : language === "hi" ? "खेत की स्थिति" : "Field Status"}
                  </h2>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {language === "bn"
                      ? "আপনার সক্রিয় কৃষিজমির পর্যবেক্ষণ ও স্বাস্থ্য"
                      : language === "hi"
                      ? "आपकी सक्रिय कृषि भूमि की निगरानी और स्वास्थ्य"
                      : "Overview of your active farming plots"}
                  </p>
                </div>
              </div>

              <Link
                href="/fields"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                <span>{language === "bn" ? "সকল জমি" : language === "hi" ? "सभी खेत" : "Manage Fields"}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {loadingFields ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1.5 flex-1">
                        <div className="w-24 h-4 bg-surface-container-high rounded" />
                        <div className="w-16 h-3 bg-surface-container-high rounded" />
                      </div>
                      <div className="w-8 h-4 bg-surface-container-high rounded-full" />
                    </div>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full" />
                  </div>
                ))}
              </div>
            ) : fields.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {fields.map((f: any) => {
                  const score = f.health_score ?? 85;
                  const isGood = score >= 80;
                  const isFair = score >= 55 && score < 80;
                  return (
                    <Link
                      key={f.id}
                      href={`/fields/${f.id}`}
                      className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-on-surface truncate group-hover:text-primary transition-colors">
                            {translateDynamic(f.name)}
                          </h3>
                          <p className="text-xs text-on-surface-variant font-medium truncate mt-0.5">
                            {f.crop_type ? translateDynamic(f.crop_type) : (language === "bn" ? "ফসল" : language === "hi" ? "फसल" : "Crop")} • {formatNumber(f.area_acres ?? 1)} {language === "bn" ? "একর" : language === "hi" ? "एकड़" : "acres"}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            isGood
                              ? "bg-emerald-500/10 text-emerald-700"
                              : isFair
                              ? "bg-amber-500/10 text-amber-700"
                              : "bg-rose-500/10 text-rose-700"
                          }`}
                        >
                          {formatNumber(score)}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isGood ? "bg-emerald-500" : isFair ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(score, 100)}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-dashed border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-on-surface-variant font-medium">
                  <span className="material-symbols-outlined text-xl text-primary shrink-0">add_location_alt</span>
                  <span>
                    {language === "bn"
                      ? "এখনও কোনো জমি যোগ করা হয়নি। স্বাস্থ্য নিরীক্ষণ শুরু করতে জমি যোগ করুন।"
                      : language === "hi"
                      ? "अभी तक कोई खेत नहीं जोड़ा गया है। स्वास्थ्य निगरानी शुरू करने के लिए खेत जोड़ें।"
                      : "No fields added yet. Add your first field to begin monitoring."}
                  </span>
                </div>
                <Link
                  href="/fields"
                  className="px-3.5 py-1.5 bg-primary text-on-primary rounded-xl font-bold text-xs shrink-0 shadow-xs hover:bg-primary/90 transition-all"
                >
                  {t("addField")}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Rail: Alerts Widget, IoT Telemetry */}
        <div className="xl:col-span-5 xl:self-start space-y-6">
          {/* ── 5. Important Alerts Widget ── */}
          <div className="farmer-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    notifications
                  </span>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-on-surface tracking-tight">
                    {language === "bn" ? "গুরুত্বপূর্ণ সতর্কতা" : language === "hi" ? "महत्वपूर्ण अलर्ट" : "Important Alerts"}
                  </h2>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {language === "bn"
                      ? "যেসব ক্ষেত্রে দ্রুত ব্যবস্থা নেওয়া প্রয়োজন"
                      : language === "hi"
                      ? "जिन मामलों पर तुरंत ध्यान देने की आवश्यकता है"
                      : "Recent issues that need your attention"}
                  </p>
                </div>
              </div>

              <Link
                href="/alerts"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                <span>{language === "bn" ? "সকল সতর্কতা" : language === "hi" ? "सभी अलर्ट" : "View All"}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {/* Alerts Content */}
            {loadingAlerts ? (
              <div className="space-y-2.5 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-surface-container-high rounded-2xl" />
                ))}
              </div>
            ) : alerts.length > 0 ? (
              <div className="space-y-2.5">
                {alerts.map((a) => (
                  <Link
                    key={a.id}
                    href="/alerts"
                    className={`block p-4 rounded-2xl border transition-all duration-200 hover:shadow-sm ${
                      a.type === "critical"
                        ? "bg-error-container/40 border-error/30 text-on-surface"
                        : "bg-surface-container-lowest border-outline-variant/20 text-on-surface"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          className={`material-symbols-outlined text-xl shrink-0 mt-0.5 ${
                            a.type === "critical" ? "text-error" : "text-primary"
                          }`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {a.type === "critical" ? "warning" : "info"}
                        </span>
                        <div>
                          <h3 className="font-extrabold text-sm text-on-surface">{a.title}</h3>
                          <p className="text-xs text-on-surface-variant font-medium mt-0.5 line-clamp-1">
                            {a.message}
                          </p>
                        </div>
                      </div>
                      {a.timeLabel && (
                        <span className="text-[11px] text-on-surface-variant font-semibold bg-surface-container-high px-2.5 py-0.5 rounded-full shrink-0">
                          {a.timeLabel}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-800 font-bold">
                <span className="material-symbols-outlined text-xl shrink-0 text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span>
                  {language === "bn"
                    ? "সবকিছু স্বাভাবিক ও সুস্থ রয়েছে। কোনো সক্রিয় সতর্কতা নেই।"
                    : language === "hi"
                    ? "सब कुछ सामान्य और स्वस्थ है। कोई सक्रिय चेतावनी नहीं है।"
                    : "All systems healthy. No active crop alerts requiring immediate action."}
                </span>
              </div>
            )}
          </div>

          {/* ── 7. Sensor / IoT Node (§6 & §22: Honest Status, Zero Fake Numbers) ── */}
          <div className="farmer-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    sensors
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-extrabold text-on-surface tracking-tight">
                      {language === "bn" ? "আইওটি সেন্সর নোড" : language === "hi" ? "आईओटी सेंसर नोड" : "IoT Sensor Telemetry"}
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">
                      {hardwareStatus?.status === "online" ? "ESP32 • Online" : "Hardware • Standby"}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {hardwareStatus?.status === "online"
                      ? (language === "bn" ? "সংযুক্ত হার্ডওয়্যার নোড থেকে সক্রিয় ডেটা" : language === "hi" ? "सक्रिय रूप से कनेक्टेड हार्डवेयर नोड" : "Live data from active hardware node")
                      : (language === "bn" ? "হার্ডওয়্যার সংযোগের জন্য প্রস্তুত (Section 22)" : language === "hi" ? "हार्डवेयर कनेक्शन के लिए तैयार (Section 22)" : "Hardware node ready for pairing without laptop mediation")}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                hardwareStatus?.status === "online" ? "bg-emerald-500/10 text-emerald-700" : "bg-surface-container-highest text-on-surface-variant"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hardwareStatus?.status === "online" ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                <span>{hardwareStatus?.status === "online" ? translateDynamic("Connected") : (language === "bn" ? "সংযুক্ত নয়" : language === "hi" ? "कनेक्टेड नहीं" : "Not connected")}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Soil Moisture */}
              <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 space-y-1.5">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-xs font-bold">{language === "bn" ? "মাটির আর্দ্রতা" : language === "hi" ? "मिट्टी की नमी" : "Soil Moisture"}</span>
                  <span className="material-symbols-outlined text-base text-sky-600">water_drop</span>
                </div>
                {sensorReading && typeof sensorReading.soilMoisture === "number" ? (
                  <>
                    <p className="text-xl font-black text-on-surface tracking-tight">{sensorReading.soilMoisture.toFixed(1)}%</p>
                    <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      <span>{language === "bn" ? "সক্রিয় পরিমাপ" : language === "hi" ? "सक्रिय माप" : "Live verified reading"}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-on-surface-variant tracking-tight">{language === "bn" ? "অনুপলব্ধ" : language === "hi" ? "अनुपलब्ध" : "Unavailable"}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">sensors_off</span>
                      <span>{language === "bn" ? "সেন্সর সংযুক্ত নয়" : language === "hi" ? "सेंसर कनेक्टेड नहीं" : "Sensor not connected"}</span>
                    </p>
                  </>
                )}
              </div>

              {/* Climate (Temp / Humidity) */}
              <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 space-y-1.5">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-xs font-bold">{language === "bn" ? "তাপমাত্রা ও আর্দ্রতা" : language === "hi" ? "तापमान एवं आर्द्रता" : "DHT22 Climate"}</span>
                  <span className="material-symbols-outlined text-base text-amber-600">thermostat</span>
                </div>
                {sensorReading && typeof sensorReading.temperature === "number" ? (
                  <>
                    <p className="text-xl font-black text-on-surface tracking-tight">
                      {sensorReading.temperature.toFixed(1)}°C
                      {typeof sensorReading.humidity === "number" && (
                        <span className="text-sm font-semibold text-on-surface-variant"> / {sensorReading.humidity.toFixed(0)}%</span>
                      )}
                    </p>
                    <p className="text-[10px] text-on-surface-variant font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">info</span>
                      <span>{language === "bn" ? "সক্রিয় সেন্সর" : language === "hi" ? "सक्रिय सेंसर" : "Active field sensor"}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-on-surface-variant tracking-tight">{language === "bn" ? "অনুপলব্ধ" : language === "hi" ? "अनुपलब्ध" : "Unavailable"}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">sensors_off</span>
                      <span>{language === "bn" ? "সেন্সর সংযুক্ত নয়" : language === "hi" ? "सेंसर कनेक्टेड नहीं" : "Sensor not connected"}</span>
                    </p>
                  </>
                )}
              </div>

              {/* Soil pH */}
              <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 space-y-1.5">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span className="text-xs font-bold">{language === "bn" ? "মাটির পিএইচ" : language === "hi" ? "मिट्टी का पीएच" : "Soil pH"}</span>
                  <span className="material-symbols-outlined text-base text-emerald-600">science</span>
                </div>
                {sensorReading && typeof sensorReading.soilPH === "number" ? (
                  <>
                    <p className="text-xl font-black text-on-surface tracking-tight">{sensorReading.soilPH.toFixed(1)} <span className="text-xs font-bold text-on-surface-variant">pH</span></p>
                    <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      <span>{language === "bn" ? "পরিমাপিত মান" : language === "hi" ? "मापा गया मान" : "Measured value"}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-on-surface-variant tracking-tight">{language === "bn" ? "অনুপলব্ধ" : language === "hi" ? "अनुपलब्ध" : "Unavailable"}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">sensors_off</span>
                      <span>{language === "bn" ? "সেন্সর সংযুক্ত নয়" : language === "hi" ? "सेंसर कनेक्टेड नहीं" : "Sensor not connected"}</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


