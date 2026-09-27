"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";
import { useTranslation } from "@/context/LanguageContext";

export function NetworkStatusBar() {
  const { language } = useTranslation();
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    let removeListener: (() => void) | null = null;

    const handleStatus = (connected: boolean) => {
      setIsOnline((prev) => {
        if (!prev && connected) {
          setShowReconnected(true);
          setTimeout(() => setShowReconnected(false), 4000);
        }
        return connected;
      });
    };

    if (Capacitor.isNativePlatform()) {
      Network.getStatus().then((status) => {
        setIsOnline(status.connected);
      });

      Network.addListener("networkStatusChange", (status) => {
        handleStatus(status.connected);
      }).then((handle) => {
        removeListener = () => handle.remove();
      });
    } else if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const onOnline = () => handleStatus(true);
      const onOffline = () => handleStatus(false);

      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);

      removeListener = () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }

    return () => {
      if (removeListener) removeListener();
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  const offlineTitle =
    language === "bn"
      ? "সংযোগ করতে অক্ষম"
      : language === "hi"
        ? "कनेक्ट करने में असमर्थ"
        : "Unable to Connect";

  const offlineMessage =
    language === "bn"
      ? "আপনার ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।"
      : language === "hi"
        ? "अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।"
        : "Check your internet connection and try again.";

  const onlineTitle =
    language === "bn"
      ? "সংযোগ ফিরে এসেছে"
      : language === "hi"
        ? "कनेक्शन बहाल"
        : "Connection Restored";

  const onlineMessage =
    language === "bn"
      ? "AgriSight ক্লাউডের সাথে সংযুক্ত।"
      : language === "hi"
        ? "AgriSight क्लाउड से पुनः कनेक्ट हो गया।"
        : "Connected to AgriSight cloud.";

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md animate-in slide-in-from-top-4 duration-300 pointer-events-none">
      {!isOnline ? (
        <div className="bg-rose-700/95 text-white backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 pointer-events-auto border border-rose-500/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-lg shrink-0 animate-pulse">
              cloud_off
            </span>
            <div className="min-w-0 text-left">
              <p className="text-xs font-black leading-none">{offlineTitle}</p>
              <p className="text-[11px] opacity-90 truncate mt-0.5 font-medium">
                {offlineMessage}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-wider shrink-0">
            {language === "bn" ? "অফলাইন" : language === "hi" ? "ऑफ़लाइन" : "Offline"}
          </span>
        </div>
      ) : (
        <div className="bg-emerald-600/95 text-white backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 pointer-events-auto border border-emerald-400/30">
          <span className="material-symbols-outlined text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            wifi
          </span>
          <div className="min-w-0 text-left">
            <p className="text-xs font-black leading-none">{onlineTitle}</p>
            <p className="text-[11px] opacity-90 truncate mt-0.5 font-medium">
              {onlineMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
