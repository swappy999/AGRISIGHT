"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation, Language } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();
  const { signUp, signInWithGoogle, checkUsernameAvailable } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      const msg = (googleError.message || "").toLowerCase();
      if (
        msg.includes("popup") ||
        msg.includes("closed") ||
        msg.includes("cancel") ||
        msg.includes("aborted")
      ) {
        setError(
          language === "hi"
            ? "Google साइन-अप रद्द कर दिया गया था। कृपया पुनः प्रयास करें।"
            : language === "bn"
            ? "Google সাইন-আপ বাতিল করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
            : "Google sign-up was cancelled. Please try again."
        );
      } else if (msg.includes("provider is not enabled") || msg.includes("unsupported provider")) {
        setError(
          language === "hi"
            ? "Supabase में Google प्रदाता सक्षम नहीं है। कृपया Supabase डैशबोर्ड में Authentication > Providers > Google को चालू करें।"
            : language === "bn"
            ? "Supabase-এ Google প্রদানকারী সক্রিয় করা নেই। অনুগ্রহ করে Supabase ড্যাশবোর্ডে Authentication > Providers > Google সক্রিয় করুন।"
            : "Google sign-in is not enabled in your Supabase project. Please enable Google under Authentication > Providers in your Supabase Dashboard."
        );
      } else {
        setError(googleError.message || "Google sign-up failed. Please try again.");
      }
      setGoogleLoading(false);
    }
  };

  const validateUsernameFormat = (val: string) => {
    const clean = val.trim();
    if (clean.length < 3 || clean.length > 20) return false;
    return /^[a-zA-Z0-9_]+$/.test(clean);
  };

  const handleUsernameChange = (val: string) => {
    const cleaned = val.replace(/\s+/g, "").toLowerCase();
    setUsername(cleaned);
    setError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!cleaned) {
      setUsernameStatus("idle");
      return;
    }

    if (!validateUsernameFormat(cleaned)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    debounceTimerRef.current = setTimeout(async () => {
      const isAvailable = await checkUsernameAvailable(cleaned);
      setUsernameStatus(isAvailable ? "available" : "taken");
    }, 350);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(
        language === "hi"
          ? "कृपया अपना पूरा नाम दर्ज करें।"
          : language === "bn"
          ? "অনুগ্রহ করে আপনার পুরো নাম লিখুন।"
          : "Please enter your full name."
      );
      return;
    }

    if (!username.trim() || !validateUsernameFormat(username)) {
      setError(
        language === "hi"
          ? "उपयोगकर्ता नाम 3-20 वर्णों (अक्षर, संख्या, _) का होना चाहिए।"
          : language === "bn"
          ? "ব্যবহারকারীর নাম ৩-২০ অক্ষরের (ইংরেজি অক্ষর, সংখ্যা, _) হতে হবে।"
          : "Username must be 3-20 characters (letters, numbers, _ only)."
      );
      return;
    }

    if (usernameStatus === "taken") {
      setError(
        language === "hi"
          ? "यह उपयोगकर्ता नाम पहले से लिया जा चुका है। कृपया दूसरा चुनें।"
          : language === "bn"
          ? "এই ব্যবহারকারীর নাম ইতিমধ্যে ব্যবহৃত। অনুগ্রহ করে অন্যটি বেছে নিন।"
          : "This username is already taken. Please choose another."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        language === "hi"
          ? "पासवर्ड कम से कम 6 वर्णों का होना चाहिए।"
          : language === "bn"
          ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"
          : "Password must be at least 6 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        language === "hi"
          ? "पासवर्ड मेल नहीं खाते। कृपया दोबारा जांचें।"
          : language === "bn"
          ? "পাসওয়ার্ড মিলছে না। অনুগ্রহ করে আবার চেক করুন।"
          : "Passwords do not match. Please verify both password fields."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signupError } = await signUp(
        email.trim(),
        password,
        name.trim(),
        username.trim().toLowerCase()
      );

      if (signupError) {
        const errorMsg = String(signupError.message || "");
        if (
          errorMsg.toLowerCase().includes("already registered") ||
          errorMsg.toLowerCase().includes("already in use")
        ) {
          setError(
            language === "hi"
              ? "इस ईमेल पते के साथ पहले से एक खाता मौजूद है। कृपया साइन इन करें।"
              : language === "bn"
              ? "এই ইমেল ঠিকানার সাথে ইতিমধ্যে একটি অ্যাকাউন্ট আছে। অনুগ্রহ করে সাইন ইন করুন।"
              : "An account with this email address already exists. Please Sign In instead."
          );
        } else {
          setError(errorMsg);
        }
        setLoading(false);
      } else {
        const userObj = (data as { user?: { identities?: unknown[] } })?.user;
        if (userObj && userObj.identities && userObj.identities.length === 0) {
          setError(
            language === "hi"
              ? "इस ईमेल पते के साथ पहले से एक खाता मौजूद है। कृपया साइन इन करें।"
              : language === "bn"
              ? "এই ইমেল ঠিকানার সাথে ইতিমধ্যে একটি অ্যাকাউন্ট আছে। অনুগ্রহ করে সাইন ইন করুন।"
              : "An account with this email address already exists. Please Sign In instead."
          );
          setLoading(false);
        } else {
          setLoading(false);
          router.push(`/verify?email=${encodeURIComponent(email.trim())}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register. Please try again.";
      setError(msg);
      setLoading(false);
    }
  };

  const langs: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "bn", label: "বাংলা" },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface p-6">
      <div className="max-w-md w-full mx-auto">
        <div className="rounded-[2rem] shadow-2xl p-8 bg-surface-bright space-y-6 border border-outline-variant/30">
          {/* Header */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center p-3 mb-2 shadow-xl shadow-primary/10 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-mark.png"
                alt="AgriSight Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-black text-on-surface tracking-tight">AgriSight</span>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight mt-1">
              {t("signupWelcome")}
            </h1>
            <p className="text-on-surface-variant font-medium mt-1 text-sm">
              {t("signupSubtext")}
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

          {/* Error Banner */}
          {error && (
            <div
              id="signup-error"
              role="alert"
              className="bg-error-container text-on-error-container p-4 rounded-2xl text-sm font-semibold flex items-center gap-2 border border-error/20"
            >
              <span className="material-symbols-outlined text-error shrink-0">error</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            id="btn-google-signup"
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full py-3.5 bg-surface-bright border-2 border-outline-variant/40 text-on-surface font-bold rounded-xl shadow-sm hover:bg-surface-container hover:border-primary/30 active:scale-[0.98] transition-all outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 flex items-center justify-center gap-3 text-[15px]"
          >
            {googleLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>
                  {language === "hi"
                    ? "Google से कनेक्ट हो रहा है..."
                    : language === "bn"
                    ? "Google-এ সংযুক্ত হচ্ছে..."
                    : "Connecting to Google..."}
                </span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {t("continueWithGoogle")}
              </>
            )}
          </button>



          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant/30" />
            <span className="text-xs font-semibold text-on-surface-variant">
              {language === "hi"
                ? "या ईमेल के साथ रजिस्टर करें"
                : language === "bn"
                ? "বা ইমেল দিয়ে রেজিস্টার করুন"
                : "or register with email"}
            </span>
            <div className="flex-1 h-px bg-outline-variant/30" />
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface ml-1" htmlFor="name">
                {t("fullName")}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3.5 bg-surface-container border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface font-medium"
                placeholder="Ravi Kumar"
                required
              />
            </div>

            {/* Username field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold text-on-surface" htmlFor="username">
                  {t("username")}
                </label>
                {usernameStatus === "checking" && (
                  <span className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    {language === "hi" ? "जांच रहे हैं..." : language === "bn" ? "যাচাই করা হচ্ছে..." : "Checking..."}
                  </span>
                )}
                {usernameStatus === "available" && (
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    {language === "hi" ? "उपलब्ध है" : language === "bn" ? "উপলব্ধ" : "Available"}
                  </span>
                )}
                {usernameStatus === "taken" && (
                  <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">cancel</span>
                    {language === "hi" ? "पहले से मौजूद है" : language === "bn" ? "ইতিমধ্যে ব্যবহৃত" : "Taken"}
                  </span>
                )}
                {usernameStatus === "invalid" && (
                  <span className="text-[11px] text-amber-600 font-medium">
                    {language === "hi" ? "3-20 वर्ण, a-z, 0-9, _" : language === "bn" ? "৩-২০ অক্ষর, a-z, 0-9, _" : "3-20 chars, a-z, 0-9, _"}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-black text-sm select-none">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={`w-full pl-9 pr-5 py-3.5 bg-surface-container border rounded-xl outline-none transition-all text-on-surface font-medium lowercase ${
                    usernameStatus === "available"
                      ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      : usernameStatus === "taken"
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  }`}
                  placeholder="ravikumar"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface ml-1" htmlFor="email">
                {t("emailAddress")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-surface-container border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface font-medium"
                placeholder="farmer@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface ml-1" htmlFor="password">
                {t("password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-surface-container border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface font-medium pr-12"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface ml-1" htmlFor="confirmPassword">
                {t("confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-surface-container border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface font-medium"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              id="btn-signup-submit"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-4 mt-2 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 text-[15px]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  <span>
                    {language === "hi"
                      ? "खाता बनाया जा रहा है..."
                      : language === "bn"
                      ? "অ্যাকাউন্ট তৈরি করা হচ্ছে..."
                      : "Creating Account..."}
                  </span>
                </>
              ) : (
                <>
                  {t("createAccount")}
                  <span className="material-symbols-outlined text-xl">person_add</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-sm font-medium text-on-surface-variant">
              {t("alreadyHaveAccount")}{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                {t("signIn")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
