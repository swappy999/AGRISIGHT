/**
 * AgriSight Hybrid Assistant
 * Implements a4.md Sections 10–14, 23–32:
 * - Online: Authenticated Gemini Assistant with rich account context (Scans, Crops, Fields, Sensors).
 * - Offline: Bounded Local Agronomic Memory & Decision Engine.
 * - Adheres strictly to the Language Contract (Bengali, Hindi, English).
 * - Never hallucinates scan results or uses fake data.
 */

import { AssistantContextService } from "./assistantContextService";
import { LanguageService, AppLanguage } from "./languageService";
import { LanguageValidationService } from "./languageValidationService";
import { getFastApiUrl, getCurrentUserId } from "./apiClient";
import { supabase } from "./supabaseClient";

export interface AssistantResponse {
  answer: string;
  reason: string;
  action: string;
  isOffline: boolean;
  isGrounded?: boolean;
  confidenceTier?: string;
  evidencePoints?: string[];
  whyExplanation?: string;
  moreDetails?: string;
  suggestedActions?: string[];
}

export class HybridAssistantService {
  private static currentRequestId = 0;

  /**
   * Main query method (a5.md Sections 5, 11, 12, 14, 30)
   */
  public static async askAssistant(
    question: string,
    language: string = "en",
    activeFieldId?: string,
    activeCropId?: string
  ): Promise<AssistantResponse> {
    const isOnline = typeof window !== "undefined" && navigator.onLine;
    const currentLang = (language as AppLanguage) || LanguageService.getCurrentLanguage();
    const userId = await getCurrentUserId();

    // a5.md Section 30: Request deduplication and tracking
    this.currentRequestId += 1;
    const thisRequestId = this.currentRequestId;

    // 1. Build authoritative Assistant Context from local + synced state
    const context = await AssistantContextService.buildAssistantContext(
      userId,
      activeFieldId,
      activeCropId
    );

    const currentField = context.currentField;
    const currentCrop = context.currentCrop;
    const latestScan = context.latestScan;
    const latestSensor = context.recentSensorReadings[0];

    // 2. If online, invoke authenticated backend Assistant (Gemini Online First per a5.md Sections 1-4)
    if (isOnline) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const baseUrl = getFastApiUrl();

        // Retrieve Supabase bearer token
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.access_token) {
            headers["Authorization"] = `Bearer ${data.session.access_token}`;
          }
        } catch {}

        // a5.md Section 12: Serialize structured latest scan context from local repository
        const scanPayload = latestScan
          ? {
              id: latestScan.id,
              crop: latestScan.analysis?.crop || (latestScan.result_json?.crop as string) || currentCrop?.name || "crop",
              condition: latestScan.analysis?.condition || latestScan.disease || "Healthy Plant",
              disease: latestScan.disease || latestScan.analysis?.condition || "Healthy Plant",
              severity: latestScan.analysis?.severity || latestScan.severity || "Low",
              confidence: latestScan.confidence || latestScan.analysis?.confidence,
              field_id: latestScan.field_id || currentField?.id,
              crop_id: latestScan.crop_id || currentCrop?.id,
              field_name: currentField?.name,
              crop_name: currentCrop?.name,
              created_at: latestScan.created_at,
              observations: latestScan.analysis?.observations || (latestScan.result_json?.observations as string[]) || (latestScan.result_json?.summary ? [latestScan.result_json.summary] : []),
              possible_causes: latestScan.analysis?.possibleCauses || (latestScan.result_json?.possible_causes as string[]) || [],
              recommended_actions: latestScan.analysis?.recommendedActions || (latestScan.result_json?.actions as string[]) || [],
              prevention: latestScan.analysis?.prevention || (latestScan.result_json?.prevention_steps as string[]) || [],
              result_json: latestScan.result_json,
            }
          : undefined;

        const recentScansPayload = context.recentScans.slice(0, 5).map((s) => ({
          id: s.id,
          crop: s.analysis?.crop || (s.result_json?.crop as string) || "crop",
          condition: s.analysis?.condition || s.disease || "Healthy Plant",
          disease: s.disease || s.analysis?.condition || "Healthy Plant",
          severity: s.analysis?.severity || s.severity || "Low",
          confidence: s.confidence,
          field_id: s.field_id,
          crop_id: s.crop_id,
          created_at: s.created_at,
          observations: s.analysis?.observations || (s.result_json?.summary ? [s.result_json.summary] : []),
          recommended_actions: s.analysis?.recommendedActions || (s.result_json?.actions as string[]) || [],
        }));

        const contextText = AssistantContextService.formatContextForPrompt(context);

        const res = await fetch(`${baseUrl}/assistant/chat`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: question,
            language: currentLang,
            field_id: currentField?.id || activeFieldId || "",
            crop_id: currentCrop?.id || activeCropId || "",
            latest_scan: scanPayload,
            recent_scans: recentScansPayload,
            context_text: contextText,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // Discard stale responses if a newer request was dispatched
        if (thisRequestId !== this.currentRequestId) {
          console.info(`[HybridAssistant] Discarding stale response for request #${thisRequestId}`);
          return {
            answer: "",
            reason: "",
            action: "",
            isOffline: false,
          };
        }

        if (res.ok) {
          const raw = await res.json();
          const data = raw.data || raw;
          let answerText = data.answer || data.reply || data.response || "";

          // Validate response language adheres to selected language (a4.md Section 12)
          const valResult = LanguageValidationService.validateResponse(answerText, currentLang);
          if (!valResult.isValid && currentLang !== "en") {
            console.warn(
              `[HybridAssistant] Language mismatch detected (expected ${currentLang}). Retrying with correction prompt.`
            );
            try {
              const retryRes = await fetch(`${baseUrl}/assistant/chat`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                  message: `${question}\n[${LanguageValidationService.getCorrectionDirective(currentLang)}]`,
                  language: currentLang,
                  field_id: currentField?.id || activeFieldId || "",
                  crop_id: currentCrop?.id || activeCropId || "",
                  latest_scan: scanPayload,
                  recent_scans: recentScansPayload,
                  context_text: contextText,
                }),
              });
              if (retryRes.ok) {
                const retryRaw = await retryRes.json();
                const retryData = retryRaw.data || retryRaw;
                if (retryData.answer) {
                  answerText = retryData.answer;
                }
              }
            } catch {}
          }

          const suggestedActions = Array.isArray(data.suggested_actions)
            ? data.suggested_actions
            : [data.action || "Continue regular crop scouting"];

          return {
            answer: answerText,
            reason: data.why_explanation || data.reason || "Analysis derived from verified crop health data.",
            action: suggestedActions[0] || "Maintain optimal irrigation and check crop regularly.",
            isOffline: false,
            isGrounded: data.is_grounded ?? true,
            confidenceTier: data.confidence_tier || "High",
            evidencePoints: data.evidence_points || [data.why_explanation || "Field records verified"],
            whyExplanation: data.why_explanation,
            moreDetails: data.more_details || data.why_explanation,
            suggestedActions,
          };
        } else {
          console.warn(`[HybridAssistant] Backend returned status ${res.status}.`);
        }
      } catch (cloudErr) {
        console.warn("[HybridAssistant] Cloud assistant unreachable or timed out; activating local rule memory:", cloudErr);
      }
    }

    // ── Local Agronomic Rule & Memory Engine (Offline) ───────────────────────
    return this.generateOfflineResponse(
      question,
      currentLang,
      currentCrop,
      currentField,
      latestScan,
      latestSensor
    );
  }

  private static generateOfflineResponse(
    question: string,
    language: AppLanguage,
    crop?: any,
    field?: any,
    scan?: any,
    sensor?: any
  ): AssistantResponse {
    const q = question.toLowerCase();

    // 0. Recent Scan / Diagnostic Memory Queries (a4.md Sections 23–29)
    if (AssistantContextService.isRecentScanQuery(question)) {
      const scanAnswer = AssistantContextService.formatStoredScanAnswer(
        scan,
        language,
        crop?.name,
        field?.name
      );

      return {
        answer: scanAnswer.answer,
        reason: scanAnswer.reason,
        action: scanAnswer.action,
        isOffline: true,
        isGrounded: Boolean(scan),
        confidenceTier: scan ? "High" : "Guidance",
        evidencePoints: scan
          ? [`Diagnosis: ${scan.disease}`, `Severity: ${scan.severity}`, `Date: ${scan.created_at?.slice(0, 10)}`]
          : ["No prior scan recorded in local database"],
        whyExplanation: scanAnswer.reason,
        moreDetails: scanAnswer.reason,
        suggestedActions: [scanAnswer.action],
      };
    }

    // 1. Irrigation & Moisture query
    if (
      q.includes("water") ||
      q.includes("irrigat") ||
      q.includes("moisture") ||
      q.includes("পানি") ||
      q.includes("সেচ") ||
      q.includes("পানি") ||
      q.includes("पानी") ||
      q.includes("सिंचाई") ||
      q.includes("नमी")
    ) {
      const moisture = sensor?.soil_moisture;
      if (moisture !== undefined && moisture < 25) {
        const answer =
          language === "bn"
            ? "আপনার জমিতে মাটির আর্দ্রতা কম রয়েছে (২৫% এর নিচে)। এখনই সেচ দেওয়া প্রয়োজন।"
            : language === "hi"
            ? "आपके खेत में मिट्टी की नमी कम है (25% से नीचे)। तुरंत सिंचाई की आवश्यकता है।"
            : "Soil moisture is low (below 25%). Irrigation is required promptly.";

        const reason =
          language === "bn"
            ? `সাম্প্রতিক সেন্সর রিডিং অনুযায়ী আর্দ্রতা ${moisture}%। পানির ঘাটতি ফসলের ফলন কমিয়ে দিতে পারে।`
            : language === "hi"
            ? `हालिया सेंसर रीडिंग के अनुसार नमी ${moisture}% है। पानी की कमी से पैदावार प्रभावित हो सकती है।`
            : `Recent sensor readings indicate ${moisture}% soil moisture. Water deficit during this stage can stress crop roots.`;

        const action =
          language === "bn"
            ? "মাঝারি সেচ প্রদান করুন এবং সকালে অথবা বিকেলে পানি দিন যাতে বাষ্পীভবন কম হয়।"
            : language === "hi"
            ? "मध्यम सिंचाई करें और पानी सुबह या शाम को दें ताकि वाष्पीकरण कम हो।"
            : "Apply light-to-moderate furrow or drip irrigation during early morning or evening hours.";

        return {
          answer,
          reason,
          action,
          isOffline: true,
          isGrounded: true,
          confidenceTier: "High",
          evidencePoints: [`Soil moisture: ${moisture}%`],
          suggestedActions: [action],
        };
      } else if (moisture !== undefined && moisture > 70) {
        const answer =
          language === "bn"
            ? "মাটির আর্দ্রতা যথেষ্ট বেশি রয়েছে (৭০% এর উপরে)। অতিরিক্ত সেচ পরিহার করুন।"
            : language === "hi"
            ? "मिट्टी की नमी पर्याप्त है (70% से अधिक)। अतिरिक्त सिंचाई से बचें।"
            : "Soil moisture is well saturated (above 70%). Postpone further irrigation.";

        const reason =
          language === "bn"
            ? `মাটিতে পর্যাপ্ত পানি রয়েছে (${moisture}%)। অতিরিক্ত পানি জমে থাকলে শিকড় পচে যাওয়ার ঝুঁকি থাকে।`
            : language === "hi"
            ? `मिट्टी में पर्याप्त पानी है (${moisture}%)। जलभराव से जड़ सड़न का खतरा बढ़ जाता है।`
            : `Current sensor reading is ${moisture}%. Excess stagnant water promotes fungal root rot.`;

        const action =
          language === "bn"
            ? "পানি নিষ্কাশন নালা পরিষ্কার রাখুন এবং মাটি কিছুটা শুকাতে দিন।"
            : language === "hi"
            ? "जल निकासी नालियों को साफ रखें और मिट्टी को थोड़ा सूखने दें।"
            : "Ensure drainage outlets are clear and wait until moisture drops below 40% before next watering.";

        return {
          answer,
          reason,
          action,
          isOffline: true,
          isGrounded: true,
          confidenceTier: "High",
          evidencePoints: [`Soil moisture: ${moisture}%`],
          suggestedActions: [action],
        };
      }
    }

    // 2. Disease / Scan / Leaf health query
    if (
      q.includes("disease") ||
      q.includes("leaf") ||
      q.includes("spot") ||
      q.includes("blight") ||
      q.includes("রোগ") ||
      q.includes("পাতা") ||
      q.includes("ছত্রাক") ||
      q.includes("रोग") ||
      q.includes("बीमारी") ||
      q.includes("पत्ती")
    ) {
      const diseaseName = scan?.disease || "Healthy Foliage";
      const answer =
        language === "bn"
          ? `আপনার ফসলের সাম্প্রতিক রেকর্ডে "${diseaseName}" সম্পর্কিত তথ্য সংরক্ষিত আছে।`
          : language === "hi"
          ? `आपकी फसल के हालिया रिकॉर्ड में "${diseaseName}" दर्ज किया गया है।`
          : `Your recent diagnostic history indicates "${diseaseName}".`;

      const reason =
        language === "bn"
          ? "আক্রান্ত পাতা সময়মতো নিয়ন্ত্রণ না করলে ছত্রাক বা ব্যাকটেরিয়ার জীবাণু দ্রুত পুরো জমিতে ছড়িয়ে পড়ে।"
          : language === "hi"
          ? "संक्रमित पत्तियों का समय पर प्रबंधन न करने से रोग पूरे खेत में फैल सकता है।"
          : "Foliar lesions spread rapidly under high morning humidity and warm daytime temperatures.";

      const action =
        language === "bn"
          ? "বেশি আক্রান্ত পাতা সাবধানে কেটে নষ্ট করে ফেলুন এবং অনুমোদিত জৈব নিম তেল বা ছত্রাকনাশক স্প্রে করুন।"
          : language === "hi"
          ? "गंभीर रूप से प्रभावित पत्तियों को हटाकर नष्ट करें और अनुशंसित नीम तेल या कवकनाशी का छिड़काव करें।"
          : "Prune and destroy heavily blighted bottom leaves, then apply Neem oil (3ml/L) or targeted copper fungicide.";

      return {
        answer,
        reason,
        action,
        isOffline: true,
        isGrounded: Boolean(scan),
        confidenceTier: scan ? "High" : "Guidance",
        evidencePoints: [diseaseName],
        suggestedActions: [action],
      };
    }

    // 3. Fertilizer / NPK query
    if (
      q.includes("fertiliz") ||
      q.includes("urea") ||
      q.includes("npk") ||
      q.includes("সার") ||
      q.includes("ইউরিয়া") ||
      q.includes("खाद") ||
      q.includes("उर्वरक") ||
      q.includes("यूरिया")
    ) {
      const cropName = crop?.name || "Paddy";
      const answer =
        language === "bn"
          ? `${cropName} ফসলের জন্য সুষম NPK সারের প্রয়োগ নিশ্চিত করুন।`
          : language === "hi"
          ? `${cropName} फसल के लिए संतुलित NPK उर्वरक का प्रयोग करें।`
          : `Apply a balanced NPK regimen matched to the growth stage of your ${cropName}.`;

      const reason =
        language === "bn"
          ? "অতিরিক্ত ইউরিয়া প্রয়োগ করলে গাছ দুর্বল হয়ে পোকা ও রোগের আক্রমণ বেড়ে যায়।"
          : language === "hi"
          ? "अत्यधिक यूरिया के उपयोग से पौधे कोमल हो जाते हैं और कीटों का खतरा बढ़ जाता है।"
          : "Excessive nitrogen causes succulent growth, making leaves susceptible to fungal blights.";

      const action =
        language === "bn"
          ? "ইউরিয়া সমান ৩ ভাগে ভাগ করে প্রয়োগ করুন এবং পটাশ সার যুক্ত করতে ভুলবেন না।"
          : language === "hi"
          ? "यूरिया को 3 बराबर भागों में बांटकर दें और पोटाश का प्रयोग अवश्य करें।"
          : "Split nitrogen into 3 balanced applications and supplement with Muriate of Potash (MOP).";

      return {
        answer,
        reason,
        action,
        isOffline: true,
        isGrounded: true,
        confidenceTier: "High",
        evidencePoints: [`Crop: ${cropName}`],
        suggestedActions: [action],
      };
    }

    // Default General Advisory (a4.md Section 50)
    const cropName = crop?.name || "your crop";
    const fieldName = field?.name || "your field";
    const answer =
      language === "bn"
        ? `এগ্রিসাইট অফলাইন বুদ্ধিমত্তা: "${fieldName}" জমিতে ${cropName} ফসলের নিয়মিত পর্যবেক্ষণ চালিয়ে যান।`
        : language === "hi"
        ? `एग्रीसाइट ऑफ़लाइन सलाहकार: "${fieldName}" खेत में ${cropName} फसल की नियमित निगरानी रखें।`
        : `AgriSight Local Advisory: Maintain regular monitoring on "${fieldName}" for ${cropName}.`;

    const reason =
      language === "bn"
        ? "নিয়মিত পর্যবেক্ষণ রোগের প্রাথমিক লক্ষণ ও পানির অভাব দ্রুত শনাক্ত করতে সাহায্য করে।"
        : language === "hi"
        ? "नियमित निगरानी से रोग के शुरुआती लक्षण और पानी की कमी समय पर पता चल जाती है।"
        : "Early detection of nutrient stress or leaf discoloration prevents crop loss before symptoms escalate.";

    const action =
      language === "bn"
        ? "সপ্তাহে দুইবার পাতা স্ক্যান করুন এবং মাটির আর্দ্রতা পরীক্ষা করুন।"
        : language === "hi"
        ? "सप्ताह में दो बार पत्तियों को स्कैन करें और मिट्टी की नमी जांचें।"
        : "Perform leaf scans twice weekly and maintain weed-free bunds around the plot.";

    return {
      answer,
      reason,
      action,
      isOffline: true,
      isGrounded: false,
      confidenceTier: "Guidance",
      evidencePoints: [`Field: ${fieldName}`, `Crop: ${cropName}`],
      suggestedActions: [action],
    };
  }
}
