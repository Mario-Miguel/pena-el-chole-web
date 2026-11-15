import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Search, RefreshCw, Filter } from "lucide-react";

const ENTIDADES = [
  "Todas", "ItemAlmacen", "MovimientoAlmacen", "Tarea", "VotoRespuesta",
  "ItemCompra", "PagoRegistrado", "Notificacion", "ChatMensaje", "Integrante",
  "Votacion", "DiaCalendario"
];

const ACCION_COLORS = {
  crear:    "bg-green-100 text-green-700",
  editar:   "bg-amber-100 text-amber-700",
  eliminar: "bg-red-100 text-red-700",
};

const ENTIDAD_EMOJIS = {
  ItemAlmacen: "📦", MovimientoAlmacen: "🔄", Tarea: "✅",
  VotoRespuesta: "🗳️", ItemCompra: "🛒", PagoRegistrado: "💰",
  Notificacion: "🔔", ChatMensaje: "💬", Integrante: "👤",
  Votacion: "📊", DiaCalendario: "📅",
};

export default function AuditoriaPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroEntidad, setFiltroEntidad] = useState("Todas");

  const cargar = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.AdminLog.list("-created_date", 200);
    setLogs(data);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const usuarios = [...new Set(logs.map(l => l.autor_nombre).filter(Boolean))].sort();

  const logsFiltrados = logs.filter(l => {
    const matchUser = !filtroUsuario || l.autor_nombre === filtroUsuario;
    const matchEnt = filtroEntidad === "Todas" || l.entidad === filtroEntidad;
    return matchUser && matchEnt;
  });

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[160px]">
          <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
          <select
            value={filtroUsuario}
            onChange={e => setFiltroUsuario(e.target.value)}
            className="bg-transparent text-sm text-gray-600 flex-1 focus:outline-none"
          >
            <option value="">Todos los usuarios</option>
            {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-[160px]">
          <Filter className="w-4 h-4 text-gray-300 flex-shrink-0" />
          <select
            value={filtroEntidad}
            onChange={e => setFiltroEntidad(e.target.value)}
            className="bg-transparent text-sm text-gray-600 flex-1 focus:outline-none"
          >
            {ENTIDADES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <button onClick={cargar} className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-400">{logsFiltrados.length} evento(s) · últimas 200 acciones</p>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
        </div>
      )}

      {/* Timeline */}
      {!loading && (
        <div className="relative space-y-0">
          {logsFiltrados.length === 0 && (
            <p className="text-center text-gray-300 text-sm py-10">Sin resultados</p>
          )}
          {logsFiltrados.map((log, i) => (
            <div key={log.id} className="flex gap-3 group">
              {/* línea de tiempo */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-sm flex-shrink-0 z-10">
                  {ENTIDAD_EMOJIS[log.entidad] || "🔹"}
                </div>
                {i < logsFiltrados.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gray-100 mt-1 mb-1 min-h-[12px]" />
                )}
              </div>
              {/* contenido */}
              <div className="flex-1 pb-3 pt-0.5">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ACCION_COLORS[log.accion] || "bg-gray-100 text-gray-600"}`}>
                        {log.accion}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                        {log.entidad}
                      </span>
                    </div>
                    <span className="text-xs text-gray-300">
                      {new Date(log.created_date).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1.5">{log.descripcion}</p>
                  <p className="text-xs text-gray-400 mt-1">por <span className="font-medium text-gray-500">{log.autor_nombre || "Sistema"}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}