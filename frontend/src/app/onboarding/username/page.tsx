"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation, Language } from "@/context/LanguageContext";

export default function UsernameOnboardingPage() {
  const { profile, updateProfile, checkUsernameAvailable } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // If user already has a username, skip to dashboard
  useEffect(() => {
    if (profile?.username) {
      router.push("/dashboard");
    }
  }, [profile?.username, router]);

  const validateFormat = (val: string) => {
    const clean = val.trim();
    if (clean.length < 3 || clean.length > 20) return false;
    return /^[a-zA-Z0-9_]+$/.test(clean);
  };

  const handleUsernameChange = (val: string) => {
    const cleaned = val.replace(/\s+/g, "");
    setUsername(cleaned);
    setError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!cleaned) {
      setStatus("idle");
      return;
    }

    if (!validateFormat(cleaned)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");
    debounceTimerRef.current = setTimeout(async () => {
      const isAvailable = await checkUsernameAvailable(cleaned);
      setStatus(isAvailable ? "available" : "taken");
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "available" || !username) {
      setError(t("usernameRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: updateErr } = await updateProfile({
      username: username.toLowerCase().trim(),
    });

    if (updateErr) {
      setError(updateErr.message || t("profileUpdateFailed"));
      setSubmitting(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  const langs: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "bn", label: "বাংলা" },
  ];

  return (
    <div className="rounded-[2rem] shadow-2xl p-8 bg-surface-bright space-y-6 border border-outline-variant/30">
      {/* Brand Header */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center p-3 mb-4 shadow-xl shadow-primary/10 overflow-hidden">
          <span className="material-symbols-outlined text-4xl text-primary">badge</span>
        </div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
          {t("onboardingTitle")}
        </h1>
        <p className="text-on-surface-variant font-medium mt-1 text-sm">
          {t("onboardingSubtext")}
        </p>
      </div>

      {/* Language Selector */}
      <div className="flex justify-center gap-2">
        {langs.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              language === lang.code
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-dim"
            }`}
            aria-label={`Switch to ${lang.label}`}
            aria-pressed={language === lang.code}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="bg-error-container text-on-error-container p-4 rounded-2xl text-sm font-semibold flex items-center gap-2 border border-error/20"
        >
          <span className="material-symbols-outlined text-error shrink-0">error</span>
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-bold text-on-surface ml-1" htmlFor="username-input">
            {t("chooseUsername")}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant text-base select-none">
              @
            </span>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              maxLength={20}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              className={`w-full pl-9 pr-12 py-3.5 bg-surface-container border rounded-xl outline-none font-semibold text-on-surface transition-all ${
                status === "available"
                  ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  : status === "taken" || status === "invalid"
                  ? "border-error focus:ring-2 focus:ring-error/20"
                  : "border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
              }`}
              placeholder="kisan_ravi"
              required
            />
            {/* Live Indicator Icon */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {status === "checking" && (
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              )}
              {status === "available" && (
                <span className="material-symbols-outlined text-emerald-500 text-xl font-bold">
                  check_circle
                </span>
              )}
              {(status === "taken" || status === "invalid") && (
                <span className="material-symbols-outlined text-error text-xl font-bold">
                  cancel
                </span>
              )}
            </div>
          </div>

          {/* Validation Feedback Line */}
          <div className="text-xs font-medium px-1 min-h-[20px]">
            {status === "idle" && (
              <span className="text-on-surface-variant">{t("usernameHint")}</span>
            )}
            {status === "checking" && (
              <span className="text-primary font-semibold flex items-center gap-1">
                {t("usernameChecking")}
              </span>
            )}
            {status === "available" && (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                {t("usernameAvailable")}
              </span>
            )}
            {status === "taken" && (
              <span className="text-error font-bold flex items-center gap-1">
                {t("usernameTaken")}
              </span>
            )}
            {status === "invalid" && (
              <span className="text-error font-semibold flex items-center gap-1">
                {t("usernameInvalid")}
              </span>
            )}
          </div>
        </div>

        <button
          id="btn-save-username"
          type="submit"
          disabled={status !== "available" || submitting}
          className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-40 flex items-center justify-center gap-2 text-[15px]"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>{t("onboardingContinue")}</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </>
          )}
        </button>

        <button
          id="btn-skip-onboarding"
          type="button"
          onClick={handleSkip}
          disabled={submitting}
          className="w-full py-3 bg-transparent hover:bg-surface-container text-on-surface-variant font-bold rounded-xl active:scale-[0.98] transition-all text-sm"
        >
          {t("onboardingSkip")}
        </button>
      </form>
    </div>
  );
}
