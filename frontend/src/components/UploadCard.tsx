"use client";

import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

/**
 * UploadCard — Dashboard primary scan CTA.
 * Designed to be the prominent, immediately understandable centerpiece action for farmers.
 */
export function UploadCard() {
  const { t, language } = useTranslation();

  return (
    <section className="relative w-full">
      <Link href="/scan" className="block group" aria-label={t("scanLeaf")}>
        <div className="relative w-full bg-surface-container-low rounded-3xl p-6 sm:p-8 overflow-hidden transition-all duration-200 hover:bg-surface-container border border-outline-variant/30 hover:border-primary/40 shadow-xs hover:shadow-sm">
          {/* Subtle natural background accent */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-primary/5 rounded-full blur-2xl pointer-events-none -translate-y-1/3 translate-x-1/3" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            {/* Primary Action Icon */}
            <div className="shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform duration-200">
                <span
                  className="material-symbols-outlined text-4xl sm:text-5xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  energy_savings_leaf
                </span>
              </div>
            </div>

            {/* Text Description */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 text-primary text-[11px] font-black uppercase tracking-wider rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-live-pulse" />
                <span>{language === "bn" ? "কৃষি ডায়াগনস্টিক" : language === "hi" ? "कृषि निदान" : "Fast Diagnosis"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight leading-snug">
                {t("scanLeaf")}
              </h2>
              <p className="text-on-surface-variant text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
                {language === "bn"
                  ? "পাতার ছবি তুলুন বা আপলোড করুন — কয়েক সেকেন্ডে রোগ শনাক্ত ও সমাধান পান।"
                  : language === "hi"
                  ? "पत्ते की तस्वीर लें या अपलोड करें — सेकंडों में रोग पहचान और उपचार पाएं।"
                  : t("uploadInstruction")}
              </p>
            </div>

            {/* Prominent Action Button */}
            <div className="shrink-0 self-stretch sm:self-center mt-2 sm:mt-0">
              <div className="btn-farmer-primary w-full sm:w-auto shadow-lg shadow-primary/20 group-hover:shadow-primary/35">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  photo_camera
                </span>
                <span>{language === "bn" ? "স্ক্যান শুরু করুন" : language === "hi" ? "स्कैन शुरू करें" : "Scan Now"}</span>
                <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="relative z-10 mt-5 pt-4 border-t border-outline-variant/15 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-on-surface-variant font-bold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/20 shadow-2xs">
              <span className="material-symbols-outlined text-primary text-sm">photo_camera</span>
              <span>{t("takePhoto")}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/20 shadow-2xs">
              <span className="material-symbols-outlined text-primary text-sm">photo_library</span>
              <span>{t("chooseFile")}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/20 shadow-2xs">
              <span className="material-symbols-outlined text-emerald-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span>{language === "bn" ? "তাত্ক্ষণিক ফলাফল" : language === "hi" ? "त्वरित परिणाम" : "Instant AI Result"}</span>
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}

