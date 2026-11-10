// src/app/login/page.tsx
"use client";

import { useState, useTransition } from "react";
import {
  loginWithPinAction,
  registerAction,
  resetPinAction,
} from "@/app/actions/auth";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  User,
  Mail,
  UserPlus,
  Key,
  CheckCircle2,
  LogIn,
} from "lucide-react";

type AuthMode = "LOGIN" | "REGISTER" | "FORGOT";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("LOGIN");
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setSuccessMsg("");
    setPin("");
  };

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
    setError("");
    setSuccessMsg("");

    if (!pin) {
      setError("Silakan masukkan Security PIN Anda.");
      return;
    }

    startTransition(async () => {
      if (mode === "LOGIN") {
        const res = await loginWithPinAction(pin, identifier);
        if (res?.error) {
          setError(res.error);
          setPin("");
        }
      } else if (mode === "REGISTER") {
        if (!name.trim()) {
          setError("Silakan masukkan Nama Operator Anda.");
          return;
        }
        if (!email.trim() || !email.includes("@")) {
          setError("Silakan masukkan Email valid Anda.");
          return;
        }
        if (pin.length < 4) {
          setError("PIN Keamanan minimal 4 digit angka.");
          return;
        }
        const res = await registerAction(name, email, pin);
        if (res?.error) {
          setError(res.error);
        }
      } else if (mode === "FORGOT") {
        if (!email.trim() || !email.includes("@")) {
          setError("Silakan masukkan Email akun terdaftar.");
          return;
        }
        if (pin.length < 4) {
          setError("PIN Baru minimal 4 digit angka.");
          return;
        }
        const res = await resetPinAction(email, pin);
        if (res?.error) {
          setError(res.error);
        } else if (res?.success) {
          setSuccessMsg(
            "PIN berhasil diperbarui! Silakan masuk dengan PIN baru Anda.",
          );
          setIdentifier(email);
          setMode("LOGIN");
          setPin("");
        }
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#061a1d] text-white flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans selection:bg-[#a3f784] selection:text-[#061a1d]">
      {/* Background Ambience ala Floq */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#a3f784]/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(6,26,29,0.85)_100%)] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Floq-Style Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#a3f784]/15 border border-[#a3f784]/30 text-[#a3f784] text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(163,247,132,0.15)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a3f784]" />
            SECURE TERMINAL // MULTI-TENANT CLEARANCE
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-white">
            PREDATOR <span className="text-[#a3f784]">TRACKER</span>
          </h1>

          <p className="text-[#9bb8b5] text-xs sm:text-sm font-medium flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#a3f784]" />
            <span>
              {mode === "LOGIN" && "Enter Security PIN to unlock radar control"}
              {mode === "REGISTER" &&
                "Create isolated multi-tenant operator workspace"}
              {mode === "FORGOT" && "Reset your operator security access PIN"}
            </span>
          </p>
        </div>

        {/* Clean White Floq Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl relative space-y-5 sm:space-y-6 text-slate-900">
          {/* Top Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => switchMode("LOGIN")}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "LOGIN"
                  ? "bg-[#061a1d] text-[#a3f784] font-bold shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode("REGISTER")}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "REGISTER"
                  ? "bg-[#061a1d] text-[#a3f784] font-bold shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode("FORGOT")}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "FORGOT"
                  ? "bg-[#061a1d] text-[#a3f784] font-bold shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Lupa PIN</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* REGISTER FIELDS */}
            {mode === "REGISTER" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" /> Nama
                    Operator / Workspace
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Whale Hunter Alpha"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" /> Email
                    Operator
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@crypto.com"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* FORGOT PIN FIELDS */}
            {mode === "FORGOT" && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" /> Email Akun
                    Terdaftar
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@crypto.com"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* LOGIN IDENTIFIER FIELD */}
            {mode === "LOGIN" && (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" /> Email /
                    Operator ID
                  </span>
                  <span className="text-[10px] text-slate-400 normal-case font-normal">
                    (Opsional untuk Master Admin)
                  </span>
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email akun atau kosongkan jika Master PIN"
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                />
              </div>
            )}

            {/* PIN DISPLAY & INPUT */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  {mode === "LOGIN" && "Security Access PIN"}
                  {mode === "REGISTER" && "Buat 4-10 Digit PIN"}
                  {mode === "FORGOT" && "Masukkan PIN Baru"}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  maxLength={12}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError("");
                  }}
                  placeholder="••••"
                  className="w-full bg-slate-50 border-2 border-slate-300 focus:border-emerald-500 focus:bg-white rounded-2xl px-6 py-3.5 text-center text-3xl font-mono tracking-[0.4em] font-bold outline-none text-slate-900 transition-all placeholder:text-slate-300 shadow-inner"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-900 text-xs">
                    Pemberitahuan
                  </p>
                  <p className="text-rose-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-emerald-900 text-xs">Berhasil</p>
                  <p className="text-emerald-700 mt-0.5">{successMsg}</p>
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
                  className="h-12 md:h-13 bg-slate-50 hover:bg-slate-100 active:bg-emerald-100 border border-slate-200 hover:border-slate-300 active:border-emerald-400 rounded-2xl text-xl font-bold transition-all flex items-center justify-center text-slate-900 cursor-pointer shadow-sm active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={isPending}
                className="h-12 md:h-13 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 transition-all uppercase cursor-pointer"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress("0")}
                disabled={isPending}
                className="h-12 md:h-13 bg-slate-50 hover:bg-slate-100 active:bg-emerald-100 border border-slate-200 hover:border-slate-300 active:border-emerald-400 rounded-2xl text-xl font-bold transition-all flex items-center justify-center text-slate-900 cursor-pointer shadow-sm active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={isPending}
                className="h-12 md:h-13 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-lg font-bold text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer"
              >
                ⌫
              </button>
            </div>

            {/* Main Action Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 mt-2 bg-[#a3f784] hover:bg-[#8fe66f] disabled:bg-slate-200 disabled:text-slate-400 text-[#061a1d] font-bold uppercase tracking-wider rounded-2xl text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#061a1d]" />
                  <span>MEMPROSES...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === "LOGIN" && "UNLOCK RADAR CONTROL"}
                    {mode === "REGISTER" && "CREATE OPERATOR WORKSPACE"}
                    {mode === "FORGOT" && "UPDATE & RESET PIN"}
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#061a1d]" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Context Navigation */}
          <div className="pt-2 flex flex-col items-center gap-2 text-xs text-slate-500 border-t border-slate-100">
            {mode === "LOGIN" && (
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => switchMode("REGISTER")}
                  className="hover:text-emerald-700 transition-colors font-medium cursor-pointer"
                >
                  Belum punya akun?{" "}
                  <span className="text-emerald-700 font-bold">Daftar</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("FORGOT")}
                  className="hover:text-emerald-700 transition-colors text-slate-400 hover:underline cursor-pointer"
                >
                  Lupa PIN?
                </button>
              </div>
            )}

            {mode === "REGISTER" && (
              <button
                type="button"
                onClick={() => switchMode("LOGIN")}
                className="hover:text-emerald-700 transition-colors font-medium cursor-pointer"
              >
                Sudah punya akun operator?{" "}
                <span className="text-emerald-700 font-bold">
                  Masuk di sini
                </span>
              </button>
            )}

            {mode === "FORGOT" && (
              <button
                type="button"
                onClick={() => switchMode("LOGIN")}
                className="hover:text-emerald-700 transition-colors font-medium cursor-pointer"
              >
                Ingat PIN Anda?{" "}
                <span className="text-emerald-700 font-bold">
                  Kembali ke Login
                </span>
              </button>
            )}
          </div>

          {/* Footer Security Badges */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Tenant Data Isolation
            </span>
            <span className="font-mono text-[10px] text-slate-400 font-bold">
              SHA-256 Encrypted
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
