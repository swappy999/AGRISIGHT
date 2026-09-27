"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

export type Theme = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = "agrisight_theme";

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeToDocument(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (resolved === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
  }

  // Update theme-color meta tag for mobile browsers and PWA
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const targetColor = resolved === "dark" ? "#0B1110" : "#F5F2EA";
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", targetColor);
  } else {
    const newMeta = document.createElement("meta");
    newMeta.name = "theme-color";
    newMeta.content = targetColor;
    document.head.appendChild(newMeta);
  }

  // Synchronize Capacitor Native Android/iOS StatusBar
  try {
    if (Capacitor.isPluginAvailable("StatusBar")) {
      // Style.Dark: light content (white text/icons) for dark backgrounds
      // Style.Light: dark content (black text/icons) for light backgrounds
      StatusBar.setStyle({
        style: resolved === "dark" ? Style.Dark : Style.Light,
      }).catch(() => {});

      StatusBar.setBackgroundColor({
        color: resolved === "dark" ? "#0B1110" : "#F5F2EA",
      }).catch(() => {});
    }
  } catch {}
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
      return saved;
    }
  } catch {}
  return "system";
}

function getInitialResolvedTheme(): ResolvedTheme {
  const initial = getInitialTheme();
  return initial === "system" ? getSystemTheme() : initial;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(getInitialResolvedTheme);

  // Apply theme to document on mount
  useEffect(() => {
    applyThemeToDocument(resolvedTheme);
  }, [resolvedTheme]);

  // Handle OS theme changes dynamically when theme === "system"
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemChange = (e: MediaQueryListEvent) => {
      // Only change if user is on "system" mode
      let currentTheme: Theme = "system";
      try {
        currentTheme = (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
      } catch {}

      if (currentTheme === "system") {
        const nextResolved: ResolvedTheme = e.matches ? "dark" : "light";
        setResolvedTheme(nextResolved);
        applyThemeToDocument(nextResolved);
      }
    };

    // Listen to media query changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemChange);
    }

    // Sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const newTheme = (e.newValue as Theme) || "system";
        setThemeState(newTheme);
        const nextResolved = newTheme === "system" ? getSystemTheme() : newTheme;
        setResolvedTheme(nextResolved);
        applyThemeToDocument(nextResolved);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemChange);
      } else {
        mediaQuery.removeListener(handleSystemChange);
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
      // Dispatch custom event for immediate same-page listeners
      window.dispatchEvent(new CustomEvent("agrisight_theme_change", { detail: newTheme }));
    } catch {}

    const nextResolved: ResolvedTheme = newTheme === "system" ? getSystemTheme() : newTheme;
    setResolvedTheme(nextResolved);
    applyThemeToDocument(nextResolved);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
