import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus, CheckCircle2, ChevronDown, ChevronUp, Search } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import TaskItem from "../components/tareas/TaskItem";
import TaskDialog from "../components/tareas/TaskDialog";

export default function ToDo() {
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

  const handleOpenNew = () => {
    setSelectedTarea(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (tarea) => {
    setSelectedTarea(tarea);
    setDialogOpen(true);
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.03 } } }}
      className="max-w-2xl mx-auto px-4 py-10"
    >
      {/* Header */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.42 } } }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">Tareas</h1>
            <HelpIcon section="tareas" />
          </div>
          <p className="text-gray-400 text-sm mt-1">
            {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""}
            {completadas.length > 0 && ` · ${completadas.length} completada${completadas.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
          <Button onClick={handleOpenNew} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl px-4">
            <Plus className="w-4 h-4 mr-2" />
            Nueva tarea
          </Button>
        </motion.div>
      </motion.div>

      {/* Búsqueda */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
        className="relative mb-6"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar tarea..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20 bg-white"
        />
      </motion.div>

      {/* Tareas pendientes */}
      <div className="space-y-2 mb-10">
        <AnimatePresence mode="popLayout">
          {pendientes.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              className="text-center py-14"
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="text-5xl mb-3"
              >✅</motion.div>
              <p className="text-gray-300 text-sm">No hay tareas pendientes</p>
              <p className="text-gray-200 text-xs mt-1">Pulsa "Nueva tarea" para añadir</p>
            </motion.div>
          ) : (
            pendientes.map((tarea, i) => (
              <motion.div
                key={tarea.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
                transition={{ duration: 0.28, delay: i * 0.04 }}
                whileHover={{ x: 2, boxShadow: "0 4px 14px rgba(99,0,39,0.07)" }}
              >
                <TaskItem
                  tarea={tarea}
                  onToggle={() => handleToggle(tarea)}
                  onClick={() => handleOpenEdit(tarea)}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Tareas completadas */}
      {completadas.length > 0 && (
        <motion.div
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.15 } } }}
        >
          <motion.button
            onClick={() => setCompletadasOpen(v => !v)}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-3 select-none"
          >
            <CheckCircle2 className="w-4 h-4" />
            Tareas completadas ({completadas.length})
            <motion.div animate={{ rotate: completadasOpen ? 180 : 0 }} transition={{ duration: 0.22 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.button>

          <AnimatePresence initial={false}>
            {completadasOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="overflow-hidden space-y-2"
              >
                {completadas.map((tarea, i) => (
                  <motion.div
                    key={tarea.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.22 }}
                    className="relative"
                  >
                    <TaskItem
                      tarea={tarea}
                      onToggle={() => handleToggle(tarea)}
                      onClick={() => handleOpenEdit(tarea)}
                    />
                    {tarea.fecha_completada && (
                      <p className="text-xs text-gray-300 mt-0.5 pl-4">
                        Completada el{" "}
                        <span className="font-medium">
                          {format(new Date(tarea.fecha_completada), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                        </span>
                      </p>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tarea={selectedTarea}
        isNew={!selectedTarea}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </motion.div>
  );
}