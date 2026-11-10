// src/components/LiveRadarPoller.tsx
"use client";

import { useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * ⚡ Headless Ultra-Lightweight Background Poller
 * Zero 1-second interval state rerenders.
 * Only refreshes when page is actively visible, not interacting, and after a gentle interval (45s).
 */
export default function LiveRadarPoller({
  intervalSec = 45,
}: {
  intervalSec?: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const triggerRefresh = useCallback(() => {
    // Only refresh if document is in foreground
    if (typeof document !== "undefined" && document.hidden) return;

    // Don't refresh if user is typing in search or an input
    const active =
      typeof document !== "undefined" ? document.activeElement : null;
    if (
      active &&
      (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
    ) {
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  useEffect(() => {
    // Polling interval (gentle 45s, zero 1s rerenders)
    const intervalMs = Math.max(30, intervalSec) * 1000;
    const timer = setInterval(triggerRefresh, intervalMs);

    // Refresh when user returns to the tab after being away
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerRefresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [triggerRefresh, intervalSec]);

  // Headless: renders nothing into DOM
  return null;
}
