import { createClient } from "@supabase/supabase-js";

// Ensure these environment variables are set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Intercept uncaught Supabase auth network errors in browser so Next.js Turbopack
// doesn't block the UI with a full-screen dev error overlay when Supabase is paused or offline.
if (typeof window !== "undefined") {
  try {
    // Wrap console.error in development to downgrade Supabase retryable network errors to console.warn
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const firstArg = args[0];
      const errorName = firstArg?.name || "";
      const errorMsg = String(firstArg?.message || firstArg || "");

      const isSupabaseNetworkError =
        errorName === "AuthRetryableFetchError" ||
        errorName === "AuthApiError" ||
        errorMsg.includes("AuthRetryableFetchError") ||
        (errorMsg.includes("Failed to fetch") && errorMsg.includes("supabase"));

      if (isSupabaseNetworkError) {
        console.warn("[AgriSight Supabase Local Fallback]", ...args);
        return;
      }
      originalConsoleError.apply(console, args);
    };
  } catch {}
}

/**
 * Resilient fetch wrapper to prevent Next.js Turbopack dev overlay crash when Supabase
 * project is paused, unresolvable on DNS, or network is offline.
 * NOTE: Never return 400 "invalid_grant" on network errors, as that causes Supabase Auth
 * to purge the user's refresh token and forcefully log them out. Returning 503 preserves the session.
 */
const resilientFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    const targetUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : (input as Request)?.url || "unknown";

    console.warn(`[AgriSight Supabase] Host unreachable (${err?.message || "fetch error"}). Target: ${targetUrl}`);

    return new Response(
      JSON.stringify({
        msg: "Supabase host unreachable or network is offline.",
        message: "Supabase host unreachable or network is offline.",
        error_description: "Supabase host unreachable or network is offline.",
        code: "network_offline",
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: resilientFetch,
  },
});
