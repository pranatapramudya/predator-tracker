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
  LogOut,
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
        "bg-white text-black font-bold border-none shadow-[0_0_12px_rgba(255,255,255,0.4)]",
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

  // 🎯 Interactive Per-Whale Token Selection State
  const [selectedTokenMap, setSelectedTokenMap] = useState<
    Record<string, string>
  >({});

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
    <main className="min-h-screen bg-[#061a1d] text-[#f4fbf8] selection:bg-[#a3f784] selection:text-[#061a1d] pb-28 md:pb-12">
      {/* 🚀 TOP CYBER HEADER BAR - CATEGORIZED INTO 3 CLEAN ZONES */}
      <header className="sticky top-0 z-40 bg-[#061a1d]/90 backdrop-blur-xl border-b border-[#a3f784]/15 px-4 sm:px-6 lg:px-8 py-3 transition-all">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* ZONE 1: BRAND IDENTITY & LIVE RADAR (LEFT) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleTabChange("watchlist")}
              className="text-left group flex items-center gap-2.5 transition-transform hover:opacity-90 cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#a3f784] animate-pulse shadow-[0_0_10px_rgba(163,247,132,0.9)]" />
              <h1 className="text-base sm:text-lg font-bold tracking-tight uppercase leading-none text-[#f4fbf8]">
                PREDATOR <span className="text-[#a3f784]">TRACKER</span>
              </h1>
            </button>

            <div className="hidden lg:block pl-3 border-l border-white/10">
              <LiveRadarPoller intervalSec={15} />
            </div>
          </div>

          {/* ZONE 2: NAVIGATION CENTER (MIDDLE) */}
          <nav className="hidden md:flex items-center bg-[#0b272a] border border-[#a3f784]/20 rounded-2xl p-1 gap-1 shadow-inner">
            <button
              onClick={() => handleTabChange("watchlist")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "watchlist"
                  ? "bg-[#a3f784] text-[#061a1d] shadow-[0_0_15px_rgba(163,247,132,0.3)]"
                  : "text-[#9bb8b5] hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>Watchlist</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  activeTab === "watchlist"
                    ? "bg-[#061a1d]/20 text-[#061a1d] font-bold"
                    : "bg-[#0f3236] text-[#9bb8b5] font-bold"
                }`}
              >
                {totalWallets}
              </span>
            </button>

            <button
              onClick={() => handleTabChange("feed")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "feed"
                  ? "bg-[#a3f784] text-[#061a1d] shadow-[0_0_15px_rgba(163,247,132,0.3)]"
                  : "text-[#9bb8b5] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${activeTab === "feed" ? "text-[#061a1d]" : "text-[#9bb8b5]"}`}
              />
              <span>Alpha Feed</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${activeTab === "feed" ? "bg-[#061a1d]" : "bg-[#a3f784]"} animate-pulse`}
              />
            </button>

            <button
              onClick={() => handleTabChange("add")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "add"
                  ? "bg-[#a3f784] text-[#061a1d] shadow-[0_0_15px_rgba(163,247,132,0.3)]"
                  : "text-[#9bb8b5] hover:bg-white/5 hover:text-white"
              }`}
            >
              <PlusCircle
                className={`w-3.5 h-3.5 ${activeTab === "add" ? "text-[#061a1d]" : "text-[#9bb8b5]"}`}
              />
              <span>Acquisition</span>
            </button>

            <button
              onClick={() => handleTabChange("menu")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                activeTab === "menu"
                  ? "bg-[#a3f784] text-[#061a1d] shadow-[0_0_15px_rgba(163,247,132,0.3)]"
                  : "text-[#9bb8b5] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Terminal
                className={`w-3.5 h-3.5 ${activeTab === "menu" ? "text-[#061a1d]" : "text-[#9bb8b5]"}`}
              />
              <span>Command Menu</span>
            </button>
          </nav>

          {/* ZONE 3: OPERATOR PROFILE & SECURITY CONTROLS (RIGHT) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#0f3236] border border-[#a3f784]/25 rounded-xl text-[#a3f784] font-mono text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#a3f784] animate-pulse" />
              <span className="truncate max-w-[110px] text-white font-bold">
                {dbUser.name}
              </span>
              <span className="text-[#9bb8b5] font-bold">//</span>
              <span className="text-[#a3f784] font-bold">{dbUser.role}</span>
            </div>

            <UpgradeModal userId={dbUser.id} currentTier={dbUser.tier} />

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SIGNOUT</span>
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
              <h4 className="font-bold text-sm uppercase tracking-tight text-white">
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
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-[#0b272a] border-b border-[#a3f784]/15 text-[11px] font-mono">
        <LiveRadarPoller intervalSec={15} />
        <span className="text-[#9bb8b5] font-semibold uppercase tracking-wider">
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0b272a] border border-[#a3f784]/15 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg">
              <div>
                <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight flex items-center gap-2 text-[#f4fbf8]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a3f784] shadow-[0_0_8px_rgba(163,247,132,0.8)]" />
                  Active Target Whales
                </h2>
                <p className="text-xs text-[#9bb8b5] font-medium mt-0.5">
                  Menampilkan {filteredWallets.length} target aktif (Maks 3 per
                  halaman)
                </p>
              </div>

              {/* Chain Filter & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:flex-none min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-[#9bb8b5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari whale atau address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#061a1d] border border-[#a3f784]/20 rounded-full pl-9 pr-3.5 py-1.5 text-xs text-[#f4fbf8] placeholder-[#9bb8b5] outline-none focus:border-[#a3f784] font-medium transition-all"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-[#061a1d] border border-[#a3f784]/20 rounded-full text-[10px] font-bold">
                  {["ALL", "SOLANA", "BASE", "ETHEREUM", "BITCOIN"].map(
                    (chain) => (
                      <button
                        key={chain}
                        onClick={() => setSelectedChainFilter(chain)}
                        className={`px-3 py-1 rounded-full uppercase tracking-wider transition-all cursor-pointer ${
                          selectedChainFilter === chain
                            ? "bg-[#a3f784] text-[#061a1d] font-bold shadow-sm"
                            : "text-[#9bb8b5] hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {chain === "ALL" ? "Semua" : chain}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() => handleTabChange("add")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#a3f784] hover:bg-[#b6f99c] text-[#061a1d] font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-[0_0_15px_rgba(163,247,132,0.25)] ml-auto sm:ml-0 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#061a1d]" />
                  <span>Lock Whale</span>
                </button>
              </div>
            </div>

            {/* Empty State */}
            {filteredWallets.length === 0 ? (
              <div className="border border-dashed border-[#a3f784]/20 rounded-3xl p-12 sm:p-20 text-center bg-[#0b272a]/50">
                <Radio className="w-10 h-10 mx-auto mb-4 text-[#a3f784] animate-pulse" />
                <h3 className="text-base font-bold uppercase tracking-wider text-[#f4fbf8]">
                  Tidak Ada Target Sesuai Filter
                </h3>
                <p className="text-xs text-[#9bb8b5] max-w-sm mx-auto mt-2 mb-6 font-medium">
                  Belum ada whale yang terdaftar atau sesuai kriteria pencarian
                  Anda.
                </p>
                <button
                  onClick={() => handleTabChange("add")}
                  className="px-6 py-3 bg-[#a3f784] hover:bg-[#b6f99c] text-[#061a1d] font-bold text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-[0_0_15px_rgba(163,247,132,0.25)]"
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
                    activePosition: null,
                    activePnl: 0,
                    activeRoi: 0,
                  };

                  const positions: any[] = w.positions || [];
                  const userSelectedToken = selectedTokenMap[w.id];
                  const activePos = userSelectedToken
                    ? positions.find(
                        (p: any) =>
                          p.tokenSymbol?.toUpperCase() ===
                          userSelectedToken.toUpperCase(),
                      ) ||
                      positions[0] ||
                      null
                    : positions[0] || stats.activePosition || null;

                  const activeToken =
                    activePos?.tokenSymbol ||
                    w.transactions?.[0]?.tokenSymbol ||
                    "TOKEN";
                  const activePnl = activePos
                    ? Number(activePos.realizedPnlUsd || 0)
                    : stats.totalPnl;
                  const activeRoi = activePos
                    ? Number(activePos.roiPercent || 0)
                    : stats.roiPercent;
                  const activeInvested = activePos
                    ? Number(
                        activePos.totalInvestedUsd || activePos.buyUsd || 0,
                      )
                    : stats.totalInvested;
                  const isActivePositive = activePnl >= 0;
                  const activeStatus = activePos?.status || "HOLDING";

                  // Active token transactions only for sparkline chart
                  const activeTransactions = (w.transactions || []).filter(
                    (tx: any) =>
                      tx.tokenSymbol?.toUpperCase() ===
                      activeToken?.toUpperCase(),
                  );
                  const chartTransactions =
                    activeTransactions.length > 0
                      ? activeTransactions
                      : w.transactions;

                  const baseShadow = dbUser.shadowBalance || 100;
                  const shadowProfit = (baseShadow * activeRoi) / 100;
                  const shadowTotal = baseShadow + shadowProfit;
                  const isFomoPositive = shadowProfit >= 0;

                  return (
                    <div
                      key={w.id || idx}
                      className="group bg-[#0b272a] border border-[#a3f784]/15 p-5 rounded-3xl hover:border-[#a3f784]/50 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Card Header */}
                      <div>
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-bold text-[#9bb8b5] uppercase tracking-widest">
                                TARGET #{(page - 1) * 3 + idx + 1}
                              </span>
                              <span
                                className={`text-[8px] px-2 py-0.5 rounded border tracking-wider font-semibold ${whaleTag.style}`}
                              >
                                {whaleTag.text}
                              </span>
                            </div>

                            <h3
                              className="text-base sm:text-lg font-bold text-[#f4fbf8] group-hover:text-[#a3f784] transition-colors uppercase truncate"
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
                                className={`text-sm font-bold tabular-nums tracking-tight truncate ${config?.color}`}
                              >
                                {w.network === "BITCOIN"
                                  ? `₿ ${Number(w.lastBalance).toFixed(6)}`
                                  : w.network === "SOLANA"
                                    ? `◎ ${Number(w.lastBalance).toFixed(2)}`
                                    : `Ξ ${Number(w.lastBalance).toFixed(4)}`}
                              </span>
                              <div
                                className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1 ${tradeStyle.color}`}
                              >
                                <span>{tradeStyle.icon}</span>{" "}
                                {tradeStyle.label}
                              </div>
                            </div>
                          </div>

                          {/* Network & Modern Delete Trigger */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span
                              className={`text-[9px] font-bold px-2 py-1 rounded-full border border-[#a3f784]/20 bg-[#061a1d] uppercase ${config?.color}`}
                            >
                              {w.network}
                            </span>

                            {dbUser.tier === "FREE" &&
                            dbUser.role !== "OWNER" ? (
                              <span
                                className="p-1 text-[#9bb8b5] font-bold cursor-not-allowed"
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
                                className="p-1.5 text-[#9bb8b5] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Eliminate Target"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 🏆 RAPOR AKUN MENYELURUH (LIFETIME WHALE STATS) */}
                        <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 bg-[#06181a]/90 border border-white/10 rounded-2xl text-center text-xs font-mono">
                          <div>
                            <p className="text-[8px] font-bold text-[#9bb8b5] uppercase tracking-wider">
                              All-Time PnL
                            </p>
                            <p
                              className={`text-xs font-bold mt-0.5 tabular-nums ${
                                stats.totalPnl >= 0
                                  ? "text-[#a3f784]"
                                  : "text-rose-400"
                              }`}
                            >
                              {stats.totalPnl >= 0 ? "+" : ""}$
                              {Math.round(stats.totalPnl).toLocaleString()}
                            </p>
                          </div>
                          <div className="border-x border-white/10 px-1">
                            <p className="text-[8px] font-bold text-[#9bb8b5] uppercase tracking-wider">
                              Win Rate
                            </p>
                            <p
                              className={`text-xs font-bold mt-0.5 tabular-nums ${
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
                          <div>
                            <p className="text-[8px] font-bold text-[#9bb8b5] uppercase tracking-wider">
                              Total Trades
                            </p>
                            <p className="text-xs font-bold mt-0.5 tabular-nums text-white">
                              <span className="text-[#a3f784]">
                                {w.successTrades || 0}
                              </span>
                              <span className="text-white/40 mx-0.5">/</span>
                              <span>{w.totalTrades || 0}</span>
                            </p>
                          </div>
                        </div>

                        {/* 🎯 TARGET AKTIF (KOIN YANG SEDANG DITRADE / DIPILIH) */}
                        <div className="mt-3.5 p-3.5 bg-[#092226] border border-[#a3f784]/30 rounded-2xl relative overflow-hidden shadow-inner">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#a3f784] animate-ping" />
                              <span className="text-[10px] font-bold text-[#a3f784] uppercase tracking-wider font-mono">
                                KOIN AKTIF:
                              </span>
                              <span className="text-sm font-bold text-white tracking-wide">
                                ${activeToken}
                              </span>
                            </div>

                            <span
                              className={`text-[8px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider flex items-center gap-1 ${
                                activeStatus === "FRESH_BUY"
                                  ? "bg-[#a3f784]/20 text-[#a3f784] border-[#a3f784]/50 animate-pulse"
                                  : activeStatus === "TAKE_PROFIT"
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                                    : activeStatus === "CUT_LOSS"
                                      ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                                      : "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                              }`}
                            >
                              {activeStatus === "FRESH_BUY"
                                ? "🟢 FRESH BUY // SEROK"
                                : activeStatus === "TAKE_PROFIT"
                                  ? "👑 TAKE PROFIT"
                                  : activeStatus === "CUT_LOSS"
                                    ? "🔴 CUT LOSS"
                                    : "🟡 ACTIVE HOLDING"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-mono py-1.5 border-t border-b border-white/10 my-2">
                            <div>
                              <span className="text-[9px] text-[#9bb8b5] uppercase block font-medium">
                                Modal Beli Paus:
                              </span>
                              <span className="text-white font-bold tabular-nums">
                                ${activeInvested.toLocaleString()} USD
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-[#9bb8b5] uppercase block font-medium">
                                PnL Khusus ${activeToken}:
                              </span>
                              <span
                                className={`font-bold tabular-nums ${
                                  isActivePositive
                                    ? "text-[#a3f784]"
                                    : "text-rose-400"
                                }`}
                              >
                                {isActivePositive ? "+" : ""}$
                                {activePnl.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                ({activeRoi >= 0 ? "+" : ""}
                                {activeRoi.toFixed(1)}%)
                              </span>
                            </div>
                          </div>

                          {/* 🌟 GLOWING MICRO SPARKLINE PNL CHART (KHUSUS KOIN AKTIF) */}
                          <PnLChart
                            data={[
                              { tokenSymbol: activeToken, pnl: activePnl },
                            ]}
                            transactions={chartTransactions}
                          />
                        </div>

                        {/* Shadow Mode Box specifically for active coin */}
                        <div
                          className={`mt-3 p-3 border rounded-xl flex justify-between items-center relative overflow-hidden ${
                            isFomoPositive
                              ? "bg-[#a3f784]/10 border-[#a3f784]/30"
                              : "bg-rose-500/10 border-rose-500/30"
                          }`}
                        >
                          <div>
                            <p
                              className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1 ${
                                isFomoPositive
                                  ? "text-[#a3f784]"
                                  : "text-rose-400"
                              }`}
                            >
                              <Ghost className="w-3.5 h-3.5" /> Shadow Mode
                              ($100 on ${activeToken})
                            </p>
                            <p className="text-xs font-bold text-white">
                              If copied:{" "}
                              <span
                                className={`font-bold text-sm tabular-nums ${
                                  isFomoPositive
                                    ? "text-[#a3f784]"
                                    : "text-rose-400"
                                }`}
                              >
                                ${shadowTotal.toFixed(2)}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-white uppercase tracking-widest">
                              Est. Profit
                            </p>
                            <p
                              className={`text-sm font-bold tabular-nums ${
                                isFomoPositive
                                  ? "text-[#a3f784]"
                                  : "text-rose-400"
                              }`}
                            >
                              {isFomoPositive ? "+" : ""}
                              {shadowProfit.toFixed(2)} USD
                            </p>
                          </div>
                        </div>

                        {/* 📜 HISTORI KOIN PAUS (PORTFOLIO BREAKDOWN PER-KOIN - INTERACTIVE CLICKABLE) */}
                        <div className="mt-3 pt-2.5 border-t border-[#a3f784]/15">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1">
                              <span>Portofolio Koin Paus</span>
                              <span className="text-[8px] text-[#9bb8b5] font-normal lowercase">
                                (klik koin untuk ganti grafik)
                              </span>
                            </p>
                            <span className="text-[9px] font-mono font-medium text-[#9bb8b5]">
                              {positions.length} Koin Ditradingkan
                            </span>
                          </div>

                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                            {positions.length > 0 ? (
                              positions.map((pos: any, pIdx: number) => {
                                const isPosPositive =
                                  Number(pos.realizedPnlUsd || 0) >= 0;
                                const isCurrent =
                                  pos.tokenSymbol?.toUpperCase() ===
                                  activeToken?.toUpperCase();
                                return (
                                  <button
                                    key={pos.tokenSymbol || pIdx}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTokenMap((prev) => ({
                                        ...prev,
                                        [w.id]: pos.tokenSymbol,
                                      }));
                                    }}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-mono border transition-all text-left cursor-pointer group/token ${
                                      isCurrent
                                        ? "bg-[#a3f784]/15 border-[#a3f784] ring-1 ring-[#a3f784]/40 text-white font-bold shadow-[0_0_12px_rgba(163,247,132,0.15)]"
                                        : "bg-[#06181a]/70 border-white/5 hover:border-[#a3f784]/30 hover:bg-[#0f3236]/80 text-[#9bb8b5]"
                                    }`}
                                    title={`Klik untuk menganalisis grafik & PnL $${pos.tokenSymbol}`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span
                                        className={`font-bold truncate ${
                                          isCurrent
                                            ? "text-[#a3f784]"
                                            : "text-white group-hover/token:text-[#a3f784]"
                                        }`}
                                      >
                                        ${pos.tokenSymbol}
                                      </span>
                                      {isCurrent ? (
                                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-[#a3f784] text-[#061a1d] font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                                          <span>✓</span> AKTIF
                                        </span>
                                      ) : (
                                        <span className="text-[7.5px] px-1 py-0.2 rounded border border-white/10 text-[#9bb8b5] group-hover/token:text-white uppercase font-medium">
                                          PILIH
                                        </span>
                                      )}
                                      <span
                                        className={`text-[8px] px-1.5 py-0.2 rounded uppercase font-semibold ${
                                          pos.status === "TAKE_PROFIT"
                                            ? "bg-amber-500/20 text-amber-300"
                                            : pos.status === "CUT_LOSS"
                                              ? "bg-rose-500/20 text-rose-300"
                                              : "bg-[#a3f784]/20 text-[#a3f784]"
                                        }`}
                                      >
                                        {pos.status === "TAKE_PROFIT"
                                          ? "SOLD / TP"
                                          : pos.status === "CUT_LOSS"
                                            ? "CUT LOSS"
                                            : "HOLDING"}
                                      </span>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <span
                                        className={`font-bold tabular-nums ${
                                          isPosPositive
                                            ? "text-[#a3f784]"
                                            : "text-rose-400"
                                        }`}
                                      >
                                        {isPosPositive ? "+" : ""}$
                                        {Number(
                                          pos.realizedPnlUsd || 0,
                                        ).toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                      <span className="text-[9px] text-[#9bb8b5] ml-1 tabular-nums">
                                        ({pos.roiPercent >= 0 ? "+" : ""}
                                        {Number(pos.roiPercent || 0).toFixed(1)}
                                        %)
                                      </span>
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <span className="text-[10px] text-[#9bb8b5] font-medium italic">
                                Belum ada riwayat posisi
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
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-4 border-t border-[#a3f784]/15">
                <span className="text-xs font-mono text-[#9bb8b5] font-semibold">
                  Showing targets {(page - 1) * 3 + 1} -{" "}
                  {Math.min(page * 3, totalWallets)} of {totalWallets}
                </span>

                <div className="flex items-center gap-3">
                  {page > 1 ? (
                    <Link
                      href={`/?page=${page - 1}&tab=watchlist`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#0b272a] hover:bg-[#0f3236] border border-[#a3f784]/20 rounded-full text-xs font-semibold uppercase tracking-wider text-[#f4fbf8] transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-[#0b272a]/40 border border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider text-[#9bb8b5]/40 cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </div>
                  )}

                  <span className="px-3.5 py-1.5 bg-[#061a1d] border border-[#a3f784]/30 rounded-full text-xs font-mono font-bold text-[#a3f784]">
                    {page} / {totalPages}
                  </span>

                  {page < totalPages ? (
                    <Link
                      href={`/?page=${page + 1}&tab=watchlist`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#0b272a] hover:bg-[#0f3236] border border-[#a3f784]/20 rounded-full text-xs font-semibold uppercase tracking-wider text-[#f4fbf8] transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-[#0b272a]/40 border border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider text-[#9bb8b5]/40 cursor-not-allowed">
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
              <div className="bg-[#0b272a] border border-[#a3f784]/15 rounded-2xl sm:rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#0f3236] border border-[#a3f784]/30 rounded-xl text-[#a3f784]">
                      <Radio className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight flex items-center gap-2 text-[#f4fbf8]">
                        Live Alpha Signals Feed
                        <span className="w-2 h-2 rounded-full bg-[#a3f784] animate-ping" />
                      </h2>
                      <p className="text-[10px] text-[#9bb8b5] uppercase font-mono font-medium">
                        Direct on-chain execution stream
                      </p>
                    </div>
                  </div>

                  {/* Buy / Sell Toggles */}
                  <div className="flex items-center bg-[#061a1d] border border-[#a3f784]/20 rounded-full p-1 text-[10px] font-bold">
                    <button
                      onClick={() => setSignalTypeFilter("ALL")}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        signalTypeFilter === "ALL"
                          ? "bg-[#a3f784] text-[#061a1d] font-bold"
                          : "text-[#9bb8b5] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setSignalTypeFilter("BUY")}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        signalTypeFilter === "BUY"
                          ? "bg-[#a3f784] text-[#061a1d] font-bold"
                          : "text-[#9bb8b5] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      BUYS
                    </button>
                    <button
                      onClick={() => setSignalTypeFilter("SELL")}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        signalTypeFilter === "SELL"
                          ? "bg-rose-500 text-white font-bold"
                          : "text-[#9bb8b5] hover:text-white hover:bg-white/5"
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
                      className="group p-4 bg-[#06181a]/80 border border-white/5 rounded-2xl hover:border-[#a3f784]/40 transition-all flex flex-col gap-2.5"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[#f4fbf8] group-hover:text-[#a3f784] transition-colors uppercase">
                          {log.wallet?.name || "Smart Money Alpha"}
                        </span>
                        <span className="text-[11px] text-[#9bb8b5] font-mono font-medium">
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
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                              log.type === "BUY"
                                ? "bg-[#a3f784]/20 text-[#a3f784] border border-[#a3f784]/50"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/50"
                            }`}
                          >
                            {log.type}
                          </span>
                          <div>
                            <p className="text-base font-bold text-[#f4fbf8] leading-tight">
                              ${log.tokenSymbol || "TOKEN"}
                            </p>
                            <p className="text-xs font-bold text-[#a3f784] tabular-nums font-mono">
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
                            className="p-2 bg-white/5 rounded-xl text-[#9bb8b5] hover:text-[#a3f784] hover:bg-[#a3f784]/10 transition-all"
                            title="View on Explorer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredSignals.length === 0 && (
                    <div className="text-center py-12 text-[#9bb8b5] text-xs font-mono uppercase font-semibold">
                      No signals matching current filter
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: AI Smart Trends & Multi-Wallet Confluence (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Smart Trends */}
              <div className="bg-[#0b272a] border border-orange-500/30 rounded-2xl sm:rounded-3xl p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[40px] rounded-full pointer-events-none" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="text-sm font-bold text-orange-400 tracking-widest flex items-center gap-2 uppercase">
                    <Flame className="w-4 h-4" /> AI Smart Trends
                  </h3>
                  <span className="text-[9px] text-orange-300 uppercase tracking-wider font-semibold border border-orange-500/30 px-2 py-1 rounded bg-orange-500/20">
                    Live Mindshare
                  </span>
                </div>

                <div className="space-y-3 relative z-10 max-h-[340px] overflow-y-auto pr-1">
                  {smartMoneyTrends.map((trend, i) => (
                    <div
                      key={trend.address || i}
                      className="p-3 bg-[#06181a]/80 border border-white/10 rounded-2xl flex flex-col gap-2 hover:border-orange-500/40 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            #{i + 1}
                          </span>
                          <span className="text-sm font-bold tabular-nums text-white">
                            ${trend.symbol}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-[#a3f784] tabular-nums flex items-center gap-1 font-mono">
                          <TrendingUp className="w-3.5 h-3.5 text-[#a3f784]" />
                          <span>{trend.buyCount} Whales In</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 uppercase flex items-center gap-1">
                          <BrainCircuit className="w-3 h-3" /> {trend.narrative}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                            trend.mindshare?.includes("Hype")
                              ? "bg-rose-500/30 text-rose-200 border-rose-500/40"
                              : "bg-amber-500/30 text-amber-200 border-amber-500/40"
                          }`}
                        >
                          {trend.mindshare}
                        </span>
                        {trend.confluence === "SUPER_ALPHA" && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#a3f784]/20 text-[#a3f784] border border-[#a3f784]/40 uppercase">
                            ⚡ Super Alpha
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {smartMoneyTrends.length === 0 && (
                    <p className="text-xs text-[#9bb8b5] text-center py-6 font-mono uppercase font-semibold">
                      Gathering AI Trends Data...
                    </p>
                  )}
                </div>
              </div>

              {/* Bot Routing Info Box */}
              <div className="bg-[#0b272a] border border-[#a3f784]/20 rounded-2xl sm:rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center gap-2.5 mb-3 text-[#a3f784]">
                  <Send className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Telegram Routing Architecture
                  </h4>
                </div>
                <p className="text-xs text-[#9bb8b5] font-medium mb-4">
                  Sinyal real-time otomatis disaring berdasarkan nominal
                  transaksi:
                </p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 bg-[#06181a]/90 border border-white/10 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">
                        Private Bot DM (@skom_tracker_bot)
                      </p>
                      <p className="text-[11px] text-[#9bb8b5] font-medium">
                        Chat ID: {savedChatId}
                      </p>
                    </div>
                    <span className="text-[#a3f784] font-bold text-sm tabular-nums">
                      &gt; $100 USD
                    </span>
                  </div>
                  <div className="p-3 bg-[#06181a]/90 border border-amber-500/30 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-amber-400">
                        Predator Alpha Channel
                      </p>
                      <p className="text-[11px] text-[#9bb8b5] font-medium">
                        Channel ID: {savedAlphaId}
                      </p>
                    </div>
                    <span className="text-amber-400 font-bold text-sm tabular-nums">
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
            <div className="bg-[#0b272a] border border-[#a3f784]/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                <div className="p-3 bg-[#0f3236] border border-[#a3f784]/30 rounded-2xl text-[#a3f784]">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-tight text-[#f4fbf8]">
                    Lock Target Whale
                  </h2>
                  <p className="text-xs text-[#9bb8b5] font-medium">
                    Masukkan address dompet whale untuk diawasi radar secara
                    24/7
                  </p>
                </div>
              </div>

              <form action={createWalletAction} className="space-y-5">
                {/* Wallet Address */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#f4fbf8] uppercase tracking-widest ml-1">
                    Wallet Address
                  </label>
                  <input
                    name="address"
                    required
                    placeholder="Contoh: HjxaED... atau 0x71C... atau bc1q..."
                    className="w-full bg-[#061a1d] border border-[#a3f784]/20 rounded-2xl px-5 py-3.5 font-medium outline-none font-mono text-sm focus:border-[#a3f784] text-[#f4fbf8] placeholder-[#9bb8b5]"
                  />
                </div>

                {/* 🌟 MODERN BLOCKCHAIN NETWORK SELECTOR */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#f4fbf8] uppercase tracking-widest ml-1">
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
                              ? "bg-[#0f3236] border-[#a3f784] shadow-[0_0_15px_rgba(163,247,132,0.25)] ring-1 ring-[#a3f784]"
                              : "bg-[#06181a]/80 border-white/10 hover:border-[#a3f784]/30 hover:bg-[#0f3236]/60"
                          }`}
                        >
                          <img
                            src={NETWORK_LOGOS[n.value]}
                            alt={n.label}
                            className="w-6 h-6 rounded-full bg-white p-0.5 shrink-0 shadow-sm"
                          />
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-bold uppercase ${
                                isSelected ? n.color : "text-white"
                              }`}
                            >
                              {n.label}
                            </p>
                            <p className="text-[9px] text-[#9bb8b5] uppercase font-mono font-medium">
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
                  <label className="text-[11px] font-bold text-[#f4fbf8] uppercase tracking-widest ml-1">
                    Alias / Nama Target
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="Contoh: Smart Money Alpha #3"
                    className="w-full bg-[#061a1d] border border-[#a3f784]/20 rounded-2xl px-5 py-3.5 font-medium outline-none text-sm focus:border-[#a3f784] text-[#f4fbf8] placeholder-[#9bb8b5]"
                  />
                </div>

                {/* Telegram Personal Chat ID */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-[#f4fbf8] uppercase tracking-widest ml-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-cyan-400" /> Telegram
                      Chat ID (Personal DM)
                    </span>
                    <span className="text-[#a3f784] font-bold">
                      🔒 Auto-Synced
                    </span>
                  </label>
                  <input
                    name="chatId"
                    defaultValue={savedChatId}
                    readOnly={!!savedChatId}
                    className={`w-full rounded-2xl px-5 py-3.5 font-bold outline-none text-sm ${
                      savedChatId
                        ? "bg-[#a3f784]/10 border border-[#a3f784]/40 text-[#a3f784] cursor-not-allowed font-mono"
                        : "bg-[#061a1d] border border-[#a3f784]/20 text-[#f4fbf8] font-mono"
                    }`}
                  />
                  <p className="text-[10px] text-[#9bb8b5] font-medium ml-1">
                    Menerima notifikasi langsung dari @skom_tracker_bot untuk
                    transaksi &gt; $100.
                  </p>
                </div>

                {/* Telegram Alpha Channel ID */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-[#f4fbf8] uppercase tracking-widest ml-1 flex items-center justify-between">
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
                        : "bg-[#061a1d] border border-[#a3f784]/20 text-[#f4fbf8] font-mono"
                    }`}
                  />
                  <p className="text-[10px] text-[#9bb8b5] font-medium ml-1">
                    Menerima sinyal transaksi paus besar &gt; $1,000 di channel
                    Predator Alpha Feed.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 mt-4 bg-[#a3f784] hover:bg-[#b6f99c] text-[#061a1d] font-bold rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(163,247,132,0.3)] cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-[#061a1d]" />
                  <span>START RADAR SURVEILLANCE</span>
                  <ChevronRight className="w-4 h-4 text-[#061a1d]" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── TAB 4: COMMAND MENU (HALAMAN MENU MODERN AKURAT) ───────── */}
        {activeTab === "menu" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Header Menu Title */}
            <div className="bg-gradient-to-r from-[#0b272a] via-[#0f3236] to-[#0b272a] border border-[#a3f784]/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a3f784]/20 text-[#a3f784] text-xs font-mono font-bold mb-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>PREDATOR SYSTEM COMMAND</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#f4fbf8]">
                  Terminal & Security Menu
                </h2>
                <p className="text-xs sm:text-sm text-[#9bb8b5] font-medium mt-1">
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
              <div className="bg-[#0b272a] border border-[#a3f784]/15 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="p-2.5 bg-[#0f3236] border border-[#a3f784]/30 rounded-2xl text-[#a3f784]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Operator Clearance
                    </h3>
                    <p className="text-[10px] text-[#9bb8b5] uppercase font-mono font-medium">
                      Multi-Tenant Encrypted Session
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between p-3 bg-[#06181a]/90 rounded-xl">
                    <span className="text-[#9bb8b5]">Operator Name:</span>
                    <span className="font-bold text-white">{dbUser.name}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#06181a]/90 rounded-xl">
                    <span className="text-[#9bb8b5]">Operator Email:</span>
                    <span className="font-bold text-white">{dbUser.email}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#06181a]/90 rounded-xl">
                    <span className="text-[#9bb8b5]">Clearance Role:</span>
                    <span className="font-bold text-[#a3f784]">
                      {dbUser.role}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#06181a]/90 rounded-xl">
                    <span className="text-[#9bb8b5]">Current Tier:</span>
                    <span className="font-bold text-amber-400">
                      {dbUser.tier}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#06181a]/90 rounded-xl">
                    <span className="text-[#9bb8b5]">
                      Radar Target Capacity:
                    </span>
                    <span className="font-bold text-cyan-400">
                      {totalWallets} Whales Monitored
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Telegram Bot Hub */}
              <div className="bg-[#0b272a] border border-[#a3f784]/15 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Telegram Intelligence Hub
                    </h3>
                    <p className="text-[10px] text-[#9bb8b5] uppercase font-mono font-medium">
                      24/7 Automated Notification Pipes
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 bg-[#06181a]/90 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#9bb8b5]">Bot Handle:</span>
                      <span className="font-bold text-cyan-400">
                        @skom_tracker_bot
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9bb8b5]">Status:</span>
                      <span className="font-bold text-[#a3f784]">
                        ● LIVE & SINKRON
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#06181a]/90 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#9bb8b5]">
                        Personal DM (Chat ID):
                      </span>
                      <span className="font-bold text-white">
                        {savedChatId}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9bb8b5]">
                      ⚡ Menerima transaksi copy-trade whale di atas $100 USD.
                    </p>
                  </div>

                  <div className="p-3 bg-[#06181a]/90 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#9bb8b5]">
                        Alpha Feed (Channel ID):
                      </span>
                      <span className="font-bold text-amber-400">
                        {savedAlphaId}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9bb8b5]">
                      👑 Menerima transaksi mega-whale di atas $1,000 USD.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Radar Engine & Telemetry */}
              <div className="bg-[#0b272a] border border-[#a3f784]/15 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      Radar Engine Telemetry
                    </h3>
                    <p className="text-[10px] text-[#9bb8b5] uppercase font-mono font-medium">
                      Real-Time Microservices Health
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center p-3 bg-[#06181a]/90 rounded-xl">
                    <span className="text-[#9bb8b5]">
                      Worker Daemon (Local):
                    </span>
                    <span className="text-[#a3f784] font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#a3f784] animate-pulse" />
                      ONLINE (RUNNER)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#06181a]/90 rounded-xl">
                    <span className="text-[#9bb8b5]">GitHub Actions Cron:</span>
                    <span className="text-[#a3f784] font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#a3f784]" />
                      EVERY 10 MIN
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#06181a]/90 rounded-xl">
                    <span className="text-[#9bb8b5]">Anti-Rugpull Guard:</span>
                    <span className="text-cyan-400 font-bold">
                      ACTIVE (RUGCHECK)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-[#06181a]/90 rounded-xl">
                    <span className="text-[#9bb8b5]">Confluence Detector:</span>
                    <span className="text-amber-400 font-bold">
                      MULTI-WALLET ACTIVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Quick Navigation & Security Actions */}
              <div className="bg-[#0b272a] border border-[#a3f784]/15 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                        Security & Terminal Controls
                      </h3>
                      <p className="text-[10px] text-[#9bb8b5] uppercase font-mono font-medium">
                        Session & Keypad PIN Management
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-between p-3 bg-[#06181a]/90 hover:bg-[#0f3236] border border-white/10 rounded-xl text-xs font-mono font-bold transition-all text-[#f4fbf8]"
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-medium">
                          Ganti / Reset PIN Keamanan
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#9bb8b5]" />
                    </Link>

                    <button
                      onClick={() => handleTabChange("add")}
                      className="w-full flex items-center justify-between p-3 bg-[#06181a]/90 hover:bg-[#a3f784]/10 border border-white/10 hover:border-[#a3f784]/30 rounded-xl text-xs font-mono font-bold transition-all text-white hover:text-[#a3f784] cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <PlusCircle className="w-3.5 h-3.5 text-[#a3f784]" />
                        <span className="font-medium">
                          Tambah Target Whale Baru
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#9bb8b5]" />
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
                    <LogOut className="w-3.5 h-3.5" />
                    <span>SIGNOUT SESI</span>
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
          <div className="w-full max-w-md bg-[#0b272a] border border-rose-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(244,63,94,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[40px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight text-white">
                  Eliminasi Target Whale?
                </h3>
                <p className="text-[10px] text-rose-400 uppercase font-mono font-bold">
                  Security Clearance Warning
                </p>
              </div>
            </div>

            <p className="text-xs text-[#9bb8b5] leading-relaxed mb-4 font-medium">
              Apakah Anda yakin ingin menghapus pemantauan target{" "}
              <span className="text-white font-bold">
                "{whaleToDelete.name}"
              </span>
              ? Pelacakan transaksi on-chain untuk dompet ini akan
              dinonaktifkan.
            </p>

            <div className="p-3 bg-[#06181a] border border-white/10 rounded-xl font-mono text-[11px] text-[#9bb8b5] mb-6 truncate font-medium">
              Address:{" "}
              <span className="text-[#a3f784] font-bold">
                {whaleToDelete.address}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setWhaleToDelete(null)}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer"
              >
                Batal
              </button>

              <form action={deleteWalletAction} className="flex-1">
                <input type="hidden" name="id" value={whaleToDelete.id} />
                <button
                  type="submit"
                  onClick={() => setWhaleToDelete(null)}
                  className="w-full py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#061a1d]/95 backdrop-blur-xl border-t border-[#a3f784]/20 px-3 py-2 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pb-safe">
        {/* Watchlist Tab */}
        <button
          onClick={() => handleTabChange("watchlist")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative cursor-pointer ${
            activeTab === "watchlist"
              ? "text-[#a3f784] scale-105"
              : "text-[#9bb8b5] hover:text-[#f4fbf8]"
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            Watchlist
          </span>
          <span className="absolute top-0 right-2 w-4 h-4 bg-[#a3f784] text-[#061a1d] text-[9px] font-bold rounded-full flex items-center justify-center">
            {totalWallets}
          </span>
        </button>

        {/* Alpha Feed Tab */}
        <button
          onClick={() => handleTabChange("feed")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative cursor-pointer ${
            activeTab === "feed"
              ? "text-[#a3f784] scale-105"
              : "text-[#9bb8b5] hover:text-[#f4fbf8]"
          }`}
        >
          <Radio className="w-5 h-5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            Alpha Feed
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#a3f784] absolute top-1 right-3 animate-ping" />
        </button>

        {/* Add Target Tab (High Accent) */}
        <button
          onClick={() => handleTabChange("add")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "add"
              ? "text-[#a3f784] scale-105"
              : "text-[#9bb8b5] hover:text-[#f4fbf8]"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              activeTab === "add"
                ? "bg-[#a3f784] text-[#061a1d] shadow-[0_0_12px_rgba(163,247,132,0.5)]"
                : "bg-white/10 text-white"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-wider">
            Lock Target
          </span>
        </button>

        {/* Command Menu Tab */}
        <button
          onClick={() => handleTabChange("menu")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === "menu"
              ? "text-[#a3f784] scale-105"
              : "text-[#9bb8b5] hover:text-[#f4fbf8]"
          }`}
        >
          <Terminal className="w-5 h-5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            Menu
          </span>
        </button>
      </nav>
    </main>
  );
}
