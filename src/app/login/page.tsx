// src/app/login/page.tsx
"use client";

import { useState, useTransition } from "react";
import { loginAction, registerAction } from "@/app/actions/auth";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Mail,
  User,
  Eye,
  EyeOff,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building2,
} from "lucide-react";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError(
        "Please provide both operator identity and security access key.",
      );
      return;
    }

    setError("");
    startTransition(async () => {
      const res = await loginAction(identifier, password);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError("Please complete all workspace registration fields.");
      return;
    }

    setError("");
    startTransition(async () => {
      const res = await registerAction(regName, regEmail, regPassword);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,9,11,0.85)_100%)] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Terminal Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            ENTERPRISE GATEWAY // MULTI-TENANT CLEARANCE
          </div>

          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
            PREDATOR <span className="text-emerald-400">TRACKER</span>
          </h1>

          <p className="text-neutral-400 text-sm md:text-base font-normal">
            Institutional Whale Intelligence & On-Chain Radar Terminal
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#121216] border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 p-1 bg-neutral-900/90 border border-neutral-800 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError("");
              }}
              className={`py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                tab === "login"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Operator Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setError("");
              }}
              className={`py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                tab === "register"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Create Workspace</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm font-medium flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Authentication Notice</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Form: Sign In */}
          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Operator
                  Identity
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError("");
                    }}
                    placeholder="Username or operator email"
                    className="w-full bg-[#18181e] border border-neutral-700/80 focus:border-emerald-400 rounded-2xl px-5 py-4 text-base font-medium text-white outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-400/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />{" "}
                    Security Access Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{showPassword ? "Hide" : "Show Key"}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter security access key"
                    className="w-full bg-[#18181e] border border-neutral-700/80 focus:border-emerald-400 rounded-2xl px-5 py-4 text-base font-medium text-white outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-400/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-black uppercase tracking-wider rounded-2xl text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 group"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>AUTHENTICATE & ENTER TERMINAL</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Form: Sign Up / Register Workspace */
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Operator
                  Name / Alias
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. Whale Hunter Alpha"
                  className="w-full bg-[#18181e] border border-neutral-700/80 focus:border-emerald-400 rounded-2xl px-5 py-4 text-base font-medium text-white outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-400/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" /> Operator
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => {
                    setRegEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="operator@fund.xyz"
                  className="w-full bg-[#18181e] border border-neutral-700/80 focus:border-emerald-400 rounded-2xl px-5 py-4 text-base font-medium text-white outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-400/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Create
                    Security Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{showRegPassword ? "Hide" : "Show Key"}</span>
                  </button>
                </div>
                <input
                  type={showRegPassword ? "text" : "password"}
                  required
                  minLength={4}
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Minimum 4 characters"
                  className="w-full bg-[#18181e] border border-neutral-700/80 focus:border-emerald-400 rounded-2xl px-5 py-4 text-base font-medium text-white outline-none transition-all placeholder:text-neutral-600 focus:ring-1 focus:ring-emerald-400/20"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-black uppercase tracking-wider rounded-2xl text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 group"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>PROVISIONING WORKSPACE...</span>
                  </>
                ) : (
                  <>
                    <span>INITIALIZE OPERATOR WORKSPACE</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Security Badges */}
          <div className="pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />{" "}
              End-to-end Tenant Data Isolation
            </span>
            <span className="font-mono text-[11px] text-neutral-600">
              TLS Encrypted // SHA-256
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
