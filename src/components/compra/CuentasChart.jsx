import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

export default function CuentasChart({ cuentas }) {
  const data = cuentas
    .filter(c => c.deuda > 0)
    .sort((a, b) => b.deuda - a.deuda)
    .map(c => ({
      nombre: c.nombre.split(" ")[0],
      deuda: parseFloat(c.deuda.toFixed(2)),
      pagado: parseFloat(c.pagado.toFixed(2)),
      restante: parseFloat(c.restante.toFixed(2)),
    }));

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resumen visual de deudas</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="€" />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
            formatter={(v, name) => [`${v}€`, name === "pagado" ? "Pagado" : name === "restante" ? "Restante" : "Deuda total"]}
          />
          <Legend formatter={(v) => v === "pagado" ? "Pagado" : v === "restante" ? "Pendiente" : "Total"} wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="pagado" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
          <Bar dataKey="restante" stackId="a" fill="#630027" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}