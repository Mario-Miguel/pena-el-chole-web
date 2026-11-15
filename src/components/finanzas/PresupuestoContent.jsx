import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../auth/AuthContext";

const CATEGORIAS = ["Materiales", "Transporte", "Servicios", "Alimentación", "Decoración", "Otros"];

function ResumenCard({ label, valor, color, emoji }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
      <p className="text-2xl mb-1">{emoji}</p>
      <p className={`text-xl font-black ${color}`}>{valor.toFixed(2)}€</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function PartidaRow({ item, idx, onRemove, onChange, disabled }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{idx + 1}.</span>
      <input value={item.concepto} onChange={e => onChange(idx, "concepto", e.target.value)} placeholder="Concepto" disabled={disabled}
        className="flex-1 min-w-[100px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none disabled:bg-gray-50" />
      <select value={item.categoria || ""} onChange={e => onChange(idx, "categoria", e.target.value)} disabled={disabled}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-600 focus:outline-none disabled:bg-gray-50">
        <option value="">Cat.</option>
        {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="number" value={item.importe_estimado ?? ""} onChange={e => onChange(idx, "importe_estimado", parseFloat(e.target.value) || 0)}
        placeholder="Est. €" disabled={disabled}
        className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none disabled:bg-gray-50" />
      <input type="number" value={item.importe_real ?? ""} onChange={e => onChange(idx, "importe_real", parseFloat(e.target.value) || 0)}
        placeholder="Real €" disabled={disabled}
        className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none disabled:bg-gray-50" />
      {!disabled && (
        <button onClick={() => onRemove(idx)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function IngresoRow({ item, idx, onRemove, onChange, disabled }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{idx + 1}.</span>
      <input value={item.concepto} onChange={e => onChange(idx, "concepto", e.target.value)} placeholder="Concepto" disabled={disabled}
        className="flex-1 min-w-[120px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none disabled:bg-gray-50" />
      <input type="number" value={item.importe_estimado ?? ""} onChange={e => onChange(idx, "importe_estimado", parseFloat(e.target.value) || 0)}
        placeholder="Est. €" disabled={disabled}
        className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none disabled:bg-gray-50" />
      <input type="number" value={item.importe_real ?? ""} onChange={e => onChange(idx, "importe_real", parseFloat(e.target.value) || 0)}
        placeholder="Real €" disabled={disabled}
        className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none disabled:bg-gray-50" />
      {!disabled && (
        <button onClick={() => onRemove(idx)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function PresupuestoCard({ ppto, onDelete }) {
  const { puedeConfigurar } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [partidas, setPartidas] = useState(ppto.partidas || []);
  const [ingresos, setIngresos] = useState(ppto.ingresos || []);
  const [guardando, setGuardando] = useState(false);

  const handlePartidaChange = (i, campo, valor) => setPartidas(prev => prev.map((p, idx) => idx === i ? { ...p, [campo]: valor } : p));
  const handleIngresoChange = (i, campo, valor) => setIngresos(prev => prev.map((p, idx) => idx === i ? { ...p, [campo]: valor } : p));

  const totalGastoEst    = partidas.reduce((s, p) => s + (p.importe_estimado || 0), 0);
  const totalGastoReal   = partidas.reduce((s, p) => s + (p.importe_real || 0), 0);
  const totalIngresoEst  = ingresos.reduce((s, p) => s + (p.importe_estimado || 0), 0);
  const totalIngresoReal = ingresos.reduce((s, p) => s + (p.importe_real || 0), 0);
  const balanceReal = totalIngresoReal - totalGastoReal;

  const handleGuardar = async () => {
    setGuardando(true);
    await base44.entities.Presupuesto.update(ppto.id, { partidas, ingresos });
    setGuardando(false);
  };

  const exportarCSV = () => {
    const filas = [
      ["Tipo", "Concepto", "Categoría", "Estimado (€)", "Real (€)"],
      ...ingresos.map(i => ["Ingreso", i.concepto || "", "", i.importe_estimado || 0, i.importe_real || 0]),
      ...partidas.map(p => ["Gasto", p.concepto || "", p.categoria || "", p.importe_estimado || 0, p.importe_real || 0]),
      [],
      ["Resumen", "", "", "", ""],
      ["Total Ingresos Estimado", "", "", totalIngresoEst, ""],
      ["Total Ingresos Real", "", "", "", totalIngresoReal],
      ["Total Gastos Estimado", "", "", totalGastoEst, ""],
      ["Total Gastos Real", "", "", "", totalGastoReal],
      ["Balance Real", "", "", "", balanceReal],
    ];
    const csv = filas.map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presupuesto_${ppto.anio}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div>
          <p className="font-bold text-[#630027] text-lg">{ppto.titulo || `Presupuesto ${ppto.anio}`}</p>
          <p className="text-xs text-gray-400">{ppto.anio} · {partidas.length} partidas · {ingresos.length} ingresos</p>
        </div>
        <div className="flex items-center gap-2">
          {puedeConfigurar && (
            <button onClick={e => { e.stopPropagation(); if (confirm("¿Eliminar este presupuesto?")) onDelete(ppto.id); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <ResumenCard label="Gasto est." valor={totalGastoEst} color="text-amber-600" emoji="📋" />
            <ResumenCard label="Gasto real" valor={totalGastoReal} color="text-red-500" emoji="💸" />
            <ResumenCard label="Balance" valor={balanceReal} color={balanceReal >= 0 ? "text-green-600" : "text-red-500"} emoji={balanceReal >= 0 ? "✅" : "⚠️"} />
          </div>

          {/* Ingresos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-700 text-sm flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-green-500" /> Ingresos</p>
              <span className="text-xs text-gray-400">Est: <b className="text-green-600">{totalIngresoEst.toFixed(2)}€</b> · Real: <b className="text-green-700">{totalIngresoReal.toFixed(2)}€</b></span>
            </div>
            <div className="space-y-2">
              {ingresos.map((item, i) => (
                <IngresoRow key={i} item={item} idx={i} disabled={!puedeConfigurar} onChange={handleIngresoChange}
                  onRemove={i => setIngresos(prev => prev.filter((_, idx) => idx !== i))} />
              ))}
              {ingresos.length === 0 && <p className="text-xs text-gray-300 py-2">Sin ingresos añadidos</p>}
            </div>
            {puedeConfigurar && (
              <Button variant="outline" size="sm" onClick={() => setIngresos(prev => [...prev, { concepto: "", importe_estimado: 0, importe_real: 0 }])} className="rounded-xl text-xs mt-2">
                <Plus className="w-3.5 h-3.5 mr-1" /> Añadir ingreso
              </Button>
            )}
          </div>

          {/* Gastos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-700 text-sm flex items-center gap-1.5"><TrendingDown className="w-4 h-4 text-red-400" /> Gastos</p>
              <span className="text-xs text-gray-400">Est: <b className="text-amber-600">{totalGastoEst.toFixed(2)}€</b> · Real: <b className="text-red-500">{totalGastoReal.toFixed(2)}€</b></span>
            </div>
            <div className="space-y-2">
              {partidas.map((item, i) => (
                <PartidaRow key={i} item={item} idx={i} disabled={!puedeConfigurar} onChange={handlePartidaChange}
                  onRemove={i => setPartidas(prev => prev.filter((_, idx) => idx !== i))} />
              ))}
              {partidas.length === 0 && <p className="text-xs text-gray-300 py-2">Sin partidas añadidas</p>}
            </div>
            {puedeConfigurar && (
              <Button variant="outline" size="sm" onClick={() => setPartidas(prev => [...prev, { concepto: "", categoria: "", importe_estimado: 0, importe_real: 0 }])} className="rounded-xl text-xs mt-2">
                <Plus className="w-3.5 h-3.5 mr-1" /> Añadir partida
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportarCSV} className="rounded-xl text-xs">
              <Download className="w-3.5 h-3.5 mr-1" /> Exportar CSV
            </Button>
            {puedeConfigurar && (
              <Button size="sm" onClick={handleGuardar} disabled={guardando} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-xs">
                {guardando ? "Guardando..." : "Guardar cambios"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PresupuestoContent() {
  const { puedeConfigurar } = useAuth();
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoAnio, setNuevoAnio] = useState("");

  const cargar = useCallback(async () => {
    const data = await base44.entities.Presupuesto.list("-anio");
    setPresupuestos(data);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCreate = async () => {
    const anio = parseInt(nuevoAnio, 10);
    if (!anio) return;
    await base44.entities.Presupuesto.create({ anio, partidas: [], ingresos: [] });
    setNuevoAnio(""); cargar();
  };

  const handleDelete = async (id) => {
    await base44.entities.Presupuesto.delete(id);
    cargar();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-7 h-7 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {puedeConfigurar && (
        <div className="flex gap-2">
          <input type="number" value={nuevoAnio} onChange={e => setNuevoAnio(e.target.value)}
            placeholder={`Nuevo año (ej: ${new Date().getFullYear()})`}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
            onKeyDown={e => e.key === "Enter" && handleCreate()} />
          <Button onClick={handleCreate} disabled={!nuevoAnio} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Crear
          </Button>
        </div>
      )}

      {presupuestos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-gray-300 text-sm">{puedeConfigurar ? "Crea el primer presupuesto" : "No hay presupuestos disponibles"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {presupuestos.map(p => <PresupuestoCard key={p.id} ppto={p} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}