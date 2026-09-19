import { translations, LANGUAGE_CONFIG, translateDynamicContent, Language } from "../src/translations";

function runTests() {
  console.log("Starting Multilingual & Translation System Tests...");

  // Test 1: Validate LANGUAGE_CONFIG
  const expectedLangs: Language[] = ["en", "hi", "bn"];
  for (const lang of expectedLangs) {
    const config = LANGUAGE_CONFIG[lang];
    if (!config) {
      throw new Error(`LANGUAGE_CONFIG missing entry for ${lang}`);
    }
    if (!config.code || !config.name || !config.nativeName || !config.speech || !config.tts) {
      throw new Error(`LANGUAGE_CONFIG entry for ${lang} is missing required fields`);
    }
    if (lang === "en" && (config.speech !== "en-IN" || config.tts !== "en-IN")) {
      throw new Error("English speech/tts must be en-IN per a2.md §12");
    }
    if (lang === "hi" && (config.speech !== "hi-IN" || config.tts !== "hi-IN")) {
      throw new Error("Hindi speech/tts must be hi-IN per a2.md §12");
    }
    if (lang === "bn" && (config.speech !== "bn-IN" || config.tts !== "bn-IN")) {
      throw new Error("Bengali speech/tts must be bn-IN per a2.md §12");
    }
  }
  console.log("[PASS] Test 1: LANGUAGE_CONFIG adheres to a2.md §12 specification (en-IN, hi-IN, bn-IN)");

  // Test 2: Parity between en, hi, bn dictionaries
  const enKeys = Object.keys(translations.en) as (keyof typeof translations.en)[];
  const hiKeys = Object.keys(translations.hi) as (keyof typeof translations.hi)[];
  const bnKeys = Object.keys(translations.bn) as (keyof typeof translations.bn)[];

  if (enKeys.length !== hiKeys.length || enKeys.length !== bnKeys.length) {
    throw new Error(
      `Translation key length mismatch! en: ${enKeys.length}, hi: ${hiKeys.length}, bn: ${bnKeys.length}`
    );
  }

  for (const key of enKeys) {
    if (!translations.hi[key] || translations.hi[key].trim() === "") {
      throw new Error(`Missing or empty Hindi translation for key "${key}"`);
    }
    if (!translations.bn[key] || translations.bn[key].trim() === "") {
      throw new Error(`Missing or empty Bengali translation for key "${key}"`);
    }
  }
  console.log(`[PASS] Test 2: Complete translation key parity across ${enKeys.length} keys in en, hi, bn`);

  // Test 3: Validate newly added profile & alert keys exist and are populated
  const newKeys = [
    "manageProfileSettings",
    "memberSince",
    "dataSync",
    "active",
    "subscription",
    "freeTier",
    "languageLabel",
    "savedSuccess",
    "criticalAlertsPref",
    "criticalAlertsSub",
    "weeklySummariesPref",
    "weeklySummariesSub",
    "needSupport",
    "supportSub",
    "contactSupport",
    "backToDashboard",
    "notificationsTitle",
    "notificationsSubtitle",
    "summary",
    "totalAlerts",
    "unread",
    "aboutAlerts",
    "criticalAlertsDesc",
    "warningAlertsDesc",
    "optimalAlertsDesc",
    "scanNewCrop",
    "historySubtitle",
    "searchHistoryPlaceholder",
    "allScans",
    "threatsTab",
    "healthyTab",
  ] as (keyof typeof translations.en)[];

  for (const k of newKeys) {
    if (!translations.en[k] || !translations.hi[k] || !translations.bn[k]) {
      throw new Error(`Required key "${k}" is missing in one or more dictionaries!`);
    }
  }
  console.log(`[PASS] Test 3: Verified all ${newKeys.length} newly added profile, alert, and history keys`);

  // Test 4: Dynamic content translation (diseases, crops, pests, nutrients, stages, soil, irrigation)
  const dynamicHi = translateDynamicContent("Early Blight Detected", "hi");
  const dynamicBn = translateDynamicContent("Early Blight Detected", "bn");
  if (dynamicHi !== "अर्ली ब्लाइट का पता चला") {
    throw new Error(`translateDynamicContent failed for Hindi: expected "अर्ली ब्लाइट का पता चला", got "${dynamicHi}"`);
  }
  if (dynamicBn !== "আর্লি ব্লাইট ধরা পড়েছে") {
    throw new Error(`translateDynamicContent failed for Bengali: expected "আর্লি ব্লাইট ধরা পড়েছে", got "${dynamicBn}"`);
  }

  // Crops
  if (translateDynamicContent("Rice", "bn") !== "ধান" || translateDynamicContent("Rice", "hi") !== "धान (चावल)") {
    throw new Error(`Crop Rice translation failed`);
  }
  if (translateDynamicContent("Wheat", "bn") !== "গম" || translateDynamicContent("Wheat", "hi") !== "गेहूं") {
    throw new Error(`Crop Wheat translation failed`);
  }
  if (translateDynamicContent("Tomato", "bn") !== "টমেটো" || translateDynamicContent("Tomato", "hi") !== "टमाटर") {
    throw new Error(`Crop Tomato translation failed`);
  }

  // Diseases
  if (translateDynamicContent("Bacterial Leaf Blight", "bn") !== "ব্যাকটেরিয়াল লিফ ব্লাইট") {
    throw new Error(`Disease Bacterial Leaf Blight failed`);
  }

  // Pests
  if (translateDynamicContent("Stem Borer", "bn") !== "মাজরা পোকা" || translateDynamicContent("Stem Borer", "hi") !== "तना छेदक") {
    throw new Error(`Pest Stem Borer failed`);
  }
  if (translateDynamicContent("Aphids", "bn") !== "জাবপোকা") {
    throw new Error(`Pest Aphids failed`);
  }

  // Nutrient Deficiencies
  if (translateDynamicContent("Nitrogen Deficiency", "bn") !== "নাইট্রোজেনের ঘাটতি" || translateDynamicContent("Nitrogen Deficiency", "hi") !== "नाइट्रोजन की कमी") {
    throw new Error(`Nutrient Nitrogen Deficiency failed`);
  }

  // Growth stages
  if (translateDynamicContent("Tillering", "bn") !== "কুশি পর্যায়") {
    throw new Error(`Growth stage Tillering failed`);
  }

  // Soil & Irrigation
  if (translateDynamicContent("Alluvial", "bn") !== "পলি মাটি" || translateDynamicContent("Alluvial", "hi") !== "जलोढ़ मिट्टी") {
    throw new Error(`Soil Alluvial failed`);
  }
  if (translateDynamicContent("Drip", "bn") !== "ড্রিপ (বিন্দু) সেচ" || translateDynamicContent("Drip", "hi") !== "ड्रिप (टपक) सिंचाई") {
    throw new Error(`Irrigation Drip failed`);
  }

  console.log("[PASS] Test 4: translateDynamicContent accurately covers crops, diseases, pests, nutrients, stages, soils & irrigation");

  // Test 5: Validate Voice Input Keys
  const voiceKeys = [
    "micPermissionDenied",
    "speechNetworkError",
    "listeningInLanguage",
    "tapToSpeak",
    "clearVoiceInput",
    "voiceNotSupported",
  ] as (keyof typeof translations.en)[];

  for (const vk of voiceKeys) {
    if (!translations.en[vk] || !translations.hi[vk] || !translations.bn[vk]) {
      throw new Error(`Voice key "${vk}" is missing in one or more dictionaries!`);
    }
  }
  console.log(`[PASS] Test 5: Verified all ${voiceKeys.length} voice input keys across en, hi, bn`);

  // Test 6: Validate Voice Output (TTS) Keys
  const ttsKeys = [
    "speak",
    "stopSpeaking",
    "ttsVoiceUnavailable",
    "ttsPlaying",
    "detailedInsight",
    "listenExplanation",
    "stopAudio",
    "audioPlaybackError",
  ] as (keyof typeof translations.en)[];

  for (const tk of ttsKeys) {
    if (!translations.en[tk] || !translations.hi[tk] || !translations.bn[tk]) {
      throw new Error(`TTS key "${tk}" is missing in one or more dictionaries!`);
    }
  }
  console.log(`[PASS] Test 6: Verified all ${ttsKeys.length} voice output / TTS keys across en, hi, bn`);

  console.log("\nALL MULTILINGUAL & TRANSLATION SYSTEM TESTS PASSED SUCCESSFULLY!");
}

runTests();
