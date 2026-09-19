import { createClient } from "@supabase/supabase-js";

// Ensure these environment variables are set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Intercept uncaught Supabase auth network errors in browser so Next.js Turbopack
// doesn't block the UI with a full-screen dev error overlay when Supabase is paused or offline.
if (typeof window !== "undefined") {
  try {
    // 1. Clean up any expired stale Supabase auth tokens in localStorage to prevent refresh loops
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (parsed?.expires_at && parsed.expires_at * 1000 < Date.now()) {
              localStorage.removeItem(key);
            }
          } catch {}
        }
      }
    }

    // 2. Wrap console.error in development to downgrade Supabase retryable network errors to console.warn
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const firstArg = args[0];
      const errorName = firstArg?.name || "";
      const errorMsg = String(firstArg?.message || firstArg || "");

      const isSupabaseNetworkError =
        errorName === "AuthRetryableFetchError" ||
        errorName === "AuthApiError" ||
        errorMsg.includes("AuthRetryableFetchError") ||
        errorMsg.includes("Failed to fetch") && errorMsg.includes("supabase");

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

    // If it's a token refresh attempt against a dead/paused project, return invalid_grant
    // so Supabase Auth cleanly removes the stale session rather than retrying indefinitely
    if (targetUrl.includes("/token") && targetUrl.includes("grant_type=refresh_token")) {
      return new Response(
        JSON.stringify({
          error: "invalid_grant",
          error_description: "Supabase host unreachable. Stale session cleared.",
        }),
        {
          status: 400,
          statusText: "Bad Request",
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        msg: "Supabase host unreachable or project is paused.",
        message: "Supabase host unreachable or project is paused.",
        error_description: "Supabase host unreachable or project is paused.",
        code: "supabase_unreachable",
      }),
      {
        status: 400,
        statusText: "Bad Request",
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
