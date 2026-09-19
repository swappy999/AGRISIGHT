"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { loginAsDemo } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDemoAccess = () => {
    setLoading(true);
    loginAsDemo(name || "Farmer", email || "farmer@agrisight.com");
    router.push("/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify both password fields.");
      return;
    }

    setLoading(true);
    setError(null);

    // Local / demo bypass
    if (
      email.toLowerCase().includes("farmer") ||
      email.toLowerCase().includes("demo") ||
      email.toLowerCase().includes("test")
    ) {
      loginAsDemo(name || "Farmer", email);
      router.push("/dashboard");
      return;
    }

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        const errorMsg = String(error.message || "");
        const isNetworkOrPaused =
          errorMsg === "{}" ||
          !errorMsg ||
          errorMsg.toLowerCase().includes("unreachable") ||
          errorMsg.toLowerCase().includes("failed to fetch") ||
          errorMsg.toLowerCase().includes("retryable") ||
          errorMsg.toLowerCase().includes("network");

        if (isNetworkOrPaused) {
          // If Supabase cloud is unreachable or paused, automatically register the local user
          loginAsDemo(name || "Farmer", email);
          router.push("/dashboard");
          return;
        }

        if (errorMsg.toLowerCase().includes("already registered") || errorMsg.toLowerCase().includes("already in use")) {
          setError("An account with this email address already exists. Please Sign In instead.");
        } else {
          setError(errorMsg);
        }
        setLoading(false);
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError("An account with this email address already exists. Please Sign In instead.");
        setLoading(false);
      } else {
        setLoading(false);
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      }
    } catch {
      // Fallback cleanly to local user registration
      loginAsDemo(name || "Farmer", email);
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6">
      <div className="max-w-md w-full mx-auto">
        <div className="rounded-3xl shadow-xl p-8 bg-white space-y-6 border border-outline-variant/10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-on-primary mb-6 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                person_add
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">{t("signupWelcome")}</h1>
            <p className="text-on-surface-variant font-medium mt-1">{t("signupSubtext")}</p>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-2xl text-sm font-semibold flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-error shrink-0">error</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface ml-1" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3.5 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none transition-all text-on-surface font-medium"
                placeholder="Ayush Sarkar"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface ml-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none transition-all text-on-surface font-medium"
                placeholder="farmer@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-on-surface ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none transition-all text-on-surface font-medium pr-12"
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
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none transition-all text-on-surface font-medium"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-3 bg-primary text-on-primary font-bold rounded-full shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
            >
              {loading ? "Creating Account..." : "Sign Up"}
              {!loading && <span className="material-symbols-outlined text-xl">person_add</span>}
            </button>

            <button
              type="button"
              onClick={handleDemoAccess}
              disabled={loading}
              className="w-full py-3 bg-surface-container-highest text-primary font-bold rounded-full hover:bg-surface-dim active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm border border-primary/20 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">verified_user</span>
              Continue with Demo / Guest Access
            </button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-sm font-medium text-on-surface-variant">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
