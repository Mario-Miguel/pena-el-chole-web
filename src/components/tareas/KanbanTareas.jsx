import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { User, Calendar, Trash2, Filter } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const COLUMNAS = [
  { id: "pendiente", label: "Pendiente", color: "bg-gray-50", headerColor: "text-gray-600", dot: "bg-gray-400" },
  { id: "en_progreso", label: "En progreso", color: "bg-blue-50", headerColor: "text-blue-600", dot: "bg-blue-500" },
  { id: "completada", label: "Completada", color: "bg-green-50", headerColor: "text-green-600", dot: "bg-green-500" },
];

export default function KanbanTareas() {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "secretario" || sesion?.cargo === "vicepresidente";
  const [tareas, setTareas] = useState([]);
  const [integrantes, setIntegrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroIntegrante, setFiltroIntegrante] = useState("");

  const cargar = useCallback(async () => {
    const [tareasData, ints] = await Promise.all([
      base44.entities.TareaReunion.list("-created_date"),
      base44.entities.Integrante.list(),
    ]);
    setTareas(tareasData);
    setIntegrantes(ints.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const nuevoEstado = result.destination.droppableId;
    const tarea = tareas.find(t => t.id === taskId);
    if (!tarea || tarea.estado === nuevoEstado) return;
    setTareas(prev => prev.map(t => t.id === taskId ? { ...t, estado: nuevoEstado } : t));
    await base44.entities.TareaReunion.update(taskId, { estado: nuevoEstado });
  };

  const eliminar = async (id) => {
    await base44.entities.TareaReunion.delete(id);
    cargar();
  };

  const tareasFiltradas = filtroIntegrante
    ? tareas.filter(t => t.integrante_id === filtroIntegrante)
    : tareas;

  const getTareasPorEstado = (estado) => tareasFiltradas.filter(t => t.estado === estado);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-7 h-7 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        <select value={filtroIntegrante} onChange={e => setFiltroIntegrante(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20">
          <option value="">Todos los integrantes</option>
          {integrantes.map(int => <option key={int.id} value={int.id}>{int.nombre}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{tareasFiltradas.length} tarea(s)</span>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNAS.map(col => {
            const tareasCol = getTareasPorEstado(col.id);
            return (
              <div key={col.id} className={`${col.color} rounded-2xl border border-gray-100 overflow-hidden flex flex-col`}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <h3 className={`font-bold text-sm ${col.headerColor}`}>{col.label}</h3>
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-white/60 rounded-full px-2 py-0.5">{tareasCol.length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[200px] p-3 space-y-2 transition-colors ${snapshot.isDraggingOver ? "bg-white/50" : ""}`}
                    >
                      {tareasCol.map((tarea, index) => (
                        <Draggable key={tarea.id} draggableId={tarea.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-xl border border-gray-100 shadow-sm p-3 ${snapshot.isDragging ? "shadow-lg ring-2 ring-[#630027]/20" : ""}`}
                            >
                              <p className="text-sm text-gray-700 font-medium">{tarea.descripcion}</p>
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {tarea.integrante_nombre && (
                                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5 bg-gray-50 px-1.5 py-0.5 rounded-full">
                                    <User className="w-2.5 h-2.5" /> {tarea.integrante_nombre}
                                  </span>
                                )}
                                {tarea.fecha_limite && (
                                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5 bg-gray-50 px-1.5 py-0.5 rounded-full">
                                    <Calendar className="w-2.5 h-2.5" /> {tarea.fecha_limite}
                                  </span>
                                )}
                              </div>
                              {tarea.acta_fecha && (
                                <p className="text-[10px] text-gray-400 mt-1.5">Acta: {tarea.acta_fecha}</p>
                              )}
                              {puedeEditar && (
                                <button onClick={() => eliminar(tarea.id)}
                                  className="mt-2 text-[10px] text-gray-300 hover:text-red-400 flex items-center gap-0.5 transition-colors">
                                  <Trash2 className="w-2.5 h-2.5" /> Eliminar
                                </button>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {tareasCol.length === 0 && (
                        <p className="text-xs text-gray-300 text-center py-8">Sin tareas</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}