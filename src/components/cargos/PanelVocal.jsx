import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PanelVocal() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seccion, setSeccion] = useState("tareas");
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const [tareas, sugerencias, integrantes] = await Promise.all([
      base44.entities.Tarea.list(),
      base44.entities.Sugerencia.list("-created_date", 10),
      base44.entities.Integrante.list(),
    ]);
    setDatos({ tareas, sugerencias, integrantes });
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>;

  const { tareas, sugerencias, integrantes } = datos;
  const tareasPendientes = tareas.filter(t => !t.completada);
  const tareasCompletadas = tareas.filter(t => t.completada);

  const handleCompletarTarea = async (tarea) => {
    await base44.entities.Tarea.update(tarea.id, {
      completada: !tarea.completada,
      fecha_completada: !tarea.completada ? new Date().toISOString() : null,
    });
    cargar();
  };

  const handleCrearTarea = async () => {
    if (!nuevaTarea.trim()) return;
    setGuardando(true);
    await base44.entities.Tarea.create({ nombre: nuevaTarea.trim(), categoria: "otros", completada: false });
    setNuevaTarea("");
    setGuardando(false);
    cargar();
  };

  const SECCIONES = [
    { id: "tareas", label: "Tareas de la peña", emoji: "✅" },
    { id: "sugerencias", label: "Sugerencias recientes", emoji: "💡" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-black text-[#630027]">{tareasPendientes.length}</p>
          <p className="text-xs text-gray-400">Tareas pendientes</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-black text-green-600">{tareasCompletadas.length}</p>
          <p className="text-xs text-gray-400">Tareas completadas</p>
        </div>
      </div>

      {SECCIONES.map(sec => (
        <div key={sec.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => setSeccion(s => s === sec.id ? null : sec.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <span className="font-bold text-gray-700 flex items-center gap-2 text-sm"><span>{sec.emoji}</span> {sec.label}</span>
            {seccion === sec.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {seccion === sec.id && (
            <div className="px-5 pb-4 border-t border-gray-50 pt-3 space-y-2">
              {sec.id === "tareas" && (
                <>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={nuevaTarea}
                      onChange={e => setNuevaTarea(e.target.value)}
                      placeholder="Nueva tarea..."
                      className="rounded-xl border-gray-200 text-sm flex-1"
                      onKeyDown={e => e.key === "Enter" && handleCrearTarea()}
                    />
                    <Button onClick={handleCrearTarea} disabled={!nuevaTarea.trim() || guardando} size="icon" className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl w-9 h-9 flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {tareasPendientes.map(t => (
                    <div key={t.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                      <input type="checkbox" checked={t.completada} onChange={() => handleCompletarTarea(t)} className="accent-[#630027] w-4 h-4 rounded" />
                      <span className="text-sm text-gray-700 flex-1">{t.nombre}</span>
                      {t.categoria && <span className="text-xs text-gray-300 capitalize">{t.categoria}</span>}
                    </div>
                  ))}
                  {tareasPendientes.length === 0 && <p className="text-gray-300 text-sm">No hay tareas pendientes 🎉</p>}
                  <Link to={createPageUrl("ToDo")} className="text-xs text-[#630027] underline block mt-2">Ver todas →</Link>
                </>
              )}
              {sec.id === "sugerencias" && (
                <>
                  {sugerencias.length === 0 && <p className="text-gray-300 text-sm">No hay sugerencias recientes</p>}
                  {sugerencias.slice(0, 5).map(s => (
                    <div key={s.id} className="py-2 border-b border-gray-50 last:border-0">
                      <p className="text-sm text-gray-700">{s.texto || s.contenido || s.mensaje || "Sin texto"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.autor_nombre || "Anónimo"}</p>
                    </div>
                  ))}
                  <Link to={createPageUrl("Sugerencias")} className="text-xs text-[#630027] underline block mt-2">Ver todas →</Link>
                </>
              )}

            </div>
          )}
        </div>
      ))}
    </div>
  );
}