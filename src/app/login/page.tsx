// src/app/login/page.tsx
"use client";

import { useState, useTransition } from "react";
import { loginWithPinAction } from "@/app/actions/auth";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
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
      setError("Please enter your Security PIN.");
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
    <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,9,11,0.85)_100%)] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Terminal Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            SECURE TERMINAL // OPERATOR CLEARANCE
          </div>

          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
            PREDATOR <span className="text-emerald-400">TRACKER</span>
          </h1>

          <p className="text-neutral-400 text-sm font-medium flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Enter Security PIN to unlock radar control</span>
          </p>
        </div>

        {/* Keypad Auth Card */}
        <div className="bg-[#121216] border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative backdrop-blur-xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PIN Display / Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" /> Security
                  Access PIN
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  {showPin ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span>{showPin ? "Hide" : "Show PIN"}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  autoFocus
                  maxLength={12}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError("");
                  }}
                  placeholder="••••"
                  className="w-full bg-[#18181e] border-2 border-neutral-700 focus:border-emerald-400 rounded-2xl px-6 py-4 text-center text-3xl font-mono tracking-[0.4em] font-black outline-none text-white transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-400/20"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm font-medium flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Authentication Notice</p>
                  <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  disabled={isPending}
                  className="h-14 bg-neutral-900/90 hover:bg-neutral-800 active:bg-emerald-500 active:text-black border border-neutral-700/80 rounded-2xl text-2xl font-bold transition-all flex items-center justify-center text-white"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="h-14 bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 rounded-2xl text-xs font-bold text-neutral-400 hover:text-white transition-all uppercase"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                disabled={isPending}
                className="h-14 bg-neutral-900/90 hover:bg-neutral-800 active:bg-emerald-500 active:text-black border border-neutral-700/80 rounded-2xl text-2xl font-bold transition-all flex items-center justify-center text-white"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={isPending}
                className="h-14 bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 rounded-2xl text-xl font-bold text-neutral-400 hover:text-white transition-all flex items-center justify-center"
              >
                ⌫
              </button>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-black uppercase tracking-wider rounded-2xl text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 group"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>VERIFYING PIN...</span>
                </>
              ) : (
                <>
                  <span>UNLOCK RADAR CONTROL</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badges */}
          <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Encrypted
              Session
            </span>
            <span className="font-mono text-[11px] text-neutral-600">
              Restricted Access Only
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
