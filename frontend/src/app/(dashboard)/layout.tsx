"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { Sidebar } from "@/components/Sidebar";
import { TopAppBar } from "@/components/TopAppBar";
import { BottomNav } from "@/components/BottomNav";
import { NetworkStatusBar } from "@/components/NetworkStatusBar";
import { GlobalAssistant } from "@/components/GlobalAssistant";
import { useCapacitorBackButton } from "@/hooks/useCapacitorBackButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isVerified } = useAuth();
  const { language } = useTranslation();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useCapacitorBackButton(() => {
    if (mobileNavOpen) {
      setMobileNavOpen(false);
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isVerified) {
        router.push(`/verify?email=${encodeURIComponent(user.email || "")}`);
      }
    }
  }, [user, isLoading, isVerified, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center p-3 shadow-xl shadow-primary/10 animate-pulse overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.png"
              alt="AgriSight"
              className="w-full h-full object-contain"
            />
          </div>
          <p suppressHydrationWarning className="text-on-surface font-extrabold text-lg tracking-tight">
            {language === "bn" ? "এগ্রিসাইট লোড হচ্ছে..." : language === "hi" ? "एग्रीसाइट लोड हो रहा है..." : "Cultivating AgriSight..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isVerified) {
    return null;
  }

  return (
    <div className="flex w-full h-full min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <NetworkStatusBar />
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col h-full min-h-screen relative overflow-x-hidden min-w-0">
        <TopAppBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main id="main-content" tabIndex={-1} className="flex-1 w-full bg-surface pb-24 xl:pb-6 overflow-x-hidden outline-none">
          {children}
        </main>
        <BottomNav />
        <GlobalAssistant />
      </div>
    </div>
  );
}
