"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please check and try again.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await updatePassword(password);
    setLoading(false);

    if (updateError) {
      setError(updateError.message || "Failed to update password. Please try again.");
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
              <span className="material-symbols-outlined text-3xl">key</span>
            </div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Set New Password</h1>
            <p className="text-on-surface-variant font-medium text-sm mt-1">
              Please enter and confirm your new password.
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
              <div className="w-20 h-20 rounded-full bg-healthy-bg text-healthy flex items-center justify-center mx-auto border border-healthy-border">
                <span className="material-symbols-outlined text-5xl">check_circle</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-on-surface">Password Updated!</h2>
                <p className="text-on-surface-variant font-medium text-sm">
                  Your password has been changed successfully. You can now sign in with your new password.
                </p>
              </div>
              <button
                onClick={() => router.push("/login")}
                className="w-full py-4 bg-primary text-on-primary font-bold rounded-full text-center shadow-md hover:bg-primary/95 transition-all"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface ml-1" htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none transition-all text-on-surface font-medium pr-12"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface ml-1" htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none transition-all text-on-surface font-medium"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 bg-primary text-on-primary font-bold rounded-full shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
              >
                {loading ? "Updating Password..." : "Update Password"}
                {!loading && <span className="material-symbols-outlined text-xl">check</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
