// src/components/LiveRadarPoller.tsx
"use client";

import { useEffect, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * ⚡ Headless Ultra-Lightweight Background Poller
 * - Zero 1-second interval state rerenders.
 * - Gentle 60s background refresh.
 * - Never interrupts user interaction (delays refresh if user is scrolling or touching).
 * - Instant refresh when user returns to foreground tab.
 */
export default function LiveRadarPoller({
  intervalSec = 60,
}: {
  intervalSec?: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const lastInteractionRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleInteraction = () => {
      lastInteractionRef.current = Date.now();
    };

    window.addEventListener("touchstart", handleInteraction, { passive: true });
    window.addEventListener("scroll", handleInteraction, { passive: true });
    window.addEventListener("click", handleInteraction, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("click", handleInteraction);
    };
  }, []);

  const triggerRefresh = useCallback(() => {
    // Only refresh if document is in foreground
    if (typeof document !== "undefined" && document.hidden) return;

    // Don't refresh if user interacted within the last 10 seconds (prevents scroll/touch stutter)
    if (Date.now() - lastInteractionRef.current < 10000) return;

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
    const intervalMs = Math.max(45, intervalSec) * 1000;
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
