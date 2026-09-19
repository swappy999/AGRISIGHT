"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export function useCapacitorBackButton(onBackCustom?: () => boolean) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapApp.addListener("backButton", ({ canGoBack }) => {
      // 1. Check custom handler (e.g., closing drawers/modals/assistants)
      if (onBackCustom && onBackCustom()) {
        return;
      }

      // 2. If on root landing or main dashboard, minimize app gracefully
      if (pathname === "/" || pathname === "/dashboard" || pathname === "/login") {
        CapApp.minimizeApp();
        return;
      }

      // 3. Navigate back through the stack
      if (canGoBack) {
        router.back();
      } else {
        router.push("/dashboard");
      }
    });

    return () => {
      listenerPromise.then((handle) => handle.remove());
    };
  }, [router, pathname, onBackCustom]);
}
