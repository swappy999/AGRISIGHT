import { translations, LANGUAGE_CONFIG, Language } from "../src/translations";
import { cleanTextForSpeech } from "../src/hooks/useSpeechOutput";

function runVoiceOutputTests() {
  console.log("Starting Multilingual Voice Output (TTS) System Tests...");

  // Test 1: Validate TTS Target Locales per a2.md §11
  const expectedTtsLocales: Record<Language, string> = {
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
  };

  for (const [lang, expectedLocale] of Object.entries(expectedTtsLocales) as [Language, string][]) {
    const config = LANGUAGE_CONFIG[lang];
    if (!config) {
      throw new Error(`Missing LANGUAGE_CONFIG for language: ${lang}`);
    }
    if (config.tts !== expectedLocale) {
      throw new Error(
        `Language "${lang}" TTS locale mismatch: expected "${expectedLocale}", got "${config.tts}"`
      );
    }
  }
  console.log("[PASS] Test 1: TTS locales strictly adhere to a2.md §11 (en-IN, hi-IN, bn-IN)");

  // Test 2: Text Cleaning for Natural Agricultural Speech Synthesis
  const testCases = [
    {
      input: "### Crop Diagnosis\n**Rice Blast** detected on leaves.",
      expectedContains: ["Crop Diagnosis", "Rice Blast detected on leaves."],
      notContains: ["###", "**"],
    },
    {
      input: "Visit [AgriSight Portal](https://agrisight.org) for details.",
      expectedContains: ["Visit AgriSight Portal for details."],
      notContains: ["https://", "[", "](", ")"],
    },
    {
      input: "• Apply Copper Oxychloride\n- Avoid flood irrigation\n1. Prune affected branches",
      expectedContains: ["Apply Copper Oxychloride", "Avoid flood irrigation", "Prune affected branches"],
      notContains: ["•", "-", "1."],
    },
    {
      input: "🌿 Rice Leaf ⚠️ High Severity 💧 Soil Moisture 82%",
      expectedContains: ["Rice Leaf High Severity Soil Moisture 82%"],
      notContains: ["🌿", "⚠️", "💧"],
    },
    {
      input: "Run `apply_fungicide()` now: ```code block```",
      expectedContains: ["Run apply fungicide() now:"],
      notContains: ["```", "`"],
    },
  ];

  for (let i = 0; i < testCases.length; i++) {
    const { input, expectedContains, notContains } = testCases[i];
    const cleaned = cleanTextForSpeech(input);

    for (const exp of expectedContains) {
      if (!cleaned.includes(exp)) {
        throw new Error(`Test 2 Case ${i + 1} Failed: Expected cleaned text to contain "${exp}", got: "${cleaned}"`);
      }
    }
    for (const bad of notContains) {
      if (cleaned.includes(bad)) {
        throw new Error(`Test 2 Case ${i + 1} Failed: Cleaned text should NOT contain "${bad}", got: "${cleaned}"`);
      }
    }
  }
  console.log("[PASS] Test 2: cleanTextForSpeech properly strips markdown, links, bullets, and emojis");

  // Test 3: Validate Voice Output Translation Keys across en, hi, bn
  const ttsKeys = [
    "speak",
    "stopSpeaking",
    "ttsVoiceUnavailable",
    "ttsPlaying",
    "detailedInsight",
    "listenExplanation",
    "stopAudio",
  ] as (keyof typeof translations.en)[];

  const supportedLanguages: Language[] = ["en", "hi", "bn"];

  for (const key of ttsKeys) {
    for (const lang of supportedLanguages) {
      const val = translations[lang][key];
      if (!val || typeof val !== "string" || val.trim() === "") {
        throw new Error(`TTS translation key "${key}" is missing or empty in "${lang}" dictionary!`);
      }
    }
  }
  console.log(
    `[PASS] Test 3: Verified all ${ttsKeys.length} TTS voice playback translation keys across en, hi, bn`
  );

  console.log("\nALL MULTILINGUAL VOICE OUTPUT (TTS) TESTS PASSED SUCCESSFULLY!");
}

runVoiceOutputTests();
