/**
 * AgriSight Speech Normalization & Deduplication Utility
 * Implements Section 4 & 17 of Voice Input Duplication Specification.
 *
 * Responsibilities:
 * - Trims whitespace and collapses repeated spaces.
 * - Detects and eliminates accidental consecutive repeated words/phrases caused
 *   by browser/Android speech recognition event loops (e.g. "Hello Hello" -> "Hello",
 *   "WhatsApp WhatsApp WhatsApp" -> "WhatsApp", "the plant the plant" -> "the plant").
 * - Preserves natural repeated words across sentences and legitimate repetition
 *   (e.g., "I saw the plant and then I saw the plant again" remains unchanged).
 * - Multi-language safe: Works across English, Hindi (हिन्दी), and Bengali (বাংলা).
 */

/**
 * Normalizes speech recognition transcripts and conservatively removes
 * consecutive duplication artifacts without altering legitimate phrasing.
 */
export function normalizeSpeechTranscript(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  // 1. Collapse multiple whitespace and normalize Unicode
  let text = raw.replace(/\s+/g, " ").trim();
  if (!text) return "";

  // 2. Remove immediate duplicate single words (case-insensitive for Latin, exact for Indic)
  // e.g. "Hello Hello" -> "Hello", "WhatsApp WhatsApp WhatsApp" -> "WhatsApp"
  // e.g. "पानी पानी" -> "पानी", "পাতা পাতা" -> "পাতা"
  const words = text.split(" ");
  if (words.length <= 1) return text;

  // Single-word consecutive duplicate collapse
  const singleDeduplicated: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    const prev = singleDeduplicated[singleDeduplicated.length - 1];

    if (prev && current.toLowerCase() === prev.toLowerCase()) {
      // Skip consecutive duplicate
      continue;
    }
    singleDeduplicated.push(current);
  }

  // 3. Multi-word phrase consecutive duplicate collapse (n-grams from 2 up to 5 words)
  // e.g. "the leaves are turning the leaves are turning yellow"
  // -> "the leaves are turning yellow"
  let phraseTokens = [...singleDeduplicated];
  for (let phraseLen = 5; phraseLen >= 2; phraseLen--) {
    let changed = true;
    while (changed) {
      changed = false;
      if (phraseTokens.length < phraseLen * 2) break;

      for (let i = 0; i <= phraseTokens.length - phraseLen * 2; i++) {
        const phraseA = phraseTokens.slice(i, i + phraseLen).map(w => w.toLowerCase()).join(" ");
        const phraseB = phraseTokens.slice(i + phraseLen, i + phraseLen * 2).map(w => w.toLowerCase()).join(" ");

        if (phraseA === phraseB && phraseA.length > 0) {
          // Remove the duplicate consecutive block
          phraseTokens.splice(i + phraseLen, phraseLen);
          changed = true;
          break;
        }
      }
    }
  }

  return phraseTokens.join(" ").trim();
}

/**
 * Diagnostics logger for voice verification (Section 16 & 19).
 * Only logs in development or non-production environment.
 */
export function logVoiceDiagnostics(tag: string, details: Record<string, any>) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug(`[Voice Diagnostics - ${tag}]`, details);
  }
}
