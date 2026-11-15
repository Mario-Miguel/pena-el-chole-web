import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus, Trash2, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../auth/AuthContext";

// Estructura del presupuesto: 3 apartados fijos
const APARTADOS = [
  { key: "inicial",    label: "Presupuesto inicial", emoji: "📋", color: "text-blue-700",  bg: "bg-blue-50",  border: "border-blue-200" },
  { key: "deducciones",label: "Deducciones",          emoji: "➖", color: "text-red-700",   bg: "bg-red-50",   border: "border-red-200" },
  { key: "resto",      label: "Resto",                emoji: "✅", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
];

function FilaPartida({ fila, idx, onChange, onRemove, disabled }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        value={fila.concepto}
        onChange={e => onChange(idx, "concepto", e.target.value)}
        placeholder="Concepto"
        disabled={disabled}
        className="flex-1 min-w-[120px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#630027]/30 disabled:bg-gray-50"
      />
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={fila.importe ?? ""}
          onChange={e => onChange(idx, "importe", parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          disabled={disabled}
          className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#630027]/30 disabled:bg-gray-50"
        />
        <span className="text-xs text-gray-400">€</span>
      </div>
      {!disabled && (
        <button onClick={() => onRemove(idx)} className="p-1 text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default function PanelPresupuesto() {
  const { puedeConfigurar } = useAuth();
  const [anios, setAnios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoAnio, setNuevoAnio] = useState("");
  const [expandido, setExpandido] = useState(null);
  const [datos, setDatos] = useState({});   // { [id]: { inicial: [], deducciones: [], resto: [] } }
  const [guardando, setGuardando] = useState({});

  const cargar = useCallback(async () => {
    const data = await api.entities.Presupuesto.list("-anio");
    setAnios(data);
    // Inicializar datos locales
    const d = {};
    data.forEach(p => {
      d[p.id] = {
        inicial:     (p.partidas || []).filter(x => x.apartado === "inicial"),
        deducciones: (p.partidas || []).filter(x => x.apartado === "deducciones"),
        resto:       (p.partidas || []).filter(x => x.apartado === "resto"),
      };
    });
    setDatos(d);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCreate = async () => {
    const anio = parseInt(nuevoAnio, 10);
    if (!anio) return;
    await api.entities.Presupuesto.create({ anio, partidas: [] });
    setNuevoAnio("");
    cargar();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este presupuesto?")) return;
    await api.entities.Presupuesto.delete(id);
    cargar();
  };

  const handleFilaChange = (pptoId, apartado, idx, campo, valor) => {
    setDatos(prev => ({
      ...prev,
      [pptoId]: {
        ...prev[pptoId],
        [apartado]: prev[pptoId][apartado].map((f, i) => i === idx ? { ...f, [campo]: valor } : f),
      }
    }));
  };

  const handleAddFila = (pptoId, apartado) => {
    setDatos(prev => ({
      ...prev,
      [pptoId]: {
        ...prev[pptoId],
        [apartado]: [...(prev[pptoId]?.[apartado] || []), { concepto: "", importe: 0, apartado }],
      }
    }));
  };

  const handleRemoveFila = (pptoId, apartado, idx) => {
    setDatos(prev => ({
      ...prev,
      [pptoId]: {
        ...prev[pptoId],
        [apartado]: prev[pptoId][apartado].filter((_, i) => i !== idx),
      }
    }));
  };

  const handleGuardar = async (pptoId) => {
    setGuardando(g => ({ ...g, [pptoId]: true }));
    const d = datos[pptoId] || {};
    const partidas = [
      ...(d.inicial || []).map(f => ({ ...f, apartado: "inicial" })),
      ...(d.deducciones || []).map(f => ({ ...f, apartado: "deducciones" })),
      ...(d.resto || []).map(f => ({ ...f, apartado: "resto" })),
    ];
    await api.entities.Presupuesto.update(pptoId, { partidas });
    setGuardando(g => ({ ...g, [pptoId]: false }));
  };

  const calcTotal = (filas) => (filas || []).reduce((s, f) => s + (f.importe || 0), 0);

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-7 h-7 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-gray-600">Presupuestos anuales</p>
        <button onClick={cargar} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {puedeConfigurar && (
        <div className="flex gap-2">
          <input
            type="number"
            value={nuevoAnio}
            onChange={e => setNuevoAnio(e.target.value)}
            placeholder={`Nuevo año (ej: ${new Date().getFullYear()})`}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={!nuevoAnio} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-sm">
            <Plus className="w-4 h-4 mr-1" /> Crear
          </Button>
        </div>
      )}

      {anios.length === 0 && (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">💰</p>
          <p className="text-gray-300 text-sm">{puedeConfigurar ? "Crea el primer presupuesto" : "Sin presupuestos"}</p>
        </div>
      )}

      {anios.map(ppto => {
        const d = datos[ppto.id] || { inicial: [], deducciones: [], resto: [] };
        const totalInicial    = calcTotal(d.inicial);
        const totalDeducciones = calcTotal(d.deducciones);
        const totalResto      = calcTotal(d.resto);
        const isOpen = expandido === ppto.id;

        return (
          <div key={ppto.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpandido(isOpen ? null : ppto.id)}>
              <div>
                <p className="font-bold text-[#630027] text-base">{ppto.titulo || `Presupuesto ${ppto.anio}`}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Inicial: <b>{totalInicial.toFixed(2)}€</b> · Deducciones: <b className="text-red-500">{totalDeducciones.toFixed(2)}€</b> · Resto: <b className="text-green-600">{totalResto.toFixed(2)}€</b>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {puedeConfigurar && (
                  <button onClick={e => { e.stopPropagation(); handleDelete(ppto.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-5">
                {APARTADOS.map(ap => {
                  const filas = d[ap.key] || [];
                  const total = calcTotal(filas);
                  return (
                    <div key={ap.key}>
                      {/* Cabecera apartado */}
                      <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${ap.bg} border ${ap.border} mb-3`}>
                        <span className={`text-sm font-bold ${ap.color} flex items-center gap-1.5`}>
                          <span>{ap.emoji}</span> {ap.label}
                        </span>
                        <span className={`text-sm font-black ${ap.color}`}>{total.toFixed(2)}€</span>
                      </div>

                      {/* Filas */}
                      <div className="space-y-2 pl-1">
                        {filas.map((fila, idx) => (
                          <FilaPartida
                            key={idx}
                            fila={fila}
                            idx={idx}
                            disabled={!puedeConfigurar}
                            onChange={(i, campo, val) => handleFilaChange(ppto.id, ap.key, i, campo, val)}
                            onRemove={i => handleRemoveFila(ppto.id, ap.key, i)}
                          />
                        ))}
                        {filas.length === 0 && <p className="text-xs text-gray-300 pl-1">Sin partidas</p>}
                      </div>

                      {puedeConfigurar && (
                        <Button variant="outline" size="sm" onClick={() => handleAddFila(ppto.id, ap.key)} className="rounded-xl text-xs mt-2">
                          <Plus className="w-3.5 h-3.5 mr-1" /> Añadir partida
                        </Button>
                      )}
                    </div>
                  );
                })}

                {puedeConfigurar && (
                  <Button size="sm" onClick={() => handleGuardar(ppto.id)} disabled={guardando[ppto.id]} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-xs w-full mt-2">
                    {guardando[ppto.id] ? "Guardando..." : "Guardar cambios"}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}