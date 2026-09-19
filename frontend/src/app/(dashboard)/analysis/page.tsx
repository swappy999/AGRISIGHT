"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnalysisDetailClient } from "./[id]/AnalysisDetailClient";

function AnalysisPageWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  useEffect(() => {
    if (!id) {
      router.replace("/history");
    }
  }, [id, router]);

  if (!id) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-primary animate-pulse">energy_savings_leaf</span>
        </div>
      </div>
    );
  }

  return <AnalysisDetailClient />;
}

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-primary animate-pulse">energy_savings_leaf</span>
          </div>
        </div>
      }
    >
      <AnalysisPageWrapper />
    </Suspense>
  );
}

