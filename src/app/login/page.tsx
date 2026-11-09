// src/app/login/page.tsx
"use client";

import { useState, useTransition } from "react";
import { loginWithPinAction, updatePinAction } from "@/app/actions/auth";
import {
  Lock,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ChevronRight,
  KeyRound,
  Loader2,
  Settings,
} from "lucide-react";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(true); // Default visible so user can see clearly
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Settings / Change PIN state
  const [showSettings, setShowSettings] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");

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

  const handleQuickFill = () => {
    setPin("2026");
    setError("");
    startTransition(async () => {
      const res = await loginWithPinAction("2026");
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setError("Silakan masukkan PIN Anda.");
      return;
    }

    setError("");
    startTransition(async () => {
      const res = await loginWithPinAction(pin);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPin || !newPin) {
      setError("Isi PIN lama dan PIN baru.");
      return;
    }

    setError("");
    startTransition(async () => {
      const res = await updatePinAction(oldPin, newPin);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            RADAR PREDATOR // PRIVAT
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
            PREDATOR <span className="text-emerald-400">TRACKER</span>
          </h1>
          <p className="text-neutral-300 text-sm md:text-base font-medium">
            🔐 Masuk Menggunakan Master Security PIN
          </p>
        </div>

        {/* Info Card: Why PIN instead of Clerk */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-neutral-200 text-sm flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white text-sm">
              Sistem Akses Pribadi (Tanpa Daftar Email)
            </p>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Karena aplikasi ini dipakai untuk diri sendiri, sistem signup
              Clerk yang ribet sudah diganti dengan <strong>PIN Utama</strong>.
              Cukup masukkan PIN untuk langsung mengakses radar.
            </p>
          </div>
        </div>

        {/* Quick Fill Button */}
        <button
          type="button"
          onClick={handleQuickFill}
          disabled={isPending}
          className="w-full py-3 px-4 bg-emerald-950/60 hover:bg-emerald-900/80 active:bg-emerald-800 border-2 border-emerald-500/60 hover:border-emerald-400 rounded-2xl text-emerald-300 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>⚡ KLIK DISINI: Masuk Otomatis Pakai PIN Default (2026)</span>
        </button>

        {/* Main Card */}
        <div className="bg-[#141418] border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          {!showSettings ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PIN Input Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-neutral-200 uppercase tracking-wide flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-400" /> Masukkan
                    PIN Anda:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 transition-colors"
                  >
                    {showPin ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{showPin ? "Sembunyikan" : "Tampilkan PIN"}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    autoFocus
                    maxLength={10}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setError("");
                    }}
                    placeholder="Contoh: 2026"
                    className="w-full bg-[#1c1c22] border-2 border-neutral-700 focus:border-emerald-400 rounded-2xl px-6 py-4 text-center text-3xl font-mono tracking-widest font-black outline-none text-white transition-all placeholder:text-neutral-600 placeholder:text-lg"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-sm font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">{error}</p>
                    <p className="text-xs text-rose-300/90">
                      💡 Coba ketik angka <strong>2026</strong> atau klik tombol
                      hijau di atas untuk login instan.
                    </p>
                  </div>
                </div>
              )}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2.5">
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
                  HAPUS
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
                  className="h-14 bg-neutral-900/50 hover:bg-neutral-800 border border-neutral-800 rounded-2xl text-lg font-bold text-neutral-400 hover:text-white transition-all flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>

              {/* Unlock Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-black uppercase tracking-wider rounded-2xl text-base transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>MEMVERIFIKASI PIN...</span>
                  </>
                ) : (
                  <>
                    <span>BUKA KONTROL RADAR</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Change PIN Form */
            <form
              onSubmit={handleUpdatePin}
              className="space-y-5 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-400" />
                  Atur / Ganti Master PIN
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Kembali
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300">
                  PIN Lama / Saat Ini (Default: 2026):
                </label>
                <input
                  type="text"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="2026"
                  className="w-full bg-[#1c1c22] border border-neutral-700 rounded-xl px-4 py-3 font-mono text-lg text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300">
                  PIN Baru (Minimal 4 Angka/Karakter):
                </label>
                <input
                  type="text"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Contoh: 8899"
                  className="w-full bg-[#1c1c22] border border-neutral-700 rounded-xl px-4 py-3 font-mono text-lg text-white outline-none focus:border-emerald-400"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-xl text-sm transition-all"
              >
                {isPending ? "Menyimpan PIN..." : "Simpan PIN Baru & Masuk"}
              </button>
            </form>
          )}

          {/* Settings Toggle Footer */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
            <span>Operator: Master Single-User</span>
            <button
              type="button"
              onClick={() => {
                setShowSettings(!showSettings);
                setError("");
              }}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline"
            >
              {showSettings ? "← Kembali ke Login" : "⚙️ Ganti / Atur PIN Baru"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
