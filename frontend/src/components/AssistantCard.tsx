"use client";

import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export function AssistantCard() {
  const { t, language } = useTranslation();

  return (
    <div className="farmer-card relative overflow-hidden group">
      {/* Decorative gentle glow */}
      <div className="absolute -right-10 -top-10 w-44 h-44 bg-primary/8 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-live-pulse" />
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              smart_toy
            </span>
            <span>{t("aiAssistant")}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-on-surface tracking-tight">
            {t("askAgriSight")}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed">
            {language === "bn"
              ? "রোগবালাই, সার প্রয়োগ, সেচ বা আবহাওয়া সংক্রান্ত যেকোনো প্রশ্ন বাংলায় বা ভয়েসে জিজ্ঞাসা করুন।"
              : language === "hi"
              ? "रोग, खाद, सिंचाई या मौसम के बारे में कोई भी प्रश्न हिंदी में या बोलकर पूछें।"
              : t("aiAssistantDescription")}
          </p>
        </div>

        <Link
          href="/assistant"
          className="btn-farmer-primary text-xs sm:text-sm shrink-0 w-full sm:w-auto"
        >
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            chat
          </span>
          <span>{language === "bn" ? "সহকারীকে জিজ্ঞাসা করুন" : language === "hi" ? "सहायक से पूछें" : "Ask AgriSight"}</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

