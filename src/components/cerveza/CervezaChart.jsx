import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const tickFmt = (v) => (v && v.length > 16 ? v.slice(0, 15) + "…" : v);

export default function CervezaChart({ entradas }) {
  const data = [...entradas]
    .filter(e => (e.cervezas || 0) > 0)
    .sort((a, b) => (b.cervezas || 0) - (a.cervezas || 0))
    .slice(0, 10)
    .map(e => ({ nombre: e.nombre || "—", cervezas: e.cervezas || 0 }));

  if (data.length === 0) return null;

  const height = Math.max(180, data.length * 30 + 24);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ranking de consumo</p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={92} tickFormatter={tickFmt} />
          <Tooltip
            cursor={{ fill: "rgba(99,0,39,0.05)" }}
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
            formatter={(v) => [`${v} 🍺`, "Cervezas"]}
          />
          <Bar dataKey="cervezas" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? "#630027" : i === 1 ? "#8a0036" : i === 2 ? "#a8003f" : "#d4a0b0"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}