import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "../auth/AuthContext";
import { Plus, TrendingUp, TrendingDown, Filter, Trash2 } from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIAS = {
  cuota:      { label: "Cuota",       color: "bg-blue-100 text-blue-700" },
  compra:     { label: "Compra",      color: "bg-red-100 text-red-700" },
  subvencion: { label: "Subvención",  color: "bg-green-100 text-green-700" },
  evento:     { label: "Evento",      color: "bg-purple-100 text-purple-700" },
  deuda:      { label: "Deuda",       color: "bg-orange-100 text-orange-700" },
  otros:      { label: "Otros",       color: "bg-gray-100 text-gray-700" },
};

export default function LibroCajaContent() {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "tesorero" || sesion?.cargo === "vicepresidente";
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [form, setForm] = useState({ fecha: new Date().toISOString().split("T")[0], concepto: "", categoria: "otros", cantidad: "" });
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargar = async () => {
    const data = await base44.entities.MovimientoCaja.list("-fecha");
    setMovimientos(data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!form.concepto || !form.cantidad || !form.fecha) return;
    await base44.entities.MovimientoCaja.create({ ...form, cantidad: parseFloat(form.cantidad) });
    setForm({ fecha: new Date().toISOString().split("T")[0], concepto: "", categoria: "otros", cantidad: "" });
    setShowForm(false);
    cargar();
  };

  const eliminar = (id) => setConfirmEliminar(id);
  const confirmarEliminar = async () => {
    await base44.entities.MovimientoCaja.delete(confirmEliminar);
    setConfirmEliminar(null);
    cargar();
  };

  const filtrados = movimientos.filter(m => {
    const mesMatch = !filtroMes || m.fecha?.startsWith(filtroMes);
    const catMatch = !filtroCategoria || m.categoria === filtroCategoria;
    return mesMatch && catMatch;
  });

  const saldo    = filtrados.reduce((s, m) => s + (m.cantidad || 0), 0);
  const ingresos = filtrados.filter(m => m.cantidad > 0).reduce((s, m) => s + m.cantidad, 0);
  const gastos   = filtrados.filter(m => m.cantidad < 0).reduce((s, m) => s + Math.abs(m.cantidad), 0);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-7 h-7 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <ConfirmDialog open={!!confirmEliminar} mensaje="¿Eliminar este movimiento?" textoConfirmar="Eliminar" onConfirm={confirmarEliminar} onCancel={() => setConfirmEliminar(null)} />
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xs text-green-600 font-medium">Ingresos</p>
          <p className="text-lg font-bold text-green-700">+{ingresos.toFixed(2)} €</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-xs text-red-600 font-medium">Gastos</p>
          <p className="text-lg font-bold text-red-700">-{gastos.toFixed(2)} €</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${saldo >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
          <p className={`text-xs font-medium ${saldo >= 0 ? "text-blue-600" : "text-orange-600"}`}>Saldo</p>
          <p className={`text-lg font-bold ${saldo >= 0 ? "text-blue-700" : "text-orange-700"}`}>{saldo.toFixed(2)} €</p>
        </div>
      </div>

      {/* Filtros + botón añadir */}
      <div className="flex gap-2">
        <input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <option value="">Todas</option>
          {Object.entries(CATEGORIAS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {(filtroMes || filtroCategoria) && (
          <button onClick={() => { setFiltroMes(""); setFiltroCategoria(""); }}
            className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">
            <Filter className="w-4 h-4" />
          </button>
        )}
        {puedeEditar && (
          <Button onClick={() => setShowForm(v => !v)} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl px-3">
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                {Object.entries(CATEGORIAS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <input type="text" placeholder="Concepto" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            <div className="flex gap-2 items-center">
              <div className="flex-1 flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <span className="px-3 text-gray-400 text-sm bg-gray-50 border-r border-gray-200 py-2">€</span>
                <input type="number" placeholder="Cantidad (+ ingreso / - gasto)" value={form.cantidad}
                  onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
                  className="flex-1 px-3 py-2 text-sm outline-none" />
              </div>
              <Button onClick={guardar} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Guardar</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="rounded-xl">Cancelar</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista */}
      <div className="space-y-2">
        {filtrados.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">Sin movimientos registrados</div>
        )}
        {filtrados.map(m => (
          <div key={m.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.cantidad >= 0 ? "bg-green-100" : "bg-red-100"}`}>
              {m.cantidad >= 0
                ? <TrendingUp className="w-4 h-4 text-green-600" />
                : <TrendingDown className="w-4 h-4 text-red-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-sm truncate">{m.concepto}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{m.fecha}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORIAS[m.categoria]?.color || "bg-gray-100 text-gray-600"}`}>
                  {CATEGORIAS[m.categoria]?.label || m.categoria}
                </span>
              </div>
            </div>
            <span className={`font-bold text-base ${m.cantidad >= 0 ? "text-green-600" : "text-red-600"}`}>
              {m.cantidad >= 0 ? "+" : ""}{m.cantidad?.toFixed(2)} €
            </span>
            {puedeEditar && (
              <button onClick={() => eliminar(m.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}