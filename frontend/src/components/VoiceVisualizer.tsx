"use client";

import React from "react";
import { SpeechInputState } from "@/hooks/useSpeechInput";

interface VoiceVisualizerProps {
  state: SpeechInputState;
  className?: string;
  barCount?: number;
}

export function VoiceVisualizer({ state, className = "", barCount = 5 }: VoiceVisualizerProps) {
  const isListening = state === "listening";
  const isError = state === "denied" || state === "error" || state === "network_error";
  const isRequesting = state === "requesting";

  return (
    <div
      className={`inline-flex items-center justify-center gap-1 h-6 px-2 py-0.5 rounded-full ${
        isListening
          ? "bg-rose-500/10 border border-rose-500/25"
          : isError
          ? "bg-error-container/40 border border-error/20"
          : "bg-surface-container-high border border-outline-variant/15"
      } ${className}`}
      aria-label={`Voice input status: ${state}`}
    >
      {Array.from({ length: barCount }).map((_, idx) => {
        // Staggered heights and animation delays for realistic harmonic waveform
        const heightClasses = isListening
          ? idx === 2
            ? "h-5"
            : idx === 1 || idx === 3
            ? "h-3.5"
            : "h-2"
          : isRequesting
          ? "h-2.5 animate-pulse"
          : "h-1.5";

        const barColor = isListening
          ? "bg-rose-600 dark:bg-rose-400"
          : isError
          ? "bg-error"
          : "bg-on-surface-variant/40";

        return (
          <span
            key={idx}
            className={`w-1 rounded-full transition-all duration-300 ${heightClasses} ${barColor} ${
              isListening ? "animate-pulse" : ""
            }`}
            style={{
              animationDelay: isListening ? `${idx * 140}ms` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
