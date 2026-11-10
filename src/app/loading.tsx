// src/app/loading.tsx
import React from "react";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6">
      <div className="relative flex flex-col items-center">
        {/* Radar Ping Animation */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping opacity-75" />
          <div className="absolute inset-2 rounded-full border border-emerald-500/50 animate-pulse" />
          <div className="w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,1)]" />
        </div>

        {/* Cyber Loading Text */}
        <div className="mt-8 text-center space-y-2">
          <h2 className="text-sm font-bold tracking-[0.25em] uppercase text-white font-mono">
            SYNCING PREDATOR RADAR
          </h2>
          <p className="text-xs text-zinc-300 font-mono">
            Scanning on-chain smart money liquidity...
          </p>
        </div>

        {/* Skeleton Card Placeholders */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full max-w-4xl opacity-30 pointer-events-none">
          <div className="h-44 bg-zinc-900 border border-white/10 rounded-3xl animate-pulse" />
          <div className="h-44 bg-zinc-900 border border-white/10 rounded-3xl animate-pulse" />
          <div className="h-44 bg-zinc-900 border border-white/10 rounded-3xl animate-pulse" />
        </div>
      </div>
    </main>
  );
}
