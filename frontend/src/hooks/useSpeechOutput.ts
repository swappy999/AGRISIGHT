import { useState, useCallback, useEffect, useRef } from "react";
import { LANGUAGE_CONFIG, Language } from "@/translations";
import { getFastApiUrl } from "@/lib/apiClient";

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
    .replace(/^\s*[-*•▪]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    // Remove bold and italic markers (*), convert underscores to spaces for natural speech
    .replace(/\*{1,3}/g, "")
    .replace(/_+/g, " ")
    // Remove table borders
    .replace(/\|+/g, " ")
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
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackModeRef = useRef<"synth" | "audio" | null>(null);

  const isBrowserSpeechSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const isSupported =
    typeof window !== "undefined" &&
    (isBrowserSpeechSupported || typeof Audio !== "undefined");

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Load and update voices on mount and voice change events
  useEffect(() => {
    if (!isBrowserSpeechSupported) return;

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
      if (activeAudioRef.current) {
        try {
          activeAudioRef.current.pause();
          activeAudioRef.current.src = "";
        } catch {}
        activeAudioRef.current = null;
      }
    };
  }, [isBrowserSpeechSupported, clearHeartbeat]);

  const targetLangTag = LANGUAGE_CONFIG[agriLang as Language]?.tts || "en-IN";
  const langPrefix = targetLangTag.split("-")[0].toLowerCase();

  // Match native browser voice by tag, prefix, or name
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

  // Stop all active audio playback (both Web Speech API and HTML5 Audio)
  const stop = useCallback(() => {
    clearHeartbeat();

    // 1. Stop SpeechSynthesis
    if (isBrowserSpeechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    activeUtteranceRef.current = null;

    // 2. Stop HTML5 Audio
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current.src = "";
      } catch {}
      activeAudioRef.current = null;
    }

    playbackModeRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isBrowserSpeechSupported, clearHeartbeat]);

  // Immediately cancel active audio/synthesis if language changes
  useEffect(() => {
    if (isBrowserSpeechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current.src = "";
      } catch {}
      activeAudioRef.current = null;
    }
    playbackModeRef.current = null;
  }, [agriLang, isBrowserSpeechSupported]);

  // Hybrid play via backend streaming audio endpoint
  const playViaBackendAudio = useCallback(
    (cleanText: string) => {
      try {
        const baseUrl = getFastApiUrl();
        const url = `${baseUrl}/tts?lang=${encodeURIComponent(agriLang)}&text=${encodeURIComponent(cleanText)}`;

        const audio = new Audio(url);
        activeAudioRef.current = audio;
        playbackModeRef.current = "audio";

        audio.onplay = () => {
          setIsSpeaking(true);
          setIsPaused(false);
        };

        audio.onended = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          activeAudioRef.current = null;
          playbackModeRef.current = null;
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          activeAudioRef.current = null;
          playbackModeRef.current = null;
        };

        audio.onpause = () => {
          if (activeAudioRef.current && !activeAudioRef.current.ended) {
            setIsPaused(true);
          }
        };

        audio.play().catch(() => {
          setIsSpeaking(false);
          setIsPaused(false);
          activeAudioRef.current = null;
          playbackModeRef.current = null;
        });
      } catch {
        setIsSpeaking(false);
        setIsPaused(false);
        activeAudioRef.current = null;
        playbackModeRef.current = null;
      }
    },
    [agriLang]
  );

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text) return;

      lastTextRef.current = text;
      stop();

      const cleanText = cleanTextForSpeech(text);
      if (!cleanText) return;

      // FOR BENGALI AND HINDI:
      // Desktop Windows/Chrome almost never has natural high-quality offline Bengali or Hindi voices installed.
      // If no native voice exists OR for superior pronunciation in Bengali/Hindi, use backend streaming TTS.
      const hasNativeVoice = Boolean(matchedVoice);

      if (agriLang === "bn" || agriLang === "hi") {
        if (!hasNativeVoice) {
          // No local browser voice installed -> use ultra-fast high-quality backend TTS
          playViaBackendAudio(cleanText);
          return;
        }
      }

      // If browser synthesis is available and we have a suitable voice (or for English)
      if (isBrowserSpeechSupported) {
        try {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = targetLangTag;
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }

          playbackModeRef.current = "synth";
          activeUtteranceRef.current = utterance;

          utterance.onstart = () => {
            setIsSpeaking(true);
            setIsPaused(false);

            // Chromium 15-second speech pause bug workaround
            clearHeartbeat();
            heartbeatRef.current = setInterval(() => {
              if (
                typeof window !== "undefined" &&
                window.speechSynthesis.speaking &&
                !window.speechSynthesis.paused
              ) {
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
            playbackModeRef.current = null;
          };

          utterance.onerror = (e) => {
            clearHeartbeat();
            activeUtteranceRef.current = null;
            // If browser speech synthesis failed (e.g. language-unavailable), seamless fallback to backend audio!
            if (e.error === "language-unavailable" || e.error === "voice-unavailable" || agriLang !== "en") {
              playViaBackendAudio(cleanText);
            } else {
              setIsSpeaking(false);
              setIsPaused(false);
              playbackModeRef.current = null;
            }
          };

          utterance.onpause = () => setIsPaused(true);
          utterance.onresume = () => setIsPaused(false);

          window.speechSynthesis.speak(utterance);
          return;
        } catch {
          // Fallback to backend audio
          playViaBackendAudio(cleanText);
          return;
        }
      }

      // If speech synthesis not supported at all, play via backend audio
      playViaBackendAudio(cleanText);
    },
    [
      isSupported,
      isBrowserSpeechSupported,
      matchedVoice,
      targetLangTag,
      agriLang,
      stop,
      clearHeartbeat,
      playViaBackendAudio,
    ]
  );

  const pause = useCallback(() => {
    if (!isSpeaking || isPaused) return;

    if (playbackModeRef.current === "audio" && activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        setIsPaused(true);
      } catch {}
    } else if (playbackModeRef.current === "synth" && isBrowserSpeechSupported) {
      try {
        window.speechSynthesis.pause();
        setIsPaused(true);
      } catch {}
    }
  }, [isSpeaking, isPaused, isBrowserSpeechSupported]);

  const resume = useCallback(() => {
    if (!isPaused) return;

    if (playbackModeRef.current === "audio" && activeAudioRef.current) {
      try {
        activeAudioRef.current.play();
        setIsPaused(false);
      } catch {}
    } else if (playbackModeRef.current === "synth" && isBrowserSpeechSupported) {
      try {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } catch {}
    }
  }, [isPaused, isBrowserSpeechSupported]);

  const replay = useCallback(
    (text?: string) => {
      const target = text || lastTextRef.current;
      if (target) {
        speak(target);
      }
    },
    [speak]
  );

  // Since backend streaming TTS is 100% available for en, hi, and bn, voice is ALWAYS available!
  const hasVoiceForLanguage = true;

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
