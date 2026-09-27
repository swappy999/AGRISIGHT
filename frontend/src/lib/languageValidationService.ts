/**
 * AgriSight LanguageValidationService
 * Implements a4.md Section 12: Response Language Validation
 */

import { AppLanguage } from "./languageService";

export interface LanguageValidationResult {
  isValid: boolean;
  expectedLanguage: AppLanguage;
  detectedLanguage?: string;
  hasExpectedScript: boolean;
  confidence: number;
}

export class LanguageValidationService {
  /**
   * Validate that the response text matches the requested language script.
   */
  public static validateResponse(text: string, expectedLang: AppLanguage): LanguageValidationResult {
    if (!text || !text.trim()) {
      return {
        isValid: true,
        expectedLanguage: expectedLang,
        hasExpectedScript: true,
        confidence: 1.0,
      };
    }

    const clean = text.replace(/AgriSight/gi, "").replace(/[0-9\s.,!?:;'"()/\-_%]+/g, "");
    if (clean.length < 5) {
      // Too short to reliably determine
      return {
        isValid: true,
        expectedLanguage: expectedLang,
        hasExpectedScript: true,
        confidence: 0.8,
      };
    }

    if (expectedLang === "bn") {
      const bnMatches = clean.match(/[\u0980-\u09FF]/g) || [];
      const bnRatio = bnMatches.length / clean.length;
      const hasExpectedScript = bnMatches.length >= 3 || bnRatio > 0.3;

      return {
        isValid: hasExpectedScript,
        expectedLanguage: "bn",
        detectedLanguage: hasExpectedScript ? "bn" : "en/other",
        hasExpectedScript,
        confidence: bnRatio,
      };
    }

    if (expectedLang === "hi") {
      const hiMatches = clean.match(/[\u0900-\u097F]/g) || [];
      const hiRatio = hiMatches.length / clean.length;
      const hasExpectedScript = hiMatches.length >= 3 || hiRatio > 0.3;

      return {
        isValid: hasExpectedScript,
        expectedLanguage: "hi",
        detectedLanguage: hasExpectedScript ? "hi" : "en/other",
        hasExpectedScript,
        confidence: hiRatio,
      };
    }

    // Default English: check that it doesn't contain predominantly non-Latin Indian scripts
    const bnCount = (clean.match(/[\u0980-\u09FF]/g) || []).length;
    const hiCount = (clean.match(/[\u0900-\u097F]/g) || []).length;
    const isUnwantedScript = (bnCount + hiCount) / clean.length > 0.5;

    return {
      isValid: !isUnwantedScript,
      expectedLanguage: "en",
      detectedLanguage: bnCount > hiCount ? "bn" : hiCount > 0 ? "hi" : "en",
      hasExpectedScript: !isUnwantedScript,
      confidence: 1.0 - (bnCount + hiCount) / clean.length,
    };
  }

  /**
   * Generates reinforcement prompt directive if language mismatch occurs.
   */
  public static getCorrectionDirective(expectedLang: AppLanguage): string {
    if (expectedLang === "bn") {
      return "CRITICAL RE-REQUEST: Your previous answer was not in Bengali script. You MUST respond 100% in natural Bengali (বাংলা) script.";
    }
    if (expectedLang === "hi") {
      return "CRITICAL RE-REQUEST: Your previous answer was not in Devanagari script. You MUST respond 100% in natural Hindi (हिन्दी) Devanagari script.";
    }
    return "Please respond in standard English.";
  }
}
