"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis, // <-- TAMBAHAN: Import YAxis
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function PnLChart({ data }: { data: any[] }) {
  // 🔥 JURUS VAKSIN ANTI-HYDRATION 🔥
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Pas di server (sebelum nyampe HP), tampilin animasi loading detak jantung
  if (!isMounted) {
    return (
      <div className="h-32 w-full mt-2 border border-white/5 bg-white/[0.02] rounded-2xl flex items-center justify-center">
        <span className="w-4 h-4 rounded-full bg-emerald-500 animate-ping opacity-50" />
      </div>
    );
  }

  // Jika data kosong, tampilkan placeholder
  if (!data || data.length === 0) {
    return (
      <div className="h-32 w-full flex items-center justify-center border border-white/5 bg-white/[0.02] rounded-2xl mt-2">
        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
          No Data Found
        </p>
      </div>
    );
  }

  return (
    <div className="h-32 w-full mt-2 bg-white/[0.03] border border-white/5 rounded-2xl p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="tokenSymbol" hide={true} />

          {/* 🔥 JURUS 1: Kasih YAxis biar skalanya jelas walau disembunyiin */}
          <YAxis hide={true} />

          <Tooltip
            cursor={{ fill: "#ffffff05" }}
            contentStyle={{
              backgroundColor: "#000000",
              borderColor: "#000000",
              borderRadius: "8px",
              fontSize: "10px",
              color: "#ffffff",
            }}
            itemStyle={{
              color: "#02ff1f",
              fontWeight: "900",
              textTransform: "uppercase",
            }}
            labelStyle={{
              color: "#ffffff",
              fontWeight: "900",
              marginBottom: "4px",
            }}
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "PNL"]}
          />

          {/* 🔥 JURUS 2: minPointSize={2} biar nilai $0.00 tetep ada garis tipis 2 pixel */}
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]} minPointSize={2}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.pnl >= 0 ? "#15ff00" : "#ff002b"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
