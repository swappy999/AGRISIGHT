import assert from "assert";
import { normalizeSpeechTranscript } from "../src/lib/speechNormalization";

console.log("Starting Speech Normalization & Voice Input Deduplication Tests...");

// Test 1: Single word consecutive duplicates
assert.strictEqual(normalizeSpeechTranscript("Hello Hello"), "Hello", "Single word duplicate failed");
assert.strictEqual(
  normalizeSpeechTranscript("WhatsApp WhatsApp WhatsApp WhatsApp"),
  "WhatsApp",
  "Repeated single word duplicate failed"
);
console.log("[PASS] Test 1: Single word consecutive duplicates collapsed");

// Test 2: Normal natural sentences preserved
assert.strictEqual(
  normalizeSpeechTranscript("The leaves are turning yellow"),
  "The leaves are turning yellow",
  "Natural sentence modified unexpectedly"
);
assert.strictEqual(
  normalizeSpeechTranscript("The leaves are turning yellow and the plant is growing slowly"),
  "The leaves are turning yellow and the plant is growing slowly",
  "Natural compound sentence modified unexpectedly"
);
console.log("[PASS] Test 2: Legitimate natural sentences preserved");

// Test 3: Legitimate non-consecutive repetitions preserved
assert.strictEqual(
  normalizeSpeechTranscript("I saw the plant and then I saw the plant again"),
  "I saw the plant and then I saw the plant again",
  "Legitimate non-consecutive repetition removed"
);
console.log("[PASS] Test 3: Legitimate non-consecutive repetitions preserved");

// Test 4: Multi-word consecutive phrase duplicates
assert.strictEqual(
  normalizeSpeechTranscript("the leaves are turning yellow the leaves are turning yellow"),
  "the leaves are turning yellow",
  "Consecutive multi-word phrase duplicate not collapsed"
);
console.log("[PASS] Test 4: Consecutive multi-word phrases collapsed");

// Test 5: Multilingual Indic support (Hindi & Bengali)
assert.strictEqual(normalizeSpeechTranscript("पानी पानी"), "पानी", "Hindi duplicate failed");
assert.strictEqual(normalizeSpeechTranscript("পাতা পাতা"), "পাতা", "Bengali duplicate failed");
assert.strictEqual(
  normalizeSpeechTranscript("পাতা হলুদ পাতা হলুদ হয়ে গেছে"),
  "পাতা হলুদ হয়ে গেছে",
  "Bengali phrase duplicate failed"
);
console.log("[PASS] Test 5: Indic (Hindi & Bengali) duplicates correctly deduplicated");

console.log("\nALL SPEECH NORMALIZATION TESTS PASSED SUCCESSFULLY! [5/5]\n");
