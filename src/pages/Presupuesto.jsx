import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus, Trash2, ChevronDown, ChevronUp, PiggyBank, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../components/auth/AuthContext";

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
      <input
        value={item.concepto}
        onChange={e => onChange(idx, "concepto", e.target.value)}
        placeholder="Concepto"
        disabled={disabled}
        className="flex-1 min-w-[120px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#630027]/30 disabled:bg-gray-50"
      />
      <select
        value={item.categoria || ""}
        onChange={e => onChange(idx, "categoria", e.target.value)}
        disabled={disabled}
        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-600 focus:outline-none disabled:bg-gray-50"
      >
        <option value="">Categoría</option>
        {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input
        type="number"
        value={item.importe_estimado ?? ""}
        onChange={e => onChange(idx, "importe_estimado", parseFloat(e.target.value) || 0)}
        placeholder="Estimado €"
        disabled={disabled}
        className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#630027]/30 disabled:bg-gray-50"
      />
      <input
        type="number"
        value={item.importe_real ?? ""}
        onChange={e => onChange(idx, "importe_real", parseFloat(e.target.value) || 0)}
        placeholder="Real €"
        disabled={disabled}
        className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#630027]/30 disabled:bg-gray-50"
      />
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
      <input
        value={item.concepto}
        onChange={e => onChange(idx, "concepto", e.target.value)}
        placeholder="Concepto"
        disabled={disabled}
        className="flex-1 min-w-[140px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#630027]/30 disabled:bg-gray-50"
      />
      <input
        type="number"
        value={item.importe_estimado ?? ""}
        onChange={e => onChange(idx, "importe_estimado", parseFloat(e.target.value) || 0)}
        placeholder="Estimado €"
        disabled={disabled}
        className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#630027]/30 disabled:bg-gray-50"
      />
      <input
        type="number"
        value={item.importe_real ?? ""}
        onChange={e => onChange(idx, "importe_real", parseFloat(e.target.value) || 0)}
        placeholder="Real €"
        disabled={disabled}
        className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#630027]/30 disabled:bg-gray-50"
      />
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

  const totalGastoEst = partidas.reduce((s, p) => s + (p.importe_estimado || 0), 0);
  const totalGastoReal = partidas.reduce((s, p) => s + (p.importe_real || 0), 0);
  const totalIngresoEst = ingresos.reduce((s, p) => s + (p.importe_estimado || 0), 0);
  const totalIngresoReal = ingresos.reduce((s, p) => s + (p.importe_real || 0), 0);
  const balanceEst = totalIngresoEst - totalGastoEst;
  const balanceReal = totalIngresoReal - totalGastoReal;

  const handleGuardar = async () => {
    setGuardando(true);
    await api.entities.Presupuesto.update(ppto.id, { partidas, ingresos });
    setGuardando(false);
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
            <button
              onClick={e => { e.stopPropagation(); if (confirm("¿Eliminar este presupuesto?")) onDelete(ppto.id); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <ResumenCard label="Gasto estimado" valor={totalGastoEst} color="text-amber-600" emoji="📋" />
            <ResumenCard label="Gasto real" valor={totalGastoReal} color="text-red-500" emoji="💸" />
            <ResumenCard label="Balance real" valor={balanceReal} color={balanceReal >= 0 ? "text-green-600" : "text-red-500"} emoji={balanceReal >= 0 ? "✅" : "⚠️"} />
          </div>

          {/* Ingresos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-700 text-sm flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-green-500" /> Ingresos</p>
              <span className="text-xs text-gray-400">Est: <b className="text-green-600">{totalIngresoEst.toFixed(2)}€</b> · Real: <b className="text-green-700">{totalIngresoReal.toFixed(2)}€</b></span>
            </div>
            <div className="space-y-2">
              {ingresos.map((item, i) => (
                <IngresoRow key={i} item={item} idx={i} disabled={!puedeConfigurar}
                  onChange={handleIngresoChange}
                  onRemove={i => setIngresos(prev => prev.filter((_, idx) => idx !== i))}
                />
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

            {/* Cabecera columnas */}
            {partidas.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-1 px-6">
                <span className="flex-1 min-w-[120px] text-xs text-gray-400">Concepto</span>
                <span className="text-xs text-gray-400 w-24">Categoría</span>
                <span className="text-xs text-gray-400 w-28">Estimado €</span>
                <span className="text-xs text-gray-400 w-24">Real €</span>
              </div>
            )}

            <div className="space-y-2">
              {partidas.map((item, i) => (
                <PartidaRow key={i} item={item} idx={i} disabled={!puedeConfigurar}
                  onChange={handlePartidaChange}
                  onRemove={i => setPartidas(prev => prev.filter((_, idx) => idx !== i))}
                />
              ))}
              {partidas.length === 0 && <p className="text-xs text-gray-300 py-2">Sin partidas añadidas</p>}
            </div>
            {puedeConfigurar && (
              <Button variant="outline" size="sm" onClick={() => setPartidas(prev => [...prev, { concepto: "", categoria: "", importe_estimado: 0, importe_real: 0 }])} className="rounded-xl text-xs mt-2">
                <Plus className="w-3.5 h-3.5 mr-1" /> Añadir partida
              </Button>
            )}
          </div>

          {puedeConfigurar && (
            <Button size="sm" onClick={handleGuardar} disabled={guardando} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-xs">
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Presupuesto() {
  const { puedeConfigurar } = useAuth();
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoAnio, setNuevoAnio] = useState("");

  const cargar = useCallback(async () => {
    const data = await api.entities.Presupuesto.list("-anio");
    setPresupuestos(data);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCreate = async () => {
    const anio = parseInt(nuevoAnio, 10);
    if (!anio) return;
    await api.entities.Presupuesto.create({ anio, partidas: [], ingresos: [] });
    setNuevoAnio("");
    cargar();
  };

  const handleDelete = async (id) => {
    await api.entities.Presupuesto.delete(id);
    cargar();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#630027]/10 flex items-center justify-center">
          <PiggyBank className="w-6 h-6 text-[#630027]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#630027]">Presupuesto</h1>
          <p className="text-gray-400 text-sm">Ingresos y gastos por año</p>
        </div>
      </div>

      {puedeConfigurar && (
        <div className="flex gap-2 mb-8">
          <input
            type="number"
            value={nuevoAnio}
            onChange={e => setNuevoAnio(e.target.value)}
            placeholder={`Nuevo año (ej: ${new Date().getFullYear()})`}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={!nuevoAnio} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Crear
          </Button>
        </div>
      )}

      {presupuestos.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">💰</p>
          <p className="text-gray-300 text-sm">
            {puedeConfigurar ? "Crea el primer presupuesto" : "No hay presupuestos disponibles"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {presupuestos.map(p => (
            <PresupuestoCard key={p.id} ppto={p} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}