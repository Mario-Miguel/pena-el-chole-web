import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus, CheckCircle2, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import TaskItem from "../tareas/TaskItem";
import TaskDialog from "../tareas/TaskDialog";

export default function TareasContent() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTarea, setSelectedTarea] = useState(null);
  const [completadasOpen, setCompletadasOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const loadTareas = useCallback(async () => {
    const data = await api.entities.Tarea.list("-created_date");
    setTareas(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadTareas(); }, [loadTareas]);

  const handleSave = async (form) => {
    if (selectedTarea) {
      await api.entities.Tarea.update(selectedTarea.id, form);
    } else {
      await api.entities.Tarea.create({ ...form, completada: false });
    }
    setDialogOpen(false);
    loadTareas();
  };

  const handleDelete = async () => {
    if (!selectedTarea) return;
    await api.entities.Tarea.delete(selectedTarea.id);
    setDialogOpen(false);
    loadTareas();
  };

  const handleToggle = async (tarea) => {
    const ahora = new Date().toISOString();
    const update = tarea.completada
      ? { completada: false, fecha_completada: null }
      : { completada: true, fecha_completada: ahora };
    setTareas(prev => prev.map(t => t.id === tarea.id ? { ...t, ...update } : t));
    await api.entities.Tarea.update(tarea.id, update);
  };

  const q = busqueda.trim().toLowerCase();
  const pendientes = tareas.filter(t => !t.completada && (!q || t.nombre.toLowerCase().includes(q) || (t.descripcion || "").toLowerCase().includes(q)));
  const completadas = tareas
    .filter(t => t.completada && (!q || t.nombre.toLowerCase().includes(q) || (t.descripcion || "").toLowerCase().includes(q)))
    .sort((a, b) => new Date(b.fecha_completada) - new Date(a.fecha_completada));

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">
          {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
          {completadas.length > 0 && ` · ${completadas.length} completada${completadas.length !== 1 ? "s" : ""}`}
        </p>
        <Button onClick={() => { setSelectedTarea(null); setDialogOpen(true); }} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl px-4 h-9">
          <Plus className="w-4 h-4 mr-1" /> Nueva tarea
        </Button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar tarea..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20 bg-white" />
      </div>

      <div className="space-y-2 mb-8">
        <AnimatePresence mode="popLayout">
          {pendientes.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-gray-300 text-sm">No hay tareas pendientes</p>
            </motion.div>
          ) : pendientes.map((tarea, i) => (
            <motion.div key={tarea.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.28, delay: i * 0.04 }}>
              <TaskItem tarea={tarea} onToggle={() => handleToggle(tarea)} onClick={() => { setSelectedTarea(tarea); setDialogOpen(true); }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {completadas.length > 0 && (
        <div>
          <button onClick={() => setCompletadasOpen(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-3 select-none">
            <CheckCircle2 className="w-4 h-4" />
            Tareas completadas ({completadas.length})
            <ChevronDown className={`w-4 h-4 transition-transform ${completadasOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {completadasOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                {completadas.map((tarea, i) => (
                  <motion.div key={tarea.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative">
                    <TaskItem tarea={tarea} onToggle={() => handleToggle(tarea)} onClick={() => { setSelectedTarea(tarea); setDialogOpen(true); }} />
                    {tarea.fecha_completada && (
                      <p className="text-xs text-gray-300 mt-0.5 pl-4">
                        Completada el <span className="font-medium">{format(new Date(tarea.fecha_completada), "d 'de' MMMM yyyy, HH:mm", { locale: es })}</span>
                      </p>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} tarea={selectedTarea} isNew={!selectedTarea} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}