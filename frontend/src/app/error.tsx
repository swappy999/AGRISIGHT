"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [lang, setLang] = useState<"en" | "hi" | "bn">("en");

  useEffect(() => {
    console.warn("Global application error boundary caught:", error);
    try {
      const stored = localStorage.getItem("agrisight_language");
      if (stored === "hi" || stored === "bn" || stored === "en") {
        setLang(stored);
      }
    } catch {}
  }, [error]);

  const titles = {
    en: "Something went wrong",
    hi: "कुछ अप्रत्याशित समस्या आई",
    bn: "একটি অপ্রত্যাশিত সমস্যা হয়েছে",
  };

  const descriptions = {
    en: "We encountered an issue loading this screen. Don't worry, your farm records and scan data are safe!",
    hi: "इस स्क्रीन को लोड करने में समस्या आई। चिंता न करें, आपकी फसल और स्कैन डेटा पूरी तरह सुरक्षित है!",
    bn: "এই স্ক্রিনটি লোড করতে সমস্যা হয়েছে। চিন্তা করবেন না, আপনার ফসলের তথ্য ও স্ক্যান ডেটা সম্পূর্ণ নিরাপদ!",
  };

  const tryAgainLabels = {
    en: "Try Again",
    hi: "पुनः प्रयास करें",
    bn: "আবার চেষ্টা করুন",
  };

  const backHomeLabels = {
    en: "Back to Dashboard",
    hi: "डैशबोर्ड पर वापस जाएं",
    bn: "ড্যাশবোর্ডে ফিরে যান",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="max-w-md w-full bg-surface-container-low rounded-[3rem] p-8 sm:p-12 text-center space-y-7 shadow-xl border border-outline-variant/20">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-md">
          <span
            className="material-symbols-outlined text-4xl sm:text-5xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            spa
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            {titles[lang]}
          </h1>
          <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
            {descriptions[lang]}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3.5 sm:py-4 bg-primary text-on-primary font-bold rounded-2xl shadow-md hover:bg-primary/90 transition-all active:scale-95 text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            <span>{tryAgainLabels[lang]}</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full py-3.5 sm:py-4 bg-surface-container-highest text-on-surface font-bold rounded-2xl hover:bg-surface-container-high transition-all active:scale-95 text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            <span>{backHomeLabels[lang]}</span>
          </Link>
        </div>

        {error.digest && (
          <p className="text-[11px] text-on-surface-variant/40 font-mono">
            Ref: #{error.digest.slice(0, 10)}
          </p>
        )}
      </div>
    </div>
  );
}
