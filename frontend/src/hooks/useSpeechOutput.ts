import { useState, useCallback, useEffect, useRef } from "react";
import { LANGUAGE_CONFIG, Language } from "@/translations";

interface UseSpeechOutputReturn {
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  hasVoiceForLanguage: boolean;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  replay: (text?: string) => void;
}

/**
 * Clean markdown, URLs, symbols, and emojis for smooth, natural TTS synthesis.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";

  return text
    // Replace markdown links [label](url) with just label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove code fences and inline backticks
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Remove markdown headers
    .replace(/^#+\s+/gm, "")
    // Remove bullet characters and numbered list prefixes
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    // Remove bold and italic markers (*), convert underscores to spaces for natural speech
    .replace(/\*{1,3}/g, "")
    .replace(/_/g, " ")
    // Remove table borders
    .replace(/\|/g, " ")
    // Remove common emojis and variation selectors that clutter speech synthesis
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE00}-\u{FE0F}]/gu, "")
    // Normalize newlines to sentence pauses
    .replace(/\n+/g, ". ")
    // Collapse multiple dots or spaces
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

export function useSpeechOutput(agriLang: string = "en"): UseSpeechOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const lastTextRef = useRef<string>("");
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Load and update voices on mount and voice change events
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setVoices(available);
        }
      } catch {}
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      clearHeartbeat();
      try {
        window.speechSynthesis.cancel();
      } catch {}
    };
  }, [isSupported, clearHeartbeat]);

  // Immediately cancel active speech if language changes
  useEffect(() => {
    if (isSupported) {
      clearHeartbeat();
      try {
        window.speechSynthesis.cancel();
      } catch {}
      setIsSpeaking(false);
      setIsPaused(false);
      activeUtteranceRef.current = null;
    }
  }, [agriLang, isSupported, clearHeartbeat]);

  const targetLangTag = LANGUAGE_CONFIG[agriLang as Language]?.tts || "en-IN";
  const langPrefix = targetLangTag.split("-")[0].toLowerCase();

  // Match voice by exact tag, prefix, regional fallback, or name
  const matchedVoice =
    voices.find(
      (v) => v.lang.toLowerCase().replace("_", "-") === targetLangTag.toLowerCase()
    ) ||
    (agriLang === "bn"
      ? voices.find((v) => v.lang.toLowerCase().replace("_", "-") === "bn-bd")
      : null) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
    voices.find(
      (v) =>
        v.name.toLowerCase().includes(langPrefix) ||
        (agriLang === "hi" && (v.name.includes("Hindi") || v.name.includes("हिन्दी"))) ||
        (agriLang === "bn" && (v.name.includes("Bengali") || v.name.includes("বাংলা") || v.name.includes("Bangla")))
    );

  // If voices list is still loading or English fallback or matched
  const hasVoiceForLanguage = Boolean(matchedVoice || voices.length === 0 || agriLang === "en");

  const stop = useCallback(() => {
    clearHeartbeat();
    if (isSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      setIsSpeaking(false);
      setIsPaused(false);
      activeUtteranceRef.current = null;
    }
  }, [isSupported, clearHeartbeat]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text) return;

      lastTextRef.current = text;

      stop();

      const cleanText = cleanTextForSpeech(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = targetLangTag;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Find best voice match from current voices
      const currentVoices = window.speechSynthesis.getVoices();
      const voice =
        currentVoices.find(
          (v) => v.lang.toLowerCase().replace("_", "-") === targetLangTag.toLowerCase()
        ) ||
        (agriLang === "bn"
          ? currentVoices.find((v) => v.lang.toLowerCase().replace("_", "-") === "bn-bd")
          : null) ||
        currentVoices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
        currentVoices.find(
          (v) =>
            v.name.toLowerCase().includes(langPrefix) ||
            (agriLang === "hi" && (v.name.includes("Hindi") || v.name.includes("हिन्दी"))) ||
            (agriLang === "bn" && (v.name.includes("Bengali") || v.name.includes("বাংলা") || v.name.includes("Bangla")))
        );

      if (voice) {
        utterance.voice = voice;
      }

      // Keep utterance reference alive to prevent Chromium garbage collection bug
      activeUtteranceRef.current = utterance;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);

        // Chromium 15-second speech pause bug workaround:
        // Periodically pause and resume to keep speech active
        clearHeartbeat();
        heartbeatRef.current = setInterval(() => {
          if (typeof window !== "undefined" && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 10000);
      };

      utterance.onend = () => {
        clearHeartbeat();
        setIsSpeaking(false);
        setIsPaused(false);
        activeUtteranceRef.current = null;
      };

      utterance.onerror = () => {
        clearHeartbeat();
        setIsSpeaking(false);
        setIsPaused(false);
        activeUtteranceRef.current = null;
      };

      utterance.onpause = () => setIsPaused(true);
      utterance.onresume = () => setIsPaused(false);

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        clearHeartbeat();
        setIsSpeaking(false);
        activeUtteranceRef.current = null;
      }
    },
    [isSupported, targetLangTag, langPrefix, agriLang, stop, clearHeartbeat]
  );

  const pause = useCallback(() => {
    if (isSupported && isSpeaking && !isPaused) {
      try {
        window.speechSynthesis.pause();
        setIsPaused(true);
      } catch {}
    }
  }, [isSupported, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      try {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } catch {}
    }
  }, [isSupported, isPaused]);

  const replay = useCallback(
    (text?: string) => {
      const target = text || lastTextRef.current;
      if (target) {
        speak(target);
      }
    },
    [speak]
  );

  return {
    isSpeaking,
    isPaused,
    isSupported,
    hasVoiceForLanguage,
    speak,
    pause,
    resume,
    stop,
    replay,
  };
}
