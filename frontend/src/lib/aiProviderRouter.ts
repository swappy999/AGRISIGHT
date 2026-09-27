/**
 * AgriSight AIProviderRouter — Automatic Online / Offline AI Router
 * Implements a4.md Section 14, 37
 */

import { AppLanguage } from "./languageService";

export type AIStatus =
  | "ONLINE_GEMINI"
  | "OFFLINE_LOCAL"
  | "WAITING_FOR_NETWORK"
  | "ERROR";

export interface AIProviderStatus {
  status: AIStatus;
  isOnline: boolean;
  providerName: "Gemini 2.5 Flash" | "AgriSight Local AI" | "Pending Network";
  displayBadge: string;
}

export class AIProviderRouter {
  public static getStatus(language: AppLanguage = "en"): AIProviderStatus {
    const isOnline = typeof window !== "undefined" && navigator.onLine;

    if (isOnline) {
      const badge =
        language === "bn"
          ? "অনলাইন এআই প্রস্তুত"
          : language === "hi"
          ? "ऑनलाइन एआई सक्रिय"
          : "AI Online";

      return {
        status: "ONLINE_GEMINI",
        isOnline: true,
        providerName: "Gemini 2.5 Flash",
        displayBadge: badge,
      };
    }

    // Offline mode
    const badge =
      language === "bn"
        ? "অফলাইন এআই সক্রিয়"
        : language === "hi"
        ? "ऑफ़लाइन एआई सक्रिय"
        : "Offline AI Active";

    return {
      status: "OFFLINE_LOCAL",
      isOnline: false,
      providerName: "AgriSight Local AI",
      displayBadge: badge,
    };
  }

  public static getOfflineNotice(language: AppLanguage): string {
    if (language === "bn") {
      return "আমি আপনার সাম্প্রতিক স্ক্যান ও খামারের তথ্য দেখতে পাচ্ছি। বিস্তারিত উত্তরের জন্য ইন্টারনেট সংযোগ প্রয়োজন হতে পারে।";
    }
    if (language === "hi") {
      return "मैं आपके हालिया स्कैन और खेत की जानकारी देख सकता हूँ। विस्तृत उत्तर के लिए इंटरनेट की आवश्यकता हो सकती है।";
    }
    return "I can see your recent scan and field data. An internet connection may be required for complex agronomic synthesis.";
  }
}
