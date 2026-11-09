// src/app/not-found.tsx
import React from "react";
import Link from "next/link";
import { Radio, ChevronRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
        <Radio className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-pulse" />

        <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
          TARGET 404 // NOT FOUND
        </span>

        <h2 className="text-xl font-black uppercase tracking-tight text-white mt-4 mb-2">
          Koordinat Tidak Ditemukan
        </h2>

        <p className="text-xs text-zinc-200 mb-6 font-medium">
          Halaman atau koordinat radar yang Anda tuju tidak berada dalam
          jangkauan pemantauan sistem.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <span>Kembali ke Watchlist Radar</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </main>
  );
}
