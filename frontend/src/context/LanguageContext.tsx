"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Language, LanguageConfig, LANGUAGE_CONFIG, translations, translateDynamicContent, formatLocalizedNumber } from "@/translations";
import { LanguageService, AppLanguage } from "@/lib/languageService";

export type { Language, LanguageConfig, AppLanguage };
export { LANGUAGE_CONFIG, LanguageService };

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
  // Always initialize to 'en' during SSR to prevent hydration mismatch
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Sync with LanguageService
    const current = LanguageService.getCurrentLanguage();
    setLanguageState(current);

    const unsubscribe = LanguageService.subscribe((newLang) => {
      setLanguageState(newLang);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setLanguage = (lang: Language) => {
    LanguageService.setLanguage(lang as AppLanguage);
    setLanguageState(lang);
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
