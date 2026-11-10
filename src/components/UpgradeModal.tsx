"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Zap,
  Shield,
  Check,
  ExternalLink,
  Copy,
  Sparkles,
  ArrowLeft,
  Lock,
  Wallet,
  CheckCircle2,
} from "lucide-react";

const MOONPAY_LINKS = {
  SCOUT: "69f2f1f23efa8db4c0c649df",
  PREDATOR: "69f2f303b1cea9fd7396688f",
  APEX: "69f2f3603efa8db4c0c6510d",
};

interface TierConfig {
  id: "SCOUT" | "PREDATOR" | "APEX";
  name: string;
  tagline: string;
  price: number;
  wallets: number;
  popular?: boolean;
  features: string[];
}

export default function UpgradeModal({
  userId = "admin_owner",
  currentTier = "FREE",
}: {
  userId?: string;
  currentTier?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierConfig | null>(null);
  const [copied, setCopied] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState<
    "gateway" | "direct"
  >("gateway");
  const [directCopied, setDirectCopied] = useState(false);

  const directWalletSol = "EdaXoG9n8Wp62c2vK3k4qTz8y2Q5u1bK9z4r8y7W2abc";

  useEffect(() => {
    setMounted(true);
  }, []);

  const tiers: TierConfig[] = [
    {
      id: "SCOUT",
      name: "SCOUT RADAR",
      tagline: "Starter Alpha Discovery",
      price: 29,
      wallets: 3,
      features: [
        "Track 3 Active Whale Targets",
        "Real-Time Telegram Alpha Alerts",
        "Basic Anti-Rugpull & Mint Guard",
        "PnL Shadow Simulation ($100 Base)",
        "Solana Network Scanner",
      ],
    },
    {
      id: "PREDATOR",
      name: "PREDATOR PRO",
      tagline: "Most Popular // Scalper Alpha",
      price: 99,
      wallets: 15,
      popular: true,
      features: [
        "Track 15 Active Whale Targets",
        "Zero-Delay Telegram Instant Push",
        "Multi-Wallet Confluence Signal Engine",
        "Deep Liquidity & Contract Verifier",
        "Multi-Chain: Solana + Base + Ethereum",
        "Priority Support & Scalper Tips",
      ],
    },
    {
      id: "APEX",
      name: "APEX WHALE",
      tagline: "Institutional Predator Grade",
      price: 499,
      wallets: 100,
      features: [
        "Track 100+ Whale Targets Non-Stop",
        "Dedicated Private RPC Node Speed",
        "Auto-Copy Trading Webhook Signals",
        "Unlimited Custom Telegram Channels",
        "1-on-1 VIP Direct Strategy Access",
        "Lifetime Clearance & Zero Limits",
      ],
    },
  ];

  // Close on Escape key press & body scroll locking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setSelectedTier(null);
    setCopied(false);
    setDirectCopied(false);
  };

  const getCheckoutUrl = (tierId: "SCOUT" | "PREDATOR" | "APEX") => {
    const linkId = MOONPAY_LINKS[tierId];
    return `https://moonpay.hel.io/pay/${linkId}?clientReferenceId=${encodeURIComponent(
      userId || "admin_owner",
    )}`;
  };

  const handleOpenGateway = (url: string) => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const copyToClipboard = (text: string, isDirect = false) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (isDirect) {
        setDirectCopied(true);
        setTimeout(() => setDirectCopied(false), 2500);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const isOwner =
    userId === "admin_owner" ||
    currentTier === "APEX" ||
    currentTier === "OWNER";

  return (
    <>
      {/* TOMBOL UPGRADE UTAMA (NAVBAR / COMMAND MENU) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[#a3f784]/15 hover:bg-[#a3f784] border border-[#a3f784]/40 hover:border-[#a3f784] text-[#a3f784] hover:text-[#061a1d] rounded-xl sm:rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(163,247,132,0.2)] group shrink-0 cursor-pointer"
        title="Upgrade Kapasitas Radar"
      >
        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">UPGRADE RADAR</span>
        <span className="inline sm:hidden">UPGRADE</span>
      </button>

      {/* PORTAL TELEPORT LANGSUNG KE DOCUMENT.BODY AGAR BEBAS DARI STACKING CONTEXT HEADER */}
      {isOpen &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose();
            }}
            className="fixed inset-0 z-[999999] overflow-y-auto overflow-x-hidden bg-[#061a1d]/90 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start sm:items-center animate-in fade-in duration-150"
          >
            <div className="relative w-full max-w-4xl my-auto bg-[#0b272a] border border-[#a3f784]/25 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_0_60px_rgba(163,247,132,0.15)] z-10">
              {/* CLOSE BUTTON BULLETPROOF TOP-RIGHT */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:text-[#a3f784] transition-all cursor-pointer z-20 flex items-center justify-center shadow-lg"
                aria-label="Tutup Modal"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* HEADER AREA */}
              <div className="text-center mb-5 sm:mb-7 pr-10 sm:pr-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#a3f784]/15 border border-[#a3f784]/30 rounded-full text-[#a3f784] text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest mb-2.5">
                  <Sparkles className="w-3 h-3 text-[#a3f784]" />
                  <span>PREDATOR CLEARANCE UPGRADE</span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">
                  UNLOCK <span className="text-[#a3f784]">SMART MONEY</span>{" "}
                  RADAR
                </h2>
                <p className="text-[#9bb8b5] font-medium text-xs sm:text-sm mt-1.5 max-w-lg mx-auto">
                  Tingkatkan kapasitas pelacakan paus on-chain, notifikasi
                  instan Telegram 0-delay, dan sinyal konfluensi multi-chain.
                </p>

                {/* CURRENT CLEARANCE BADGE */}
                <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1 bg-[#06181a]/80 border border-white/15 rounded-xl font-mono text-[10px] sm:text-[11px] text-white">
                  <span className="text-[#9bb8b5] font-medium">
                    STATUS OPERATOR:
                  </span>
                  <span className="text-[#a3f784] font-bold">
                    {isOwner
                      ? "MASTER PREDATOR (OWNER // UNLIMITED ACCESS)"
                      : `${currentTier} TIER`}
                  </span>
                </div>
              </div>

              {!selectedTier ? (
                // ================= TAHAP 1: PILIH TIER =================
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
                  {tiers.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTier(t)}
                      className={`relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:-translate-y-1 ${
                        t.popular
                          ? "border-[#a3f784] bg-gradient-to-b from-[#a3f784]/15 via-[#0b272a] to-[#06181a] shadow-[0_0_30px_rgba(163,247,132,0.25)]"
                          : "border-white/10 hover:border-[#a3f784]/40 bg-[#06181a]/80 hover:bg-[#0f3236]/80"
                      }`}
                    >
                      {t.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#a3f784] text-[#061a1d] text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md shadow-[#a3f784]/30 flex items-center gap-1 z-10">
                          <Zap className="w-2.5 h-2.5 fill-[#061a1d]" />
                          RECOMMENDED
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider group-hover:text-[#a3f784] transition-colors">
                            {t.name}
                          </h3>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/10 text-white border border-white/15">
                            {t.wallets} WHALES
                          </span>
                        </div>
                        <p className="text-[#9bb8b5] text-[11px] font-medium mt-0.5">
                          {t.tagline}
                        </p>

                        <div className="mt-3 flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                            ${t.price}
                          </span>
                          <span className="text-xs font-mono font-medium text-[#9bb8b5]">
                            / bulan
                          </span>
                        </div>

                        {/* FEATURE LIST */}
                        <ul className="mt-3.5 space-y-1.5 sm:space-y-2 pt-3 border-t border-white/10">
                          {t.features.map((feat, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-1.5 text-xs text-[#f4fbf8] font-medium"
                            >
                              <Check className="w-3.5 h-3.5 text-[#a3f784] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        className={`mt-5 w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          t.popular
                            ? "bg-[#a3f784] hover:bg-[#b6f99c] text-[#061a1d] shadow-[0_0_20px_rgba(163,247,132,0.3)]"
                            : "bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-[#a3f784]/50"
                        }`}
                      >
                        <span>PILIH {t.name}</span>
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                // ================= TAHAP 2: CHECKOUT & PAYMENT =================
                <div className="max-w-xl mx-auto bg-[#06181a] rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[#a3f784]/25 shadow-2xl space-y-5">
                  <button
                    type="button"
                    onClick={() => setSelectedTier(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-white hover:text-[#a3f784] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali ke Pilihan Tier</span>
                  </button>

                  {/* TIER SUMMARY */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/15 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-semibold uppercase text-emerald-400 tracking-wider">
                        PAKET TERPILIH
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-white uppercase">
                        {selectedTier.name}
                      </h3>
                      <p className="text-xs text-white font-medium">
                        Kapasitas pelacakan: {selectedTier.wallets} Target
                        Whales
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">
                        ${selectedTier.price}
                      </div>
                      <span className="text-[10px] font-mono font-medium text-white">
                        USD / BULAN
                      </span>
                    </div>
                  </div>

                  {/* PAYMENT METHOD TABS */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/15 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActivePaymentMethod("gateway")}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                        activePaymentMethod === "gateway"
                          ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                          : "text-white hover:bg-white/5"
                      }`}
                    >
                      ⚡ Instant Gateway
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePaymentMethod("direct")}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                        activePaymentMethod === "direct"
                          ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                          : "text-white hover:bg-white/5"
                      }`}
                    >
                      💎 Transfer Kripto
                    </button>
                  </div>

                  {activePaymentMethod === "gateway" ? (
                    // GATEWAY PAYMENT (HELIOPAY / MOONPAY)
                    <div className="space-y-4">
                      <p className="text-xs text-white font-medium leading-relaxed">
                        Klik tombol di bawah untuk membuka gateway pembayaran
                        aman (Mendukung Solana Pay, USDT, USDC, & Kartu Kredit).
                        Akses di-unlock otomatis setelah konfirmasi blockchain.
                      </p>

                      <div className="space-y-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenGateway(getCheckoutUrl(selectedTier.id))
                          }
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-500 text-black hover:bg-emerald-400 rounded-xl font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] cursor-pointer text-sm"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Buka Checkout Gateway</span>
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        {/* FALLBACK DIRECT LINK */}
                        <div className="pt-2 flex items-center justify-between gap-2">
                          <a
                            href={getCheckoutUrl(selectedTier.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Buka tautan langsung di tab baru</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(getCheckoutUrl(selectedTier.id))
                            }
                            className="text-[11px] font-mono font-semibold text-white hover:text-emerald-400 inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/15 rounded-lg transition-colors cursor-pointer"
                          >
                            {copied ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">
                                  Tersalin!
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // DIRECT CRYPTO TRANSFER
                    <div className="space-y-4">
                      <p className="text-xs text-white font-medium leading-relaxed">
                        Transfer senilai{" "}
                        <strong className="text-white font-bold">
                          ${selectedTier.price} USD
                        </strong>{" "}
                        dalam bentuk{" "}
                        <strong className="text-emerald-400 font-bold">
                          SOL
                        </strong>{" "}
                        atau{" "}
                        <strong className="text-emerald-400 font-bold">
                          USDT (SPL Solana)
                        </strong>{" "}
                        ke alamat resmi radar di bawah ini:
                      </p>

                      <div className="p-3 bg-black/60 border border-white/15 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-white">
                          <span className="font-semibold">JARINGAN:</span>
                          <span className="text-emerald-400 font-bold">
                            SOLANA MAINNET (SPL)
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 p-2 bg-white/5 border border-white/10 rounded-lg">
                          <span className="text-xs font-mono font-medium text-white truncate">
                            {directWalletSol}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(directWalletSol, true)
                            }
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1"
                          >
                            {directCopied ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-white font-bold">
                        💡 Setelah transfer, kirimkan bukti transaksi (Tx Hash)
                        ke admin Telegram bot untuk clearance instan akun Anda.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
