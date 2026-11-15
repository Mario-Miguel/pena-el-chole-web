import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, Edit2, ChevronDown, ChevronUp, RefreshCw, Save, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const ENTIDADES = [
  { key: "Integrante",      label: "Integrantes",       emoji: "👤" },
  { key: "ItemCompra",      label: "Compras",            emoji: "🛒" },
  { key: "Notificacion",    label: "Notificaciones",     emoji: "🔔" },
  { key: "Votacion",        label: "Votaciones",         emoji: "🗳️" },
  { key: "Tarea",           label: "Tareas",             emoji: "✅" },
  { key: "MediaItem",       label: "Imágenes/Vídeos",   emoji: "🖼️" },
  { key: "Carpeta",         label: "Carpetas",           emoji: "📁" },
  { key: "DeudaProveedor",  label: "Deudas Externas",    emoji: "💸" },
  { key: "PagoRegistrado",  label: "Pagos",              emoji: "💰" },
  { key: "ChatGrupo",       label: "Grupos de Chat",     emoji: "💬" },
  { key: "DiaCalendario",   label: "Calendario",         emoji: "📅" },
  { key: "PlazoCalendario", label: "Plazos",             emoji: "📆" },
  { key: "ItemAlmacen",     label: "Almacén",            emoji: "📦" },
  { key: "CuentaAtras",     label: "Cuenta Atrás",       emoji: "⏳" },
  { key: "AppConfig",       label: "Configuración App",  emoji: "⚙️" },
  { key: "AdminLog",        label: "Log",                emoji: "📋" },
  { key: "VehiculoPieza",   label: "Piezas Vehículo",    emoji: "🔧" },
  { key: "VehiculoRevision",label: "Revisiones",          emoji: "🔩" },
  { key: "VehiculoTarea",   label: "Tareas Vehículo",    emoji: "🚛" },
  { key: "EnlaceUtil",      label: "Enlaces útiles",     emoji: "🔗" },
  { key: "GrupoTrabajo",    label: "Grupos Trabajo",     emoji: "👷" },
  { key: "Cuota",           label: "Cuotas",             emoji: "💶" },
];

function getLabel(record) {
  return record.nombre || record.titulo || record.tema || record.persona
    || record.clave || record.proveedor || record.descripcion
    || record.id?.substring(0, 8) || "—";
}

function RecordEditor({ record, onSave, onCancel }) {
  const [data, setData] = useState({ ...record });
  const skip = ["id", "created_date", "updated_date", "created_by"];

  const handleChange = (key, val) => setData(d => ({ ...d, [key]: val }));

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
      {Object.entries(data).filter(([k]) => !skip.includes(k)).map(([key, val]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-28 flex-shrink-0 font-mono">{key}</span>
          <Input
            className="h-7 text-xs rounded-lg border-gray-200"
            value={typeof val === "object" ? JSON.stringify(val) : String(val ?? "")}
            onChange={e => {
              let v = e.target.value;
              if (typeof val === "boolean") v = v === "true";
              else if (typeof val === "number") v = parseFloat(v) || 0;
              handleChange(key, v);
            }}
          />
        </div>
      ))}
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" onClick={onCancel} className="h-7 text-xs rounded-lg px-3">Cancelar</Button>
        <Button onClick={() => onSave(data)} className="h-7 text-xs rounded-lg px-3 bg-[#630027] hover:bg-[#4a001d] text-white">
          <Save className="w-3 h-3 mr-1" /> Guardar
        </Button>
      </div>
    </div>
  );
}

export default function GestorDatos() {
  const [entidadActiva, setEntidadActiva] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [buscar, setBuscar] = useState("");

  const cargarEntidad = async (key) => {
    setLoading(true);
    setEditando(null);
    setBuscar("");
    const data = await base44.entities[key].list("-created_date", 200);
    setRegistros(data);
    setEntidadActiva(key);
    setLoading(false);
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este registro definitivamente?")) return;
    await base44.entities[entidadActiva].delete(id);
    setRegistros(prev => prev.filter(r => r.id !== id));
  };

  const handleGuardar = async (data) => {
    const { id, created_date, updated_date, created_by, ...rest } = data;
    await base44.entities[entidadActiva].update(id, rest);
    setRegistros(prev => prev.map(r => r.id === id ? data : r));
    setEditando(null);
  };

  const filtrados = registros.filter(r =>
    !buscar || getLabel(r).toLowerCase().includes(buscar.toLowerCase()) ||
    JSON.stringify(r).toLowerCase().includes(buscar.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">Selecciona una sección para ver, editar o eliminar sus registros.</p>

      {/* Selector de entidad */}
      <div className="grid grid-cols-3 gap-2">
        {ENTIDADES.map(e => (
          <button
            key={e.key}
            onClick={() => cargarEntidad(e.key)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all text-xs font-semibold ${
              entidadActiva === e.key
                ? "bg-[#630027] text-white border-[#630027]"
                : "bg-white border-gray-200 text-gray-600 hover:border-[#630027]/40"
            }`}
          >
            <span className="text-lg">{e.emoji}</span>
            <span className="leading-tight">{e.label}</span>
          </button>
        ))}
      </div>

      {/* Registros */}
      {entidadActiva && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar…"
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
              className="rounded-xl h-8 text-xs border-gray-200"
            />
            <button onClick={() => cargarEntidad(entidadActiva)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
            </div>
          ) : filtrados.length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-6">Sin registros</p>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {filtrados.map(r => (
                <div key={r.id}>
                  <div className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">{getLabel(r)}</p>
                      <p className="text-xs text-gray-300 font-mono truncate">{r.id}</p>
                    </div>
                    <button onClick={() => setEditando(editando === r.id ? null : r.id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleEliminar(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <AnimatePresence>
                    {editando === r.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="mt-1 mb-1">
                          <RecordEditor record={r} onSave={handleGuardar} onCancel={() => setEditando(null)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}