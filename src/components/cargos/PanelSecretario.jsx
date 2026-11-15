import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function PanelSecretario() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seccion, setSeccion] = useState("actas");

  const cargar = useCallback(async () => {
    const [integrantes, notifs, votaciones, tareas] = await Promise.all([
      base44.entities.Integrante.list(),
      base44.entities.Notificacion.list("-created_date", 10),
      base44.entities.Votacion.list(),
      base44.entities.Tarea.list(),
    ]);
    setDatos({ integrantes, notifs, votaciones, tareas });
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>;

  const { integrantes, notifs, votaciones, tareas } = datos;
  const votacionesActivas = votaciones.filter(v => !v.completada);
  const votacionesCompletas = votaciones.filter(v => v.completada);
  const tareasPendientes = tareas.filter(t => !t.completada);
  const cargos = integrantes.filter(i => i.categoria === "cargos");
  const socios = integrantes.filter(i => i.categoria === "socios" || i.categoria === "contribuyentes");

  const SECCIONES = [
    { id: "actas", label: "Notificaciones recientes", emoji: "📋" },
    { id: "votaciones", label: "Votaciones", emoji: "🗳️" },
    { id: "integrantes", label: "Censo de integrantes", emoji: "👥" },
  ];

  return (
    <div className="space-y-3">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Total integrantes", val: integrantes.length, emoji: "👥" },
          { label: "Votaciones activas", val: votacionesActivas.length, emoji: "🗳️" },
          { label: "Tareas pendientes", val: tareasPendientes.length, emoji: "✅" },
          { label: "Notifs. recientes", val: notifs.length, emoji: "🔔" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl mb-1">{c.emoji}</p>
            <p className="text-xl font-black text-[#630027]">{c.val}</p>
            <p className="text-xs text-gray-400">{c.label}</p>
          </div>
        ))}
      </div>

      {SECCIONES.map(sec => (
        <div key={sec.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setSeccion(s => s === sec.id ? null : sec.id)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="font-bold text-gray-700 flex items-center gap-2 text-sm">
              <span>{sec.emoji}</span> {sec.label}
            </span>
            {seccion === sec.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {seccion === sec.id && (
            <div className="px-5 pb-4 border-t border-gray-50 pt-3">
              {sec.id === "actas" && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 mb-2">Últimas notificaciones publicadas</p>
                  {notifs.length === 0 && <p className="text-gray-300 text-sm">No hay notificaciones recientes</p>}
                  {notifs.map(n => (
                    <div key={n.id} className="py-2 border-b border-gray-50 last:border-0">
                      <p className="text-sm font-semibold text-gray-700">{n.titulo}</p>
                      {n.mensaje && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.mensaje}</p>}
                    </div>
                  ))}
                  <Link to={createPageUrl("Notificaciones")} className="text-xs text-[#630027] underline mt-2 block">
                    Gestionar notificaciones →
                  </Link>
                </div>
              )}
              {sec.id === "votaciones" && (
                <div className="space-y-1.5">
                  {votacionesActivas.map(v => (
                    <div key={v.id} className="text-sm text-gray-600 py-1.5 border-b border-gray-50 last:border-0">
                      <span className="font-medium">{v.tema}</span>
                    </div>
                  ))}
                  {votacionesActivas.length === 0 && <p className="text-gray-300 text-sm">No hay votaciones activas</p>}
                  <p className="text-xs text-gray-400 mt-1">Completadas: {votacionesCompletas.length}</p>
                  <Link to={createPageUrl("Comunidad")} className="text-xs text-[#630027] underline mt-1 block">Gestionar votaciones →</Link>
                </div>
              )}
              {sec.id === "integrantes" && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Junta directiva</p>
                    {cargos.map(i => (
                      <div key={i.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm font-medium text-gray-700">{i.nombre}</span>
                        <span className="text-xs text-[#630027] capitalize font-semibold">{i.cargo}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Socios y contribuyentes ({socios.length})
                    </p>
                    {socios.slice(0, 8).map(i => (
                      <div key={i.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-700">{i.nombre}</span>
                        <span className="text-xs text-gray-400 capitalize">{i.categoria?.replace("_", " ")}</span>
                      </div>
                    ))}
                    {socios.length > 8 && <p className="text-xs text-gray-400 mt-1">...y {socios.length - 8} más</p>}
                  </div>
                  <Link to={createPageUrl("Integrantes")} className="text-xs text-[#630027] underline mt-1 block">
                    Ver censo completo →
                  </Link>
                </div>
              )}

            </div>
          )}
        </div>
      ))}
    </div>
  );
}