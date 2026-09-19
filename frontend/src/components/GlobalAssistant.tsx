"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTranslation, Language, LANGUAGE_CONFIG } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { useSpeechOutput } from "@/hooks/useSpeechOutput";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  isGrounded?: boolean;
  confidenceTier?: string;
  evidencePoints?: string[];
  whyExplanation?: string;
  moreDetails?: string;
  suggestedActions?: string[];
  timestamp: Date;
  error?: boolean;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Context-Aware Prompts Generator ───────────────────────────────────────────
function getContextPrompts(pathname: string, lang: Language): { icon: string; text: string }[] {
  if (pathname.includes("/crops/")) {
    if (lang === "bn") {
      return [
        { icon: "trending_up", text: "এই ফসলের স্বাস্থ্য কি উন্নতি হচ্ছে?" },
        { icon: "medication", text: "এই ফসলের জন্য প্রস্তাবিত চিকিৎসা কী?" },
        { icon: "calendar_month", text: "পরবর্তী স্ক্যান কখন করা উচিত?" },
      ];
    }
    if (lang === "hi") {
      return [
        { icon: "trending_up", text: "क्या इस फसल के स्वास्थ्य में सुधार हो रहा है?" },
        { icon: "medication", text: "इस फसल के लिए अनुशंसित उपचार क्या है?" },
        { icon: "calendar_month", text: "अगला स्कैन कब करना चाहिए?" },
      ];
    }
    return [
      { icon: "trending_up", text: "Is this crop's health improving?" },
      { icon: "medication", text: "What is the recommended treatment for this crop?" },
      { icon: "calendar_month", text: "When should I perform the next scan?" },
    ];
  }

  if (pathname.includes("/fields")) {
    if (lang === "bn") {
      return [
        { icon: "landscape", text: "এই জমিতে সক্রিয় কোনো রোগের ঝুঁকি আছে কি?" },
        { icon: "water_drop", text: "বর্তমান আবহাওয়ায় সেচ ব্যবস্থা কেমন রাখা উচিত?" },
        { icon: "checklist", text: "এই জমির প্রধান করণীয় পদক্ষেপ কী?" },
      ];
    }
    if (lang === "hi") {
      return [
        { icon: "landscape", text: "क्या इस खेत में कोई सक्रिय रोग जोखिम है?" },
        { icon: "water_drop", text: "वर्तमान मौसम में सिंचाई प्रबंधन कैसे करें?" },
        { icon: "checklist", text: "इस खेत के लिए मुख्य कदम क्या हैं?" },
      ];
    }
    return [
      { icon: "landscape", text: "Are there active disease hotspots in this field?" },
      { icon: "water_drop", text: "How should I manage irrigation in current weather?" },
      { icon: "checklist", text: "What are the priority field actions?" },
    ];
  }

  if (pathname.includes("/analysis/") || pathname.includes("/scan")) {
    if (lang === "bn") {
      return [
        { icon: "coronavirus", text: "এই পাতার রোগ নির্ণয় সহজ ভাষায় বুঝিয়ে বলুন।" },
        { icon: "bolt", text: "আমাকে অবিলম্বে কী পদক্ষেপ নিতে হবে?" },
        { icon: "shield", text: "অন্যান্য পাতায় রোগ ছড়ানো কীভাবে রোধ করব?" },
      ];
    }
    if (lang === "hi") {
      return [
        { icon: "coronavirus", text: "इस पत्ती के रोग निदान को सरल भाषा में समझाएं।" },
        { icon: "bolt", text: "मुझे तुरंत क्या कदम उठाने चाहिए?" },
        { icon: "shield", text: "अन्य पौधों में संक्रमण फैलने से कैसे रोकें?" },
      ];
    }
    return [
      { icon: "coronavirus", text: "Explain this leaf diagnosis in simple terms." },
      { icon: "bolt", text: "What immediate action should I take right now?" },
      { icon: "shield", text: "How do I prevent this pathogen from spreading?" },
    ];
  }

  // Default Dashboard Prompts
  if (lang === "bn") {
    return [
      { icon: "warning", text: "আজ কোন ফসলের দিকে বিশেষ নজর দেওয়া দরকার?" },
      { icon: "radar", text: "আমার খামারে সামগ্রিক রোগ ঝুঁকি কেমন?" },
      { icon: "checklist", text: "আজকের জন্য অগ্রাধিকারমূলক কৃষি পদক্ষেপ কী?" },
    ];
  }
  if (lang === "hi") {
    return [
      { icon: "warning", text: "आज किन फसलों पर तुरंत ध्यान देने की आवश्यकता है?" },
      { icon: "radar", text: "मेरे खेत में समग्र रोग जोखिम की स्थिति क्या है?" },
      { icon: "checklist", text: "आज के लिए प्राथमिकता कृषि कदम क्या हैं?" },
    ];
  }
  return [
    { icon: "warning", text: "Which of my crops require attention today?" },
    { icon: "radar", text: "What is my farm's overall disease risk status?" },
    { icon: "checklist", text: "What are my priority farming actions for today?" },
  ];
}

export function GlobalAssistant() {
  const { t, language, setLanguage } = useTranslation();
  const { user } = useAuth();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [autoPlayVoice, setAutoPlayVoice] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const toggleDetails = (msgId: string) => {
    setExpandedDetails((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const speechInput = useSpeechInput(language);
  const speechOutput = useSpeechOutput(language);

  // Connectivity detection
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Sync speech input transcript into input textarea
  useEffect(() => {
    if (speechInput.transcript) {
      setInput(speechInput.transcript);
    }
  }, [speechInput.transcript]);

  // Auto-scroll when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking, isOpen]);

  // Welcome message when opened (localized to current language)
  useEffect(() => {
    if (user && (messages.length === 0 || (messages.length === 1 && messages[0].role === "assistant"))) {
      const welcome =
        language === "bn"
          ? "নমস্কার! আমি এগ্রিসাইট এআই — আপনার বুদ্ধিমান কৃষি সহকারী। আপনার ফসল, জমি বা রোগের লক্ষণ সম্পর্কে যেকোনো প্রশ্ন জিজ্ঞাসা করুন।"
          : language === "hi"
          ? "नमस्ते! मैं एग्रीसाइट एआई हूँ — आपका कृषि निर्णय सलाहकार। अपनी फसलों, खेतों या रोग के लक्षणों के बारे में कोई भी प्रश्न पूछें।"
          : "Hello! I'm AgriSight AI — your agricultural decision advisor. Ask me anything about your crops, fields, disease risks, or treatments.";

      setMessages([
        {
          id: uid(),
          role: "assistant",
          text: welcome,
          isGrounded: true,
          confidenceTier: "High",
          timestamp: new Date(),
        },
      ]);
    }
  }, [user, language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handlePlayVoice = (msgId: string, text: string) => {
    if (playingMessageId === msgId && speechOutput.isSpeaking) {
      speechOutput.stop();
      setPlayingMessageId(null);
    } else {
      speechOutput.stop();
      setPlayingMessageId(msgId);
      speechOutput.speak(text);
    }
  };

  // Reset playing ID when speech finishes
  useEffect(() => {
    if (!speechOutput.isSpeaking) {
      setPlayingMessageId(null);
    }
  }, [speechOutput.isSpeaking]);

  const handleToggleVoice = () => {
    if (showVoice) {
      speechInput.stopListening();
      speechInput.reset();
      setShowVoice(false);
    } else {
      setShowVoice(true);
      speechInput.reset();
      speechInput.startListening();
    }
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      const userMsg: AssistantMessage = {
        id: uid(),
        role: "user",
        text: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      speechInput.reset();
      setShowVoice(false);
      setIsThinking(true);

      try {
        const result = await api.assistantChat(trimmed, language);
        const newMsgId = uid();
        const aiMsg: AssistantMessage = {
          id: newMsgId,
          role: "assistant",
          text: result.answer,
          isGrounded: result.is_grounded,
          confidenceTier: result.confidence_tier,
          evidencePoints: result.evidence_points,
          whyExplanation: result.why_explanation,
          moreDetails: result.more_details || result.why_explanation,
          suggestedActions: result.suggested_actions,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Auto-play voice readout if enabled
        if (autoPlayVoice && result.answer) {
          setPlayingMessageId(newMsgId);
          speechOutput.speak(result.answer);
        }
      } catch (err: any) {
        const errMsg: AssistantMessage = {
          id: uid(),
          role: "assistant",
          text:
            err.message ||
            (language === "bn"
              ? "আমি এই মুহূর্তে উত্তর দিতে পারছি না। দয়া করে আবার চেষ্টা করুন।"
              : language === "hi"
              ? "मैं अभी इसका उत्तर नहीं दे पा रहा हूँ। कृपया फिर से प्रयास करें।"
              : "I couldn't process your question right now. Please try again."),
          error: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsThinking(false);
        inputRef.current?.focus();
      }
    },
    [isThinking, isOnline, language, speechInput, autoPlayVoice, speechOutput]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Don't display floating launcher on dedicated full-screen /assistant route or active /scan page
  if (pathname === "/assistant" || pathname === "/scan") {
    return null;
  }

  const contextPrompts = getContextPrompts(pathname, language);

  return (
    <>
      {/* ── Floating Launcher Trigger ── */}
      <div className="fixed bottom-[6.5rem] sm:bottom-6 right-4 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? t("closeAssistant") : t("openAssistant")}
          className={`flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full shadow-2xl transition-all duration-300 font-extrabold text-xs sm:text-sm active:scale-95 group ${
            isOpen
              ? "bg-on-surface text-surface ring-2 ring-primary/40 shadow-primary/20"
              : "bg-primary text-on-primary shadow-primary/30 hover:shadow-primary/50 hover:scale-105"
          }`}
        >
          <span
            className={`material-symbols-outlined text-xl sm:text-2xl transition-transform duration-300 ${
              isOpen ? "rotate-90" : "group-hover:rotate-12"
            }`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isOpen ? "close" : "smart_toy"}
          </span>
          <span className="hidden sm:inline">
            {isOpen ? t("closeAssistant") : t("askAgriSight")}
          </span>
          {!isOpen && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          )}
        </button>
      </div>

      {/* ── Assistant Panel / Bottom Sheet ── */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("aiAssistant")}
          className="fixed inset-x-0 bottom-0 sm:bottom-24 sm:right-6 sm:left-auto sm:w-[440px] z-50 flex flex-col bg-surface/98 backdrop-blur-2xl border border-outline-variant/30 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-black/25 overflow-hidden animate-in slide-in-from-bottom-5 duration-300 max-h-[85vh] sm:max-h-[640px] h-[82vh] sm:h-[620px]"
        >
          {/* Header */}
          <div className="bg-surface-container-low/80 px-5 py-3.5 border-b border-outline-variant/20 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  smart_toy
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-on-surface truncate leading-tight">
                  {t("askAgriSight")}
                </h3>
                <p className="text-[10px] text-on-surface-variant font-semibold flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  {language === "bn"
                    ? "বাংলা কৃষি সহকারী"
                    : language === "hi"
                    ? "हिन्दी कृषि सलाहकार"
                    : "Grounded AI Copilot"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Language Switcher */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                aria-label="Change assistant language"
                className="bg-surface-container-high rounded-full px-2.5 py-1 text-[11px] font-extrabold text-on-surface cursor-pointer outline-none border border-outline-variant/30 hover:bg-surface-container-highest transition-colors"
              >
                <option value="en">EN</option>
                <option value="hi">हि</option>
                <option value="bn">বা</option>
              </select>

              {/* Auto-play toggle */}
              <button
                type="button"
                onClick={() => setAutoPlayVoice((v) => !v)}
                title={autoPlayVoice ? "Auto-play Audio: ON" : "Auto-play Audio: OFF"}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
                  autoPlayVoice
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {autoPlayVoice ? "volume_up" : "volume_off"}
                </span>
              </button>

              {/* Clear chat */}
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  aria-label={t("clearChat")}
                  title={t("clearChat")}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">delete_sweep</span>
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t("closeAssistant")}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Offline Warning Banner */}
          {!isOnline && (
            <div className="bg-amber-500/15 border-b border-amber-500/25 px-4 py-2 flex items-center gap-2 text-amber-800 text-xs font-semibold shrink-0">
              <span className="material-symbols-outlined text-sm">wifi_off</span>
              <span>{t("offlineWarning")}</span>
            </div>
          )}

          {/* Conversation Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Initial Welcome & Quick Prompts */}
            {messages.length === 0 && (
              <div className="space-y-4 py-2">
                <div className="text-center space-y-1.5 py-3 bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      smart_toy
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-on-surface">
                    {t("askAgriSight")}
                  </h4>
                  <p className="text-xs font-semibold text-on-surface-variant">
                    {language === "bn"
                      ? "আপনার ফসল, রোগবালাই, সেচ বা আবহাওয়া সম্পর্কে যেকোনো প্রশ্ন করুন।"
                      : language === "hi"
                      ? "अपनी फसल, रोग, सिंचाई या मौसम के बारे में कुछ भी पूछें।"
                      : "Ask anything about your crops, diseases, irrigation, or weather."}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest px-1">
                    <span className="material-symbols-outlined text-xs">auto_awesome</span>
                    <span>{t("suggestedQuestions")}</span>
                  </div>
                  <div className="space-y-1.5">
                    {contextPrompts.map(({ icon, text }) => (
                      <button
                        key={text}
                        type="button"
                        onClick={() => sendMessage(text)}
                        className="w-full flex items-center gap-2.5 bg-surface-container-lowest hover:bg-primary/10 border border-outline-variant/15 hover:border-primary/30 rounded-2xl p-3 text-left transition-all group shadow-sm text-xs font-bold text-on-surface hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-primary text-sm shrink-0">
                          {icon}
                        </span>
                        <span className="line-clamp-2 leading-tight">{text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const isPlaying = playingMessageId === msg.id && speechOutput.isSpeaking;
              const isExpanded = expandedDetails[msg.id] || false;

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] bg-primary text-on-primary rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-sm">
                      <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              }

              // Assistant message (Crisp Mode per Section 11 of a4.md)
              return (
                <div key={msg.id} className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      smart_toy
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Badge Strip */}
                    {!msg.error && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {msg.isGrounded ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-500/20">
                            <span
                              className="material-symbols-outlined text-[10px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              verified
                            </span>
                            {t("groundedBadge")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded-full text-[9px] font-black uppercase tracking-wider border border-outline-variant/30">
                            <span className="material-symbols-outlined text-[10px]">
                              auto_awesome
                            </span>
                            {t("guidanceBadge")}
                          </span>
                        )}

                        {/* Speaker TTS button */}
                        <button
                          type="button"
                          onClick={() => handlePlayVoice(msg.id, msg.text)}
                          title={isPlaying ? t("stopSpeaking") : !speechOutput.hasVoiceForLanguage ? t("ttsVoiceUnavailable") : t("speak")}
                          aria-label={isPlaying ? t("stopSpeaking") : t("speak")}
                          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border transition-all active:scale-95 ${
                            isPlaying
                              ? "bg-primary text-on-primary border-primary shadow-sm animate-pulse"
                              : "bg-surface-container-high text-on-surface hover:bg-primary/15 hover:text-primary border-outline-variant/20"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[11px]">
                            {isPlaying ? "stop" : "volume_up"}
                          </span>
                          <span>{isPlaying ? t("stopSpeaking") : t("speak")}</span>
                          {!speechOutput.hasVoiceForLanguage && !isPlaying && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                              title={t("ttsVoiceUnavailable")}
                            />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Crisp Bubble Content */}
                    <div
                      className={`rounded-2xl rounded-tl-xs p-3.5 shadow-sm text-xs sm:text-sm leading-relaxed space-y-2.5 ${
                        msg.error
                          ? "bg-rose-500/10 border border-rose-500/20 text-rose-900"
                          : "bg-surface-container-lowest border border-outline-variant/20 text-on-surface"
                      }`}
                    >
                      {/* 1. Concise Gist */}
                      <p className="font-semibold whitespace-pre-line leading-relaxed">
                        {msg.text}
                      </p>

                      {/* 2. Action Checklist (1-2-3 Actions) */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="pt-2 border-t border-outline-variant/15 space-y-1.5">
                          <strong className="block text-[10px] uppercase tracking-wider font-black text-on-surface-variant">
                            {language === "bn" ? "আজকের পদক্ষেপ:" : language === "hi" ? "आज के कदम:" : "Today's Actions:"}
                          </strong>
                          <div className="space-y-1">
                            {msg.suggestedActions.slice(0, 3).map((act, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs font-semibold text-on-surface">
                                <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span>{act}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Progressive Disclosure Toggle: More Details Button */}
                      {(msg.moreDetails || msg.whyExplanation) && (
                        <div className="pt-1.5">
                          <button
                            type="button"
                            onClick={() => toggleDetails(msg.id)}
                            className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">
                              {isExpanded ? "expand_less" : "expand_more"}
                            </span>
                            <span>{isExpanded ? t("lessDetails") : t("moreDetails")}</span>
                          </button>

                          {/* Expanded Deep Details */}
                          {isExpanded && (
                            <div className="mt-2 p-3 bg-surface-container-high/60 rounded-xl space-y-2 border border-outline-variant/20 animate-in fade-in duration-200">
                              {msg.whyExplanation && (
                                <div className="space-y-0.5 text-xs text-on-surface">
                                  <strong className="block text-[9px] uppercase tracking-wider font-black text-primary">
                                    {t("decisionRationale")}:
                                  </strong>
                                  <p className="font-medium text-[11px] leading-relaxed">
                                    {msg.whyExplanation}
                                  </p>
                                </div>
                              )}

                              {msg.moreDetails && msg.moreDetails !== msg.whyExplanation && (
                                <div className="space-y-0.5 text-xs text-on-surface pt-1 border-t border-outline-variant/15">
                                  <strong className="block text-[9px] uppercase tracking-wider font-black text-on-surface-variant">
                                    {language === "bn" ? "বিস্তারিত ব্যাখ্যা:" : language === "hi" ? "विस्तृत विवरण:" : "Detailed Analysis:"}
                                  </strong>
                                  <p className="font-medium text-[11px] leading-relaxed">
                                    {msg.moreDetails}
                                  </p>
                                </div>
                              )}

                              {/* Evidence Points */}
                              {msg.evidencePoints && msg.evidencePoints.length > 0 && (
                                <div className="pt-1 border-t border-outline-variant/15 flex flex-wrap gap-1 items-center">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant/60 mr-1">
                                    {t("evidence")}:
                                  </span>
                                  {msg.evidencePoints.map((pt, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 bg-surface-container-lowest text-on-surface-variant text-[10px] font-bold rounded-md border border-outline-variant/20"
                                    >
                                      {pt}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Contextual Action Chips (Section 13 in a4.md) */}
                    {!msg.error && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => sendMessage(language === "bn" ? "কেন এমন হচ্ছে?" : language === "hi" ? "ऐसा क्यों हो रहा है?" : "Why is this happening?")}
                          className="px-2.5 py-1 bg-surface-container-high hover:bg-primary/15 hover:text-primary border border-outline-variant/20 text-on-surface text-[10px] font-bold rounded-lg transition-all"
                        >
                          {t("btnWhy")}
                        </button>

                        <button
                          type="button"
                          onClick={() => sendMessage(language === "bn" ? "আমার অবিলম্বে কী করা উচিত?" : language === "hi" ? "मुझे तुरंत क्या करना चाहिए?" : "What immediate action should I take?")}
                          className="px-2.5 py-1 bg-surface-container-high hover:bg-primary/15 hover:text-primary border border-outline-variant/20 text-on-surface text-[10px] font-bold rounded-lg transition-all"
                        >
                          {t("btnWhatToDo")}
                        </button>

                        <button
                          type="button"
                          onClick={() => sendMessage(language === "bn" ? "এর জন্য আইপিএম (IPM) বা জৈব প্রতিরোধ কী?" : language === "hi" ? "इसके लिए आईपीएम (IPM) या जैविक रोकथाम क्या है?" : "Explain IPM and non-chemical prevention for this.")}
                          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-500/20 text-[10px] font-bold rounded-lg transition-all"
                        >
                          {t("btnIpm")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex gap-2.5 items-center animate-in fade-in">
                <div className="w-7 h-7 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0 animate-pulse">
                  <span className="material-symbols-outlined text-base">smart_toy</span>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl rounded-tl-xs px-3.5 py-2 flex items-center gap-1.5">
                  <span className="text-xs font-bold text-on-surface-variant">
                    {t("thinking")}
                  </span>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Bar ── */}
          <div
            className="bg-surface-container-low/80 p-3 border-t border-outline-variant/20 space-y-2 shrink-0"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          >
            {/* Voice input banner */}
            {showVoice && (
              <div className="bg-surface-container-high rounded-2xl p-2.5 border border-outline-variant/30 space-y-2 text-xs shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {speechInput.state === "listening" ? (
                      <button
                        type="button"
                        onClick={speechInput.stopListening}
                        aria-label={t("stopListening")}
                        className="relative w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-sm shrink-0 active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined text-base">stop_circle</span>
                        <span className="absolute inset-0 rounded-full border-2 border-rose-600 animate-ping opacity-60" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          speechInput.reset();
                          speechInput.startListening();
                        }}
                        aria-label={t("voiceInputTitle")}
                        className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm shrink-0 hover:bg-primary/90 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">mic</span>
                      </button>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded-full bg-primary/15 text-primary text-[9px] font-black uppercase tracking-wider">
                          {LANGUAGE_CONFIG[language]?.speech}
                        </span>
                        <span className="text-[10px] font-extrabold text-on-surface truncate">
                          {LANGUAGE_CONFIG[language]?.nativeName}
                        </span>
                        <VoiceVisualizer state={speechInput.state} barCount={4} />
                      </div>
                      <p
                        className={`font-semibold truncate mt-0.5 ${
                          speechInput.state === "listening"
                            ? "text-rose-600 font-bold animate-pulse"
                            : speechInput.state === "denied"
                            ? "text-error font-extrabold"
                            : speechInput.state === "network_error"
                            ? "text-amber-700 font-bold"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {speechInput.state === "listening"
                          ? t("listeningInLanguage", { lang: LANGUAGE_CONFIG[language]?.nativeName })
                          : speechInput.state === "denied"
                          ? t("micPermissionDenied")
                          : speechInput.state === "network_error"
                          ? t("speechNetworkError")
                          : !speechInput.isSupported
                          ? t("voiceNotSupported")
                          : t("speakNowPrompt")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {speechInput.transcript && (
                      <button
                        type="button"
                        onClick={() => {
                          speechInput.reset();
                          setInput("");
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors"
                        title={t("clearVoiceInput")}
                      >
                        {t("clearVoiceInput")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        speechInput.stopListening();
                        speechInput.reset();
                        setShowVoice(false);
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                      aria-label="Close voice panel"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                </div>

                {/* Live transcript preview */}
                {(speechInput.transcript || speechInput.interimTranscript) && (
                  <div className="bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/15 text-[11px] text-on-surface font-semibold leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex-1">
                      <span>{speechInput.transcript}</span>
                      {speechInput.interimTranscript && (
                        <span className="italic opacity-60 font-medium"> {speechInput.interimTranscript}</span>
                      )}
                    </div>
                    {speechInput.transcript && (
                      <button
                        type="button"
                        onClick={() => sendMessage(speechInput.transcript)}
                        disabled={isThinking}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-on-primary rounded-lg text-[10px] font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all self-end sm:self-auto shrink-0"
                      >
                        <span>{t("askButton")}</span>
                        <span className="material-symbols-outlined text-xs">send</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* Mic toggle with fallback */}
              {speechInput.isSupported ? (
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  aria-label={t("voiceInputTitle")}
                  title={t("voiceInputTitle")}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                    showVoice
                      ? "bg-primary text-on-primary shadow-sm scale-105"
                      : "bg-surface-container-highest text-on-surface-variant hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ fontVariationSettings: showVoice ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    mic
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title={t("voiceNotSupported")}
                  aria-label={t("voiceNotSupported")}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 bg-surface-container-highest text-on-surface-variant/30 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">mic_off</span>
                </button>
              )}

              {/* Input textarea */}
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder={t("typeYourQuestion")}
                  disabled={isThinking || !isOnline}
                  className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed transition-all"
                  style={{ minHeight: "38px", maxHeight: "100px" }}
                />
              </div>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isThinking || !isOnline}
                aria-label={t("askButton")}
                className="w-9 h-9 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
              >
                {isThinking ? (
                  <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">send</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
