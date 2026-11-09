// src/app/login/page.tsx
"use client";

import { useState, useTransition } from "react";
import { loginWithPinAction } from "@/app/actions/auth";
import {
  Lock,
  ShieldAlert,
  Terminal,
  KeyRound,
  ChevronRight,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleKeyPress = (num: string) => {
    if (pin.length < 10) {
      setPin((prev) => prev + num);
      setError("");
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setError("Please enter your Master PIN.");
      return;
    }

    setError("");
    startTransition(async () => {
      const res = await loginWithPinAction(pin);
      if (res?.error) {
        setError(res.error);
        setPin("");
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,9,11,0.8)_100%)] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Terminal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-[0.25em] uppercase mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SECURE TERMINAL // SINGLE-OPERATOR
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
            PREDATOR <span className="text-emerald-400">TRACKER</span>
          </h1>
          <p className="text-neutral-400 text-xs font-mono uppercase tracking-widest mt-2 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> System Locked //
            Enter Master PIN
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#121215] border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PIN Display / Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block ml-1">
                OPERATOR CLEARANCE PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  maxLength={12}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError("");
                  }}
                  placeholder="••••"
                  className="w-full bg-[#18181c] border border-neutral-800 rounded-2xl px-5 py-4 text-center text-2xl font-mono tracking-[0.4em] font-black outline-none text-white focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-neutral-700"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">
                  <KeyRound className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono animate-in fade-in slide-in-from-top-1">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Numeric Keypad (Optimized for Mobile/Touch) */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  disabled={isPending}
                  className="h-12 bg-neutral-900/80 hover:bg-neutral-800 active:bg-emerald-500 active:text-black border border-neutral-800 rounded-xl text-lg font-mono font-bold transition-all flex items-center justify-center text-white"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="h-12 bg-neutral-900/40 hover:bg-neutral-800/80 active:bg-neutral-700 border border-neutral-800/80 rounded-xl text-xs font-mono font-bold text-neutral-400 hover:text-white transition-all flex items-center justify-center uppercase"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                disabled={isPending}
                className="h-12 bg-neutral-900/80 hover:bg-neutral-800 active:bg-emerald-500 active:text-black border border-neutral-800 rounded-xl text-lg font-mono font-bold transition-all flex items-center justify-center text-white"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={isPending}
                className="h-12 bg-neutral-900/40 hover:bg-neutral-800/80 active:bg-neutral-700 border border-neutral-800/80 rounded-xl text-xs font-mono font-bold text-neutral-400 hover:text-white transition-all flex items-center justify-center uppercase"
              >
                ⌫
              </button>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-black font-mono uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 group mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>VERIFYING PIN...</span>
                </>
              ) : (
                <>
                  <span>UNLOCK RADAR CONTROL</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 pt-5 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-500">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-emerald-400" /> Default PIN:
              2026
            </span>
            <span>ENV: ADMIN_PIN</span>
          </div>
        </div>
      </div>
    </main>
  );
}
