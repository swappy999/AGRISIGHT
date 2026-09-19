"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (Capacitor.isNativePlatform() || user)) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex flex-col min-h-screen bg-surface w-full">
      <header className="flex justify-between items-center px-6 py-4 fixed top-0 w-full bg-surface/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center p-1 shadow-sm overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="AgriSight" className="w-full h-full object-contain" />
          </div>
          <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-50">AgriSight</span>
        </div>
        
        <Link 
          href="/login" 
          className="px-6 py-2 bg-primary text-on-primary font-bold rounded-full hover:opacity-90 transition-all shadow-md active:scale-95"
        >
          Login
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 mt-20">
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="w-28 h-28 mx-auto bg-surface-container-lowest border border-outline-variant/30 rounded-[2rem] flex items-center justify-center p-3 shadow-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="AgriSight" className="w-full h-full object-contain" />
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-on-surface tracking-tight leading-tight">
            Cultivating <br className="hidden lg:block"/>
            <span className="text-primary">Intelligence</span>
          </h1>
          
          <p className="text-xl text-on-surface-variant font-medium max-w-2xl mx-auto">
            The AI-powered health monitoring platform for modern agriculture. Instant crop analysis, real-time alerts, and predictive insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link 
              href="/dashboard" 
              className="px-8 py-4 bg-primary text-on-primary font-bold text-lg rounded-full shadow-lg shadow-primary/30 hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Start Analysis
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link 
              href="/signup" 
              className="px-8 py-4 bg-surface-container-highest text-on-surface font-bold text-lg rounded-full shadow-sm hover:surface-dim transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-on-surface-variant font-medium text-sm">
        © {new Date().getFullYear()} AgriSight. Cultivated Workspace.
      </footer>
    </div>
  );
}
