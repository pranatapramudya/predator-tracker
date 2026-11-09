// src/components/DashboardShell.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UpgradeModal from "@/components/UpgradeModal";
import LiveRadarPoller from "@/components/LiveRadarPoller";
import PnLChart from "@/components/PnLChart";
import { createWalletAction, deleteWalletAction } from "@/app/actions/wallet";
import {
  Shield,
  Radio,
  Activity,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Send,
  ExternalLink,
  Ghost,
  Flame,
  BrainCircuit,
  TrendingUp,
  Lock,
  Search,
  PlusCircle,
  Terminal,
  Zap,
  Copy,
  Check,
  Cpu,
} from "lucide-react";

const NETWORK_OPTIONS = [
  {
    value: "SOLANA",
    label: "Solana",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  {
    value: "BASE",
    label: "Base",
    color: "text-indigo-400",
    border: "border-indigo-500/30",
  },
  {
    value: "ETHEREUM",
    label: "Ethereum",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
  },
  {
    value: "BITCOIN",
    label: "Bitcoin",
    color: "text-orange-500",
    border: "border-orange-500/30",
  },
] as const;

type WalletNetwork = (typeof NETWORK_OPTIONS)[number]["value"];

const NETWORK_LOGOS: Record<string, string> = {
  SOLANA: "https://cryptologos.cc/logos/solana-sol-logo.svg?v=035",
  BASE: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png",
  ETHEREUM: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035",
  BITCOIN: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035",
};

function formatAddress(address: string): string {
  if (!address) return "";
  return address.length <= 12
    ? address
    : `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function getWhaleTag(winRate: number, totalTrades: number) {
  if (totalTrades < 3)
    return {
      text: "UNRANKED",
      style:
        "bg-white text-black font-black border-none shadow-[0_0_12px_rgba(255,255,255,0.4)]",
    };
  if (winRate >= 70)
    return {
      text: "THE ORACLE",
      style:
        "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.3)]",
    };
  if (winRate >= 40)
    return {
      text: "THE GRINDER",
      style:
        "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]",
    };
  return {
    text: "EXIT LIQUIDITY",
    style: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  };
}

function getTradeStyleBadge(transactions: any[]) {
  if (!transactions || transactions.length < 2) {
    return {
      label: "Unknown",
      color: "bg-white/20 text-white font-bold border border-white/20",
      icon: "❓",
    };
  }

  let totalHoldTimeHours = 0;
  let pairCount = 0;

  const tokenGroups: Record<string, any[]> = {};
  transactions.forEach((tx) => {
    if (!tx.tokenAddress || tx.tokenAddress === "solana") return;
    if (!tokenGroups[tx.tokenAddress]) tokenGroups[tx.tokenAddress] = [];
    tokenGroups[tx.tokenAddress].push(tx);
  });

  for (const token in tokenGroups) {
    const txs = tokenGroups[token].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    let firstBuyTime = null;
    for (const tx of txs) {
      if (tx.type === "BUY" && !firstBuyTime) {
        firstBuyTime = new Date(tx.createdAt).getTime();
      } else if (tx.type === "SELL" && firstBuyTime) {
        const sellTime = new Date(tx.createdAt).getTime();
        const diffInHours = (sellTime - firstBuyTime) / (1000 * 60 * 60);
        totalHoldTimeHours += diffInHours;
        pairCount++;
        firstBuyTime = null;
      }
    }
  }

  if (pairCount === 0) {
    return {
      label: "Diamond Hands",
      color: "bg-blue-600/30 text-blue-300 border border-blue-500/50",
      icon: "💎",
    };
  }

  const avgHoldTime = totalHoldTimeHours / pairCount;

  if (avgHoldTime < 24) {
    return {
      label: "Scalper",
      color: "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50",
      icon: "⚡",
    };
  } else if (avgHoldTime >= 24 && avgHoldTime <= 168) {
    return {
      label: "Swing Trader",
      color: "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50",
      icon: "🏄‍♂️",
    };
  } else {
    return {
      label: "Diamond Hands",
      color: "bg-blue-600/30 text-blue-300 border border-blue-500/50",
      icon: "💎",
    };
  }
}

interface DashboardShellProps {
  wallets: any[];
  smartMoneyTrends: any[];
  privateAlphaLogs: any[];
  walletStats: any[];
  dbUser: any;
  totalWallets: number;
  totalPages: number;
  page: number;
  initialTab?: string;
  feedback?: {
    title: string;
    description: string;
    icon: any;
    color: string;
  } | null;
  savedChatId: string;
  savedAlphaId: string;
  logoutAction: () => Promise<void>;
}

export default function DashboardShell({
  wallets,
  smartMoneyTrends,
  privateAlphaLogs,
  walletStats,
  dbUser,
  totalWallets,
  totalPages,
  page,
  initialTab = "watchlist",
  feedback,
  savedChatId,
  savedAlphaId,
  logoutAction,
}: DashboardShellProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "watchlist" | "feed" | "add" | "menu"
  >(() => {
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab && ["watchlist", "feed", "add", "menu"].includes(urlTab)) {
        return urlTab as any;
      }
      const savedTab = localStorage.getItem("predator_active_tab");
      if (savedTab && ["watchlist", "feed", "add", "menu"].includes(savedTab)) {
        return savedTab as any;
      }
    }
    return (initialTab as any) || "watchlist";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChainFilter, setSelectedChainFilter] = useState<string>("ALL");
  const [signalTypeFilter, setSignalTypeFilter] = useState<
    "ALL" | "BUY" | "SELL"
  >("ALL");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // 🌟 Modern Blockchain Selector State
  const [selectedNetwork, setSelectedNetwork] =
    useState<WalletNetwork>("SOLANA");

  // 🌟 Modern Delete Alert Modal State
  const [whaleToDelete, setWhaleToDelete] = useState<{
    id: string;
    name: string;
    address: string;
  } | null>(null);

  // Keep state synchronized with URL query params and localStorage across background revalidation
  useEffect(() => {
    try {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      const savedTab = localStorage.getItem("predator_active_tab");
      const targetTab = (urlTab || savedTab || initialTab) as any;
      if (
        targetTab &&
        ["watchlist", "feed", "add", "menu"].includes(targetTab)
      ) {
        setActiveTab(targetTab);
        try {
          localStorage.setItem("predator_active_tab", targetTab);
        } catch {}
      }
    } catch {}

    const handlePopState = () => {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab && ["watchlist", "feed", "add", "menu"].includes(urlTab)) {
        setActiveTab(urlTab as any);
        try {
          localStorage.setItem("predator_active_tab", urlTab);
        } catch {}
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [initialTab]);

  const handleTabChange = (tab: "watchlist" | "feed" | "add" | "menu") => {
    setActiveTab(tab);
    try {
      localStorage.setItem("predator_active_tab", tab);
    } catch {}
    router.replace(`/?tab=${tab}`, { scroll: false });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Filtered wallets
  const filteredWallets = useMemo(() => {
    return wallets.filter((w) => {
      const matchChain =
        selectedChainFilter === "ALL" ||
        w.network?.toUpperCase() === selectedChainFilter;
      const matchSearch =
        !searchQuery.trim() ||
        w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.address?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchChain && matchSearch;
    });
  }, [wallets, selectedChainFilter, searchQuery]);

  // Filtered signals
  const filteredSignals = useMemo(() => {
    if (signalTypeFilter === "ALL") return privateAlphaLogs;
    return privateAlphaLogs.filter((s) => s.type === signalTypeFilter);
  }, [privateAlphaLogs, signalTypeFilter]);

  return (
    <main className="min-h-screen bg-[#09090b] text-white selection:bg-emerald-500 selection:text-black pb-28 md:pb-12">
      {/* 🚀 TOP CYBER HEADER BAR - CATEGORIZED INTO 3 CLEAN ZONES */}
      <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3 transition-all">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* ZONE 1: BRAND IDENTITY & LIVE RADAR (LEFT) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleTabChange("watchlist")}
              className="text-left group flex items-center gap-2.5 transition-transform hover:opacity-90 cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
              <h1 className="text-base sm:text-lg font-black tracking-tight uppercase leading-none text-white">
                PREDATOR <span className="text-emerald-400">TRACKER</span>
              </h1>
            </button>

            <div className="hidden lg:block pl-3 border-l border-white/10">
              <LiveRadarPoller intervalSec={15} />
            </div>
          </div>

          {/* ZONE 2: NAVIGATION CENTER (MIDDLE) */}
          <nav className="hidden md:flex items-center bg-zinc-900/90 border border-white/20 rounded-2xl p-1 gap-1 shadow-inner">
            <button
              onClick={() => handleTabChange("watchlist")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "watchlist"
                  ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "text-white hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={
                  activeTab === "watchlist"
                    ? "text-black font-black"
                    : "text-white font-black"
                }
              >
                Watchlist
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  activeTab === "watchlist"
                    ? "bg-black/40 text-white font-bold"
                    : "bg-white/20 text-white font-bold"
                }`}
              >
                {totalWallets}
              </span>
            </button>

            <button
              onClick={() => handleTabChange("feed")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "feed"
                  ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "text-white hover:bg-white/10 hover:text-white"
              }`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${activeTab === "feed" ? "text-black" : "text-white"}`}
              />
              <span
                className={
                  activeTab === "feed"
                    ? "text-black font-black"
                    : "text-white font-black"
                }
              >
                Alpha Feed
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => handleTabChange("add")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "add"
                  ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "text-white hover:bg-white/10 hover:text-white"
              }`}
            >
              <PlusCircle
                className={`w-3.5 h-3.5 ${activeTab === "add" ? "text-black" : "text-white"}`}
              />
              <span
                className={
                  activeTab === "add"
                    ? "text-black font-black"
                    : "text-white font-black"
                }
              >
                Acquisition
              </span>
            </button>

            <button
              onClick={() => handleTabChange("menu")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "menu"
                  ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  : "text-white hover:bg-white/10 hover:text-white"
              }`}
            >
              <Terminal
                className={`w-3.5 h-3.5 ${activeTab === "menu" ? "text-black" : "text-white"}`}
              />
              <span
                className={
                  activeTab === "menu"
                    ? "text-black font-black"
                    : "text-white font-black"
                }
              >
                Command Menu
              </span>
            </button>
          </nav>

          {/* ZONE 3: OPERATOR PROFILE & SECURITY CONTROLS (RIGHT) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-mono text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[110px] text-white font-black">
                {dbUser.name}
              </span>
              <span className="text-white font-black">//</span>
              <span className="text-emerald-300 font-black">{dbUser.role}</span>
            </div>

            <UpgradeModal userId={dbUser.id} currentTier={dbUser.tier} />

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                title="Lock Terminal"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LOCK</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* FEEDBACK BANNER (IF ANY) */}
      {feedback && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`flex items-start gap-4 p-4 rounded-2xl border bg-transparent animate-in fade-in slide-in-from-top-4 ${feedback.color}`}
          >
            <feedback.icon className="w-6 h-6 shrink-0" />
            <div>
              <h4 className="font-black text-sm uppercase tracking-tight text-white">
                {feedback.title}
              </h4>
              <p className="text-sm font-medium text-white">
                {feedback.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 📱 MOBILE QUICK LIVE RADAR (CLEAN, NO OVERCROWDING) */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-white/10 text-[11px] font-mono">
        <LiveRadarPoller intervalSec={15} />
        <span className="text-white font-black uppercase tracking-widest">
          {totalWallets} TARGETS ON RADAR
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN VIEW CONTAINER (TAB DRIVEN - NO CLUTTER, ULTRA FOCUSED)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* ─── TAB 1: WATCHLIST (TARGET RADAR) ─────────────────────────── */}
        {activeTab === "watchlist" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Watchlist Sub-header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
              <div>
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-2 text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  Active Target Whales
                </h2>
                <p className="text-xs text-white font-bold mt-0.5">
                  Menampilkan {filteredWallets.length} target aktif (Maks 3 per
                  halaman)
                </p>
              </div>

              {/* Chain Filter & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:flex-none min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-white absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search whale or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/80 border border-white/30 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-white outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div className="flex items-center bg-black/80 border border-white/30 rounded-xl p-0.5 text-[10px] font-bold">
                  {["ALL", "SOLANA", "BASE", "ETHEREUM", "BITCOIN"].map(
                    (chain) => (
                      <button
                        key={chain}
                        onClick={() => setSelectedChainFilter(chain)}
                        className={`px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                          selectedChainFilter === chain
                            ? "bg-emerald-500 text-black font-black"
                            : "text-white font-bold hover:text-emerald-300 hover:bg-white/10"
                        }`}
                      >
                        {chain === "ALL" ? "ALL" : chain}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() => handleTabChange("add")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] ml-auto sm:ml-0 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-black" />
                  <span>Lock Whale</span>
                </button>
              </div>
            </div>

            {/* Empty State */}
            {filteredWallets.length === 0 ? (
              <div className="border border-dashed border-white/20 rounded-3xl p-12 sm:p-20 text-center bg-zinc-900/30">
                <Radio className="w-10 h-10 mx-auto mb-4 text-emerald-400 animate-pulse" />
                <h3 className="text-base font-black uppercase tracking-wider text-white">
                  Tidak Ada Target Sesuai Filter
                </h3>
                <p className="text-xs text-white max-w-sm mx-auto mt-2 mb-6 font-bold">
                  Belum ada whale yang terdaftar atau sesuai kriteria pencarian
                  Anda.
                </p>
                <button
                  onClick={() => handleTabChange("add")}
                  className="px-6 py-3 bg-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-emerald-400 transition-all cursor-pointer"
                >
                  + Tambah Target Whale Baru
                </button>
              </div>
            ) : (
              /* Whale Cards Grid (Max 3 per page, 3-col on desktop) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredWallets.map((w, idx) => {
                  const config = NETWORK_OPTIONS.find(
                    (n) => n.value === w.network,
                  );
                  const whaleTag = getWhaleTag(w.winRate, w.totalTrades);
                  const safeName = w.name || "Target";
                  const tradeStyle = getTradeStyleBadge(w.transactions);
                  const stats = walletStats.find((s) => s.id === w.id) || {
                    totalInvested: 0,
                    totalPnl: 0,
                    roiPercent: 0,
                  };
                  const { roiPercent } = stats;

                  const baseShadow = dbUser.shadowBalance || 100;
                  const shadowProfit = (baseShadow * roiPercent) / 100;
                  const shadowTotal = baseShadow + shadowProfit;
                  const isFomoPositive = shadowProfit >= 0;

                  return (
                    <div
                      key={w.id || idx}
                      className="group bg-[#18181b] border border-white/10 p-5 rounded-3xl hover:border-emerald-500/50 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Card Header */}
                      <div>
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                TARGET #{(page - 1) * 3 + idx + 1}
                              </span>
                              <span
                                className={`text-[8px] px-2 py-0.5 rounded border tracking-widest font-black ${whaleTag.style}`}
                              >
                                {whaleTag.text}
                              </span>
                            </div>

                            <h3
                              className="text-base sm:text-lg font-black text-white group-hover:text-emerald-400 transition-colors uppercase truncate"
                              title={safeName}
                            >
                              {safeName}
                            </h3>

                            <div className="flex items-center gap-2 mt-2">
                              <img
                                src={
                                  NETWORK_LOGOS[w.network as WalletNetwork] ||
                                  NETWORK_LOGOS.SOLANA
                                }
                                alt=""
                                className="w-5 h-5 rounded-full bg-white p-0.5 shrink-0 shadow-sm"
                              />
                              <span
                                className={`text-sm font-black tracking-tight truncate ${config?.color}`}
                              >
                                {w.network === "BITCOIN"
                                  ? `₿ ${Number(w.lastBalance).toFixed(6)}`
                                  : w.network === "SOLANA"
                                    ? `◎ ${Number(w.lastBalance).toFixed(2)}`
                                    : `Ξ ${Number(w.lastBalance).toFixed(4)}`}
                              </span>
                              <div
                                className={`text-[9px] px-2 py-0.5 rounded uppercase font-black tracking-wider flex items-center gap-1 ${tradeStyle.color}`}
                              >
                                <span>{tradeStyle.icon}</span>{" "}
                                {tradeStyle.label}
                              </div>
                            </div>
                          </div>

                          {/* Network & Modern Delete Trigger */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span
                              className={`text-[9px] font-black px-2 py-1 rounded-full border border-white/20 bg-zinc-900 uppercase ${config?.color}`}
                            >
                              {w.network}
                            </span>

                            {dbUser.tier === "FREE" &&
                            dbUser.role !== "OWNER" ? (
                              <span
                                className="p-1 text-white font-bold cursor-not-allowed"
                                title="Slot Locked. Upgrade to change."
                              >
                                🔒
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setWhaleToDelete({
                                    id: w.id,
                                    name: safeName,
                                    address: w.address,
                                  })
                                }
                                className="p-1.5 text-white hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Eliminate Target"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Win Rate & Trades Metric Bar */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-2.5 text-center">
                            <p className="text-[9px] font-black text-white uppercase tracking-widest">
                              Win Rate
                            </p>
                            <p
                              className={`text-base font-black mt-0.5 ${
                                w.winRate >= 70
                                  ? "text-amber-400"
                                  : w.winRate >= 40
                                    ? "text-cyan-400"
                                    : "text-rose-400"
                              }`}
                            >
                              {Number(w.winRate).toFixed(1)}%
                            </p>
                          </div>
                          <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-2.5 text-center">
                            <p className="text-[9px] font-black text-white uppercase tracking-widest">
                              Total Trades
                            </p>
                            <p className="text-base font-black mt-0.5 text-white font-mono">
                              <span className="text-emerald-400">
                                {w.successTrades || 0}
                              </span>
                              <span className="text-white mx-1">/</span>
                              <span>{w.totalTrades || 0}</span>
                            </p>
                          </div>
                        </div>

                        {/* 🌟 GLOWING MICRO SPARKLINE PNL CHART */}
                        <div className="mt-3.5">
                          <p className="text-[9px] font-black text-white uppercase tracking-widest mb-1.5">
                            PnL Performance
                          </p>
                          <PnLChart
                            data={(w.positions || []).map((p: any) => ({
                              tokenSymbol: p.tokenSymbol || "TOKEN",
                              pnl: Number(p.realizedPnlUsd) || 0,
                            }))}
                            transactions={w.transactions}
                          />
                        </div>

                        {/* Shadow Mode Box */}
                        <div
                          className={`mt-3 p-3 border rounded-xl flex justify-between items-center relative overflow-hidden ${
                            isFomoPositive
                              ? "bg-emerald-500/10 border-emerald-500/40"
                              : "bg-rose-500/10 border-rose-500/40"
                          }`}
                        >
                          <div>
                            <p
                              className={`text-[10px] font-black uppercase tracking-widest mb-0.5 flex items-center gap-1 ${
                                isFomoPositive
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              <Ghost className="w-3.5 h-3.5" /> Shadow Mode
                              ($100 Base)
                            </p>
                            <p className="text-xs font-bold text-white">
                              If copied:{" "}
                              <span
                                className={`font-black text-sm ${
                                  isFomoPositive
                                    ? "text-emerald-400"
                                    : "text-rose-400"
                                }`}
                              >
                                ${shadowTotal.toFixed(2)}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-white uppercase tracking-widest">
                              Est. Profit
                            </p>
                            <p
                              className={`text-sm font-black ${
                                isFomoPositive
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {isFomoPositive ? "+" : ""}
                              {shadowProfit.toFixed(2)} USD
                            </p>
                          </div>
                        </div>

                        {/* Recent Activity Tokens */}
                        <div className="mt-3 pt-2.5 border-t border-white/10">
                          <p className="text-[9px] font-black text-white uppercase tracking-widest mb-1.5">
                            Recent Trades
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {w.transactions && w.transactions.length > 0 ? (
                              w.transactions
                                .slice(0, 6)
                                .map((tx: any, tIdx: number) => (
                                  <a
                                    key={tx.id || tIdx}
                                    href={tx.explorerUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-black border transition-all ${
                                      tx.type === "BUY"
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                                        : "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
                                    }`}
                                  >
                                    {tx.type === "BUY" ? "🟢" : "🔴"}{" "}
                                    {tx.tokenSymbol?.slice(0, 5)}
                                  </a>
                                ))
                            ) : (
                              <span className="text-[10px] text-white font-medium italic">
                                No recent trades recorded
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Address & Live Status */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-[10px] font-mono">
                        <div className="flex items-center gap-1.5 text-white font-bold">
                          <span>{formatAddress(w.address)}</span>
                          <button
                            onClick={() => handleCopy(w.address)}
                            className="text-white hover:text-emerald-400 transition-colors cursor-pointer"
                            title="Copy Address"
                          >
                            {copiedAddress === w.address ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-white" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-400 font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="tracking-widest uppercase text-[9px]">
                            LIVE
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 🌟 ENHANCED NAVIGATION NEXT/PREV CONTROLS */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-4 border-t border-white/10">
                <span className="text-xs font-mono text-white font-bold">
                  Showing targets {(page - 1) * 3 + 1} -{" "}
                  {Math.min(page * 3, totalWallets)} of {totalWallets}
                </span>

                <div className="flex items-center gap-3">
                  {page > 1 ? (
                    <Link
                      href={`/?page=${page - 1}&tab=watchlist`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900/40 border border-white/20 rounded-xl text-xs font-black uppercase tracking-wider text-white/60 cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </div>
                  )}

                  <span className="px-3 py-1.5 bg-black/80 border border-white/20 rounded-xl text-xs font-mono font-black text-emerald-400">
                    {page} / {totalPages}
                  </span>

                  {page < totalPages ? (
                    <Link
                      href={`/?page=${page + 1}&tab=watchlist`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/20 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900/40 border border-white/20 rounded-xl text-xs font-black uppercase tracking-wider text-white/60 cursor-not-allowed">
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: ALPHA FEED & SMART TRENDS ────────────────────────── */}
        {activeTab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Left Column: Live On-Chain Signals Feed (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-[#18181b] border border-white/10 rounded-2xl sm:rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                      <Radio className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2 text-white">
                        Live Alpha Signals Feed
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      </h2>
                      <p className="text-[10px] text-white uppercase font-mono font-bold">
                        Direct on-chain execution stream
                      </p>
                    </div>
                  </div>

                  {/* Buy / Sell Toggles */}
                  <div className="flex items-center bg-black/80 border border-white/20 rounded-xl p-0.5 text-[10px] font-bold">
                    <button
                      onClick={() => setSignalTypeFilter("ALL")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        signalTypeFilter === "ALL"
                          ? "bg-white text-black font-black"
                          : "text-white font-bold hover:text-emerald-300 hover:bg-white/10"
                      }`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setSignalTypeFilter("BUY")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        signalTypeFilter === "BUY"
                          ? "bg-emerald-500 text-black font-black"
                          : "text-white font-bold hover:text-emerald-300 hover:bg-white/10"
                      }`}
                    >
                      BUYS
                    </button>
                    <button
                      onClick={() => setSignalTypeFilter("SELL")}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        signalTypeFilter === "SELL"
                          ? "bg-rose-500 text-white font-black"
                          : "text-white font-bold hover:text-emerald-300 hover:bg-white/10"
                      }`}
                    >
                      SELLS
                    </button>
                  </div>
                </div>

                {/* Signals List */}
                <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                  {filteredSignals.map((log: any, idx: number) => (
                    <div
                      key={log.id || idx}
                      className="group p-4 bg-zinc-900/60 border border-white/10 rounded-2xl hover:border-emerald-500/40 transition-all flex flex-col gap-2.5"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-white group-hover:text-emerald-400 transition-colors uppercase">
                          {log.wallet?.name || "Smart Money Alpha"}
                        </span>
                        <span className="text-[11px] text-white font-mono font-bold">
                          {new Date(log.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              log.type === "BUY"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/50"
                            }`}
                          >
                            {log.type}
                          </span>
                          <div>
                            <p className="text-base font-black text-white leading-tight">
                              ${log.tokenSymbol || "TOKEN"}
                            </p>
                            <p className="text-xs font-black text-emerald-400 font-mono">
                              ${Number(log.usdValue || 0).toLocaleString()} USD
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {log.rsi14AtTx && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                              RSI: {Number(log.rsi14AtTx).toFixed(1)}
                            </span>
                          )}
                          <a
                            href={log.explorerUrl || "https://solscan.io"}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-white/10 rounded-xl text-white hover:text-emerald-400 hover:bg-emerald-500/20 transition-all"
                            title="View on Explorer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredSignals.length === 0 && (
                    <div className="text-center py-12 text-white text-xs font-mono uppercase font-bold">
                      No signals matching current filter
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: AI Smart Trends & Multi-Wallet Confluence (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Smart Trends */}
              <div className="bg-[#18181b] border border-orange-500/30 rounded-2xl sm:rounded-3xl p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[40px] rounded-full pointer-events-none" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="text-sm font-black text-orange-400 tracking-widest flex items-center gap-2 uppercase">
                    <Flame className="w-4 h-4" /> AI Smart Trends
                  </h3>
                  <span className="text-[9px] text-orange-300 uppercase tracking-widest font-black border border-orange-500/30 px-2 py-1 rounded bg-orange-500/20">
                    Live Mindshare
                  </span>
                </div>

                <div className="space-y-3 relative z-10 max-h-[340px] overflow-y-auto pr-1">
                  {smartMoneyTrends.map((trend, i) => (
                    <div
                      key={trend.address || i}
                      className="p-3 bg-zinc-900/80 border border-white/10 rounded-2xl flex flex-col gap-2 hover:border-orange-500/40 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">
                            #{i + 1}
                          </span>
                          <span className="text-sm font-black text-white">
                            ${trend.symbol}
                          </span>
                        </div>
                        <div className="text-xs font-black text-emerald-400 flex items-center gap-1 font-mono">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{trend.buyCount} Whales In</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 uppercase flex items-center gap-1">
                          <BrainCircuit className="w-3 h-3" /> {trend.narrative}
                        </span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border ${
                            trend.mindshare?.includes("Hype")
                              ? "bg-rose-500/30 text-rose-200 border-rose-500/40"
                              : "bg-amber-500/30 text-amber-200 border-amber-500/40"
                          }`}
                        >
                          {trend.mindshare}
                        </span>
                        {trend.confluence === "SUPER_ALPHA" && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 uppercase">
                            ⚡ Super Alpha
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {smartMoneyTrends.length === 0 && (
                    <p className="text-xs text-white text-center py-6 font-mono uppercase font-bold">
                      Gathering AI Trends Data...
                    </p>
                  )}
                </div>
              </div>

              {/* Bot Routing Info Box */}
              <div className="bg-[#18181b] border border-cyan-500/30 rounded-2xl sm:rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center gap-2.5 mb-3 text-cyan-400">
                  <Send className="w-4 h-4" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Telegram Routing Architecture
                  </h4>
                </div>
                <p className="text-xs text-white font-bold mb-4">
                  Sinyal real-time otomatis disaring berdasarkan nominal
                  transaksi:
                </p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 bg-black/60 border border-white/10 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-black text-white">
                        Private Bot DM (@skom_tracker_bot)
                      </p>
                      <p className="text-[11px] text-white font-bold">
                        Chat ID: {savedChatId}
                      </p>
                    </div>
                    <span className="text-emerald-400 font-black text-sm">
                      &gt; $100 USD
                    </span>
                  </div>
                  <div className="p-3 bg-black/60 border border-amber-500/30 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-black text-amber-400">
                        Predator Alpha Channel
                      </p>
                      <p className="text-[11px] text-white font-bold">
                        Channel ID: {savedAlphaId}
                      </p>
                    </div>
                    <span className="text-amber-400 font-black text-sm">
                      &gt; $1,000 USD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: ACQUISITION PROTOCOL (ADD TARGET FORM) ───────────── */}
        {activeTab === "add" && (
          <div className="max-w-2xl mx-auto animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">
                    Lock Target Whale
                  </h2>
                  <p className="text-xs text-white font-bold">
                    Masukkan address dompet whale untuk diawasi radar secara
                    24/7
                  </p>
                </div>
              </div>

              <form action={createWalletAction} className="space-y-5">
                {/* Wallet Address */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-white uppercase tracking-widest ml-1">
                    Wallet Address
                  </label>
                  <input
                    name="address"
                    required
                    placeholder="Contoh: HjxaED... atau 0x71C... atau bc1q..."
                    className="w-full bg-zinc-900/90 border border-white/30 rounded-2xl px-5 py-3.5 font-bold outline-none font-mono text-sm focus:border-emerald-500 text-white placeholder-white"
                  />
                </div>

                {/* 🌟 MODERN BLOCKCHAIN NETWORK SELECTOR */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-white uppercase tracking-widest ml-1">
                    Blockchain Network
                  </label>
                  <input type="hidden" name="network" value={selectedNetwork} />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {NETWORK_OPTIONS.map((n) => {
                      const isSelected = selectedNetwork === n.value;
                      return (
                        <button
                          type="button"
                          key={n.value}
                          onClick={() =>
                            setSelectedNetwork(n.value as WalletNetwork)
                          }
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                            isSelected
                              ? "bg-zinc-800 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500"
                              : "bg-zinc-900/80 border-white/10 hover:border-white/30 hover:bg-zinc-800/60"
                          }`}
                        >
                          <img
                            src={NETWORK_LOGOS[n.value]}
                            alt={n.label}
                            className="w-6 h-6 rounded-full bg-white p-0.5 shrink-0 shadow-sm"
                          />
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-black uppercase ${
                                isSelected ? n.color : "text-white"
                              }`}
                            >
                              {n.label}
                            </p>
                            <p className="text-[9px] text-white uppercase font-mono font-bold">
                              {isSelected ? "● SELECTED" : "SELECT"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Alias Name */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-white uppercase tracking-widest ml-1">
                    Alias / Nama Target
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Contoh: Smart Money Alpha #3"
                    className="w-full bg-zinc-900/90 border border-white/30 rounded-2xl px-5 py-3.5 font-bold outline-none text-sm focus:border-emerald-500 text-white placeholder-white"
                  />
                </div>

                {/* Telegram Personal Chat ID */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-black text-white uppercase tracking-widest ml-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-cyan-400" /> Telegram
                      Chat ID (Personal DM)
                    </span>
                    <span className="text-emerald-400 font-bold">
                      🔒 Auto-Synced
                    </span>
                  </label>
                  <input
                    name="chatId"
                    defaultValue={savedChatId}
                    readOnly={!!savedChatId}
                    className={`w-full rounded-2xl px-5 py-3.5 font-bold outline-none text-sm ${
                      savedChatId
                        ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 cursor-not-allowed font-mono"
                        : "bg-zinc-900/90 border border-white/20 text-white font-mono"
                    }`}
                  />
                  <p className="text-[10px] text-white font-bold ml-1">
                    Menerima notifikasi langsung dari @skom_tracker_bot untuk
                    transaksi &gt; $100.
                  </p>
                </div>

                {/* Telegram Alpha Channel ID */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-black text-white uppercase tracking-widest ml-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      👑 Predator Alpha Channel ID (Grup/Channel)
                    </span>
                    <span className="text-amber-400 font-bold">
                      🔒 Auto-Synced
                    </span>
                  </label>
                  <input
                    name="alphaChannelId"
                    defaultValue={savedAlphaId}
                    readOnly={!!savedAlphaId}
                    className={`w-full rounded-2xl px-5 py-3.5 font-bold outline-none text-sm ${
                      savedAlphaId
                        ? "bg-amber-500/10 border border-amber-500/40 text-amber-400 cursor-not-allowed font-mono"
                        : "bg-zinc-900/90 border border-white/20 text-white font-mono"
                    }`}
                  />
                  <p className="text-[10px] text-white font-bold ml-1">
                    Menerima sinyal transaksi paus besar &gt; $1,000 di channel
                    Predator Alpha Feed.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>START RADAR SURVEILLANCE</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── TAB 4: COMMAND MENU (HALAMAN MENU MODERN AKURAT) ───────── */}
        {activeTab === "menu" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Header Menu Title */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-zinc-900 to-cyan-500/10 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold mb-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>PREDATOR SYSTEM COMMAND</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  Terminal & Security Menu
                </h2>
                <p className="text-xs sm:text-sm text-white font-bold mt-1">
                  Pusat kendali parameter, routing Telegram, clearance operator,
                  dan diagnostik radar.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <UpgradeModal userId={dbUser.id} currentTier={dbUser.tier} />
              </div>
            </div>

            {/* Menu Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Operator Identity & Clearance */}
              <div className="bg-[#18181b] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Operator Clearance
                    </h3>
                    <p className="text-[10px] text-white uppercase font-mono font-bold">
                      Multi-Tenant Encrypted Session
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between p-3 bg-black/60 rounded-xl">
                    <span className="text-white font-bold">Operator Name:</span>
                    <span className="font-black text-white">{dbUser.name}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-black/60 rounded-xl">
                    <span className="text-white font-bold">
                      Operator Email:
                    </span>
                    <span className="font-black text-white">
                      {dbUser.email}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-black/60 rounded-xl">
                    <span className="text-white font-bold">
                      Clearance Role:
                    </span>
                    <span className="font-black text-emerald-400">
                      {dbUser.role}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-black/60 rounded-xl">
                    <span className="text-white font-bold">Current Tier:</span>
                    <span className="font-black text-amber-400">
                      {dbUser.tier}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-black/60 rounded-xl">
                    <span className="text-white font-bold">
                      Radar Target Capacity:
                    </span>
                    <span className="font-black text-cyan-400">
                      {totalWallets} Whales Monitored
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Telegram Bot Hub */}
              <div className="bg-[#18181b] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Telegram Intelligence Hub
                    </h3>
                    <p className="text-[10px] text-white uppercase font-mono font-bold">
                      24/7 Automated Notification Pipes
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 bg-black/60 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-white font-bold">Bot Handle:</span>
                      <span className="font-black text-cyan-400">
                        @skom_tracker_bot
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white font-bold">Status:</span>
                      <span className="font-black text-emerald-400">
                        ● LIVE & SINKRON
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-black/60 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-white font-bold">
                        Personal DM (Chat ID):
                      </span>
                      <span className="font-black text-white">
                        {savedChatId}
                      </span>
                    </div>
                    <p className="text-[10px] text-white font-bold">
                      ⚡ Menerima transaksi copy-trade whale di atas $100 USD.
                    </p>
                  </div>

                  <div className="p-3 bg-black/60 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-white font-bold">
                        Alpha Feed (Channel ID):
                      </span>
                      <span className="font-black text-amber-400">
                        {savedAlphaId}
                      </span>
                    </div>
                    <p className="text-[10px] text-white font-bold">
                      👑 Menerima transaksi mega-whale di atas $1,000 USD.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Radar Engine & Telemetry */}
              <div className="bg-[#18181b] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Radar Engine Telemetry
                    </h3>
                    <p className="text-[10px] text-white uppercase font-mono font-bold">
                      Real-Time Microservices Health
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center p-3 bg-black/60 rounded-xl">
                    <span className="text-white font-bold">
                      Worker Daemon (Local):
                    </span>
                    <span className="text-emerald-400 font-black flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      ONLINE (RUNNER)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black/60 rounded-xl">
                    <span className="text-white font-bold">
                      GitHub Actions Cron:
                    </span>
                    <span className="text-emerald-400 font-black flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      EVERY 10 MIN
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black/60 rounded-xl">
                    <span className="text-white font-bold">
                      Anti-Rugpull Guard:
                    </span>
                    <span className="text-cyan-400 font-black">
                      ACTIVE (RUGCHECK)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-black/60 rounded-xl">
                    <span className="text-white font-bold">
                      Confluence Detector:
                    </span>
                    <span className="text-amber-400 font-black">
                      MULTI-WALLET ACTIVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Quick Navigation & Security Actions */}
              <div className="bg-[#18181b] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Security & Terminal Controls
                      </h3>
                      <p className="text-[10px] text-white uppercase font-mono font-bold">
                        Session & Keypad PIN Management
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-between p-3 bg-black/60 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono font-bold transition-all text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-white font-bold">
                          Ganti / Reset PIN Keamanan
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </Link>

                    <button
                      onClick={() => handleTabChange("add")}
                      className="w-full flex items-center justify-between p-3 bg-black/60 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 rounded-xl text-xs font-mono font-bold transition-all text-white hover:text-emerald-400 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-bold">
                          Tambah Target Whale Baru
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <form
                  action={logoutAction}
                  className="pt-4 border-t border-white/10"
                >
                  <button
                    type="submit"
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-400 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Kunci Terminal / Logout Sesi</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🌟 MODERN DELETE CONFIRMATION MODAL (NO UGLY BROWSER POPUP) */}
      {whaleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#18181b] border border-rose-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(244,63,94,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[40px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                  Eliminasi Target Whale?
                </h3>
                <p className="text-[10px] text-rose-400 uppercase font-mono font-bold">
                  Security Clearance Warning
                </p>
              </div>
            </div>

            <p className="text-xs text-white leading-relaxed mb-4 font-medium">
              Apakah Anda yakin ingin menghapus pemantauan target{" "}
              <span className="text-white font-black">
                "{whaleToDelete.name}"
              </span>
              ? Pelacakan transaksi on-chain untuk dompet ini akan
              dinonaktifkan.
            </p>

            <div className="p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-[11px] text-white mb-6 truncate font-bold">
              Address:{" "}
              <span className="text-emerald-400">{whaleToDelete.address}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWhaleToDelete(null)}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer"
              >
                Batal
              </button>

              <form action={deleteWalletAction} className="flex-1">
                <input type="hidden" name="id" value={whaleToDelete.id} />
                <button
                  type="submit"
                  onClick={() => setWhaleToDelete(null)}
                  className="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Target</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 📱 MODERN FLOATING BOTTOM NAVIGATION BAR (FOR MOBILE & TABLET) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#09090b]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pb-safe">
        {/* Watchlist Tab */}
        <button
          onClick={() => handleTabChange("watchlist")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative cursor-pointer ${
            activeTab === "watchlist"
              ? "text-emerald-400 scale-105"
              : "text-white hover:text-emerald-300"
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            Watchlist
          </span>
          <span className="absolute top-0 right-2 w-4 h-4 bg-emerald-500 text-black text-[9px] font-black rounded-full flex items-center justify-center">
            {totalWallets}
          </span>
        </button>

        {/* Alpha Feed Tab */}
        <button
          onClick={() => handleTabChange("feed")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative cursor-pointer ${
            activeTab === "feed"
              ? "text-emerald-400 scale-105"
              : "text-white hover:text-emerald-300"
          }`}
        >
          <Radio className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            Alpha Feed
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-3 animate-ping" />
        </button>

        {/* Add Target Tab (High Accent) */}
        <button
          onClick={() => handleTabChange("add")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "add"
              ? "text-emerald-400 scale-105"
              : "text-white hover:text-emerald-300"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              activeTab === "add"
                ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                : "bg-white/20 text-white"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider">
            Lock Target
          </span>
        </button>

        {/* Command Menu Tab */}
        <button
          onClick={() => handleTabChange("menu")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "menu"
              ? "text-emerald-400 scale-105"
              : "text-white hover:text-emerald-300"
          }`}
        >
          <Terminal className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-wider">
            Menu
          </span>
        </button>
      </nav>
    </main>
  );
}
