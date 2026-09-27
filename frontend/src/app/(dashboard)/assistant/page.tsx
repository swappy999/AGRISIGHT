"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation, LANGUAGE_CONFIG } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { normalizeSpeechTranscript } from "@/lib/speechNormalization";
import { useSpeechOutput } from "@/hooks/useSpeechOutput";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
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
  retryQuery?: string;
}

// ── Tiny ID gen ───────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  onActionClick,
  onPlayVoice,
  isPlaying,
  hasVoice = true,
  isVoiceSupported = true,
  onRetry,
}: {
  msg: Message;
  onActionClick?: (actionText: string) => void;
  onPlayVoice?: (msgId: string, text: string) => void;
  isPlaying?: boolean;
  hasVoice?: boolean;
  isVoiceSupported?: boolean;
  onRetry?: () => void;
}) {
  const { t, language } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary text-on-primary rounded-[1.5rem] rounded-tr-sm px-4 py-3 shadow-sm shadow-primary/20">
          <p className="text-sm font-semibold leading-relaxed">{msg.text}</p>
        </div>
      </div>
    );
  }

  // AI message (Crisp Mode per Section 11 of a4.md)
  const lines = msg.text.split("\n").filter(Boolean);

  return (
    <div className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
        <span
          className="material-symbols-outlined text-primary text-lg"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          agriculture
        </span>
      </div>

      <div className="flex-1 min-w-0 space-y-2.5">
        {/* Confidence Tier, Grounded Badges & Voice Playback */}
        {!msg.error && (
          <div className="flex flex-wrap items-center gap-1.5">
            {msg.isGrounded ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                {t("groundedBadge")}
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-surface-container-high text-on-surface-variant rounded-full text-[10px] font-black uppercase tracking-wider border border-outline-variant/30">
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                {t("guidanceBadge")}
              </span>
            )}

            {/* Voice Readout Button */}
            {onPlayVoice && (
              <button
                type="button"
                onClick={() => onPlayVoice(msg.id, msg.text)}
                title={isPlaying ? t("stopSpeaking") : !hasVoice ? t("ttsVoiceUnavailable") : t("speak")}
                aria-label={isPlaying ? t("stopSpeaking") : t("speak")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border transition-all active:scale-95 ${
                  isPlaying
                    ? "bg-primary text-on-primary border-primary shadow-sm animate-pulse"
                    : "bg-surface-container-high text-on-surface hover:bg-primary/15 hover:text-primary border-outline-variant/20"
                }`}
              >
                <span className="material-symbols-outlined text-xs">
                  {isPlaying ? "stop" : "volume_up"}
                </span>
                <span>{isPlaying ? t("stopSpeaking") : t("speak")}</span>
                {!hasVoice && !isPlaying && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                    title={t("ttsVoiceUnavailable")}
                  />
                )}
              </button>
            )}
          </div>
        )}

        {/* Error Badge */}
        {msg.error && (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/20 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-wider">
              <span className="material-symbols-outlined text-xs">error</span>
              {t("errorOccurred")}
            </span>
          </div>
        )}

        {/* Message bubble content */}
        <div
          className={`rounded-[1.5rem] rounded-tl-sm px-5 py-4 shadow-sm space-y-3 ${
            msg.error
              ? "bg-rose-500/10 border border-rose-500/20 text-rose-900"
              : "bg-surface-container-lowest border border-outline-variant/20"
          }`}
        >
          {/* 1. Concise Answer Text */}
          <div className="space-y-1.5">
            {lines.map((line, i) => {
              const isBullet = line.trimStart().startsWith("•") || line.trimStart().startsWith("-");
              return (
                <p
                  key={i}
                  className={`text-sm leading-relaxed ${
                    isBullet
                      ? "text-on-surface-variant font-medium pl-3 border-l-2 border-primary/20 my-1"
                      : "text-on-surface font-semibold"
                  }`}
                >
                  {line}
                </p>
              );
            })}
          </div>

          {/* Error Retry Button */}
          {msg.error && onRetry && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                <span>{t("retry")}</span>
              </button>
            </div>
          )}

          {/* 2. Today's Action Checklist */}
          {msg.suggestedActions && msg.suggestedActions.length > 0 && (
            <div className="pt-2.5 border-t border-outline-variant/15 space-y-1.5">
              <strong className="block text-[10px] uppercase tracking-wider font-black text-on-surface-variant">
                {t("priorityActions")}:
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
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">
                  {isExpanded ? "expand_less" : "expand_more"}
                </span>
                <span>{isExpanded ? t("lessDetails") : t("moreDetails")}</span>
              </button>

              {/* Expanded details container */}
              {isExpanded && (
                <div className="mt-2.5 p-3.5 bg-surface-container-high/60 rounded-2xl space-y-2.5 border border-outline-variant/20 animate-in fade-in duration-200">
                  {msg.whyExplanation && (
                    <div className="space-y-0.5 text-xs text-on-surface">
                      <strong className="block text-[9px] uppercase tracking-wider font-black text-primary">
                        {t("decisionRationale")}:
                      </strong>
                      <p className="font-medium text-xs leading-relaxed">
                        {msg.whyExplanation}
                      </p>
                    </div>
                  )}

                  {msg.moreDetails && msg.moreDetails !== msg.whyExplanation && (
                    <div className="space-y-0.5 text-xs text-on-surface pt-1.5 border-t border-outline-variant/15">
                      <strong className="block text-[9px] uppercase tracking-wider font-black text-on-surface-variant">
                        {t("detailedInsight")}:
                      </strong>
                      <p className="font-medium text-xs leading-relaxed">
                        {msg.moreDetails}
                      </p>
                    </div>
                  )}

                  {/* Evidence Points */}
                  {msg.evidencePoints && msg.evidencePoints.length > 0 && (
                    <div className="pt-1.5 border-t border-outline-variant/15 flex flex-wrap gap-1 items-center">
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

        {/* Quick Follow-up Action Chips */}
        {!msg.error && onActionClick && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => onActionClick(language === "bn" ? "কেন এমন হচ্ছে?" : language === "hi" ? "ऐसा क्यों हो रहा है?" : "Why is this happening?")}
              className="px-3 py-1 bg-surface-container-high hover:bg-primary/15 hover:text-primary border border-outline-variant/20 text-on-surface text-xs font-bold rounded-xl transition-all"
            >
              {t("btnWhy")}
            </button>

            <button
              type="button"
              onClick={() => onActionClick(language === "bn" ? "আমার অবিলম্বে কী করা উচিত?" : language === "hi" ? "मुझे तुरंत क्या करना चाहिए?" : "What immediate action should I take?")}
              className="px-3 py-1 bg-surface-container-high hover:bg-primary/15 hover:text-primary border border-outline-variant/20 text-on-surface text-xs font-bold rounded-xl transition-all"
            >
              {t("btnWhatToDo")}
            </button>

            <button
              type="button"
              onClick={() => onActionClick(language === "bn" ? "এর জন্য আইপিএম (IPM) বা জৈব প্রতিরোধ কী?" : language === "hi" ? "इसके लिए आईपीएम (IPM) या जैविक रोकथाम क्या है?" : "Explain IPM and non-chemical prevention for this.")}
              className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-500/20 text-xs font-bold rounded-xl transition-all"
            >
              {t("btnIpm")}
            </button>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-on-surface-variant/40 font-medium pl-1">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

// ── Thinking indicator ────────────────────────────────────────────────────────
function ThinkingBubble() {
  const { t } = useTranslation();
  return (
    <div className="flex gap-3 items-start animate-in fade-in duration-200">
      <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
        <span
          className="material-symbols-outlined text-primary text-lg animate-pulse"
          style={{ fontVariationSettings: "'FILL' 1" }}>
          agriculture
        </span>
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-[1.5rem] rounded-tl-sm px-4 py-3.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-on-surface-variant mr-1">{t("thinking")}</span>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AssistantContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const fieldId = searchParams.get("fieldId") || searchParams.get("field_id");
  const [fieldName, setFieldName] = useState<string | null>(null);
  const handledInitialQuery = useRef(false);

  const { t, language, setLanguage } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const speech = useSpeechInput(language);
  const tts = useSpeechOutput(language);

  // Fetch field name if fieldId is present
  useEffect(() => {
    if (fieldId) {
      api.getField(fieldId)
        .then((f) => {
          if (f?.name) setFieldName(f.name);
        })
        .catch(() => {});
    }
  }, [fieldId]);

  // Dynamic suggested prompts (field-aware)
  const suggestedQuestions = fieldId
    ? language === "bn"
      ? [
          { icon: "analytics", text: `এই জমির মাটির আর্দ্রতা ও পুষ্টি কেমন?`, category: "Field Soil" },
          { icon: "coronavirus", text: `এই জমিতে কোনো রোগের ঝুঁকি আছে কি?`, category: "Field Risk" },
          { icon: "water_drop", text: `এই জমিতে কি আজ সেচ দেওয়া প্রয়োজন?`, category: "Irrigation" },
          { icon: "checklist", text: `এই জমির জন্য প্রধান কৃষি পদক্ষেপ কী?`, category: "Actions" },
        ]
      : language === "hi"
      ? [
          { icon: "analytics", text: `इस खेत की मिट्टी की नमी और पोषण कैसा है?`, category: "Field Soil" },
          { icon: "coronavirus", text: `क्या इस खेत में किसी रोग का खतरा है?`, category: "Field Risk" },
          { icon: "water_drop", text: `क्या इस खेत में आज सिंचाई करनी चाहिए?`, category: "Irrigation" },
          { icon: "checklist", text: `इस खेत के लिए मुख्य कदम क्या हैं?`, category: "Actions" },
        ]
      : [
          { icon: "analytics", text: `How are the soil and moisture conditions in this field?`, category: "Field Soil" },
          { icon: "coronavirus", text: `Are there any disease outbreaks or risks in this field?`, category: "Field Risk" },
          { icon: "water_drop", text: `Does this field need irrigation today?`, category: "Irrigation" },
          { icon: "checklist", text: `What are the priority actions for this field?`, category: "Actions" },
        ]
    : language === "bn"
      ? [
          { icon: "grid_view", text: "আমার কোন জমিতে রোগ দেখা দিয়েছে?", category: "Fields" },
          { icon: "trending_up", text: "আমার ফসলের স্বাস্থ্য কি উন্নতি হচ্ছে?", category: "Trends" },
          { icon: "coronavirus", text: "আমার সর্বশেষ পাতার স্ক্যানে কী শনাক্ত হয়েছে?", category: "Diagnosis" },
          { icon: "checklist", text: "আজকের জন্য প্রধান কৃষি পরামর্শ কী?", category: "Actions" },
        ]
      : language === "hi"
      ? [
          { icon: "grid_view", text: "मेरे किस खेत में बीमारी का प्रकोप है?", category: "Fields" },
          { icon: "trending_up", text: "क्या मेरी फसल के स्वास्थ्य में सुधार हो रहा है?", category: "Trends" },
          { icon: "coronavirus", text: "मेरे नवीनतम पत्ती स्कैन में क्या पाया गया?", category: "Diagnosis" },
          { icon: "checklist", text: "आज के लिए मुख्य कृषि कदम क्या हैं?", category: "Actions" },
        ]
      : [
          { icon: "grid_view", text: "Which of my fields has active disease outbreaks?", category: "Fields" },
          { icon: "trending_up", text: "Is my crop health improving or worsening?", category: "Trends" },
          { icon: "coronavirus", text: "What did my latest leaf scan detect?", category: "Diagnosis" },
          { icon: "checklist", text: "What are my priority farming actions for today?", category: "Actions" },
        ];

  // Auto-fill speech transcript
  useEffect(() => {
    if (speech.transcript) {
      setInput(speech.transcript);
    }
  }, [speech.transcript]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Voice playback reset
  useEffect(() => {
    if (!tts.isSpeaking) {
      setPlayingMessageId(null);
    }
  }, [tts.isSpeaking]);

  const handlePlayVoice = (msgId: string, text: string) => {
    if (playingMessageId === msgId && tts.isSpeaking) {
      tts.stop();
      setPlayingMessageId(null);
    } else {
      tts.stop();
      setPlayingMessageId(msgId);
      tts.speak(text);
    }
  };

  const handleToggleVoice = () => {
    if (showVoice) {
      speech.stopListening();
      speech.reset();
      setShowVoice(false);
    } else {
      setShowVoice(true);
      speech.reset();
      speech.startListening();
    }
  };

  // Initial welcome message localized
  useEffect(() => {
    if (!authLoading && user && (messages.length === 0 || (messages.length === 1 && messages[0].role === "assistant"))) {
      const welcomeText = fieldName
        ? language === "bn"
          ? `নমস্কার! আমি এগ্রিসাইট কৃষি উপদেষ্টা — "${fieldName}" জমির জন্য প্রস্তুত। এই জমির ফসল, মাটির অবস্থা ও রোগ প্রতিরোধ সম্পর্কে যেকোনো প্রশ্ন করুন।`
          : language === "hi"
          ? `नमस्ते! मैं आपका एग्रीसाइट कृषि सलाहकार हूँ — "${fieldName}" खेत के लिए तैयार। इस खेत की फसल, मिट्टी की स्थिति और उपचार के बारे में कोई भी प्रश्न पूछें।`
          : `Hello! I'm your AgriSight advisor — ready to assist with "${fieldName}". Ask me about crop health, risk alerts, or recommendations for this field.`
        : language === "bn"
          ? "নমস্কার! আমি এগ্রিসাইট কৃষি সিদ্ধান্ত উপদেষ্টা। আপনার নিবন্ধিত জমি, ফসল এবং পাতার স্ক্যানের ডেটা আমার সাথে যুক্ত রয়েছে।\n\nরোগের বিস্তার, চিকিৎসা পরামর্শ বা প্রতিরোধমূলক পদক্ষেপ সম্পর্কে আমাকে প্রশ্ন করুন।"
          : language === "hi"
          ? "नमस्ते! मैं आपका एग्रीसाइट कृषि सलाहकार हूँ। मेरे पास आपके पंजीकृत खेतों, फसलों और पत्ती स्कैन इतिहास का डेटा है।\n\nमुझसे रोग की स्थिति, उपचार मार्गदर्शन या रोकथाम के बारे में पूछें।"
          : "Hello! I'm your AgriSight agricultural advisor. I have access to your registered fields, crops, and leaf scan history.\n\nAsk me about disease progression, plot hotspots, treatment guidance, or preventive actions.";

      setMessages([
        {
          id: uid(),
          role: "assistant",
          text: welcomeText,
          isGrounded: true,
          confidenceTier: "High",
          timestamp: new Date(),
        },
      ]);
    }
  }, [authLoading, user, language, fieldName]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = normalizeSpeechTranscript(text.trim());
      if (!trimmed || isThinking) return;

      const userMsg: Message = {
        id: uid(),
        role: "user",
        text: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      speech.reset();
      setShowVoice(false);
      setIsThinking(true);

      try {
        const result = await api.assistantChat(trimmed, language, fieldId || undefined);
        const aiMsg: Message = {
          id: uid(),
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
      } catch (err: any) {
        const errMsg: Message = {
          id: uid(),
          role: "assistant",
          text: err.message || (language === "bn" ? "কিছু ভুল হয়েছে। পুনরায় চেষ্টা করুন।" : language === "hi" ? "कुछ त्रुटि हुई। कृपया पुनः प्रयास करें।" : "Something went wrong. Please try again."),
          error: true,
          retryQuery: trimmed,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsThinking(false);
        inputRef.current?.focus();
      }
    },
    [isThinking, language, speech]
  );

  useEffect(() => {
    if (initialQuery && !handledInitialQuery.current && !authLoading) {
      handledInitialQuery.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery, authLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                agriculture
              </span>
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-on-surface leading-none">{t("askAgriSight")}</h1>
              <p className="text-[10px] text-on-surface-variant font-bold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("cropIntelligence")}
              </p>
            </div>
            {fieldId && (
              <Link
                href={`/fields/${fieldId}`}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors ml-2"
              >
                <span className="material-symbols-outlined text-xs">grid_view</span>
                <span>{fieldName || t("fields")}</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              aria-label="Change assistant language"
              className="bg-surface-container-high rounded-full px-2.5 py-1 text-[11px] font-extrabold text-on-surface cursor-pointer outline-none border border-outline-variant/30 hover:bg-surface-container-highest transition-colors"
            >
              <option value="en">EN</option>
              <option value="hi">हि</option>
              <option value="bn">বা</option>
            </select>

            {hasMessages && (
              <button
                onClick={() => setMessages([])}
                aria-label={t("clearChat")}
                title={t("clearChat")}
                className="text-xs font-bold text-on-surface-variant hover:text-error transition-colors shrink-0 px-2 py-1"
              >
                {t("clearChat")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-60 xl:pb-40">
          {/* Auth guard */}
          {!authLoading && !user && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant">lock</span>
              </div>
              <div className="space-y-2">
                <p className="font-extrabold text-on-surface text-lg">Sign in to use AI Assistant</p>
                <p className="text-sm text-on-surface-variant font-medium max-w-xs">
                  {t("aiAssistantDescription")}
                </p>
              </div>
              <Link
                href="/login"
                className="px-6 py-3 bg-primary text-on-primary font-bold rounded-2xl hover:opacity-90 transition-all"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Suggested Starter Questions */}
          {user && messages.length <= 1 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-black text-on-surface-variant/70 uppercase tracking-widest px-1">
                {t("suggestedQuestions")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {suggestedQuestions.map(({ icon, text }) => (
                  <button
                    key={text}
                    onClick={() => sendMessage(text)}
                    className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 hover:bg-primary/5 rounded-2xl p-3.5 text-left transition-all group shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <span className="material-symbols-outlined text-primary text-base">{icon}</span>
                    </div>
                    <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                      {text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Bubbles */}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onActionClick={(action) => sendMessage(action)}
              onPlayVoice={handlePlayVoice}
              onRetry={msg.retryQuery ? () => sendMessage(msg.retryQuery!) : undefined}
              isPlaying={playingMessageId === msg.id && tts.isSpeaking}
              hasVoice={tts.hasVoiceForLanguage}
              isVoiceSupported={tts.isSupported}
            />
          ))}

          {/* Thinking indicator */}
          {isThinking && <ThinkingBubble />}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      {user && (
        <div className="fixed bottom-20 xl:bottom-0 left-0 xl:left-72 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/20 shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-3 space-y-2">
            {/* Voice controls */}
            {showVoice && (
              <div className="bg-surface-container-low rounded-2xl p-3.5 border border-outline-variant/30 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {speech.state === "listening" ? (
                      <button
                        type="button"
                        onClick={speech.stopListening}
                        aria-label={t("stopListening")}
                        className="relative w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shrink-0 transition-transform active:scale-95"
                      >
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          stop_circle
                        </span>
                        <span className="absolute inset-0 rounded-full border-2 border-rose-600 animate-ping opacity-60" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          speech.reset();
                          speech.startListening();
                        }}
                        aria-label={t("voiceInputTitle")}
                        className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md shadow-primary/20 shrink-0 hover:bg-primary/90 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          mic
                        </span>
                      </button>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-black uppercase tracking-wider">
                          {LANGUAGE_CONFIG[language]?.speech}
                        </span>
                        <span className="text-xs font-extrabold text-on-surface truncate">
                          {LANGUAGE_CONFIG[language]?.nativeName}
                        </span>
                        <VoiceVisualizer state={speech.state} />
                      </div>
                      <p
                        className={`text-xs mt-0.5 truncate ${
                          speech.state === "listening"
                            ? "text-rose-600 font-bold animate-pulse"
                            : speech.state === "denied"
                            ? "text-error font-extrabold"
                            : speech.state === "network_error"
                            ? "text-amber-700 font-bold"
                            : "text-on-surface-variant font-medium"
                        }`}
                      >
                        {speech.state === "listening"
                          ? t("listeningInLanguage", { lang: LANGUAGE_CONFIG[language]?.nativeName })
                          : speech.state === "denied"
                          ? t("micPermissionDenied")
                          : speech.state === "network_error"
                          ? t("speechNetworkError")
                          : !speech.isSupported
                          ? t("voiceNotSupported")
                          : t("speakNowPrompt")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {speech.transcript && (
                      <button
                        type="button"
                        onClick={() => {
                          speech.reset();
                          setInput("");
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        title={t("clearVoiceInput")}
                      >
                        {t("clearVoiceInput")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        speech.stopListening();
                        speech.reset();
                        setShowVoice(false);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                      aria-label="Close voice panel"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                </div>

                {/* Live transcript preview */}
                {(speech.transcript || speech.interimTranscript) && (
                  <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/15 text-xs text-on-surface font-semibold leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <span>{speech.transcript}</span>
                      {speech.interimTranscript && (
                        <span className="italic opacity-60 font-medium"> {speech.interimTranscript}</span>
                      )}
                    </div>
                    {speech.transcript && (
                      <button
                        type="button"
                        onClick={() => sendMessage(speech.transcript)}
                        disabled={isThinking}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all self-end sm:self-auto shrink-0"
                      >
                        <span>{t("askButton")}</span>
                        <span className="material-symbols-outlined text-sm">send</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Main input row */}
            <div className="flex gap-2 items-end">
              {/* Mic toggle with fallback */}
              {speech.isSupported ? (
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  aria-label={t("voiceInputTitle")}
                  title={t("voiceInputTitle")}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    showVoice
                      ? "bg-primary text-on-primary shadow-md shadow-primary/20 scale-105"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary"
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
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-surface-container-high text-on-surface-variant/30 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">mic_off</span>
                </button>
              )}

              {/* Text area */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  id="assistant-input"
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t("typeYourQuestion")}
                  disabled={isThinking}
                  aria-label="Type your question"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl px-4 py-3 text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none disabled:opacity-60 leading-relaxed"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />
              </div>

              {/* Send */}
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isThinking}
                aria-label={t("askButton")}
                className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-90 transition-all disabled:opacity-40 disabled:scale-100"
              >
                {isThinking ? (
                  <span className="material-symbols-outlined text-lg animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-lg">send</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-4xl text-primary animate-pulse"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              agriculture
            </span>
          </div>
          <p className="text-sm font-bold text-on-surface-variant">Loading Assistant...</p>
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  );
}
