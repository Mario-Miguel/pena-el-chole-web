import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { RefreshCw } from "lucide-react";

const ACCION_COLORS = {
  crear:    "bg-green-100 text-green-700",
  editar:   "bg-amber-100 text-amber-700",
  eliminar: "bg-red-100 text-red-700",
};

const ENTIDAD_EMOJIS = {
  Integrante: "👤", SesionUsuario: "🔑", ItemAlmacen: "📦",
  Tarea: "✅", ItemCompra: "🛒", Notificacion: "🔔",
  ChatGrupo: "💬", ChatMensaje: "✉️", Votacion: "🗳️",
  AppConfig: "⚙️", PagoRegistrado: "💰", DiaCalendario: "📅",
};

export default function HistorialAuditoria() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const data = await api.entities.AdminLog.list("-created_date", 100);
    setHistorial(data);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-7 h-7 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-gray-600">Historial de cambios en la app</p>
        <button onClick={cargar} className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-400">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-3">Últimas 100 acciones registradas · más reciente primero</p>

      {historial.length === 0 && (
        <p className="text-center text-gray-300 text-sm py-10">No hay cambios registrados todavía.<br/>Las acciones aparecerán aquí automáticamente.</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
        {historial.length > 0 && (
          <table className="min-w-full bg-white text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Acción</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Sección</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((cambio, i) => (
                <tr key={cambio.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(cambio.created_date).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ACCION_COLORS[cambio.accion] || "bg-gray-100 text-gray-600"}`}>
                      {cambio.accion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {ENTIDAD_EMOJIS[cambio.entidad] || "🔹"} {cambio.entidad}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{cambio.descripcion}</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-500">{cambio.autor_nombre || "Sistema"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}