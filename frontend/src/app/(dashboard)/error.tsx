"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language, t } = useTranslation();

  useEffect(() => {
    console.warn("Dashboard route error boundary caught:", error);
  }, [error]);

  const titles = {
    en: "Unable to load dashboard section",
    hi: "डैशबोर्ड अनुभाग लोड करने में असमर्थ",
    bn: "ড্যাশবোর্ড বিভাগ লোড করতে অক্ষম",
  };

  const descriptions = {
    en: "An issue occurred while retrieving this section. Your farm data is intact and you can reload or navigate to other areas.",
    hi: "इस अनुभाग को प्राप्त करने में समस्या आई। आपका कृषि डेटा सुरक्षित है और आप पुनः प्रयास कर सकते हैं।",
    bn: "এই বিভাগটি লোড করতে সমস্যা হয়েছে। আপনার খামারের তথ্য নিরাপদ রয়েছে এবং আপনি পুনরায় চেষ্টা করতে পারেন।",
  };

  return (
    <div className="p-4 sm:p-8 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full bg-surface-container-low border border-outline-variant/30 rounded-[2.5rem] p-6 sm:p-10 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            report_problem
          </span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
            {titles[language as keyof typeof titles] || titles.en}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed">
            {descriptions[language as keyof typeof descriptions] || descriptions.en}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 py-3 px-4 bg-primary text-on-primary font-bold rounded-2xl shadow-sm hover:bg-primary/90 transition-all active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>{t("retry")}</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:flex-1 py-3 px-4 bg-surface-container-high text-on-surface font-bold rounded-2xl hover:bg-surface-container-highest transition-all active:scale-95 text-xs sm:text-sm flex items-center justify-center gap-2 border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-base">grid_view</span>
            <span>{t("home")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
