"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/context/LanguageContext";
import {
  fetchWeatherIntelligence,
  WeatherIntelligenceData,
  EnvironmentalRisk,
} from "@/lib/weatherIntelligence";

interface WeatherCardProps {
  customLocationName?: string;
}

export function WeatherCard({ customLocationName }: WeatherCardProps = {}) {
  const { t, language, translateDynamic, formatNumber } = useTranslation();
  const [data, setData] = useState<WeatherIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const loadWeather = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(false);
      setLocationDenied(false);

      if (typeof window === "undefined" || !("geolocation" in navigator)) {
        setLocationDenied(true);
        setLoading(false);
        return;
      }

      let lat: number;
      let lon: number;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            maximumAge: 60000,
            enableHighAccuracy: true,
          });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch (geoErr: any) {
        // PERMISSION_DENIED = 1
        if (geoErr?.code === 1) {
          setLocationDenied(true);
          setLoading(false);
          return;
        }
        // TIMEOUT or POSITION_UNAVAILABLE — try low-accuracy fallback
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 300000,
              enableHighAccuracy: false,
            });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch {
          setLocationDenied(true);
          setLoading(false);
          return;
        }
      }

      const res = await fetchWeatherIntelligence(lat, lon, forceRefresh);
      setData(res);
    } catch (err) {
      console.warn("[WEATHER] Failed to load weather intelligence", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const getRiskColor = (level: EnvironmentalRisk["level"]) => {
    switch (level) {
      case "High":
        return "bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400";
      case "Moderate":
        return "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400";
      case "Low":
      default:
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-400";
    }
  };

  const getRiskDot = (level: EnvironmentalRisk["level"]) => {
    switch (level) {
      case "High":
        return "bg-rose-500";
      case "Moderate":
        return "bg-amber-500";
      case "Low":
      default:
        return "bg-emerald-500";
    }
  };

  if (loading) {
    return (
      <div className="farmer-card min-h-[160px] animate-pulse flex flex-col items-center justify-center gap-2.5">
        <span className="material-symbols-outlined text-2xl text-primary animate-spin">cyclone</span>
        <span className="text-xs font-bold text-on-surface-variant">
          {language === "bn"
            ? "আবহাওয়ার তথ্য লোড হচ্ছে..."
            : language === "hi"
              ? "मौसम की जानकारी लोड हो रही है..."
              : "Loading weather..."}
        </span>
      </div>
    );
  }

  if (locationDenied) {
    return (
      <div className="farmer-card space-y-4">
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0">
              <span className="material-symbols-outlined text-xl">location_off</span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-on-surface">
                {language === "bn"
                  ? "অবস্থান অনুপলব্ধ"
                  : language === "hi"
                    ? "स्थान अनुपलब्ध"
                    : "Location unavailable"}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                {language === "bn"
                  ? "স্থানীয় আবহাওয়া এবং মাঠের পরিস্থিতি প্রদানের জন্য ব্যবহৃত হয়।"
                  : language === "hi"
                    ? "स्थानीय मौसम और खेत की स्थिति प्रदान करने के लिए उपयोग किया जाता है।"
                    : "Used to provide local weather and field conditions."}
              </p>
            </div>
          </div>
          <button
            onClick={() => loadWeather(true)}
            className="btn-farmer-secondary text-xs px-3.5 py-2 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">my_location</span>
            <span>
              {language === "bn"
                ? "অবস্থান সক্ষম করুন"
                : language === "hi"
                  ? "स्थान सक्षम करें"
                  : "Enable Location"}
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="farmer-card space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0">
              <span className="material-symbols-outlined text-xl">cloud_off</span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-on-surface">
                {language === "bn"
                  ? "আবহাওয়া সংযোগ বিচ্ছিন্ন"
                  : language === "hi"
                    ? "मौसम सेवा ऑफ़लाइन"
                    : "Weather Intelligence Offline"}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                {language === "bn"
                  ? "নেটওয়ার্ক চালু হলে পুনরায় চেষ্টা করুন বা রিফ্রেশ বাটনে চাপুন।"
                  : language === "hi"
                    ? "इंटरनेट कनेक्ट होने पर पुनः प्रयास करें या रीफ़्रेश बटन दबाएं।"
                    : "Tap retry once online to retrieve fresh atmospheric forecasts."}
              </p>
            </div>
          </div>
          <button
            onClick={() => loadWeather(true)}
            className="btn-farmer-secondary text-xs px-3.5 py-2 self-stretch sm:self-auto justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>{t("retry")}</span>
          </button>
        </div>
      </div>
    );
  }

  const currentInsight =
    language === "bn"
      ? data.agriInsight.bn
      : language === "hi"
        ? data.agriInsight.hi
        : data.agriInsight.en;

  const displayLocation = customLocationName || data.locationName;

  return (
    <div className="farmer-card space-y-4 transition-all duration-300">
      {/* ── Standard Card Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              partly_cloudy_day
            </span>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-on-surface tracking-tight">
              {language === "bn" ? "আবহাওয়া ও কৃষি ঝুঁকি" : language === "hi" ? "मौसम एवं कृषि जोखिम" : "Weather & Climate Risk"}
            </h2>
            <p className="text-xs text-on-surface-variant font-medium">
              {language === "bn"
                ? "ক্ষেতের পূর্বাভাস ও প্রতিকূলতার সতর্কতা"
                : language === "hi"
                  ? "खेत का पूर्वानुमान और प्रतिकूलता चेतावनी"
                  : "Microclimate forecast & crop stress signals"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadWeather(true)}
          title={t("retry")}
          aria-label={t("retry")}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
        </button>
      </div>

      {/* ── Top Row: Temperature, Condition & Coordinates ── */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {data.icon}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-black text-on-surface tracking-tight">
                {formatNumber(data.temp)}°C
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-primary">
                {translateDynamic(data.condition)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className="inline-flex items-center gap-1 text-xs font-black text-on-surface">
                <span className="material-symbols-outlined text-sm text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  location_on
                </span>
                <span className="tracking-tight max-w-[170px] truncate">{translateDynamic(displayLocation)}</span>
              </div>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full border border-outline-variant/20">
                <span className="material-symbols-outlined text-[11px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
                <span className="font-mono">{formatNumber(data.latitude.toFixed(2))}°, {formatNumber(data.longitude.toFixed(2))}°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Details Toggle */}
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-extrabold inline-flex items-center gap-1 transition-colors active:scale-95 self-end sm:self-center shrink-0"
          aria-label="Toggle weather forecast"
        >
          <span>
            {showDetails
              ? (language === "bn" ? "লুকান" : language === "hi" ? "छिपाएं" : "Hide Forecast")
              : (language === "bn" ? "পূর্বাভাস" : language === "hi" ? "पूर्वानुमान" : "Forecast")}
          </span>
          <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`}>
            expand_more
          </span>
        </button>
      </div>

      {/* ── Weather Metric Pills ── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 text-xs font-bold text-on-surface flex flex-col sm:flex-row items-center sm:items-start justify-between gap-1 shadow-xs">
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-base">humidity_percentage</span>
            <span className="text-[11px] font-semibold hidden sm:inline">{t("humidityLabel")}</span>
          </div>
          <span className="font-black text-sm text-on-surface">{formatNumber(data.humidity)}%</span>
        </div>

        <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 text-xs font-bold text-on-surface flex flex-col sm:flex-row items-center sm:items-start justify-between gap-1 shadow-xs">
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-base">air</span>
            <span className="text-[11px] font-semibold hidden sm:inline">{language === "bn" ? "বাতাস" : language === "hi" ? "हवा" : "Wind"}</span>
          </div>
          <span className="font-black text-sm text-on-surface">{formatNumber(data.windSpeed)} km/h</span>
        </div>

        <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 text-xs font-bold text-on-surface flex flex-col sm:flex-row items-center sm:items-start justify-between gap-1 shadow-xs">
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-base">rainy</span>
            <span className="text-[11px] font-semibold hidden sm:inline">{language === "bn" ? "বৃষ্টি" : language === "hi" ? "बारिश" : "Rain"}</span>
          </div>
          <span className="font-black text-sm text-on-surface">{formatNumber(data.rainProb)}%</span>
        </div>
      </div>

      {/* ── Agronomic Action Recommendation ── */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border-l-4 border-primary space-y-1 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            psychiatry
          </span>
          <h4 className="text-[10px] font-black uppercase tracking-wider text-primary">
            {t("smartInsight")}
          </h4>
        </div>
        <p className="text-xs sm:text-sm font-bold text-on-surface leading-relaxed">
          {currentInsight}
        </p>
      </div>

      {/* ── Environmental Risk Badges ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Heat Risk */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-1.5 min-w-0 ${getRiskColor(data.heatRisk.level)}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${getRiskDot(data.heatRisk.level)}`} />
            <span className="text-[11px] font-extrabold truncate">
              {language === "bn" ? "তাপ ঝুঁকি" : language === "hi" ? "ताप जोखिम" : "Heat Risk"}
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider shrink-0">
            {translateDynamic(data.heatRisk.level)}
          </span>
        </div>

        {/* Rain Risk */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-1.5 min-w-0 ${getRiskColor(data.rainRisk.level)}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${getRiskDot(data.rainRisk.level)}`} />
            <span className="text-[11px] font-extrabold truncate">
              {language === "bn" ? "বৃষ্টি ঝুঁকি" : language === "hi" ? "बारिश जोखिम" : "Rain Risk"}
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider shrink-0">
            {translateDynamic(data.rainRisk.level)}
          </span>
        </div>

        {/* Wind & Spray Risk */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-1.5 min-w-0 ${getRiskColor(data.sprayWindRisk.level)}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${getRiskDot(data.sprayWindRisk.level)}`} />
            <span className="text-[11px] font-extrabold truncate">
              {language === "bn" ? "স্প্রে বাতাস" : language === "hi" ? "छिड़काव हवा" : "Spray Wind"}
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider shrink-0">
            {translateDynamic(data.sprayWindRisk.level)}
          </span>
        </div>

        {/* Fungal Pressure */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-1.5 min-w-0 ${getRiskColor(data.fungalRisk.level)}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${getRiskDot(data.fungalRisk.level)}`} />
            <span className="text-[11px] font-extrabold truncate">
              {language === "bn" ? "ছত্রাক ঝুঁকি" : language === "hi" ? "फफूंद जोखिम" : "Fungal Risk"}
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider shrink-0">
            {translateDynamic(data.fungalRisk.level)}
          </span>
        </div>
      </div>

      {/* ── Expandable 3-Day Forecast & Environmental Explanations ── */}
      {showDetails && (
        <div className="pt-2 space-y-4 border-t border-outline-variant/15 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* 3-Day Forecast Cards */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70 mb-2">
              {language === "bn"
                ? "৩-দিনের আবহাওয়ার পূর্বাভাস"
                : language === "hi"
                  ? "3-दिवसीय मौसम पूर्वानुमान"
                  : "3-Day Atmospheric Forecast"}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {data.forecast.map((f, i) => (
                <div
                  key={f.date}
                  className={`p-3 rounded-2xl border text-center space-y-1.5 transition-all ${i === 0
                      ? "bg-primary/5 border-primary/30 shadow-xs"
                      : "bg-surface-container-lowest border-outline-variant/15"
                    }`}
                >
                  <p className="text-xs font-black text-on-surface truncate">
                    {translateDynamic(f.dayName)}
                  </p>
                  <div className="w-8 h-8 mx-auto rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {f.icon}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-on-surface">
                    {formatNumber(f.tempMax)}° <span className="text-on-surface-variant font-normal text-[11px]">/ {formatNumber(f.tempMin)}°</span>
                  </p>
                  <div className="inline-flex items-center gap-0.5 text-[10px] font-bold text-primary">
                    <span className="material-symbols-outlined text-xs">water_drop</span>
                    <span>{formatNumber(f.rainProb)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Risk Breakdown Explanations */}
          <div className="bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/15 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70">
              {language === "bn"
                ? "পরিবেশগত ঝুঁকির বিস্তারিত তথ্য"
                : language === "hi"
                  ? "पर्यावरणीय जोखिम विस्तृत विवरण"
                  : "Environmental Risk Breakdown"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-on-surface">
              <div className="p-2.5 rounded-xl bg-surface-container-low/60 flex items-start gap-2 border border-outline-variant/10">
                <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">thermostat</span>
                <div className="min-w-0">
                  <span className="font-bold block text-[11px]">
                    {language === "bn" ? "তাপ ঝুঁকি" : language === "hi" ? "ताप जोखिम" : data.heatRisk.label} ({translateDynamic(data.heatRisk.level)})
                  </span>
                  <span className="text-on-surface-variant text-[11px] leading-relaxed">
                    {language === "bn" ? data.heatRisk.explanation.bn : language === "hi" ? data.heatRisk.explanation.hi : data.heatRisk.explanation.en}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-low/60 flex items-start gap-2 border border-outline-variant/10">
                <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">rainy</span>
                <div className="min-w-0">
                  <span className="font-bold block text-[11px]">
                    {language === "bn" ? "বৃষ্টি ঝুঁকি" : language === "hi" ? "बारिश जोखिम" : data.rainRisk.label} ({translateDynamic(data.rainRisk.level)})
                  </span>
                  <span className="text-on-surface-variant text-[11px] leading-relaxed">
                    {language === "bn" ? data.rainRisk.explanation.bn : language === "hi" ? data.rainRisk.explanation.hi : data.rainRisk.explanation.en}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-low/60 flex items-start gap-2 border border-outline-variant/10">
                <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">air</span>
                <div className="min-w-0">
                  <span className="font-bold block text-[11px]">
                    {language === "bn" ? "স্প্রে বাতাস" : language === "hi" ? "छिड़काव हवा" : data.sprayWindRisk.label} ({translateDynamic(data.sprayWindRisk.level)})
                  </span>
                  <span className="text-on-surface-variant text-[11px] leading-relaxed">
                    {language === "bn" ? data.sprayWindRisk.explanation.bn : language === "hi" ? data.sprayWindRisk.explanation.hi : data.sprayWindRisk.explanation.en}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-low/60 flex items-start gap-2 border border-outline-variant/10">
                <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">coronavirus</span>
                <div className="min-w-0">
                  <span className="font-bold block text-[11px]">
                    {language === "bn" ? "ছত্রাক ঝুঁকি" : language === "hi" ? "फफूंद जोखिम" : data.fungalRisk.label} ({translateDynamic(data.fungalRisk.level)})
                  </span>
                  <span className="text-on-surface-variant text-[11px] leading-relaxed">
                    {language === "bn" ? data.fungalRisk.explanation.bn : language === "hi" ? data.fungalRisk.explanation.hi : data.fungalRisk.explanation.en}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
