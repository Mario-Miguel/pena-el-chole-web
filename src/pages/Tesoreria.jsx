import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/api/client";
import { useAuth } from "../components/auth/AuthContext";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";

const MESES_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function fmtEur(n) { return (n || 0).toFixed(2).replace(".", ",") + "€"; }
function fmtFecha(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getDate()} ${MESES_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export default function Tesoreria() {
  const { sesion, puedeConfigurar } = useAuth();
  const esAdmin = sesion?.esAdmin || puedeConfigurar ||
    ["presidente","vicepresidente","tesorero"].includes(sesion?.cargo);

  const [loading, setLoading] = useState(true);
  const [cuotas, setCuotas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [movCaja, setMovCaja] = useState([]);
  const [tab, setTab] = useState("todos");
  const [anioSel, setAnioSel] = useState(new Date().getFullYear());
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    Promise.all([
      api.entities.Cuota.filter({ pagada: true }),
      api.entities.ItemCompra.filter({ comprado: true }),
      api.entities.MovimientoCaja.list("-created_date"),
    ]).then(([c, co, m]) => {
      setCuotas(c);
      setCompras(co);
      setMovCaja(m);
      setLoading(false);
    });
  }, []);

  // Normalizar todos los movimientos a { fecha, concepto, importe, tipo, origen }
  const movimientos = useMemo(() => {
    const items = [];

    cuotas.forEach(c => {
      items.push({
        id: "cuota-" + c.id,
        fecha: c.fecha_pago || c.updated_date || c.created_date,
        concepto: `Cuota: ${c.concepto || "Sin concepto"} — ${c.integrante_nombre || ""}`,
        importe: c.importe || 0,
        tipo: "ingreso",
        origen: "Cuotas",
      });
    });

    compras.forEach(co => {
      if ((co.precio || 0) <= 0) return;
      items.push({
        id: "compra-" + co.id,
        fecha: co.fecha_comprado || co.updated_date || co.created_date,
        concepto: `Compra: ${co.nombre}${co.comprador_nombre ? ` (${co.comprador_nombre})` : ""}`,
        importe: (co.precio || 0) * (co.cantidad || 1),
        tipo: "gasto",
        origen: "Compras",
      });
    });

    movCaja.forEach(m => {
      items.push({
        id: "caja-" + m.id,
        fecha: m.fecha || m.created_date,
        concepto: m.concepto || m.descripcion || "Movimiento de caja",
        importe: Math.abs(m.importe || 0),
        tipo: (m.tipo === "ingreso" || (m.importe || 0) > 0) ? "ingreso" : "gasto",
        origen: "Caja",
      });
    });

    return items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [cuotas, compras, movCaja]);

  const anios = useMemo(() => {
    const set = new Set(movimientos.map(m => new Date(m.fecha).getFullYear()).filter(Boolean));
    return [...set].sort((a, b) => b - a);
  }, [movimientos]);

  const delAnio = useMemo(() => movimientos.filter(m => new Date(m.fecha).getFullYear() === anioSel), [movimientos, anioSel]);

  const totalIngresos = delAnio.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.importe, 0);
  const totalGastos   = delAnio.filter(m => m.tipo === "gasto").reduce((s, m) => s + m.importe, 0);
  const balance = totalIngresos - totalGastos;

  // Datos mensuales para gráfica
  const datosMensuales = useMemo(() => {
    const meses = MESES_SHORT.map((label, i) => ({ mes: label, ingresos: 0, gastos: 0 }));
    delAnio.forEach(m => {
      const mes = new Date(m.fecha).getMonth();
      if (m.tipo === "ingreso") meses[mes].ingresos += m.importe;
      else meses[mes].gastos += m.importe;
    });
    return meses;
  }, [delAnio]);

  const filtrados = tab === "todos" ? delAnio : delAnio.filter(m => m.tipo === tab);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 py-8 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#630027]">💰 Tesorería</h1>
          <p className="text-gray-400 text-sm mt-0.5">Flujo de caja y balance de la peña</p>
        </div>
        {anios.length > 0 && (
          <select value={anioSel} onChange={e => setAnioSel(parseInt(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none">
            {anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-black text-green-600">{fmtEur(totalIngresos)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Ingresos</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-xl font-black text-red-500">{fmtEur(totalGastos)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Gastos</p>
        </div>
        <div className={`rounded-2xl border shadow-sm p-4 text-center ${balance >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
          <Wallet className={`w-5 h-5 mx-auto mb-1 ${balance >= 0 ? "text-green-600" : "text-red-500"}`} />
          <p className={`text-xl font-black ${balance >= 0 ? "text-green-700" : "text-red-600"}`}>{fmtEur(balance)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Balance</p>
        </div>
      </div>

      {/* Gráfica mensual */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-bold text-gray-600 mb-4">Flujo mensual {anioSel}</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={datosMensuales} barSize={10} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={40}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
            <Tooltip formatter={(v, name) => [fmtEur(v), name === "ingresos" ? "Ingresos" : "Gastos"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #f0f0f0", fontSize: 12 }} />
            <Legend formatter={v => v === "ingresos" ? "Ingresos" : "Gastos"} iconType="circle" iconSize={8}
              wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="ingresos" fill="#22c55e" radius={[4,4,0,0]} />
            <Bar dataKey="gastos" fill="#f87171" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lista de movimientos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs filtro */}
        <div className="flex border-b border-gray-100 px-4 pt-3 gap-1">
          {[["todos","Todos"],["ingreso","Ingresos"],["gasto","Gastos"]].map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors mb-2 ${tab === v ? "bg-[#630027] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              {l} {v === "todos" ? `(${delAnio.length})` : v === "ingreso" ? `(${delAnio.filter(m=>m.tipo==="ingreso").length})` : `(${delAnio.filter(m=>m.tipo==="gasto").length})`}
            </button>
          ))}
        </div>

        {filtrados.length === 0 ? (
          <p className="text-center text-gray-300 text-sm py-10">Sin movimientos</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtrados.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.tipo === "ingreso" ? "bg-green-50" : "bg-red-50"}`}>
                  {m.tipo === "ingreso"
                    ? <ArrowUpRight className="w-4 h-4 text-green-500" />
                    : <ArrowDownRight className="w-4 h-4 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{m.concepto}</p>
                  <p className="text-xs text-gray-400">{fmtFecha(m.fecha)} · {m.origen}</p>
                </div>
                <p className={`text-sm font-black flex-shrink-0 ${m.tipo === "ingreso" ? "text-green-600" : "text-red-500"}`}>
                  {m.tipo === "ingreso" ? "+" : "-"}{fmtEur(m.importe)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}