"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isVerified, resendVerificationEmail, refreshSession } = useAuth();

  const targetEmail = searchParams.get("email") || user?.email || "";
  const isConfirmedParam = searchParams.get("confirmed") === "true";

  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto redirect if already verified
  useEffect(() => {
    if (isVerified) {
      router.push("/dashboard");
    }
  }, [isVerified, router]);

  // Countdown timer logic
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!targetEmail) {
      setError("Please provide a valid email address.");
      return;
    }
    if (cooldown > 0 || resending) return;

    setResending(true);
    setError(null);
    setMessage(null);

    const { error: resendError } = await resendVerificationEmail(targetEmail);
    setResending(false);

    if (resendError) {
      setError(resendError.message || "Failed to resend verification email. Please try again later.");
    } else {
      setMessage(`Verification link sent to ${targetEmail}!`);
      setCooldown(30);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setError(null);
    setMessage(null);

    await refreshSession();
    setChecking(false);

    if (isVerified) {
      router.push("/dashboard");
    } else {
      setMessage("Account is not verified yet. Please check your inbox or click Resend Email.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface p-6">
      <div className="max-w-md w-full mx-auto">
        <div className="rounded-3xl shadow-xl p-8 bg-surface-bright space-y-6 border border-outline-variant/30 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <span className="material-symbols-outlined text-4xl">mark_email_unread</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Verify Your Email</h1>
            <p className="text-on-surface-variant font-medium text-sm">
              We have sent a verification link to:
            </p>
            <p className="text-base font-extrabold text-primary break-all bg-surface-container-high py-2 px-4 rounded-xl">
              {targetEmail || "your registered email"}
            </p>
          </div>

          {isConfirmedParam && (
            <div className="bg-healthy-bg text-healthy-text p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border border-healthy-border">
              <span className="material-symbols-outlined text-healthy">check_circle</span>
              Email verified! Redirecting to dashboard...
            </div>
          )}

          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-error">error</span>
              {error}
            </div>
          )}

          {message && !error && (
            <div className="bg-primary-container text-on-primary-container p-4 rounded-2xl text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              {message}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-full shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base outline-none disabled:opacity-50"
            >
              {checking ? "Checking Status..." : "Check Verification Status"}
              {!checking && <span className="material-symbols-outlined">refresh</span>}
            </button>

            <button
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="w-full py-4 bg-surface-container-highest text-on-surface font-bold rounded-full hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 text-base outline-none disabled:opacity-50"
            >
              {resending
                ? "Sending Email..."
                : cooldown > 0
                ? `Resend available in ${cooldown}s`
                : "Resend Verification Email"}
              {!resending && cooldown === 0 && <span className="material-symbols-outlined">send</span>}
            </button>
          </div>

          <div className="pt-4 border-t border-outline-variant/10 text-center">
            <p className="text-sm font-medium text-on-surface-variant">
              Already verified or want to use another account?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <p className="text-on-surface font-bold animate-pulse">Loading verification details...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
