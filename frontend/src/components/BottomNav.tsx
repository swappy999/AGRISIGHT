"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const leftNavItems = [
    { name: t("home"), href: "/dashboard", icon: "space_dashboard" },
    { name: t("fields"), href: "/fields", icon: "grid_view" },
  ];

  const rightNavItems = [
    { name: t("askAgriSight"), href: "/assistant", icon: "chat_bubble" },
    { name: t("profile"), href: "/profile", icon: "person" },
  ];

  const isScanActive = pathname === "/scan";

  return (
    <nav
      className="xl:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low/95 backdrop-blur-xl border-t border-outline-variant/30 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      aria-label="Main navigation"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-end justify-between px-1 h-20 max-w-lg mx-auto">
        {/* Left nav items: Home, Fields */}
        <div className="flex items-center justify-around flex-1">
          {leftNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname === "/") ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.name}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 transition-all duration-300 ${
                  isActive ? "text-primary font-bold" : "text-on-surface-variant font-medium"
                }`}
              >
                <div
                  className={`px-2.5 py-1 rounded-full transition-all ${
                    isActive ? "bg-primary-container text-on-primary-container" : ""
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-black tracking-tight truncate max-w-[4.5rem] text-center ${
                    isActive ? "opacity-100" : "opacity-70"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Center Scan FAB */}
        <div className="flex flex-col items-center justify-end pb-2 px-2 relative -mt-5 shrink-0">
          <Link
            href="/scan"
            aria-label={t("scanLeaf")}
            aria-current={isScanActive ? "page" : undefined}
            className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 active:scale-90 ${
              isScanActive
                ? "bg-primary text-on-primary shadow-primary/40 scale-105"
                : "bg-primary text-on-primary shadow-primary/30 hover:shadow-primary/50"
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              energy_savings_leaf
            </span>
          </Link>
          <span className="text-[10px] font-black text-on-surface-variant mt-1">
            {t("scanLeaf")}
          </span>
        </div>

        {/* Right nav items: Ask AgriSight, Profile */}
        <div className="flex items-center justify-around flex-1">
          {rightNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.name}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 transition-all duration-300 ${
                  isActive ? "text-primary font-bold" : "text-on-surface-variant font-medium"
                }`}
              >
                <div
                  className={`px-2.5 py-1 rounded-full transition-all ${
                    isActive ? "bg-primary-container text-on-primary-container" : ""
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-black tracking-tight truncate max-w-[4.5rem] text-center ${
                    isActive ? "opacity-100" : "opacity-70"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
