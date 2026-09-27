/**
 * AgriSight LanguageService — Single Source of Truth for Language
 * Implements a4.md Sections 4, 5, 10
 */

export type AppLanguage = "en" | "hi" | "bn";

export interface LanguageInfo {
  code: AppLanguage;
  locale: string;
  speechLocale: string;
  name: string;
  nativeName: string;
}

export interface AILanguageContract {
  language: AppLanguage;
  locale: string;
  responseLanguage: string;
  script: "Bengali" | "Devanagari" | "Latin";
}

export const LANGUAGE_CONFIG: Record<AppLanguage, LanguageInfo> = {
  en: {
    code: "en",
    locale: "en-IN",
    speechLocale: "en-IN",
    name: "English",
    nativeName: "English",
  },
  hi: {
    code: "hi",
    locale: "hi-IN",
    speechLocale: "hi-IN",
    name: "हिन्दी",
    nativeName: "हिन्दी",
  },
  bn: {
    code: "bn",
    locale: "bn-IN",
    speechLocale: "bn-IN",
    name: "বাংলা",
    nativeName: "বাংলা",
  },
};

export const AI_LANGUAGE_CONTRACTS: Record<AppLanguage, AILanguageContract> = {
  bn: {
    language: "bn",
    locale: "bn-IN",
    responseLanguage: "Bengali",
    script: "Bengali",
  },
  hi: {
    language: "hi",
    locale: "hi-IN",
    responseLanguage: "Hindi",
    script: "Devanagari",
  },
  en: {
    language: "en",
    locale: "en-IN",
    responseLanguage: "English",
    script: "Latin",
  },
};

type LanguageSubscriber = (lang: AppLanguage) => void;

class LanguageServiceImpl {
  private currentLanguage: AppLanguage = "en";
  private subscribers: Set<LanguageSubscriber> = new Set();
  private initialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize();
    }
  }

  public initialize(): AppLanguage {
    if (this.initialized) return this.currentLanguage;

    if (typeof window !== "undefined") {
      try {
        const saved = (
          localStorage.getItem("agrisight_lang") ||
          localStorage.getItem("agrisight_language")
        ) as AppLanguage;

        if (saved && (saved === "en" || saved === "hi" || saved === "bn")) {
          this.currentLanguage = saved;
        }
      } catch (e) {
        console.warn("[LanguageService] Could not read stored language:", e);
      }

      window.addEventListener("languagechange", this.handleExternalChange);
      window.addEventListener("storage", this.handleStorageChange);
    }

    this.initialized = true;
    return this.currentLanguage;
  }

  private handleExternalChange = () => {
    try {
      const saved = (
        localStorage.getItem("agrisight_lang") ||
        localStorage.getItem("agrisight_language")
      ) as AppLanguage;
      if (saved && (saved === "en" || saved === "hi" || saved === "bn") && saved !== this.currentLanguage) {
        this.currentLanguage = saved;
        this.notifySubscribers();
      }
    } catch {}
  };

  private handleStorageChange = (e: StorageEvent) => {
    if (e.key === "agrisight_lang" || e.key === "agrisight_language") {
      const val = e.newValue as AppLanguage;
      if (val && (val === "en" || val === "hi" || val === "bn") && val !== this.currentLanguage) {
        this.currentLanguage = val;
        this.notifySubscribers();
      }
    }
  };

  public getCurrentLanguage(): AppLanguage {
    if (!this.initialized && typeof window !== "undefined") {
      this.initialize();
    }
    return this.currentLanguage;
  }

  public setLanguage(lang: AppLanguage): void {
    if (lang !== "en" && lang !== "hi" && lang !== "bn") return;

    this.currentLanguage = lang;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("agrisight_lang", lang);
        localStorage.setItem("agrisight_language", lang);
        window.dispatchEvent(new CustomEvent("agrisight_language_updated", { detail: { language: lang } }));
      } catch (e) {
        console.warn("[LanguageService] Failed to persist language:", e);
      }
    }

    this.notifySubscribers();
  }

  public getLocale(lang?: AppLanguage): string {
    const l = lang || this.currentLanguage;
    return LANGUAGE_CONFIG[l]?.locale || "en-IN";
  }

  public getSpeechLocale(lang?: AppLanguage): string {
    const l = lang || this.currentLanguage;
    return LANGUAGE_CONFIG[l]?.speechLocale || "en-IN";
  }

  public getLanguageContract(lang?: AppLanguage): AILanguageContract {
    const l = lang || this.currentLanguage;
    return AI_LANGUAGE_CONTRACTS[l] || AI_LANGUAGE_CONTRACTS["en"];
  }

  public subscribe(callback: LanguageSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    for (const sub of this.subscribers) {
      try {
        sub(this.currentLanguage);
      } catch (err) {
        console.error("[LanguageService] Error in subscriber:", err);
      }
    }
  }
}

export const LanguageService = new LanguageServiceImpl();
