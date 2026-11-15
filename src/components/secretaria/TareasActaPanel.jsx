import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "../auth/AuthContext";
import { Plus, Trash2, CheckCircle2, Circle, Clock, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const ESTADOS = [
  { value: "pendiente", label: "Pendiente", icon: Circle, color: "text-gray-400", bg: "bg-gray-100" },
  { value: "en_progreso", label: "En progreso", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
  { value: "completada", label: "Completada", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
];

export default function TareasActaPanel({ actaId, actaFecha }) {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "secretario" || sesion?.cargo === "vicepresidente";
  const [tareas, setTareas] = useState([]);
  const [integrantes, setIntegrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ descripcion: "", integrante_id: "", fecha_limite: "" });

  const cargar = async () => {
    try {
      const [data, ints] = await Promise.all([
        base44.entities.TareaReunion.filter({ acta_id: actaId }),
        base44.entities.Integrante.list(),
      ]);
      setTareas(data.sort((a, b) => (a.created_date || "").localeCompare(b.created_date || "")));
      setIntegrantes(ints.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [actaId]);

  const asignarIntegrante = (id, nombre) => setForm(f => ({ ...f, integrante_id: id, integrante_nombre: nombre }));

  const crear = async () => {
    if (!form.descripcion.trim()) return;
    const int = integrantes.find(i => i.id === form.integrante_id);
    await base44.entities.TareaReunion.create({
      acta_id: actaId,
      acta_fecha: actaFecha,
      descripcion: form.descripcion.trim(),
      integrante_id: form.integrante_id || "",
      integrante_nombre: int?.nombre || "",
      estado: "pendiente",
      fecha_limite: form.fecha_limite || "",
    });
    setForm({ descripcion: "", integrante_id: "", fecha_limite: "" });
    setShowForm(false);
    cargar();
  };

  const cambiarEstado = async (tarea, nuevoEstado) => {
    await base44.entities.TareaReunion.update(tarea.id, { estado: nuevoEstado });
    cargar();
  };

  const eliminar = async (id) => {
    await base44.entities.TareaReunion.delete(id);
    cargar();
  };

  if (loading) return null;

  const pendientes = tareas.filter(t => t.estado !== "completada").length;
  const completadas = tareas.filter(t => t.estado === "completada").length;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          ✅ Tareas derivadas
          {tareas.length > 0 && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full normal-case font-medium">
              {completadas}/{tareas.length}
            </span>
          )}
        </p>
        {puedeEditar && (
          <button onClick={() => setShowForm(v => !v)} className="text-xs text-[#630027] font-bold hover:underline flex items-center gap-0.5">
            <Plus className="w-3 h-3" /> Asignar
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && puedeEditar && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-gray-50 rounded-xl p-3 space-y-2 mb-2">
              <input type="text" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Describir la tarea o responsabilidad..." autoFocus
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
              <div className="flex gap-2">
                <select value={form.integrante_id} onChange={e => { const int = integrantes.find(i => i.id === e.target.value); asignarIntegrante(e.target.value, int?.nombre || ""); }}
                  className="flex-1 rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none">
                  <option value="">Sin asignar</option>
                  {integrantes.map(int => <option key={int.id} value={int.id}>{int.nombre}</option>)}
                </select>
                <input type="date" value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-2 py-2 text-sm focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <Button onClick={crear} disabled={!form.descripcion.trim()} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-lg text-xs h-8">Crear tarea</Button>
                <Button onClick={() => setShowForm(false)} variant="outline" className="rounded-lg text-xs h-8">Cancelar</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tareas.length === 0 ? (
        <p className="text-xs text-gray-300 italic">Sin tareas asignadas</p>
      ) : (
        <div className="space-y-1.5">
          {tareas.map(tarea => {
            const estado = ESTADOS.find(e => e.value === tarea.estado) || ESTADOS[0];
            const EstadoIcon = estado.icon;
            return (
              <div key={tarea.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 group">
                {puedeEditar || tarea.integrante_id === sesion?.integranteId ? (
                  <select value={tarea.estado} onChange={e => cambiarEstado(tarea, e.target.value)}
                    className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 border-0 cursor-pointer ${estado.bg} ${estado.color} focus:outline-none`}>
                    {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                ) : (
                  <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${estado.bg} ${estado.color} flex items-center gap-0.5`}>
                    <EstadoIcon className="w-3 h-3" /> {estado.label}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${tarea.estado === "completada" ? "line-through text-gray-300" : "text-gray-700"}`}>{tarea.descripcion}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {tarea.integrante_nombre && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><User className="w-2.5 h-2.5" /> {tarea.integrante_nombre}</span>
                    )}
                    {tarea.fecha_limite && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> {tarea.fecha_limite}</span>
                    )}
                  </div>
                </div>
                {puedeEditar && (
                  <button onClick={() => eliminar(tarea.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}