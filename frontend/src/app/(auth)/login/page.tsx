"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useTranslation, Language } from "@/context/LanguageContext";

export default function LoginPage() {
  const { t, language, setLanguage } = useTranslation();
  const { user, isVerified, refreshSession, signInWithGoogle, signInAsGuest } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Auto-redirect authenticated & verified users to dashboard
  useEffect(() => {
    if (user && isVerified) {
      router.push("/dashboard");
    }
  }, [user, isVerified, router]);

  const handleGuestLogin = () => {
    signInAsGuest();
    router.push("/dashboard");
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (
        msg.includes("popup") ||
        msg.includes("closed") ||
        msg.includes("cancel") ||
        msg.includes("aborted")
      ) {
        setError(
          language === "hi"
            ? "Google साइन-इन रद्द कर दिया गया था। कृपया पुनः प्रयास करें।"
            : language === "bn"
            ? "Google সাইন-ইন বাতিল করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
            : "Google sign-in was cancelled. Please try again."
        );
      } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("timed out")) {
        setError(
          language === "hi"
            ? "नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।"
            : language === "bn"
            ? "নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ চেক করুন।"
            : "Network error. Please check your internet connection and try again."
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
        setError(
          error.message ||
            (language === "hi"
              ? "Google साइन-इन विफल रहा। कृपया पुनः प्रयास करें।"
              : language === "bn"
              ? "Google সাইন-ইন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
              : "Google sign-in could not be completed. Please try again.")
        );
      }
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Connection timed out. Please try again.")), 8000)
      );

      const authPromise = supabase.auth.signInWithPassword({ email, password });
      const { data, error } = await Promise.race([authPromise, timeoutPromise]);

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          router.push(`/verify?email=${encodeURIComponent(email)}`);
          return;
        } else if (error.message.toLowerCase().includes("invalid login credentials")) {
          setError(
            language === "hi"
              ? "ईमेल या पासवर्ड गलत है। कृपया दोबारा जांचें।"
              : language === "bn"
              ? "ইমেল বা পাসওয়ার্ড ভুল। অনুগ্রহ করে আবার চেক করুন।"
              : "Invalid email or password. Please double-check your credentials."
          );
        } else {
          setError(error.message);
        }
        setLoading(false);
      } else {
        await refreshSession();
        const currentUser = data.user;
        const isEmailVerified = Boolean(
          currentUser?.email_confirmed_at || currentUser?.confirmed_at
        );
        if (currentUser && !isEmailVerified) {
          router.push(`/verify?email=${encodeURIComponent(email)}`);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("timed out") || msg.includes("Failed to fetch")) {
        setError(
          language === "hi"
            ? "इंटरनेट कनेक्शन जांचें और दोबारा कोशिश करें।"
            : language === "bn"
            ? "ইন্টারনেট সংযোগ চেক করুন এবং আবার চেষ্টা করুন।"
            : "Unable to connect. Check your internet connection and try again."
        );
      } else {
        setError(msg || "Sign in failed. Please try again.");
      }
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

          {/* Brand Header */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center p-3 mb-4 shadow-xl shadow-primary/10 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-mark.png"
                alt="AgriSight Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-4xl font-black text-on-surface tracking-tight">AgriSight</h1>
            <p className="text-on-surface-variant font-medium mt-1 text-sm">{t("loginSubtext")}</p>
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
              id="login-error"
              role="alert"
              className="bg-error-container text-on-error-container p-4 rounded-2xl text-sm font-semibold flex items-center gap-2 border border-error/20"
            >
              <span className="material-symbols-outlined text-error shrink-0">error</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            id="btn-google-login"
            type="button"
            onClick={handleGoogleLogin}
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
                {/* Google G icon */}
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

          {/* Guest Access Button */}
          <button
            id="btn-guest-login"
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-3.5 bg-primary/10 border-2 border-primary/25 text-primary font-bold rounded-xl shadow-sm hover:bg-primary/15 active:scale-[0.98] transition-all outline-none focus:ring-4 focus:ring-primary/20 flex items-center justify-center gap-2.5 text-[15px]"
          >
            <span className="material-symbols-outlined text-xl">person_outline</span>
            <span>
              {language === "hi"
                ? "अतिथि के रूप में जारी रखें (Guest Mode)"
                : language === "bn"
                ? "গেস্ট হিসেবে প্রবেশ করুন (Guest Mode)"
                : "Sign in as Guest (Instant Preview)"}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-outline-variant/30" />
            <span className="text-xs font-semibold text-on-surface-variant">{t("orSignInWith")}</span>
            <div className="flex-1 h-px bg-outline-variant/30" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
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
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-on-surface" htmlFor="password">
                  {t("password")}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-surface-container border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface font-medium pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
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

            <button
              id="btn-email-signin"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 text-[15px]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  {t("signingIn")}
                </>
              ) : (
                <>
                  {t("signIn")}
                  <span className="material-symbols-outlined text-xl">login</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-sm font-medium text-on-surface-variant">
              {t("noAccount")}{" "}
              <Link href="/signup" className="text-primary font-bold hover:underline">
                {t("createAccount")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
