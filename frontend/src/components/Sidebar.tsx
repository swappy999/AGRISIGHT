"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, profile, logout } = useAuth();

  const navItems = [
    { name: t("home"), href: "/dashboard", icon: "space_dashboard" },
    { name: t("fields"), href: "/fields", icon: "grid_view" },
    { name: t("crops"), href: "/crops", icon: "eco" },
    { name: t("scanLeaf"), href: "/scan", icon: "energy_savings_leaf" },
    { name: t("alerts"), href: "/alerts", icon: "notifications" },
    { name: t("analytics"), href: "/analytics", icon: "insights" },
    { name: t("profile"), href: "/profile", icon: "person" },
  ];

  const handleLogout = async () => {
    await logout();
    if (onCloseMobile) onCloseMobile();
    router.push("/login");
  };

  const isRouteActive = (itemHref: string) => {
    if (itemHref === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    if (itemHref === "/analytics") {
      return pathname.startsWith("/analytics") || pathname.startsWith("/history");
    }
    if (itemHref === "/profile") {
      return pathname.startsWith("/profile") || pathname.startsWith("/settings");
    }
    return pathname.startsWith(itemHref);
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="flex items-center justify-between gap-3 mb-8 px-4 mt-2">
        <Link
          href="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-3.5 group"
        >
          <div className="w-11 h-11 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.png"
              alt="AgriSight Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-on-surface leading-none tracking-tight">
              AgriSight
            </h1>
            <p className="text-[11px] font-bold tracking-wider uppercase text-primary mt-0.5">
              {t("precisionFarming")}
            </p>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="xl:hidden w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav aria-label="Main navigation" className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const isActive = isRouteActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3.5 px-4 sm:px-5 py-4 rounded-2xl transition-all duration-200 group font-bold text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                isActive
                  ? "bg-primary text-on-primary shadow-md shadow-primary/20 scale-[0.99]"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/60"
              }`}
            >
              <span
                aria-hidden="true"
                className={`material-symbols-outlined text-xl transition-transform duration-200 ${
                  isActive ? "scale-110" : "group-hover:scale-110"
                }`}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="tracking-tight truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Account / New Scan */}
      <div className="mt-auto pt-6 px-1 space-y-3 shrink-0">
        {user && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-highest/60 border border-outline-variant/20">
            <Link
              href="/profile"
              onClick={onCloseMobile}
              className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                {profile?.fullName?.charAt(0).toUpperCase() ||
                  user.email?.charAt(0).toUpperCase() ||
                  "A"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-on-surface truncate">
                  {profile?.fullName || t("farmer")}
                </p>
                <p className="text-[10px] text-on-surface-variant font-semibold truncate">
                  {profile?.email || user.email}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-on-surface-variant hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
              aria-label={t("signOut")}
              title={t("signOut")}
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            router.push("/scan");
          }}
          className="w-full py-3.5 bg-primary text-on-primary rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 outline-none text-sm"
          aria-label="Start a new leaf scan"
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            energy_savings_leaf
          </span>
          {t("newAnalysis")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden xl:flex flex-col p-6 h-screen w-72 sticky top-0 left-0 bg-surface-container-low/95 backdrop-blur-2xl border-r border-outline-variant/30 z-40 shrink-0">
        {navContent}
      </aside>

      {/* ── Mobile & Tablet Slide-over Drawer ── */}
      {mobileOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer sheet */}
          <div className="relative w-[300px] max-w-[85vw] h-full bg-surface-container-low p-6 shadow-2xl border-r border-outline-variant/30 flex flex-col z-10 transition-transform duration-300 animate-in slide-in-from-left duration-300">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
