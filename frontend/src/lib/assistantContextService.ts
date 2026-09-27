/**
 * AgriSight AssistantContextService — Application Memory & Recent Scan Cache
 * Implements a4.md Sections 23–32, 40
 */

import { offlineDb, OfflineField, OfflineCrop, OfflineScan, OfflineSensorReading } from "./offlineDb";
import { WeatherCacheService } from "./weatherCache";
import { LanguageService, AppLanguage } from "./languageService";

export interface AssistantContext {
  currentField?: OfflineField;
  currentCrop?: OfflineCrop;
  latestScan?: OfflineScan;
  recentScans: OfflineScan[];
  recentAlerts: any[];
  recentRecommendations: any[];
  recentSensorReadings: OfflineSensorReading[];
  recentWeather?: any;
  language: AppLanguage;
  fetchedAt: number;
}

class AssistantContextServiceImpl {
  private cachedContext: AssistantContext | null = null;
  private cacheExpiryMs = 60000; // 1 minute fresh cache
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("SCAN_COMPLETED", () => this.invalidate());
      window.addEventListener("scanCompleted", () => this.invalidate());
      window.addEventListener("scan_saved", () => this.invalidate());
      window.addEventListener("agrisight_data_updated", () => this.invalidate());
    }
  }

  /**
   * Invalidate cached assistant context so subsequent queries re-read fresh DB records.
   */
  public invalidate(): void {
    this.cachedContext = null;
    this.notifyListeners();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    for (const l of this.listeners) {
      try {
        l();
      } catch {}
    }
  }

  /**
   * Called immediately when a scan is performed / saved locally or remotely (a5.md Section 16).
   */
  public async onScanSaved(scan: OfflineScan): Promise<void> {
    if (this.cachedContext) {
      this.cachedContext.latestScan = scan;
      this.cachedContext.recentScans = [
        scan,
        ...this.cachedContext.recentScans.filter((s) => s.id !== scan.id),
      ].slice(0, 5);
    }
    this.invalidate();
  }

  /**
   * Builds bounded context for the AI Assistant respecting user identity and active field/crop.
   * a5.md Sections 9, 10, 11
   */
  public async buildAssistantContext(
    userId?: string,
    activeFieldId?: string,
    activeCropId?: string,
    forceRefresh = false
  ): Promise<AssistantContext> {
    const now = Date.now();
    if (
      !forceRefresh &&
      this.cachedContext &&
      now - this.cachedContext.fetchedAt < this.cacheExpiryMs
    ) {
      // Re-apply language in case it was switched
      this.cachedContext.language = LanguageService.getCurrentLanguage();
      return this.cachedContext;
    }

    try {
      const [fields, crops, latestScan, recentScans, sensors, weather] = await Promise.all([
        offlineDb.getFields(userId),
        offlineDb.getCrops(userId),
        offlineDb.getLatestCompletedScan(userId, activeFieldId, activeCropId),
        offlineDb.getRecentCompletedScans(userId, 5, activeFieldId, activeCropId),
        offlineDb.getSensorReadings(undefined, userId),
        WeatherCacheService.getWeather().catch(() => null),
      ]);

      const currentField =
        fields.find((f) => f.id === activeFieldId) ||
        (latestScan?.field_id ? fields.find((f) => f.id === latestScan.field_id) : undefined) ||
        fields[0];

      const currentCrop =
        crops.find((c) => c.id === activeCropId) ||
        (latestScan?.crop_id ? crops.find((c) => c.id === latestScan.crop_id) : undefined) ||
        crops[0];

      const context: AssistantContext = {
        currentField,
        currentCrop,
        latestScan: latestScan || recentScans[0],
        recentScans,
        recentAlerts: [],
        recentRecommendations: [],
        recentSensorReadings: sensors.slice(0, 5),
        recentWeather: weather,
        language: LanguageService.getCurrentLanguage(),
        fetchedAt: now,
      };

      this.cachedContext = context;
      return context;
    } catch (err) {
      console.warn("[AssistantContextService] Error building context:", err);
      return {
        recentScans: [],
        recentAlerts: [],
        recentRecommendations: [],
        recentSensorReadings: [],
        language: LanguageService.getCurrentLanguage(),
        fetchedAt: now,
      };
    }
  }

  /**
   * Formats structured context for Gemini prompt injection matching a5.md Section 12.
   */
  public formatContextForPrompt(context: AssistantContext): string {
    const lines: string[] = [];
    const ls = context.latestScan;
    if (ls) {
      const cropName = ls.analysis?.crop || (ls.result_json?.crop as string) || context.currentCrop?.name || "Crop";
      const cond = ls.analysis?.condition || ls.disease || "Healthy Plant";
      const sev = ls.analysis?.severity || ls.severity || "Low";
      const dateStr = ls.created_at ? ls.created_at.slice(0, 10) : "recently";
      const fieldStr = context.currentField?.name || ls.field_id || "";
      const actions = ls.analysis?.recommendedActions || (ls.result_json?.actions as string[]) || [];
      const obs = ls.analysis?.observations || (ls.result_json?.observations as string[]) || (ls.result_json?.summary ? [ls.result_json.summary] : []);

      lines.push("AGRISIGHT CONTEXT:\n");
      lines.push("Latest completed scan:");
      lines.push(`- Scan ID: ${ls.id}`);
      if (fieldStr) lines.push(`- Field: ${fieldStr}`);
      lines.push(`- Crop: ${cropName}`);
      lines.push(`- Date: ${dateStr}`);
      lines.push(`- Condition: ${cond}`);
      lines.push(`- Severity: ${sev}`);
      if (obs.length > 0) lines.push(`- Observations: ${obs.join("; ")}`);
      if (actions.length > 0) lines.push(`- Recommendations: ${actions.join("; ")}`);
    }

    if (context.recentScans && context.recentScans.length > 1) {
      lines.push("\nRecent scans:");
      for (const s of context.recentScans.slice(1, 5)) {
        const crop = s.analysis?.crop || (s.result_json?.crop as string) || "Crop";
        const cond = s.analysis?.condition || s.disease || "Healthy Plant";
        const dt = s.created_at ? s.created_at.slice(0, 10) : "";
        lines.push(`- Scan ID: ${s.id} | Date: ${dt} | Crop: ${crop} | Condition: ${cond} | Severity: ${s.severity}`);
      }
    }

    if (context.currentField) {
      lines.push(`\nCurrent Field: ${context.currentField.name} (${context.currentField.soil_type || 'soil'}, ${context.currentField.area_acres || ''} acres)`);
    }
    if (context.currentCrop) {
      lines.push(`Current Crop: ${context.currentCrop.name} (${context.currentCrop.variety || 'variety'}, Stage: ${context.currentCrop.growth_stage || 'growth'})`);
    }

    return lines.join("\n");
  }

  /**
   * Detects if the farmer is specifically inquiring about recent scan / diagnostic memory.
   * a5.md Sections 5, 12, 14, 17, 39
   */
  public isRecentScanQuery(message: string): boolean {
    const q = message.toLowerCase();
    const scanKeywords = [
      // English (a5.md Sections 5, 12, 14, 17, 39)
      "last scan",
      "recent scan",
      "previous scan",
      "what did you find",
      "which disease",
      "what disease",
      "last leaf",
      "my scan",
      "diagnos",
      "what did i scan",
      "what did i just scan",
      "which crop did i scan",
      "what was the condition",
      "what crop did i scan",
      "what was scanned",
      "most recently",
      // Bengali (বাংলা) (a5.md Sections 23, 25, 39)
      "শেষ স্ক্যান",
      "সর্বশেষ স্ক্যান",
      "আগের স্ক্যান",
      "কী পেয়েছিলেন",
      "কী রোগ",
      "কোন রোগ",
      "পাতার স্ক্যান",
      "কী রোগ হয়েছে",
      "আমার শেষ স্ক্যান",
      "কী স্ক্যান করেছিলাম",
      "সর্বশেষ কী স্ক্যান",
      "কোন ফসল স্ক্যান",
      "ফসলের অবস্থা কী ছিল",
      "কী অবস্থা ছিল",
      "আমি কি স্ক্যান করেছি",
      "আমি কী স্ক্যান করেছিলাম",
      // Hindi (हिन्दी) (a5.md Sections 23, 26, 39)
      "पिछला स्कैन",
      "अंतिम स्कैन",
      "क्या मिला",
      "कौन सा रोग",
      "कौन सी बीमारी",
      "पत्ती का स्कैन",
      "क्या रोग है",
      "मेरा स्कैन",
      "क्या स्कैन किया था",
      "आखिरी बार क्या स्कैन",
      "मैंने क्या स्कैन किया",
      "मैंने कौन सी फसल स्कैन की",
      "फसल की स्थिति क्या थी",
      "मैंने आखिरी बार क्या स्कैन किया था",
      "मैंने हाल ही में क्या स्कैन किया",
    ];

    return scanKeywords.some((kw) => q.includes(kw));
  }

  /**
   * Formats a crisp, factual answer from actual stored scan data in the farmer's language.
   */
  public formatStoredScanAnswer(
    scan: OfflineScan | undefined,
    lang: AppLanguage,
    cropName?: string,
    fieldName?: string
  ): { answer: string; reason: string; action: string } {
    if (!scan) {
      if (lang === "bn") {
        return {
          answer: "আপনি এখনও কোনো পাতার স্ক্যান সম্পন্ন করেননি।",
          reason: "আপনার অ্যাকাউন্টে পূর্বে সংরক্ষিত কোনো স্ক্যান ডেটা পাওয়া যায়নি।",
          action: "আপনার ফসলের পাতা পরীক্ষা করতে 'স্ক্যান' ট্যাবে গিয়ে একটি স্পষ্ট ছবি তুলুন।",
        };
      }
      if (lang === "hi") {
        return {
          answer: "आपने अभी तक कोई पत्ती स्कैन नहीं किया है।",
          reason: "आपके खाते में पहले से सहेजा गया कोई स्कैन डेटा उपलब्ध नहीं है।",
          action: "अपनी फसल की पत्ती जांचने के लिए 'स्कैन' टैब में जाकर एक स्पष्ट फोटो लें।",
        };
      }
      return {
        answer: "You haven't completed a leaf scan yet.",
        reason: "No previously saved diagnostic scan record was found for your account.",
        action: "Take a clear leaf photo in the 'Scan' tab to establish your crop health baseline.",
      };
    }

    const disease = scan.disease || "Healthy Plant";
    const severity = scan.severity || "Low";
    const dateStr = scan.created_at ? scan.created_at.slice(0, 10) : "recently";
    const cropLabel = scan.analysis?.crop || (scan.result_json?.crop as string) || cropName || "crop";
    const rj = scan.result_json || {};
    const firstAction =
      (scan.analysis?.recommendedActions && scan.analysis.recommendedActions[0]) ||
      (Array.isArray(rj.actions) && rj.actions.length > 0 ? rj.actions[0] : "");

    if (lang === "bn") {
      const isHealthy = disease.toLowerCase().includes("healthy");
      const answer = isHealthy
        ? `আপনার সর্বশেষ স্ক্যানে (${dateStr}) ${cropLabel} ফসলের পাতা সম্পূর্ণ সুস্থ ও রোগমুক্ত পাওয়া গেছে।`
        : `আপনার সর্বশেষ স্ক্যানে (${dateStr}) ${cropLabel} ফসলে "${disease}" (তীব্রতা: ${severity}) শনাক্ত করা হয়েছিল।`;

      const reason = fieldName
        ? `এই স্ক্যানটি আপনার "${fieldName}" জমির সঙ্গে সংরক্ষিত আছে এবং এতে কোনো অনুমানের আশ্রয় নেওয়া হয়নি।`
        : `এই ফলাফলটি আপনার সংরক্ষিত স্ক্যান ডেটা থেকে সরাসরি উপস্থাপন করা হয়েছে।`;

      const action = firstAction || (isHealthy
        ? "নিয়মিত পর্যবেক্ষণ চালিয়ে যান এবং মাটির আর্দ্রতা বজায় রাখুন।"
        : "আক্রান্ত পাতা সাবধানে অপসারণ করুন এবং অনুমোদিত বালাইনাশক স্প্রে করুন।");

      return { answer, reason, action };
    }

    if (lang === "hi") {
      const isHealthy = disease.toLowerCase().includes("healthy");
      const answer = isHealthy
        ? `आपके हालिया स्कैन (${dateStr}) में ${cropLabel} फसल की पत्तियां पूरी तरह स्वस्थ पाई गई हैं।`
        : `आपके हालिया स्कैन (${dateStr}) में ${cropLabel} फसल में "${disease}" (गंभीरता: ${severity}) पाया गया था।`;

      const reason = fieldName
        ? `यह स्कैन आपके "${fieldName}" खेत के रिकॉर्ड में सुरक्षित है।`
        : `यह जानकारी आपके वास्तविक सहेजे गए स्कैन डेटा से ली गई है।`;

      const action = firstAction || (isHealthy
        ? "नियमित निगरानी बनाए रखें और उचित नमी सुनिश्चित करें।"
        : "संक्रमित पत्तियों को हटाएं और अनुशंसित उपचार तुरंत शुरू करें।");

      return { answer, reason, action };
    }

    // English
    const isHealthy = disease.toLowerCase().includes("healthy");
    const answer = isHealthy
      ? `Your most recent scan on ${dateStr} indicated healthy foliage with no active pathogen on your ${cropLabel}.`
      : `Your most recent scan on ${dateStr} diagnosed "${disease}" at ${severity} severity on your ${cropLabel}.`;

    const reason = fieldName
      ? `This record is stored under field "${fieldName}" in your AgriSight diagnostic history.`
      : `This diagnosis is retrieved directly from your saved scan history.`;

    const action = firstAction || (isHealthy
      ? "Maintain your regular monitoring schedule and optimal irrigation levels."
      : "Prune affected foliage and apply recommended protective spray.");

    return { answer, reason, action };
  }
}

export const AssistantContextService = new AssistantContextServiceImpl();
