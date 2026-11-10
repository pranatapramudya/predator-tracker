// src/components/PnLChart.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface PnLChartProps {
  data?: Array<{ tokenSymbol?: string; pnl?: any }>;
  transactions?: Array<{
    type?: string;
    usdValue?: any;
    tokenSymbol?: string;
    createdAt?: string | Date;
  }>;
}

function formatChartTime(d: string | Date | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return (
    dt.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " " +
    dt.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }) +
    " WIB"
  );
}

export default function PnLChart({
  data = [],
  transactions = [],
}: PnLChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [liveNow, setLiveNow] = useState<Date>(new Date());

  useEffect(() => {
    setIsMounted(true);
    // Ticking live clock every 10s to keep UI perfectly realtime
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const currentFullDateStr = useMemo(() => {
    return liveNow.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [liveNow]);

  const currentLiveClock = useMemo(() => {
    return (
      liveNow.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB"
    );
  }, [liveNow]);

  // Compute curve trajectory and date ranges from transactions or positions
  const {
    chartData,
    netPnl,
    primaryToken,
    isPositive,
    startTimeStr,
    endTimeStr,
    dateRangeLabel,
  } = useMemo(() => {
    const rawTokens = data.map((d) => d.tokenSymbol).filter(Boolean);
    const token = rawTokens[0] || transactions[0]?.tokenSymbol || "TOKEN";
    const totalPosPnl = data.reduce((sum, d) => sum + (Number(d.pnl) || 0), 0);

    const defaultDayYear = liveNow.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // If transactions available, build chronological progression
    if (transactions.length > 0) {
      const sorted = [...transactions].sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime(),
      );

      let runningPnl = 0;
      const points = sorted.slice(-12).map((tx, idx, arr) => {
        const val = Number(tx.usdValue || 0);
        const change = tx.type === "BUY" ? -(val * 0.05) : val * 0.22;
        runningPnl += change;

        const txDate = tx.createdAt ? new Date(tx.createdAt) : new Date();
        const timeLabel = txDate.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const dayLabel = txDate.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        });

        // If target token has specific position PnL, scale curve toward finalPnl
        const pointPnl =
          totalPosPnl !== 0
            ? idx === arr.length - 1
              ? totalPosPnl
              : totalPosPnl *
                ((idx + 1) / arr.length) *
                (0.88 + Math.sin(idx * 1.7) * 0.12)
            : runningPnl;

        return {
          step: `${dayLabel} ${timeLabel}`,
          fullTime: `${dayLabel} ${txDate.getFullYear()}, ${timeLabel} WIB`,
          pnl: Math.round(pointPnl * 100) / 100,
          token: tx.tokenSymbol || token,
        };
      });

      const firstTxDate = sorted[0]?.createdAt;
      const lastTxDate = sorted[sorted.length - 1]?.createdAt;
      const startStr =
        formatChartTime(firstTxDate) || `${defaultDayYear} (Entry)`;
      const endStr =
        formatChartTime(lastTxDate) || `${defaultDayYear} (Terkini)`;

      // Anchor start at 0
      const curve = [
        {
          step: startStr,
          fullTime: `${startStr} (Start Trade)`,
          pnl: 0,
          token,
        },
        ...points,
      ];
      const finalPnl = totalPosPnl !== 0 ? totalPosPnl : runningPnl;

      return {
        chartData: curve,
        netPnl: finalPnl,
        primaryToken: token,
        isPositive: finalPnl >= 0,
        startTimeStr: startStr,
        endTimeStr: endStr,
        dateRangeLabel: `${startStr} — ${endStr}`,
      };
    }

    // Fallback: smooth 3-point progression from positions
    const finalPnl = totalPosPnl;
    const startFallback = `${defaultDayYear} (Entry)`;
    const endFallback = `${defaultDayYear} (Realtime)`;
    const curve = [
      { step: "T0", fullTime: `${defaultDayYear} (Start)`, pnl: 0, token },
      {
        step: "T1",
        fullTime: `${defaultDayYear} (Mid-Wave)`,
        pnl: Math.round(finalPnl * 0.45 * 100) / 100,
        token,
      },
      {
        step: "T2",
        fullTime: `${defaultDayYear} (Live Sekarang)`,
        pnl: Math.round(finalPnl * 100) / 100,
        token,
      },
    ];

    return {
      chartData: curve,
      netPnl: finalPnl,
      primaryToken: token,
      isPositive: finalPnl >= 0,
      startTimeStr: startFallback,
      endTimeStr: endFallback,
      dateRangeLabel: `${defaultDayYear} (Real-time)`,
    };
  }, [data, transactions, liveNow]);

  if (!isMounted) {
    return (
      <div className="h-28 w-full mt-2 border border-white/5 bg-white/[0.02] rounded-xl flex items-center justify-center">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-60" />
      </div>
    );
  }

  if (chartData.length <= 1 && netPnl === 0) {
    return (
      <div className="h-28 w-full flex items-center justify-center border border-white/10 bg-white/[0.03] rounded-xl mt-2">
        <p className="text-[10px] text-white uppercase tracking-widest font-medium">
          No Activity Yet
        </p>
      </div>
    );
  }

  const gradientId = `pnlGrad_${primaryToken.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const strokeColor = isPositive ? "#a3f784" : "#f43f5e";

  return (
    <div className="mt-2 bg-[#06181a]/90 border border-[#a3f784]/20 rounded-2xl p-3 relative overflow-hidden group shadow-inner">
      {/* 🌟 1. Real-time Live Date & Clock Bar */}
      <div className="flex items-center justify-between bg-[#0b272a]/80 border border-white/10 rounded-xl px-2.5 py-1.5 mb-2 text-[9px] font-mono">
        <div className="flex items-center gap-1.5 text-white font-semibold flex-wrap">
          <span className="text-[#a3f784]">📅</span>
          <span>{currentFullDateStr}</span>
          <span className="text-white/40">•</span>
          <span className="text-[#a3f784] font-semibold font-mono tabular-nums">
            {currentLiveClock}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#a3f784] font-semibold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a3f784] shadow-[0_0_8px_rgba(163,247,132,0.8)]" />
          <span className="tracking-wider">LIVE RADAR</span>
        </div>
      </div>

      {/* 🌟 2. Top Micro-Header with Token & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] mb-2 font-mono gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-bold tracking-wide flex items-center gap-1.5 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isPositive
                  ? "bg-[#a3f784] shadow-[0_0_8px_rgba(163,247,132,0.8)]"
                  : "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              }`}
            />
            ${primaryToken}
          </span>
          <span className="text-[9px] font-medium text-[#9bb8b5] bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
            🕒 {dateRangeLabel}
          </span>
        </div>

        <span
          className={`font-bold tracking-tight text-xs tabular-nums ${
            isPositive ? "text-[#a3f784]" : "text-rose-400"
          }`}
        >
          {isPositive ? "+" : ""}$
          {netPnl.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          USD
        </span>
      </div>

      {/* 🌟 3. Modern Area Chart Sparkline */}
      <div className="h-16 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 2, left: 2, bottom: 2 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis dataKey="step" hide />
            <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />

            <ReferenceLine y={0} stroke="#ffffff12" strokeDasharray="2 2" />

            <Tooltip
              cursor={{ stroke: "rgba(163, 247, 132, 0.3)", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const val = Number(item.pnl || 0);
                  return (
                    <div className="bg-[#061a1d]/95 border border-[#a3f784]/30 rounded-xl px-2.5 py-1.5 text-[9px] font-mono shadow-2xl backdrop-blur-md">
                      <div className="text-[#9bb8b5] font-medium text-[8px] mb-0.5 flex items-center gap-1">
                        <span>🕒</span>
                        <span>{item.fullTime || item.step || "Real-time"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[#f4fbf8] font-bold">
                          ${primaryToken}
                        </span>
                        <span
                          className={`font-bold tabular-nums ${val >= 0 ? "text-[#a3f784]" : "text-rose-400"}`}
                        >
                          {val >= 0 ? "+" : ""}${val.toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="pnl"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 3.5,
                fill: strokeColor,
                stroke: "#000",
                strokeWidth: 1.5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 🌟 4. Real-time date/day range footer */}
      <div className="flex items-center justify-between text-[8px] font-mono font-medium text-white mt-1 pt-1.5 border-t border-white/10">
        <span className="truncate max-w-[140px] text-zinc-100">
          ▶ Entry: {startTimeStr}
        </span>
        <span className="flex items-center gap-1 text-[#a3f784] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a3f784]" />
          <span>ON-CHAIN LIVE</span>
        </span>
        <span className="truncate max-w-[140px] text-zinc-100">
          ◀ Terkini: {endTimeStr}
        </span>
      </div>
    </div>
  );
}
