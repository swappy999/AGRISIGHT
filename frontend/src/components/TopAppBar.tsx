"use client";

import { useAuth } from "@/context/AuthContext";
import { useTranslation, Language } from "@/context/LanguageContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface TopAppBarProps {
  onOpenMobileNav?: () => void;
}

export function TopAppBar({ onOpenMobileNav }: TopAppBarProps) {
  const { user, profile, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside or Esc key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) {
      router.push(`/history?q=${encodeURIComponent(q)}`);
    }
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    router.push("/login");
  };

  const userName = profile?.fullName || user?.email?.split("@")[0] || "Farmer";
  const userEmail = profile?.email || user?.email || "";
  const initial = (userName || userEmail || "A").charAt(0).toUpperCase();

  return (
    <header className="flex justify-between items-center px-4 lg:px-8 py-3 w-full h-16 lg:h-20 sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 transition-all">
      {/* Mobile/Tablet Menu Button & Brand */}
      <div className="flex items-center gap-3 xl:hidden">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="touch-target w-11 h-11 rounded-2xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        )}

        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center p-1 shadow-xs overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.png"
              alt="AgriSight"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-lg font-black text-on-surface tracking-tight">AgriSight</span>
        </Link>
      </div>

      {/* Global Search — desktop & tablet */}
      <form
        onSubmit={handleSearch}
        className="flex-1 max-w-xl hidden md:flex items-center justify-center mx-4"
      >
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            id="global-search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-surface-container-high border-none rounded-full focus:ring-2 focus:ring-primary/40 focus:bg-surface transition-all text-on-surface font-semibold placeholder:text-on-surface-variant/60 shadow-sm text-xs sm:text-sm outline-none"
            placeholder={t("searchPlaceholder")}
            type="text"
            aria-label="Search crops, pests, or records"
          />
        </div>
      </form>

      {/* Right Action Icons: Language, Alerts & Profile Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
        {/* Language Switcher — hidden on mobile (available in profile dropdown) */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          aria-label="Select application language"
          className="hidden md:block bg-surface-container-high border border-outline-variant/30 rounded-full px-3 py-1.5 text-xs font-black text-on-surface cursor-pointer outline-none focus:ring-2 focus:ring-primary/40 shadow-sm hover:bg-surface-container-highest transition-colors"
        >
          <option value="en">EN</option>
          <option value="hi">हिन्दी</option>
          <option value="bn">বাংলা</option>
        </select>

        {/* Alerts quick link */}
        <Link
          href="/alerts"
          aria-label={t("alerts")}
          className="touch-target w-11 h-11 rounded-full bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-surface-container-highest flex items-center justify-center transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
        </Link>

        {/* Profile Avatar & Interactive Menu (§15) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="User profile menu"
            className="touch-target w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary text-on-primary flex items-center justify-center font-black text-xs sm:text-sm shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-primary/40 overflow-hidden"
          >
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : user?.email ? (
              <span>{initial}</span>
            ) : (
              <span className="material-symbols-outlined text-lg">person</span>
            )}
          </button>

          {/* Profile Menu Dropdown per a2.md §15 */}
          {profileOpen && (
            <div
              role="menu"
              aria-label="User account menu"
              className="absolute right-0 mt-3 w-72 bg-surface-container-low border border-outline-variant/30 rounded-3xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4"
            >
              {/* User Identity */}
              <div className="flex items-center gap-3 p-2 bg-surface-container-highest/60 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-black text-sm shrink-0 shadow-xs overflow-hidden">
                  {profile?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt={userName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-on-surface truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate font-medium">
                    {userEmail}
                  </p>
                </div>
              </div>

              {/* Language Selector */}
              <div className="space-y-1.5 px-1">
                <p className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                  {t("languageLabel")}
                </p>
                <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Select language">
                  {(["en", "hi", "bn"] as Language[]).map((langCode) => (
                    <button
                      key={langCode}
                      type="button"
                      aria-pressed={language === langCode}
                      onClick={() => setLanguage(langCode)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                        language === langCode
                          ? "bg-primary text-on-primary shadow-xs"
                          : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                      }`}
                    >
                      {langCode === "en" ? "EN" : langCode === "hi" ? "हिन्दी" : "বাংলা"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 pt-1 border-t border-outline-variant/20">
                <Link
                  href="/profile"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container-highest focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-colors"
                >
                  <span className="material-symbols-outlined text-base text-primary" aria-hidden="true">
                    settings
                  </span>
                  <span>{t("manageProfileSettings")}</span>
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-error hover:bg-error-container/40 focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">logout</span>
                  <span>{t("signOut")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
