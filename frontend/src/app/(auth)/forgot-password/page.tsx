"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    const { error: resetError } = await sendPasswordReset(email);
    setLoading(false);

    if (resetError) {
      setError(resetError.message || "Unable to send password reset email. Please try again.");
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-surface p-6">
      <div className="max-w-md w-full mx-auto">
        <div className="rounded-3xl shadow-xl p-8 bg-surface-bright space-y-6 border border-outline-variant/30">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-on-primary mb-4 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-3xl">lock_reset</span>
            </div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Reset Password</h1>
            <p className="text-on-surface-variant font-medium text-sm mt-1">
              Enter your registered email address to receive password reset instructions.
            </p>
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm font-semibold flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-error">error</span>
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                <span className="material-symbols-outlined text-5xl">mark_email_read</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-on-surface">Check your inbox</h2>
                <p className="text-on-surface-variant font-medium text-sm">
                  We&apos;ve sent a password reset link to <span className="font-extrabold text-on-surface">{email}</span>.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full py-4 bg-primary text-on-primary font-bold rounded-full text-center shadow-md hover:bg-primary/95 transition-all"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface ml-1" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none transition-all text-on-surface font-medium"
                  placeholder="farmer@example.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 bg-primary text-on-primary font-bold rounded-full shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
              >
                {loading ? "Sending Link..." : "Send Reset Link"}
                {!loading && <span className="material-symbols-outlined text-xl">send</span>}
              </button>
            </form>
          )}

          <div className="pt-2 text-center">
            <p className="text-sm font-medium text-on-surface-variant">
              Remembered your password?{" "}
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
