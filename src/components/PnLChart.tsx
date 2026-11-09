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
      day: "numeric",
      month: "short",
    }) +
    " " +
    dt.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

export default function PnLChart({
  data = [],
  transactions = [],
}: PnLChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

    const now = new Date();
    const defaultDateStr = now.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    // If transactions available, build chronological progression
    if (transactions.length > 0) {
      const sorted = [...transactions].sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime(),
      );

      let runningPnl = 0;
      const points = sorted.slice(-12).map((tx, idx) => {
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

        return {
          step: `${dayLabel} ${timeLabel}`,
          fullTime: `${dayLabel}, ${timeLabel}`,
          pnl: Math.round(runningPnl * 100) / 100,
          token: tx.tokenSymbol || token,
        };
      });

      const firstTxDate = sorted[0]?.createdAt;
      const lastTxDate = sorted[sorted.length - 1]?.createdAt;
      const startStr = formatChartTime(firstTxDate) || "Awal Trade";
      const endStr = formatChartTime(lastTxDate) || "Live";

      // Anchor start at 0
      const curve = [
        {
          step: startStr,
          fullTime: `${startStr} (Entry)`,
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
    const startFallback = "Hari ini";
    const endFallback = "Live";
    const curve = [
      { step: "T0", fullTime: `${defaultDateStr} (Start)`, pnl: 0, token },
      {
        step: "T1",
        fullTime: `${defaultDateStr} (Mid)`,
        pnl: Math.round(finalPnl * 0.45 * 100) / 100,
        token,
      },
      {
        step: "T2",
        fullTime: `${defaultDateStr} (Sekarang)`,
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
      dateRangeLabel: `${defaultDateStr} (Real-time)`,
    };
  }, [data, transactions]);

  if (!isMounted) {
    return (
      <div className="h-24 w-full mt-2 border border-white/5 bg-white/[0.02] rounded-xl flex items-center justify-center">
        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-40" />
      </div>
    );
  }

  if (chartData.length <= 1 && netPnl === 0) {
    return (
      <div className="h-24 w-full flex items-center justify-center border border-white/10 bg-white/[0.03] rounded-xl mt-2">
        <p className="text-[10px] text-white uppercase tracking-widest font-black">
          No Activity Yet
        </p>
      </div>
    );
  }

  const gradientId = `pnlGrad_${primaryToken.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const strokeColor = isPositive ? "#10b981" : "#f43f5e";

  return (
    <div className="mt-2 bg-zinc-950/80 border border-white/15 rounded-xl p-2.5 relative overflow-hidden group">
      {/* Top Micro-Header with Date/Day Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] mb-1.5 font-mono gap-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-white font-black tracking-wider flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isPositive
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  : "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              }`}
            />
            ${primaryToken}
          </span>
          <span className="text-[9px] font-bold text-white bg-white/10 px-1.5 py-0.2 rounded border border-white/15">
            📅 {dateRangeLabel}
          </span>
        </div>

        <span
          className={`font-black tracking-tight text-xs ${
            isPositive ? "text-emerald-400" : "text-rose-400"
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

      {/* Modern Area Chart Sparkline */}
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
              cursor={{ stroke: "#ffffff30", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const val = Number(item.pnl || 0);
                  return (
                    <div className="bg-black/95 border border-white/20 rounded-xl px-2.5 py-1.5 text-[9px] font-mono shadow-2xl backdrop-blur-md">
                      <div className="text-white font-bold text-[8px] mb-0.5 flex items-center gap-1">
                        <span>🕒</span>
                        <span>{item.fullTime || item.step || "Real-time"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white font-black">
                          {primaryToken}
                        </span>
                        <span
                          className={`font-black ${val >= 0 ? "text-emerald-400" : "text-rose-400"}`}
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

      {/* Real-time date/day range footer */}
      <div className="flex items-center justify-between text-[8px] font-mono font-bold text-white mt-1 pt-1 border-t border-white/10">
        <span className="truncate max-w-[130px]">{startTimeStr}</span>
        <span className="flex items-center gap-1 text-emerald-400 font-black">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE TRACK</span>
        </span>
        <span className="truncate max-w-[130px]">{endTimeStr}</span>
      </div>
    </div>
  );
}
