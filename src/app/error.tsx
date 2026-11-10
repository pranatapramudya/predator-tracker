// src/app/error.tsx
"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Terminal } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PREDATOR TERMINAL ERROR]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6 selection:bg-rose-500 selection:text-black">
      <div className="w-full max-w-lg bg-[#18181b] border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(244,63,94,0.2)] text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[40px] rounded-full pointer-events-none" />

        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5">
          <AlertTriangle className="w-7 h-7 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-semibold mb-3">
          <Terminal className="w-3 h-3" />
          <span>RADAR CORE EXCEPTION</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white mb-2">
          Telemetri Terganggu
        </h2>

        <p className="text-xs text-zinc-200 leading-relaxed max-w-sm mx-auto mb-6 font-medium">
          Terjadi gangguan saat menghubungkan database atau node on-chain.
          Sistem keamanan mengisolasi error ini untuk melindungi sesi Anda.
        </p>

        {error?.message && (
          <div className="bg-black/60 border border-white/10 rounded-xl p-3 text-left font-mono text-[11px] text-zinc-300 mb-6 truncate">
            <span className="text-rose-400 font-bold">Error:</span>{" "}
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset & Pulihkan Radar</span>
          </button>
        </div>
      </div>
    </main>
  );
}
