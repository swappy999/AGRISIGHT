"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export interface HotspotPin {
  id: string;
  scan_id?: string;
  disease: string;
  severity: string;
  risk_score: number;
  created_at: string;
  image_url?: string;
  latitude?: number | null;
  longitude?: number | null;
  zone?: string;
  crop?: string;
}

export interface ZoneData {
  name: string;
  health: number;
  status: string;
  active_threats: number;
}

interface FieldHealthMapProps {
  fieldName: string;
  areaAcres: number;
  healthScore: number;
  hotspots: HotspotPin[];
  zones?: ZoneData[];
  soilType?: string;
  irrigationType?: string;
}

export function FieldHealthMap({
  fieldName,
  areaAcres,
  healthScore,
  hotspots,
  zones = [],
  soilType = "Alluvial",
  irrigationType = "Drip",
}: FieldHealthMapProps) {
  const { t, language, translateDynamic, formatNumber } = useTranslation();
  const [selectedPin, setSelectedPin] = useState<HotspotPin | null>(null);
  const [activeLayer, setActiveLayer] = useState<"health" | "hotspots" | "zones">("hotspots");
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Deterministic zone background colors
  const getZoneBg = (zoneName: string) => {
    const z = zones.find((item) => item.name.toLowerCase().includes(zoneName.toLowerCase()));
    if (!z) return "bg-primary/10 border-primary/20";
    if (z.health >= 80) return "bg-primary/10 border-primary/30 text-primary";
    if (z.health >= 55) return "bg-amber-500/10 border-amber-500/30 text-amber-600";
    return "bg-rose-500/15 border-rose-500/40 text-rose-600 animate-pulse";
  };

  const getPinPosition = (index: number, total: number, zone?: string) => {
    const defaultPositions = [
      { top: "28%", left: "32%" },
      { top: "34%", left: "68%" },
      { top: "68%", left: "64%" },
      { top: "62%", left: "26%" },
      { top: "45%", left: "48%" },
      { top: "22%", left: "52%" },
      { top: "75%", left: "42%" },
    ];
    if (zone) {
      if (zone.includes("North")) return { top: "25%", left: `${25 + (index * 15) % 40}%` };
      if (zone.includes("East")) return { top: `${25 + (index * 15) % 40}%`, left: "70%" };
      if (zone.includes("South")) return { top: "72%", left: `${25 + (index * 15) % 40}%` };
      if (zone.includes("West")) return { top: `${25 + (index * 15) % 40}%`, left: "25%" };
    }
    return defaultPositions[index % defaultPositions.length];
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-[2.5rem] p-5 lg:p-8 space-y-6 shadow-sm">
      {/* Map Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                grid_view
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-on-surface text-lg">{fieldName} — {t("fieldHealthMap")}</h3>
              <p className="text-xs text-on-surface-variant font-medium">
                {areaAcres} {t("acres")} · {t("soilType")}: {soilType} · {t("irrigationType")}: {irrigationType}
              </p>
            </div>
          </div>
        </div>

        {/* Layer Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-container-high rounded-full border border-outline-variant/30 text-xs font-bold self-stretch sm:self-auto justify-between">
          <button
            onClick={() => setActiveLayer("hotspots")}
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              activeLayer === "hotspots"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm">coronavirus</span>
            {t("activeRisks")} ({hotspots.length})
          </button>
          <button
            onClick={() => setActiveLayer("zones")}
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              activeLayer === "zones"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm">dashboard</span>
            {t("fieldHealthMap")}
          </button>
          <button
            onClick={() => setActiveLayer("health")}
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
              activeLayer === "health"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-sm">eco</span>
            {t("overallHealth")} ({healthScore}%)
          </button>
        </div>
      </div>

      {/* Interactive Map Canvas Container */}
      <div className="relative w-full min-h-[300px] aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/10] bg-surface-container-highest/40 rounded-3xl border border-outline-variant/40 overflow-hidden select-none">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(#0f5238 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* 4 Quadrants Matrix Layout */}
        <div className="absolute inset-4 grid grid-cols-2 grid-rows-2 gap-3">
          {/* North Zone */}
          <div
            onMouseEnter={() => setHoveredZone("Zone A (North)")}
            onMouseLeave={() => setHoveredZone(null)}
            className={`rounded-2xl border-2 border-dashed p-3 transition-all duration-300 flex flex-col justify-between ${getZoneBg(
              "Zone A"
            )} ${hoveredZone === "Zone A (North)" ? "ring-2 ring-primary scale-[1.01]" : ""}`}
          >
            <span className="text-[11px] font-black uppercase tracking-wider">{translateDynamic("Quadrant A · North")}</span>
            <div className="flex items-center justify-between text-xs font-bold opacity-80">
              <span>{translateDynamic(zones[0]?.status || "Optimal")}</span>
              <span>{formatNumber(zones[0]?.health || 95)}% FHI</span>
            </div>
          </div>

          {/* East Zone */}
          <div
            onMouseEnter={() => setHoveredZone("Zone B (East)")}
            onMouseLeave={() => setHoveredZone(null)}
            className={`rounded-2xl border-2 border-dashed p-3 transition-all duration-300 flex flex-col justify-between ${getZoneBg(
              "Zone B"
            )} ${hoveredZone === "Zone B (East)" ? "ring-2 ring-primary scale-[1.01]" : ""}`}
          >
            <span className="text-[11px] font-black uppercase tracking-wider">{translateDynamic("Quadrant B · East")}</span>
            <div className="flex items-center justify-between text-xs font-bold opacity-80">
              <span>{translateDynamic(zones[1]?.status || "Optimal")}</span>
              <span>{formatNumber(zones[1]?.health || 95)}% FHI</span>
            </div>
          </div>

          {/* West Zone */}
          <div
            onMouseEnter={() => setHoveredZone("Zone D (West)")}
            onMouseLeave={() => setHoveredZone(null)}
            className={`rounded-2xl border-2 border-dashed p-3 transition-all duration-300 flex flex-col justify-between ${getZoneBg(
              "Zone D"
            )} ${hoveredZone === "Zone D (West)" ? "ring-2 ring-primary scale-[1.01]" : ""}`}
          >
            <span className="text-[11px] font-black uppercase tracking-wider">{translateDynamic("Quadrant D · West")}</span>
            <div className="flex items-center justify-between text-xs font-bold opacity-80">
              <span>{translateDynamic(zones[3]?.status || "Optimal")}</span>
              <span>{formatNumber(zones[3]?.health || 95)}% FHI</span>
            </div>
          </div>

          {/* South Zone */}
          <div
            onMouseEnter={() => setHoveredZone("Zone C (South)")}
            onMouseLeave={() => setHoveredZone(null)}
            className={`rounded-2xl border-2 border-dashed p-3 transition-all duration-300 flex flex-col justify-between ${getZoneBg(
              "Zone C"
            )} ${hoveredZone === "Zone C (South)" ? "ring-2 ring-primary scale-[1.01]" : ""}`}
          >
            <span className="text-[11px] font-black uppercase tracking-wider">{translateDynamic("Quadrant C · South")}</span>
            <div className="flex items-center justify-between text-xs font-bold opacity-80">
              <span>{translateDynamic(zones[2]?.status || "Optimal")}</span>
              <span>{formatNumber(zones[2]?.health || 95)}% FHI</span>
            </div>
          </div>
        </div>

        {/* Hotspot Markers */}
        {activeLayer !== "health" &&
          hotspots.map((pin, idx) => {
            const pos = getPinPosition(idx, hotspots.length, pin.zone);
            const isSevHigh =
              pin.severity?.toLowerCase() === "critical" ||
              pin.severity?.toLowerCase() === "high" ||
              pin.severity?.toLowerCase() === "severe" ||
              pin.risk_score >= 65;

            return (
              <div
                key={pin.id || idx}
                style={{ top: pos.top, left: pos.left }}
                onClick={() => setSelectedPin(pin)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                {isSevHigh && (
                  <span className="absolute -inset-2 rounded-full bg-rose-500/30 animate-ping" />
                )}

                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-125 ${
                    isSevHigh
                      ? "bg-rose-600 text-white shadow-rose-600/40 ring-2 ring-white"
                      : "bg-amber-500 text-white shadow-amber-500/40"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isSevHigh ? "warning" : "coronavirus"}
                  </span>
                </div>

                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30 min-w-[120px]">
                  <div className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-2.5 py-1.5 rounded-xl shadow-xl text-center">
                    <p className="text-[11px] font-black truncate">{translateDynamic(pin.disease)}</p>
                    <p className="text-[10px] text-on-surface-variant font-bold">
                      {translateDynamic(pin.severity)} · {pin.risk_score}%
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-surface-container-lowest border-b border-r border-outline-variant/30 rotate-45 -mt-1" />
                </div>
              </div>
            );
          })}

        {/* Empty Hotspots Marker State */}
        {hotspots.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 p-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-2 shadow-sm">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
            </div>
            <p className="text-sm font-extrabold text-on-surface">{t("healthy")}</p>
            <p className="text-xs text-on-surface-variant max-w-sm mt-0.5">
              {language === "bn" ? "কোনো ক্ষতিকারক রোগের হটস্পট পাওয়া যায়নি।" : language === "hi" ? "कोई सक्रिय रोग हॉटस्पॉट नहीं पाया गया।" : "No active pathogen hotspots detected."}
            </p>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-3 right-3 bg-surface-container-low/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-outline-variant/30 text-[10px] font-bold text-on-surface-variant flex items-center gap-3 shadow-md z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{t("healthy")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>{t("moderate")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>{t("high")}</span>
          </div>
        </div>
      </div>

      {/* Selected Hotspot Detailed Modal / Drawer */}
      {selectedPin && (
        <div className="bg-surface-container rounded-3xl p-5 border border-outline-variant/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-4 min-w-0">
            {selectedPin.image_url ? (
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-outline-variant/30">
                <Image
                  src={selectedPin.image_url}
                  alt={selectedPin.disease}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  coronavirus
                </span>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-600">
                  {translateDynamic(selectedPin.zone || "Field Sector")}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  {selectedPin.created_at ? new Date(selectedPin.created_at).toLocaleDateString(language) : "Recent"}
                </span>
              </div>
              <h4 className="font-extrabold text-on-surface text-base truncate mt-0.5">
                {translateDynamic(selectedPin.disease)} · {translateDynamic(selectedPin.severity)}
              </h4>
              <p className="text-xs text-on-surface-variant truncate">
                {t("risk")}: {formatNumber(selectedPin.risk_score)}% · {t("crop")}: {translateDynamic(selectedPin.crop || "Assigned Crop")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            {selectedPin.scan_id && (
              <Link
                href={`/analysis/${selectedPin.scan_id}`}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5"
              >
                <span>{t("viewDetails")}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            )}
            <button
              onClick={() => setSelectedPin(null)}
              className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              aria-label="Close hotspot detail"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
