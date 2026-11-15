import React from "react";
import { TrendingUp, TrendingDown, Wallet, Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { fmt, calcIngresos, calcGastos, calcBalance, agruparPorCategoria } from "@/lib/finanzas";

export default function ResumenGeneral({ movimientos }) {
  const ingresos = calcIngresos(movimientos);
  const gastos = calcGastos(movimientos);
  const balance = calcBalance(movimientos);

  const kpis = [
    { label: "Ingresos totales", value: fmt(ingresos), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Gastos totales", value: fmt(gastos), icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
    { label: "Balance", value: fmt(balance), icon: Scale, color: balance >= 0 ? "text-emerald-600" : "text-red-600", bg: balance >= 0 ? "bg-emerald-50" : "bg-red-50" },
    { label: "Movimientos", value: movimientos.length, icon: Wallet, color: "text-[#630027]", bg: "bg-[#630027]/5" },
  ];

  const chartData = agruparPorCategoria(movimientos);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-xs text-gray-400 font-medium">{kpi.label}</p>
              <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Ingresos vs Gastos por categoría</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="categoria" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}