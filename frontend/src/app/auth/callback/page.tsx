"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

/**
 * Upsert the user profile row in the `profiles` table after OAuth login.
 * a2.md §14: id, full_name, avatar_url, preferred_language, updated_at
 */
async function upsertProfile(
  userId: string,
  fullName: string,
  avatarUrl: string | null,
  preferredLanguage: string
): Promise<{ username: string | null }> {
  try {
    const timeoutPromise = new Promise<{ username: string | null }>((resolve) =>
      setTimeout(() => resolve({ username: null }), 2000)
    );

    const workPromise = (async () => {
      const { data: existing } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle();

      await supabase.from("profiles").upsert(
        {
          id: userId,
          full_name: fullName,
          avatar_url: avatarUrl,
          preferred_language: preferredLanguage,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      return { username: existing?.username || null };
    })();

    return await Promise.race([workPromise, timeoutPromise]);
  } catch {
    // Non-blocking — profile upsert failure must not break login
    return { username: null };
  }
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();
  const [statusMsg, setStatusMsg] = useState("Verifying session...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isRedirected = false;

    const navigateToNext = (hasUsername: boolean, isRecovery: boolean) => {
      if (isRedirected) return;
      isRedirected = true;
      if (isRecovery) {
        setStatusMsg("Redirecting to password reset...");
        router.push("/reset-password");
      } else if (!hasUsername) {
        setStatusMsg("Taking you to choose a username...");
        router.push("/onboarding/username");
      } else {
        setStatusMsg("Sign-in successful! Opening dashboard...");
        router.push("/dashboard");
      }
    };

    // Fast-path listener: as soon as session is established, navigate immediately
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && s?.user) {
        const u = s.user;
        const uName = u.user_metadata?.username;
        navigateToNext(Boolean(uName), searchParams.get("type") === "recovery");
      }
    });

    async function handleAuthCallback() {
      try {
        // 1. Check for OAuth errors (e.g. user cancelled Google sign-in)
        const oauthError = searchParams.get("error");
        const errorDesc = searchParams.get("error_description");
        if (oauthError) {
          const isCancelled =
            oauthError === "access_denied" ||
            (errorDesc && errorDesc.toLowerCase().includes("denied"));
          setErrorMsg(
            isCancelled
              ? "Google sign-in was cancelled. Please try signing in again."
              : errorDesc || oauthError
          );
          return;
        }

        const type = searchParams.get("type");
        const code = searchParams.get("code");

        const getSafeSession = async () => {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<{ data: { session: null }; error: null }>((resolve) =>
            setTimeout(() => resolve({ data: { session: null }, error: null }), 2500)
          );
          return await Promise.race([sessionPromise, timeoutPromise]);
        };

        // Check if session was already detected/established
        const { data: { session: existingSession } } = await getSafeSession();

        // PKCE Code Exchange flow
        if (code && !existingSession) {
          setStatusMsg("Exchanging verification code...");
          try {
            const exchangePromise = supabase.auth.exchangeCodeForSession(code);
            const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
              setTimeout(() => reject(new Error("Exchange timed out")), 5000)
            );
            const { error } = await Promise.race([exchangePromise, timeoutPromise]);
            if (error) {
              const { data: { session: checkSession } } = await getSafeSession();
              if (!checkSession) throw error;
            }
          } catch (exchangeErr) {
            const { data: { session: checkSession } } = await getSafeSession();
            if (!checkSession) throw exchangeErr;
          }
        }

        // Parse hash fragment if present (implicit / legacy fallback)
        if (typeof window !== "undefined" && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const hashType = hashParams.get("type");

          if (accessToken && refreshToken) {
            setStatusMsg("Establishing secure session...");
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
            if (hashType === "recovery") {
              navigateToNext(false, true);
              return;
            }
          }
        }

        // Refresh session in background
        refreshSession().catch(() => {});

        // Fetch user info for profile upsert
        setStatusMsg("Setting up your profile...");
        const { data: { session } } = await getSafeSession();
        let existingUsername: string | null = null;

        if (session?.user) {
          const u = session.user;
          const fullName =
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            u.email?.split("@")[0] ||
            "Farmer";
          const avatarUrl =
            u.user_metadata?.avatar_url ||
            u.user_metadata?.picture ||
            null;
          const preferredLanguage =
            u.user_metadata?.preferred_language ||
            (typeof window !== "undefined" ? localStorage.getItem("agrisight_language") || "en" : "en");

          const res = await upsertProfile(u.id, fullName, avatarUrl, preferredLanguage);
          existingUsername = res.username || u.user_metadata?.username || null;
        }

        navigateToNext(Boolean(existingUsername), type === "recovery");
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Verification failed or session expired. Please try signing in again."
        );
      }
    }

    handleAuthCallback();

    return () => {
      subscription.unsubscribe();
    };
  }, [router, searchParams, refreshSession]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-outline-variant/10 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-on-surface">AgriSight</h1>
          <p
            className={`font-medium text-sm ${
              errorMsg ? "text-error" : "text-on-surface-variant"
            }`}
          >
            {errorMsg ?? statusMsg}
          </p>
        </div>

        {errorMsg && (
          <button
            id="btn-callback-return-login"
            onClick={() => router.push("/login")}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-full shadow-md hover:bg-primary/95 transition-all"
          >
            Return to Login
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <p className="text-on-surface font-bold animate-pulse">Processing authentication...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
