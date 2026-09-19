"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Language, LanguageConfig, LANGUAGE_CONFIG, translations, translateDynamicContent, formatLocalizedNumber } from "@/translations";

export type { Language, LanguageConfig };
export { LANGUAGE_CONFIG };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations["en"], params?: Record<string, string | number>) => string;
  translateDynamic: (text: string) => string;
  formatNumber: (val: number | string | undefined | null) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => translations["en"][key] || (key as string),
  translateDynamic: (text) => text,
  formatNumber: (val) => String(val ?? ""),
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  // Always initialize to 'en' during SSR and initial client frame to prevent hydration mismatch
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = (localStorage.getItem("agrisight_lang") || localStorage.getItem("agrisight_language")) as Language;
      if (saved && ["en", "hi", "bn"].includes(saved)) {
        setLanguageState(saved);
      }
    } catch {}

    const handleLanguageChange = () => {
      try {
        const saved = (localStorage.getItem("agrisight_lang") || localStorage.getItem("agrisight_language")) as Language;
        if (saved && ["en", "hi", "bn"].includes(saved)) {
          setLanguageState(saved);
        }
      } catch {}
    };

    window.addEventListener("languagechange", handleLanguageChange);
    window.addEventListener("storage", handleLanguageChange);
    return () => {
      window.removeEventListener("languagechange", handleLanguageChange);
      window.removeEventListener("storage", handleLanguageChange);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("agrisight_lang", lang);
        localStorage.setItem("agrisight_language", lang);
        window.dispatchEvent(new Event("languagechange"));
      } catch {}
    }
  };

  const t = (key: keyof typeof translations["en"], params?: Record<string, string | number>): string => {
    const langDict = translations[language] || translations["en"];
    let text = langDict[key] || translations["en"][key] || (key as string);
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`{${paramKey}}`, "g"), String(val));
      });
    }
    return text;
  };

  const translateDynamic = (text: string) => {
    return translateDynamicContent(text, language);
  };

  const formatNumber = (val: number | string | undefined | null) => {
    return formatLocalizedNumber(val, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateDynamic, formatNumber }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
