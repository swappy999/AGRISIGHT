import { useState, useCallback, useRef, useEffect } from "react";
import { LANGUAGE_CONFIG, Language } from "@/translations";

export type SpeechInputState =
  | "idle"
  | "requesting"
  | "listening"
  | "processing"
  | "captured"
  | "denied"
  | "no_speech"
  | "network_error"
  | "unsupported"
  | "error";

interface UseSpeechInputReturn {
  transcript: string;
  interimTranscript: string;
  state: SpeechInputState;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
  setTranscript: (text: string) => void;
}

const MAX_SESSION_DURATION_MS = 30000; // 30s session cap to avoid accidental continuous listening
const INITIAL_SILENCE_TIMEOUT_MS = 10000; // 10s initial silence before auto-stop
const TRAILING_SILENCE_TIMEOUT_MS = 5000; // 5s silence after speaking before auto-stop

export function useSpeechInput(agriLang: string = "en"): UseSpeechInputReturn {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [state, setState] = useState<SpeechInputState>("idle");

  const stateRef = useRef<SpeechInputState>("idle");
  const recognitionRef = useRef<any | null>(null);
  const isManualStopRef = useRef(false);
  const restartCountRef = useRef(0);
  const accumulatedFinalRef = useRef("");
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const clearAllTimeouts = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  // Sync ref with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // If language changes while listening, cleanly reset
  useEffect(() => {
    if (recognitionRef.current && (stateRef.current === "listening" || stateRef.current === "requesting")) {
      isManualStopRef.current = true;
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
      clearAllTimeouts();
      setState("idle");
    }
  }, [agriLang, clearAllTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isManualStopRef.current = true;
      clearAllTimeouts();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [clearAllTimeouts]);

  const stopListening = useCallback(() => {
    isManualStopRef.current = true;
    clearAllTimeouts();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    }
    setState("captured");
    setInterimTranscript("");
  }, [clearAllTimeouts]);

  const reset = useCallback(() => {
    isManualStopRef.current = true;
    clearAllTimeouts();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    accumulatedFinalRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setState("idle");
  }, [clearAllTimeouts]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setState("unsupported");
      return;
    }

    clearAllTimeouts();

    // Check media permission first to avoid silent browser rejection
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setState("denied");
          return;
        }
      }
    }

    isManualStopRef.current = false;
    restartCountRef.current = 0;
    accumulatedFinalRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setState("requesting");

    // Abort any previous instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const SpeechRecognitionCtor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      const recognition = new SpeechRecognitionCtor();
      recognition.lang = LANGUAGE_CONFIG[agriLang as Language]?.speech || "en-IN";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setState("listening");
        restartCountRef.current = 0;

        // Auto-terminate session after 30 seconds max to prevent continuous background listening
        sessionTimeoutRef.current = setTimeout(() => {
          stopListening();
        }, MAX_SESSION_DURATION_MS);

        // Auto-terminate if initial silence persists for 10 seconds
        silenceTimeoutRef.current = setTimeout(() => {
          stopListening();
        }, INITIAL_SILENCE_TIMEOUT_MS);
      };

      recognition.onresult = (event: any) => {
        let currentFinal = "";
        let currentInterim = "";

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || "";
          if (item.isFinal) {
            currentFinal += (currentFinal ? " " : "") + text.trim();
          } else {
            currentInterim += (currentInterim ? " " : "") + text.trim();
          }
        }

        accumulatedFinalRef.current = currentFinal;
        const combined = currentFinal
          ? currentInterim
            ? `${currentFinal} ${currentInterim}`
            : currentFinal
          : currentInterim;

        setTranscript(combined);
        setInterimTranscript(currentInterim);

        // Reset trailing silence timeout on speech detected
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = setTimeout(() => {
          stopListening();
        }, TRAILING_SILENCE_TIMEOUT_MS);
      };

      recognition.onerror = (event: any) => {
        const err = event.error;
        if (err === "not-allowed" || err === "service-not-allowed" || err === "audio-capture") {
          isManualStopRef.current = true;
          clearAllTimeouts();
          setState("denied");
        } else if (err === "no-speech") {
          // Handled gracefully via timeouts
        } else if (err === "network") {
          clearAllTimeouts();
          setState("network_error");
        } else if (err !== "aborted") {
          clearAllTimeouts();
          setState("error");
        }
      };

      recognition.onend = () => {
        clearAllTimeouts();
        // If user did not manually stop and we were still in active listening mode,
        // restart up to 2 times to prevent premature browser cutoff.
        if (
          !isManualStopRef.current &&
          (stateRef.current === "listening" || stateRef.current === "requesting") &&
          restartCountRef.current < 2
        ) {
          restartCountRef.current += 1;
          try {
            recognition.start();
            return;
          } catch {}
        }

        setInterimTranscript("");
        setState((prev) =>
          prev === "listening" || prev === "requesting" || prev === "processing"
            ? "captured"
            : prev
        );
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      clearAllTimeouts();
      setState("error");
    }
  }, [isSupported, agriLang, clearAllTimeouts, stopListening]);

  return {
    transcript,
    interimTranscript,
    state,
    isSupported,
    startListening,
    stopListening,
    reset,
    setTranscript,
  };
}
