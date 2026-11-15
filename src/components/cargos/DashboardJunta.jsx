import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertTriangle, CheckSquare, ShoppingCart, BarChart2, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORES_PIE = ["#630027", "#9b1a4a", "#c94b7b", "#e8a0b8", "#f5d0df"];

export default function DashboardJunta() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [items, tareas, almacen, votaciones, votos] = await Promise.all([
      base44.entities.ItemCompra.list(),
      base44.entities.Tarea.list(),
      base44.entities.ItemAlmacen.list(),
      base44.entities.Votacion.filter({ completada: false }),
      base44.entities.VotoRespuesta.list(),
    ]);
    setDatos({ items, tareas, almacen, votaciones, votos });
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  const { items, tareas, almacen, votaciones, votos } = datos;

  // ── Gastos por persona ──
  const gastoPorPersona = {};
  items.filter(i => i.comprado && i.comprador_nombre).forEach(i => {
    gastoPorPersona[i.comprador_nombre] = (gastoPorPersona[i.comprador_nombre] || 0) + (i.precio || 0) * (i.cantidad || 1);
  });
  const gastoData = Object.entries(gastoPorPersona)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const totalGasto = gastoData.reduce((s, d) => s + d.value, 0);
  const totalPendiente = items.filter(i => !i.comprado).reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);

  // ── Tareas por categoría ──
  const tareasPendientes = tareas.filter(t => !t.completada);
  const tareasCat = {};
  tareasPendientes.forEach(t => {
    const cat = t.categoria || "otros";
    tareasCat[cat] = (tareasCat[cat] || 0) + 1;
  });
  const tareasData = Object.entries(tareasCat).map(([name, value]) => ({ name, value }));

  // ── Alertas de stock ──
  const stockBajo = almacen.filter(a => a.stock_minimo > 0 && a.cantidad <= a.stock_minimo);

  // ── Votaciones activas con votos ──
  const votacionesConVotos = votaciones.map(v => {
    const votosV = votos.filter(vt => vt.votacion_id === v.id);
    const conteo = {};
    votosV.forEach(vt => { conteo[vt.opcion] = (conteo[vt.opcion] || 0) + 1; });
    return { ...v, votosData: Object.entries(conteo).map(([name, value]) => ({ name, value })), totalVotos: votosV.length };
  });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Gasto total", val: `${totalGasto.toFixed(2)}€`, emoji: "💰", color: "text-[#630027]" },
          { label: "Por comprar", val: `${totalPendiente.toFixed(2)}€`, emoji: "🛒", color: "text-amber-600" },
          { label: "Tareas pend.", val: tareasPendientes.length, emoji: "✅", color: "text-indigo-600" },
          { label: "Stock bajo", val: stockBajo.length, emoji: "⚠️", color: stockBajo.length > 0 ? "text-red-500" : "text-green-500" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl mb-1">{k.emoji}</p>
            <p className={`text-xl font-black ${k.color}`}>{k.val}</p>
            <p className="text-xs text-gray-400">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Gráfica: Gastos por persona */}
      {gastoData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-4 h-4 text-[#630027]" />
            <h3 className="font-bold text-gray-700 text-sm">Gastos por persona</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gastoData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `${v}€`} />
              <Bar dataKey="value" fill="#630027" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <Link to={createPageUrl("Cuentas")} className="text-xs text-[#630027] underline mt-2 block text-right">Ver cuentas →</Link>
        </div>
      )}

      {/* Gráfica: Tareas por categoría */}
      {tareasData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-gray-700 text-sm">Tareas pendientes por categoría</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={tareasData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                {tareasData.map((_, i) => <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <Link to={createPageUrl("ToDo")} className="text-xs text-[#630027] underline mt-1 block text-right">Ver tareas →</Link>
        </div>
      )}
      {tareasPendientes.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center text-gray-300 text-sm">✅ No hay tareas pendientes</div>
      )}

      {/* Alertas de stock */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-gray-700 text-sm">Alertas de stock mínimo</h3>
          <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${stockBajo.length > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
            {stockBajo.length > 0 ? `${stockBajo.length} artículo(s)` : "Todo OK"}
          </span>
        </div>
        {stockBajo.length === 0 && <p className="text-gray-300 text-sm text-center py-2">Sin alertas de stock 🎉</p>}
        <div className="space-y-2">
          {stockBajo.map(a => (
            <div key={a.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <span className="font-medium text-gray-700">{a.nombre}</span>
              <span className="text-xs text-red-500 font-bold">{a.cantidad} / {a.stock_minimo} mín.</span>
            </div>
          ))}
        </div>
        {stockBajo.length > 0 && (
          <Link to={createPageUrl("Almacen")} className="text-xs text-[#630027] underline mt-2 block text-right">Ver almacén →</Link>
        )}
      </div>

      {/* Votaciones activas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="w-4 h-4 text-purple-600" />
          <h3 className="font-bold text-gray-700 text-sm">Votaciones activas</h3>
        </div>
        {votacionesConVotos.length === 0 && <p className="text-gray-300 text-sm text-center py-2">No hay votaciones activas</p>}
        <div className="space-y-4">
          {votacionesConVotos.map(v => (
            <div key={v.id}>
              <p className="font-semibold text-gray-700 text-sm mb-2">{v.tema} <span className="text-xs text-gray-400 font-normal">({v.totalVotos} votos)</span></p>
              {v.votosData.length === 0 && <p className="text-xs text-gray-300">Aún sin votos</p>}
              {v.votosData.map(op => {
                const pct = v.totalVotos > 0 ? Math.round((op.value / v.totalVotos) * 100) : 0;
                return (
                  <div key={op.name} className="mb-1.5">
                    <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                      <span>{op.name}</span>
                      <span>{pct}% ({op.value})</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#630027] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <Link to={createPageUrl("Votaciones")} className="text-xs text-[#630027] underline mt-2 block text-right">Ver votaciones →</Link>
      </div>

      <div className="flex justify-end">
        <button onClick={cargar} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#630027] transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar datos
        </button>
      </div>
    </div>
  );
}