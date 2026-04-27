"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function PnLChart({ data }: { data: any[] }) {
  // Jika data kosong, tampilkan placeholder agar tidak terlihat hitam polos
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
          <Tooltip
            cursor={{ fill: "#ffffff05" }}
            contentStyle={{
              backgroundColor: "#0a0a0a",
              borderColor: "#ffffff10",
              borderRadius: "8px",
              fontSize: "10px",
            }}
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "PNL"]}
          />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.pnl >= 0 ? "#10b981" : "#f43f5e"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
