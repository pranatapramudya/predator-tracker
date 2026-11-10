// src/components/WhaleCard.tsx
"use client";

import React, { useState, useMemo, useTransition, memo } from "react";
import PnLChart from "@/components/PnLChart";
import { Trash2, Ghost, Copy, Check } from "lucide-react";

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

  Object.values(tokenGroups).forEach((txList) => {
    const buys = txList.filter((t) => t.type === "BUY");
    const sells = txList.filter((t) => t.type === "SELL");

    if (buys.length > 0 && sells.length > 0) {
      const firstBuy = new Date(buys[0].createdAt).getTime();
      const lastSell = new Date(sells[sells.length - 1].createdAt).getTime();
      const holdTimeHours = Math.max(
        0,
        (lastSell - firstBuy) / (1000 * 60 * 60),
      );
      totalHoldTimeHours += holdTimeHours;
      pairCount++;
    }
  });

  const avgHoldHours = pairCount > 0 ? totalHoldTimeHours / pairCount : 12;

  if (avgHoldHours < 4) {
    return {
      label: "SCALPER",
      color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      icon: "⚡",
    };
  } else if (avgHoldHours <= 48) {
    return {
      label: "SWING TRADER",
      color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      icon: "🌊",
    };
  } else {
    return {
      label: "DIAMOND HANDS",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      icon: "💎",
    };
  }
}

interface WhaleCardProps {
  wallet: any;
  idx: number;
  page: number;
  stats: {
    totalInvested: number;
    totalPnl: number;
    roiPercent: number;
    activePosition: any;
    activePnl: number;
    activeRoi: number;
  };
  dbUser: {
    id: string;
    role: string;
    tier: string;
    shadowBalance?: number;
  };
  onDelete: (wallet: { id: string; name: string; address: string }) => void;
}

function WhaleCardComponent({
  wallet: w,
  idx,
  page,
  stats,
  dbUser,
  onDelete,
}: WhaleCardProps) {
  const positions: any[] = useMemo(() => w.positions || [], [w.positions]);

  // Local state for selected token inside this specific whale card
  // Prevents re-rendering other whale cards or parent shell on mobile
  const [selectedToken, setSelectedToken] = useState<string>(
    () => positions[0]?.tokenSymbol || "",
  );
  const [copied, setCopied] = useState(false);
  const [, startTokenTransition] = useTransition();

  const handleCopy = () => {
    if (!w.address) return;
    navigator.clipboard.writeText(w.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whaleTag = useMemo(
    () => getWhaleTag(w.winRate, w.totalTrades),
    [w.winRate, w.totalTrades],
  );
  const safeName = w.name || "Target";
  const tradeStyle = useMemo(
    () => getTradeStyleBadge(w.transactions),
    [w.transactions],
  );

  const activePos = useMemo(() => {
    if (selectedToken) {
      return (
        positions.find(
          (p: any) =>
            p.tokenSymbol?.toUpperCase() === selectedToken.toUpperCase(),
        ) ||
        positions[0] ||
        null
      );
    }
    return positions[0] || stats.activePosition || null;
  }, [positions, selectedToken, stats.activePosition]);

  const activeToken =
    activePos?.tokenSymbol || w.transactions?.[0]?.tokenSymbol || "TOKEN";
  const activePnl = activePos
    ? Number(activePos.realizedPnlUsd || 0)
    : stats.totalPnl;
  const activeRoi = activePos
    ? Number(activePos.roiPercent || 0)
    : stats.roiPercent;
  const activeInvested = activePos
    ? Number(activePos.totalInvestedUsd || activePos.buyUsd || 0)
    : stats.totalInvested;
  const isActivePositive = activePnl >= 0;
  const activeStatus = activePos?.status || "HOLDING";

  // Filter transactions memoized specifically for this active token
  const chartTransactions = useMemo(() => {
    const activeTx = (w.transactions || []).filter(
      (tx: any) => tx.tokenSymbol?.toUpperCase() === activeToken?.toUpperCase(),
    );
    return activeTx.length > 0 ? activeTx : w.transactions;
  }, [w.transactions, activeToken]);

  const chartData = useMemo(
    () => [{ tokenSymbol: activeToken, pnl: activePnl }],
    [activeToken, activePnl],
  );

  const baseShadow = dbUser.shadowBalance || 100;
  const shadowProfit = (baseShadow * activeRoi) / 100;
  const shadowTotal = baseShadow + shadowProfit;
  const isFomoPositive = shadowProfit >= 0;

  const handleTokenSelect = (tokenSymbol: string) => {
    startTokenTransition(() => {
      setSelectedToken(tokenSymbol);
    });
  };

  return (
    <div className="group bg-white border border-slate-200/90 hover:border-emerald-500/50 p-4 sm:p-5 rounded-3xl transition-colors shadow-sm relative overflow-hidden flex flex-col justify-between">
      {/* Card Header */}
      <div>
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                TARGET #{(page - 1) * 3 + idx + 1}
              </span>
              <span
                className={`text-[8px] px-2 py-0.5 rounded border tracking-wider font-semibold ${whaleTag.style}`}
              >
                {whaleTag.text}
              </span>
            </div>

            <h3
              className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase truncate"
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
                loading="lazy"
                decoding="async"
                className="w-5 h-5 rounded-full bg-slate-100 p-0.5 shrink-0 shadow-sm border border-slate-200"
              />
              <span className="text-sm font-bold tabular-nums tracking-tight truncate text-slate-900">
                {w.network === "BITCOIN"
                  ? `₿ ${Number(w.lastBalance).toFixed(6)}`
                  : w.network === "SOLANA"
                    ? `◎ ${Number(w.lastBalance).toFixed(2)}`
                    : `Ξ ${Number(w.lastBalance).toFixed(4)}`}
              </span>
              <div className="text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200">
                <span>{tradeStyle.icon}</span> {tradeStyle.label}
              </div>
            </div>
          </div>

          {/* Network & Modern Delete Trigger */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[9px] font-bold px-2 py-1 rounded-full border border-slate-200 bg-slate-100 text-slate-700 uppercase">
              {w.network}
            </span>

            {dbUser.tier === "FREE" && dbUser.role !== "OWNER" ? (
              <span
                className="p-1 text-slate-400 font-bold cursor-not-allowed"
                title="Slot Locked. Upgrade to change."
              >
                🔒
              </span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onDelete({ id: w.id, name: safeName, address: w.address })
                }
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Eliminate Target"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 🏆 RAPOR AKUN MENYELURUH (LIFETIME WHALE STATS) */}
        <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-center text-xs font-mono">
          <div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              All-Time PnL
            </p>
            <p
              className={`text-xs font-bold mt-0.5 tabular-nums ${stats.totalPnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              {stats.totalPnl >= 0 ? "+" : ""}$
              {Math.round(stats.totalPnl).toLocaleString()}
            </p>
          </div>
          <div className="border-x border-slate-200 px-1">
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              Win Rate
            </p>
            <p
              className={`text-xs font-bold mt-0.5 tabular-nums ${w.winRate >= 70 ? "text-amber-600" : w.winRate >= 40 ? "text-cyan-700" : "text-rose-600"}`}
            >
              {Number(w.winRate).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              Total Trades
            </p>
            <p className="text-xs font-bold mt-0.5 tabular-nums text-slate-800">
              <span className="text-emerald-600">{w.successTrades || 0}</span>
              <span className="text-slate-400 mx-0.5">/</span>
              <span>{w.totalTrades || 0}</span>
            </p>
          </div>
        </div>

        {/* 🎯 TARGET AKTIF (KOIN YANG SEDANG DITRADE / DIPILIH) - SLEEK TERMINAL RADAR */}
        <div className="mt-3.5 p-3.5 bg-[#061a1d] border border-[#a3f784]/30 rounded-2xl relative overflow-hidden shadow-md text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#a3f784]" />
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
                  ? "bg-[#a3f784]/20 text-[#a3f784] border-[#a3f784]/50"
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
                className={`font-bold tabular-nums ${isActivePositive ? "text-[#a3f784]" : "text-rose-400"}`}
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

          {/* 🌟 GLOWING MICRO SPARKLINE PNL CHART */}
          <PnLChart data={chartData} transactions={chartTransactions} />
        </div>

        {/* Shadow Mode Box specifically for active coin */}
        <div
          className={`mt-3 p-3 border rounded-2xl flex justify-between items-center relative overflow-hidden ${
            isFomoPositive
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
              : "bg-rose-50/90 border-rose-200 text-rose-950"
          }`}
        >
          <div>
            <p
              className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1 ${isFomoPositive ? "text-emerald-700" : "text-rose-700"}`}
            >
              <Ghost className="w-3.5 h-3.5" /> Shadow Mode ($100 on $
              {activeToken})
            </p>
            <p className="text-xs font-bold text-slate-800">
              If copied:{" "}
              <span
                className={`font-bold text-sm tabular-nums ${isFomoPositive ? "text-emerald-600" : "text-rose-600"}`}
              >
                ${shadowTotal.toFixed(2)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Est. Profit
            </p>
            <p
              className={`text-sm font-bold tabular-nums ${isFomoPositive ? "text-emerald-600" : "text-rose-600"}`}
            >
              {isFomoPositive ? "+" : ""}
              {shadowProfit.toFixed(2)} USD
            </p>
          </div>
        </div>

        {/* 📜 HISTORI KOIN PAUS (PORTFOLIO BREAKDOWN PER-KOIN - INSTANT ZERO-LAG SELECTION) */}
        <div className="mt-3 pt-2.5 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1">
              <span>Portofolio Koin Paus</span>
              <span className="text-[8px] text-slate-400 font-normal lowercase">
                (klik koin untuk ganti grafik)
              </span>
            </p>
            <span className="text-[9px] font-mono font-medium text-slate-500">
              {positions.length} Koin Ditradingkan
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto overscroll-contain pr-0.5 touch-pan-y">
            {positions.length > 0 ? (
              positions.map((pos: any, pIdx: number) => {
                const isPosPositive = Number(pos.realizedPnlUsd || 0) >= 0;
                const isCurrent =
                  pos.tokenSymbol?.toUpperCase() === activeToken?.toUpperCase();
                return (
                  <button
                    key={pos.tokenSymbol || pIdx}
                    type="button"
                    onClick={() => handleTokenSelect(pos.tokenSymbol)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-mono border transition-colors text-left cursor-pointer group/token touch-manipulation active:scale-[0.98] select-none ${
                      isCurrent
                        ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700 hover:border-slate-300"
                    }`}
                    style={{ touchAction: "manipulation" }}
                    title={`Klik untuk menganalisis grafik & PnL $${pos.tokenSymbol}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`font-bold truncate ${isCurrent ? "text-emerald-700 font-bold" : "text-slate-800 group-hover/token:text-slate-900"}`}
                      >
                        ${pos.tokenSymbol}
                      </span>
                      {isCurrent ? (
                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                          <span>✓</span> AKTIF
                        </span>
                      ) : (
                        <span className="text-[7.5px] px-1 py-0.2 rounded border border-slate-200 text-slate-400 group-hover/token:text-slate-700 uppercase font-medium bg-white">
                          PILIH
                        </span>
                      )}
                      <span
                        className={`text-[8px] px-1.5 py-0.2 rounded uppercase font-semibold ${
                          pos.status === "TAKE_PROFIT"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : pos.status === "CUT_LOSS"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
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
                        className={`font-bold tabular-nums ${isPosPositive ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {isPosPositive ? "+" : ""}$
                        {Number(pos.realizedPnlUsd || 0).toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </span>
                      <span className="text-[9px] text-slate-400 ml-1 tabular-nums">
                        ({pos.roiPercent >= 0 ? "+" : ""}
                        {Number(pos.roiPercent || 0).toFixed(1)}%)
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                <span className="text-[10px] text-slate-400 font-mono">
                  Belum ada riwayat posisi koin
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Target Address Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold">
          <span className="truncate max-w-[160px] text-slate-600 font-medium">
            {w.address
              ? `${w.address.slice(0, 6)}...${w.address.slice(-6)}`
              : ""}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer p-0.5"
            title="Copy Address"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="tracking-widest uppercase text-[9px]">LIVE</span>
        </div>
      </div>
    </div>
  );
}

export const WhaleCard = memo(WhaleCardComponent);
export default WhaleCard;
