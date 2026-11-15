import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/auth/AuthContext";

const CATEGORIAS = ["cuota", "compra", "subvencion", "evento", "deuda", "cerveza", "loteria", "ticket", "otros"];

export default function NuevoMovimientoDialog({ open, onClose, onSaved }) {
  const { sesion } = useAuth();
  const [tipo, setTipo] = useState("ingreso");
  const [cantidad, setCantidad] = useState("");
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState("otros");
  const [usuario, setUsuario] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!concepto.trim() || !cantidad) return;
    setSaving(true);
    try {
      await base44.entities.MovimientoCaja.create({
        tipo,
        cantidad: parseFloat(cantidad) || 0,
        concepto: concepto.trim(),
        categoria,
        usuario: usuario.trim() || undefined,
        fecha,
        notas: notas.trim() || undefined,
        fuente: "manual",
      });
      onSaved && onSaved();
      // Reset
      setCantidad(""); setConcepto(""); setUsuario(""); setNotas("");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 200, background: "rgba(0,0,0,0.4)" }} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Nuevo movimiento</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        {/* Tipo */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTipo("ingreso")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${tipo === "ingreso" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>
            ↗ Ingreso
          </button>
          <button onClick={() => setTipo("gasto")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${tipo === "gasto" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400"}`}>
            ↙ Gasto
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">Concepto *</label>
            <input value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej: Compra de pintura" className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Importe (€) *</label>
              <input type="number" step="0.01" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="0.00" className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Categoría</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Usuario (opcional)</label>
              <input value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="Nombre" className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Notas</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
          </div>
        </div>

        <button onClick={handleSave} disabled={!concepto.trim() || !cantidad || saving} className="w-full mt-4 bg-[#630027] disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> {saving ? "Guardando..." : "Añadir movimiento"}
        </button>
      </div>
    </div>
  );
}