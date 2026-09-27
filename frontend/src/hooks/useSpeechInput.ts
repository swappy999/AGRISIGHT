import { useState, useCallback, useRef, useEffect } from "react";
import { LANGUAGE_CONFIG, Language } from "@/translations";
import { normalizeSpeechTranscript, logVoiceDiagnostics } from "@/lib/speechNormalization";

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

const MAX_SESSION_DURATION_MS = 25000; // 25s session cap
const INITIAL_SILENCE_TIMEOUT_MS = 8000; // 8s initial silence before auto-stop
const TRAILING_SILENCE_TIMEOUT_MS = 4000; // 4s silence after speaking before finalizing

export function useSpeechInput(agriLang: string = "en"): UseSpeechInputReturn {
  const [transcript, setTranscriptState] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [state, setState] = useState<SpeechInputState>("idle");

  // Session Protection & Race Condition Locks (Section 6, 7, 8)
  const sessionIdRef = useRef<number>(0);
  const isStartingRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);

  // Authoritative State Storage (Section 2, 3, 13)
  const finalTranscriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");

  const recognitionRef = useRef<any | null>(null);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;
      isStartingRef.current = false;
      isListeningRef.current = false;
      clearAllTimeouts();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [clearAllTimeouts]);

  // Clean stop handler (Section 9)
  const stopListening = useCallback(() => {
    logVoiceDiagnostics("STOP_REQUESTED", { sessionId: sessionIdRef.current });

    // Invalidate session so late events are rejected
    sessionIdRef.current += 1;
    isStartingRef.current = false;
    isListeningRef.current = false;
    clearAllTimeouts();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      recognitionRef.current = null;
    }

    interimTranscriptRef.current = "";
    setInterimTranscript("");

    // Authoritative final transcript deduplication
    const cleaned = normalizeSpeechTranscript(finalTranscriptRef.current);
    finalTranscriptRef.current = cleaned;
    setTranscriptState(cleaned);
    setState("captured");

    logVoiceDiagnostics("SESSION_STOPPED", { finalTranscript: cleaned });
  }, [clearAllTimeouts]);

  // Reset handler
  const reset = useCallback(() => {
    sessionIdRef.current += 1;
    isStartingRef.current = false;
    isListeningRef.current = false;
    clearAllTimeouts();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscriptState("");
    setInterimTranscript("");
    setState("idle");
  }, [clearAllTimeouts]);

  // Sync external/manual user edits with authoritative ref
  const setTranscript = useCallback((text: string) => {
    finalTranscriptRef.current = text;
    interimTranscriptRef.current = "";
    setTranscriptState(text);
    setInterimTranscript("");
  }, []);

  // Language switch handler
  useEffect(() => {
    if (isListeningRef.current || isStartingRef.current) {
      stopListening();
    }
  }, [agriLang, stopListening]);

  // Start listening handler with bulletproof duplicate and session protection
  const startListening = useCallback(async () => {
    if (!isSupported) {
      setState("unsupported");
      return;
    }

    // Prevent double start on rapid taps (Section 8)
    if (isStartingRef.current || isListeningRef.current) {
      logVoiceDiagnostics("START_IGNORED_ALREADY_ACTIVE", {
        starting: isStartingRef.current,
        listening: isListeningRef.current,
      });
      return;
    }

    isStartingRef.current = true;
    clearAllTimeouts();

    // Check media permission first
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          isStartingRef.current = false;
          setState("denied");
          return;
        }
      }
    }

    // Stop any stale recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    // Create a new, isolated recognition session (Section 6 & 7)
    sessionIdRef.current += 1;
    const currentSessionId = sessionIdRef.current;

    // Reset transcription buffers for fresh speech session
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setTranscriptState("");
    setInterimTranscript("");
    setState("requesting");

    try {
      const SpeechRecognitionCtor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      const recognition = new SpeechRecognitionCtor();
      const targetLang = LANGUAGE_CONFIG[agriLang as Language]?.speech || "en-IN";
      recognition.lang = targetLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      logVoiceDiagnostics("SESSION_START", { sessionId: currentSessionId, language: targetLang });

      recognition.onstart = () => {
        if (sessionIdRef.current !== currentSessionId) return;
        isStartingRef.current = false;
        isListeningRef.current = true;
        setState("listening");

        // Session duration safety cap
        sessionTimeoutRef.current = setTimeout(() => {
          if (sessionIdRef.current === currentSessionId) {
            stopListening();
          }
        }, MAX_SESSION_DURATION_MS);

        // Initial silence auto-stop
        silenceTimeoutRef.current = setTimeout(() => {
          if (sessionIdRef.current === currentSessionId) {
            stopListening();
          }
        }, INITIAL_SILENCE_TIMEOUT_MS);
      };

      // Proper Result Index Handling & Never Appending Cumulative Results (Section 2, 3, 13)
      recognition.onresult = (event: any) => {
        if (sessionIdRef.current !== currentSessionId) return;

        let interimText = "";

        // Process starting from event.resultIndex to avoid re-reading past events
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const chunk = result[0]?.transcript?.trim() || "";
          if (!chunk) continue;

          if (result.isFinal) {
            // Append final chunk once to the authoritative final transcript
            const existing = finalTranscriptRef.current.trim();
            finalTranscriptRef.current = existing ? `${existing} ${chunk}` : chunk;

            // Apply conservative phrase normalization to prevent recognition echo
            finalTranscriptRef.current = normalizeSpeechTranscript(finalTranscriptRef.current);
          } else {
            // Replace interim text with current in-flight speech
            interimText += (interimText ? " " : "") + chunk;
          }
        }

        interimTranscriptRef.current = interimText;

        // Display: FINAL_TRANSCRIPT + CURRENT_INTERIM_TRANSCRIPT (Section 2)
        const combined = interimText
          ? finalTranscriptRef.current
            ? `${finalTranscriptRef.current} ${interimText}`
            : interimText
          : finalTranscriptRef.current;

        setTranscriptState(combined);
        setInterimTranscript(interimText);

        logVoiceDiagnostics("RESULT_RECEIVED", {
          sessionId: currentSessionId,
          resultIndex: event.resultIndex,
          final: finalTranscriptRef.current,
          interim: interimText,
        });

        // Reset trailing silence timeout on speech detected
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = setTimeout(() => {
          if (sessionIdRef.current === currentSessionId) {
            stopListening();
          }
        }, TRAILING_SILENCE_TIMEOUT_MS);
      };

      recognition.onerror = (event: any) => {
        if (sessionIdRef.current !== currentSessionId) return;
        logVoiceDiagnostics("RECOGNITION_ERROR", { sessionId: currentSessionId, error: event.error });

        isStartingRef.current = false;
        isListeningRef.current = false;
        clearAllTimeouts();

        const err = event.error;
        if (err === "not-allowed" || err === "service-not-allowed" || err === "audio-capture") {
          setState("denied");
        } else if (err === "network") {
          setState("network_error");
        } else if (err === "no-speech") {
          // No speech detected, cleanly transition to idle or captured
          setState(finalTranscriptRef.current ? "captured" : "no_speech");
        } else if (err !== "aborted") {
          setState("error");
        }
      };

      recognition.onend = () => {
        if (sessionIdRef.current !== currentSessionId) return;
        logVoiceDiagnostics("SESSION_END", { sessionId: currentSessionId });

        isStartingRef.current = false;
        isListeningRef.current = false;
        clearAllTimeouts();

        // Clear interim
        interimTranscriptRef.current = "";
        setInterimTranscript("");

        // Finalize transcript
        const cleaned = normalizeSpeechTranscript(finalTranscriptRef.current);
        finalTranscriptRef.current = cleaned;
        setTranscriptState(cleaned);

        setState((prev) =>
          prev === "listening" || prev === "requesting" || prev === "processing"
            ? "captured"
            : prev
        );
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      logVoiceDiagnostics("START_EXCEPTION", { error: err?.message || err });
      isStartingRef.current = false;
      isListeningRef.current = false;
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
