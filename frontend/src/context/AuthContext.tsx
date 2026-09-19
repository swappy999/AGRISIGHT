"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export interface UserProfile {
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  preferredLanguage?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isVerified: boolean;
  profile: UserProfile | null;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
  loginAsDemo: (name?: string, email?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isVerified: false,
  profile: null,
  logout: async () => {},
  signInWithGoogle: async () => ({ error: null }),
  resendVerificationEmail: async () => ({ error: null }),
  sendPasswordReset: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  refreshSession: async () => {},
  loginAsDemo: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isGoogleUser = Boolean(
    user?.app_metadata?.provider === "google" ||
    (Array.isArray(user?.app_metadata?.providers) && user.app_metadata.providers.includes("google"))
  );
  const isVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at || isGoogleUser);
  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Farmer";
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;
  const preferredLanguage =
    user?.user_metadata?.preferred_language ||
    (typeof window !== "undefined" ? localStorage.getItem("agrisight_language") || "en" : "en");

  const profile: UserProfile | null = user
    ? {
        fullName,
        email: user.email || "",
        avatarUrl,
        preferredLanguage,
      }
    : null;

  const loginAsDemo = useCallback((name = "Farmer Ravi", email = "farmer.ravi@agrisight.com") => {
    const demoUser = {
      id: "demo-farmer-id-1",
      email,
      email_confirmed_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      user_metadata: {
        full_name: name,
        name,
      },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("agrisight_local_user", JSON.stringify(demoUser));
      } catch {}
    }
    setUser(demoUser);
    setSession({ access_token: "local-token", user: demoUser } as unknown as Session);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      // Check local storage first
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("agrisight_local_user");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            setUser(parsed as User);
            setSession({ access_token: "local-token", user: parsed } as unknown as Session);
            setIsLoading(false);
            return;
          } catch {}
        }
      }

      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error || !currentSession) {
        // No active supabase session
      } else {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    } catch {
      // Fallback cleanly
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [refreshSession]);

  const logout = async () => {
    setIsLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("agrisight_local_user");
      }
      await supabase.auth.signOut().catch(() => {});
    } finally {
      setSession(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      if (error) return { error: new Error(error.message) };
      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      return { error: new Error(msg) };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const sendPasswordReset = async (email: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?type=recovery`,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? new Error(error.message) : null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isVerified,
        profile,
        logout,
        signInWithGoogle,
        resendVerificationEmail,
        sendPasswordReset,
        updatePassword,
        refreshSession,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
