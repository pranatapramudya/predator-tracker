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

export default function PnLChart({
  data = [],
  transactions = [],
}: PnLChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute curve trajectory from transactions or positions
  const { chartData, netPnl, primaryToken, isPositive } = useMemo(() => {
    const rawTokens = data.map((d) => d.tokenSymbol).filter(Boolean);
    const token = rawTokens[0] || transactions[0]?.tokenSymbol || "TOKEN";
    const totalPosPnl = data.reduce((sum, d) => sum + (Number(d.pnl) || 0), 0);

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
        return {
          step: `T${idx + 1}`,
          pnl: Math.round(runningPnl * 100) / 100,
          token: tx.tokenSymbol || token,
        };
      });

      // Anchor start at 0
      const curve = [{ step: "T0", pnl: 0, token }, ...points];
      const finalPnl = totalPosPnl !== 0 ? totalPosPnl : runningPnl;

      return {
        chartData: curve,
        netPnl: finalPnl,
        primaryToken: token,
        isPositive: finalPnl >= 0,
      };
    }

    // Fallback: smooth 3-point progression from positions
    const finalPnl = totalPosPnl;
    const curve = [
      { step: "T0", pnl: 0, token },
      { step: "T1", pnl: Math.round(finalPnl * 0.45 * 100) / 100, token },
      { step: "T2", pnl: Math.round(finalPnl * 100) / 100, token },
    ];

    return {
      chartData: curve,
      netPnl: finalPnl,
      primaryToken: token,
      isPositive: finalPnl >= 0,
    };
  }, [data, transactions]);

  if (!isMounted) {
    return (
      <div className="h-20 w-full mt-2 border border-white/5 bg-white/[0.02] rounded-xl flex items-center justify-center">
        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-40" />
      </div>
    );
  }

  if (chartData.length <= 1 && netPnl === 0) {
    return (
      <div className="h-20 w-full flex items-center justify-center border border-white/10 bg-white/[0.03] rounded-xl mt-2">
        <p className="text-[10px] text-white uppercase tracking-widest font-black">
          No Activity Yet
        </p>
      </div>
    );
  }

  const gradientId = `pnlGrad_${primaryToken.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const strokeColor = isPositive ? "#10b981" : "#f43f5e";

  return (
    <div className="mt-2 bg-zinc-950/80 border border-white/10 rounded-xl p-2.5 relative overflow-hidden group">
      {/* Top Micro-Header */}
      <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
        <span className="text-white font-black tracking-wider flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${isPositive ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]"}`}
          />
          ${primaryToken}
        </span>
        <span
          className={`font-black tracking-tight ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
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
              cursor={{ stroke: "#ffffff20", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const val = Number(payload[0].value || 0);
                  return (
                    <div className="bg-black/90 border border-white/10 rounded-lg px-2 py-1 text-[9px] font-mono shadow-xl backdrop-blur-md">
                      <span className="text-white/50">{primaryToken}: </span>
                      <span
                        className={`font-black ${val >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {val >= 0 ? "+" : ""}${val.toFixed(2)}
                      </span>
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
    </div>
  );
}
