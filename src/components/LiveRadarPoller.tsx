// src/components/LiveRadarPoller.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Radio } from "lucide-react";

export default function LiveRadarPoller({
  intervalSec = 15,
}: {
  intervalSec?: number;
}) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(intervalSec);
  const [isPending, startTransition] = useTransition();

  const handleManualRefresh = () => {
    setCountdown(intervalSec);
    startTransition(() => {
      router.refresh();
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          startTransition(() => {
            router.refresh();
          });
          return intervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, intervalSec]);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="flex items-center gap-1.5">
        <Radio className="w-3 h-3 text-emerald-400" />
        <span>RADAR LIVE ({countdown}s)</span>
      </span>
      <button
        onClick={handleManualRefresh}
        disabled={isPending}
        className="ml-1 text-neutral-400 hover:text-white transition-colors"
        title="Refresh data sekarang"
      >
        <RefreshCw
          className={`w-3 h-3 ${isPending ? "animate-spin text-emerald-400" : ""}`}
        />
      </button>
    </div>
  );
}
