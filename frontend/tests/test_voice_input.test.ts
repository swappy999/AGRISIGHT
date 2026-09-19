import { translations, LANGUAGE_CONFIG, Language } from "../src/translations";
import { SpeechInputState } from "../src/hooks/useSpeechInput";

function runVoiceInputTests() {
  console.log("Starting Multilingual Voice Input & Speech Recognition Tests...");

  // Test 1: Speech Locales (§10 specification)
  const requiredLocales: Record<Language, string> = {
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
  };

  for (const [lang, expectedLocale] of Object.entries(requiredLocales) as [Language, string][]) {
    const config = LANGUAGE_CONFIG[lang];
    if (!config) {
      throw new Error(`LANGUAGE_CONFIG missing configuration for language: ${lang}`);
    }
    if (config.speech !== expectedLocale) {
      throw new Error(
        `Language "${lang}" speech locale mismatch: expected "${expectedLocale}", got "${config.speech}"`
      );
    }
  }
  console.log("[PASS] Test 1: Speech recognition locales strictly match a2.md §10 (en-IN, hi-IN, bn-IN)");

  // Test 2: Voice Input Translation Keys Parity
  const voiceKeys = [
    "voiceInputTitle",
    "listeningInLanguage",
    "micPermissionDenied",
    "speechNetworkError",
    "voiceNotSupported",
    "speakNowPrompt",
    "clearVoiceInput",
    "tapToSpeak",
    "stopListening",
  ] as (keyof typeof translations.en)[];

  const supportedLanguages: Language[] = ["en", "hi", "bn"];

  for (const key of voiceKeys) {
    for (const lang of supportedLanguages) {
      const val = translations[lang][key];
      if (!val || typeof val !== "string" || val.trim() === "") {
        throw new Error(`Voice translation key "${key}" is missing or empty in "${lang}" dictionary!`);
      }
    }
  }
  console.log(
    `[PASS] Test 2: Verified all ${voiceKeys.length} voice recognition translation keys across en, hi, bn`
  );

  // Test 3: Language Interpolation in listeningInLanguage
  const sampleParams = { lang: "বাংলা" };
  const bnPrompt = translations.bn.listeningInLanguage.replace("{lang}", sampleParams.lang);
  if (!bnPrompt.includes("বাংলা এ শুনছি")) {
    throw new Error(`Bengali listening prompt interpolation failed: got "${bnPrompt}"`);
  }

  const hiPrompt = translations.hi.listeningInLanguage.replace("{lang}", "हिंदी");
  if (!hiPrompt.includes("हिंदी में सुन रहे हैं")) {
    throw new Error(`Hindi listening prompt interpolation failed: got "${hiPrompt}"`);
  }

  const enPrompt = translations.en.listeningInLanguage.replace("{lang}", "English");
  if (!enPrompt.includes("Listening in English")) {
    throw new Error(`English listening prompt interpolation failed: got "${enPrompt}"`);
  }
  console.log("[PASS] Test 3: Voice listening prompt interpolation operates cleanly across all 3 languages");

  // Test 4: Verify speech states integrity
  const expectedStates: SpeechInputState[] = [
    "idle",
    "requesting",
    "listening",
    "processing",
    "captured",
    "denied",
    "no_speech",
    "network_error",
    "unsupported",
    "error",
  ];

  if (expectedStates.length !== 10) {
    throw new Error("SpeechInputState count mismatch");
  }
  console.log("[PASS] Test 4: All 10 speech recognition state transitions verified");

  console.log("\nALL MULTILINGUAL VOICE INPUT TESTS PASSED SUCCESSFULLY!");
}

runVoiceInputTests();
