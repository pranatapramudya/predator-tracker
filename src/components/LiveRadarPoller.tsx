// src/components/LiveRadarPoller.tsx
"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Radio } from "lucide-react";

/**
 * Global Poller Coordinator (Singleton)
 * Coordinates interval countdown and background refresh across both
 * desktop header and mobile status bar so only 1 timer is ever active.
 */
let globalCountdown = 15;
let globalIntervalSec = 15;
const subscribers = new Set<(sec: number) => void>();
let isTimerRunning = false;
let globalRefreshCallback: (() => void) | null = null;

function notifySubscribers(val: number) {
  globalCountdown = val;
  subscribers.forEach((fn) => fn(val));
}

function isOperatorInteracting(): boolean {
  if (typeof document === "undefined") return false;
  const active = document.activeElement;
  if (!active) return false;
  const tag = active.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return true;
  }
  if (
    document.querySelector('[role="dialog"]') ||
    document.querySelector(".modal-open")
  ) {
    return true;
  }
  return false;
}

function initGlobalTimer(intervalSec: number) {
  if (isTimerRunning) return;
  isTimerRunning = true;
  globalIntervalSec = intervalSec;
  globalCountdown = intervalSec;

  setInterval(() => {
    if (globalCountdown <= 1) {
      // If operator is typing or modal is open, defer refresh for 5 seconds
      if (isOperatorInteracting()) {
        notifySubscribers(5);
        return;
      }

      if (globalRefreshCallback) {
        globalRefreshCallback();
      }
      notifySubscribers(globalIntervalSec);
    } else {
      notifySubscribers(globalCountdown - 1);
    }
  }, 1000);
}

export default function LiveRadarPoller({
  intervalSec = 15,
}: {
  intervalSec?: number;
}) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(globalCountdown);
  const [isPending, startTransition] = useTransition();

  const triggerBackgroundRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  useEffect(() => {
    globalRefreshCallback = triggerBackgroundRefresh;
    subscribers.add(setCountdown);
    initGlobalTimer(intervalSec);

    return () => {
      subscribers.delete(setCountdown);
    };
  }, [triggerBackgroundRefresh, intervalSec]);

  const handleManualRefresh = () => {
    notifySubscribers(intervalSec);
    triggerBackgroundRefresh();
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider select-none">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      <span className="flex items-center gap-1.5">
        <Radio className="w-3 h-3 text-emerald-400" />
        <span className="text-white font-bold font-mono">
          RADAR LIVE <span className="text-emerald-400">({countdown}s)</span>
        </span>
      </span>
      <button
        onClick={handleManualRefresh}
        disabled={isPending}
        className="ml-1 text-zinc-300 hover:text-white transition-colors cursor-pointer"
        title="Refresh data sekarang"
        type="button"
      >
        <RefreshCw
          className={`w-3 h-3 ${isPending ? "animate-spin text-emerald-400" : ""}`}
        />
      </button>
    </div>
  );
}
