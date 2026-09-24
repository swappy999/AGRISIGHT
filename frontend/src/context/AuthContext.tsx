"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  preferredLanguage?: string;
  username?: string | null;
}

export const GUEST_USER = {
  id: "6013231d-43ee-47c2-8803-ba486258cc18",
  app_metadata: { provider: "guest", providers: ["guest"] },
  user_metadata: {
    full_name: "Guest Farmer",
    name: "Guest Farmer",
    username: "guest_farmer",
    preferred_language: "en",
  },
  aud: "authenticated",
  confirmation_sent_at: "2026-01-01T00:00:00Z",
  confirmed_at: "2026-01-01T00:00:00Z",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  email: "guest@agrisight.local",
  phone: "",
  role: "authenticated",
} as unknown as User;

export const GUEST_SESSION = {
  access_token: "guest-preview-token",
  token_type: "bearer",
  expires_in: 31536000,
  expires_at: 1999999999,
  refresh_token: "guest-preview-refresh-token",
  user: GUEST_USER,
} as unknown as Session;

export const GUEST_PROFILE: UserProfile = {
  id: "6013231d-43ee-47c2-8803-ba486258cc18",
  fullName: "Guest Farmer",
  email: "guest@agrisight.local",
  avatarUrl: null,
  preferredLanguage: "en",
  username: "guest_farmer",
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isVerified: boolean;
  profile: UserProfile | null;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, username?: string) => Promise<{ data: unknown; error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInAsGuest: () => void;
  updateProfile: (updates: {
    fullName?: string;
    username?: string;
    preferredLanguage?: string;
  }) => Promise<{ error: Error | null }>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isVerified: false,
  profile: null,
  logout: async () => {},
  signUp: async () => ({ data: null, error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signInAsGuest: () => {},
  updateProfile: async () => ({ error: null }),
  checkUsernameAvailable: async () => false,
  resendVerificationEmail: async () => ({ error: null }),
  sendPasswordReset: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  refreshSession: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isGoogleUser = Boolean(
    user?.app_metadata?.provider === "google" ||
    (Array.isArray(user?.app_metadata?.providers) && user.app_metadata.providers.includes("google"))
  );
  const isGuestUser = Boolean(user?.app_metadata?.provider === "guest");
  const isVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at || isGoogleUser || isGuestUser);

  const fetchProfile = useCallback(async (currentUser: User) => {
    const fallbackProfile: UserProfile = {
      id: currentUser.id,
      fullName:
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.email?.split("@")[0] ||
        "Farmer",
      email: currentUser.email || "",
      avatarUrl:
        currentUser.user_metadata?.avatar_url ||
        currentUser.user_metadata?.picture ||
        null,
      preferredLanguage:
        currentUser.user_metadata?.preferred_language ||
        (typeof window !== "undefined" ? localStorage.getItem("agrisight_language") || "en" : "en"),
      username: currentUser.user_metadata?.username || null,
    };

    try {
      const queryPromise = supabase
        .from("profiles")
        .select("id, full_name, avatar_url, preferred_language, username")
        .eq("id", currentUser.id)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error("timeout") }), 2500)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error || !data) {
        setProfile(fallbackProfile);
        return;
      }

      setProfile({
        id: currentUser.id,
        fullName: data.full_name || fallbackProfile.fullName,
        email: currentUser.email || "",
        avatarUrl: data.avatar_url || fallbackProfile.avatarUrl,
        preferredLanguage: data.preferred_language || fallbackProfile.preferredLanguage,
        username: data.username || fallbackProfile.username,
      });
    } catch {
      setProfile(fallbackProfile);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("agrisight_guest_mode") === "true") {
        setSession(GUEST_SESSION);
        setUser(GUEST_USER);
        setProfile(GUEST_PROFILE);
        setIsLoading(false);
        return;
      }

      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null }; error: null }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null }, error: null }), 3500)
      );

      const { data: { session: currentSession }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise,
      ]);

      if (error || !currentSession) {
        setSession(null);
        setUser(null);
        setProfile(null);
      } else {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user);
      }
    } catch {
      // Clean fallback
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    refreshSession();

    let appUrlListenerHandle: { remove: () => void } | null = null;
    if (Capacitor.isNativePlatform()) {
      App.addListener("appUrlOpen", async (event) => {
        try {
          const urlStr = event.url;
          const codeMatch = urlStr.match(/[?&]code=([^&#]+)/);
          if (codeMatch && codeMatch[1]) {
            const code = decodeURIComponent(codeMatch[1]);
            await supabase.auth.exchangeCodeForSession(code);
            await refreshSession();
            if (typeof window !== "undefined") {
              window.location.href = "/dashboard";
            }
          } else if (urlStr.includes("access_token=")) {
            const tokenMatch = urlStr.match(/access_token=([^&#]+)/);
            const refreshMatch = urlStr.match(/refresh_token=([^&#]+)/);
            if (tokenMatch && refreshMatch) {
              await supabase.auth.setSession({
                access_token: decodeURIComponent(tokenMatch[1]),
                refresh_token: decodeURIComponent(refreshMatch[1]),
              });
              await refreshSession();
              if (typeof window !== "undefined") {
                window.location.href = "/dashboard";
              }
            }
          }
        } catch (e) {
          console.error("[Capacitor DeepLink Error]:", e);
        }
      }).then((handle) => {
        appUrlListenerHandle = handle;
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        // Defer profile fetch to prevent locking onAuthStateChange
        setTimeout(() => {
          fetchProfile(newSession.user);
        }, 0);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (appUrlListenerHandle) {
        appUrlListenerHandle.remove();
      }
    };
  }, [refreshSession, fetchProfile]);

  const logout = async () => {
    setIsLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("agrisight_guest_mode");
      }
      await supabase.auth.signOut().catch(() => {});
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsLoading(false);
    }
  };

  const signInAsGuest = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("agrisight_guest_mode", "true");
    }
    setUser(GUEST_USER);
    setSession(GUEST_SESSION);
    setProfile(GUEST_PROFILE);
    setIsLoading(false);
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    username?: string
  ): Promise<{ data: unknown; error: Error | null }> => {
    try {
      const isNative = Capacitor.isNativePlatform();
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const emailRedirectTo = isNative ? "agrisight://auth/callback" : `${origin}/auth/callback`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: fullName,
            username: username ? username.trim().toLowerCase() : "",
          },
        },
      });

      if (error) return { data: null, error: new Error(error.message) };
      return { data, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed.";
      return { data: null, error: new Error(msg) };
    }
  };

  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    try {
      const isNative = Capacitor.isNativePlatform();
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const redirectTo = isNative ? "agrisight://auth/callback" : `${origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
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

  const checkUsernameAvailable = async (candidate: string): Promise<boolean> => {
    const clean = candidate.trim().toLowerCase();
    if (!clean || clean.length < 3 || clean.length > 20) return false;
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) return false;

    try {
      const { data, error } = await supabase.rpc("is_username_available", {
        p_username: clean,
      });

      if (!error && typeof data === "boolean") {
        return data;
      }

      const { data: existing, error: selectErr } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", clean)
        .limit(1);

      if (!selectErr) {
        if (existing && existing.length === 1 && user && existing[0].id === user.id) {
          return true;
        }
        return (existing?.length ?? 0) === 0;
      }

      return false;
    } catch {
      return false;
    }
  };

  const updateProfile = async (updates: {
    fullName?: string;
    username?: string;
    preferredLanguage?: string;
  }): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const payload: Record<string, unknown> = {
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (updates.fullName !== undefined) {
        payload.full_name = updates.fullName.trim();
      }
      if (updates.username !== undefined) {
        payload.username = updates.username.trim().toLowerCase();
      }
      if (updates.preferredLanguage !== undefined) {
        payload.preferred_language = updates.preferredLanguage;
      }

      const { error: profileErr } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (profileErr) throw profileErr;

      const metadataUpdates: Record<string, unknown> = {};
      if (updates.fullName !== undefined) metadataUpdates.full_name = updates.fullName.trim();
      if (updates.username !== undefined) metadataUpdates.username = updates.username.trim().toLowerCase();
      if (updates.preferredLanguage !== undefined) metadataUpdates.preferred_language = updates.preferredLanguage;

      await supabase.auth.updateUser({ data: metadataUpdates }).catch(() => {});

      await fetchProfile(user);
      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      return { error: new Error(msg) };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    const isNative = Capacitor.isNativePlatform();
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const emailRedirectTo = isNative ? "agrisight://auth/callback" : `${origin}/auth/callback`;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const sendPasswordReset = async (email: string) => {
    const isNative = Capacitor.isNativePlatform();
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const redirectTo = isNative ? "agrisight://auth/callback?type=recovery" : `${origin}/auth/callback?type=recovery`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
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
        signUp,
        signInWithGoogle,
        signInAsGuest,
        updateProfile,
        checkUsernameAvailable,
        resendVerificationEmail,
        sendPasswordReset,
        updatePassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
