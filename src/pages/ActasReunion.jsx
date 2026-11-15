import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "../components/auth/AuthContext";
import { Plus, CheckSquare, Square, Trash2, ChevronDown, ChevronUp, Check } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function ActasReunion() {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "secretario" || sesion?.cargo === "vicepresidente";
  const [actas, setActas] = useState([]);
  const [integrantes, setIntegrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandida, setExpandida] = useState(null);
  const [asistentesSeleccionados, setAsistentesSeleccionados] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    asistentes: "",
    puntos: "",
    acuerdos: "",
    tareas_derivadas: "",
    firmada: false,
  });

  const cargar = async () => {
    const [data, ints] = await Promise.all([
      base44.entities.ActaReunion.list("-fecha"),
      base44.entities.Integrante.list(),
    ]);
    setActas(data);
    setIntegrantes(ints.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const toggleAsistente = (nombre) => {
    setAsistentesSeleccionados(prev =>
      prev.includes(nombre) ? prev.filter(n => n !== nombre) : [...prev, nombre]
    );
  };

  const guardar = async () => {
    if (!form.fecha || !form.puntos) return;
    await base44.entities.ActaReunion.create({ ...form, asistentes: asistentesSeleccionados.join(", ") });
    setForm({ fecha: new Date().toISOString().split("T")[0], asistentes: "", puntos: "", acuerdos: "", tareas_derivadas: "", firmada: false });
    setAsistentesSeleccionados([]);
    setShowForm(false);
    cargar();
  };

  const toggleFirmada = async (acta) => {
    await base44.entities.ActaReunion.update(acta.id, { firmada: !acta.firmada });
    cargar();
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta acta?")) return;
    await base44.entities.ActaReunion.delete(id);
    cargar();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-[#630027] text-3xl font-black">Actas de Reunión</h1>
          <HelpIcon />
        </div>
        {puedeEditar && (
          <Button onClick={() => setShowForm(v => !v)} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Nueva acta
          </Button>
        )}
      </div>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium mb-1 block">Fecha de la reunión</label>
                <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2 relative">
                <label className="text-xs text-gray-500 font-medium mb-1 block">Asistentes</label>
                <button type="button" onClick={() => setDropdownOpen(v => !v)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-left flex items-center justify-between bg-white">
                  <span className={asistentesSeleccionados.length ? "text-gray-800" : "text-gray-400"}>
                    {asistentesSeleccionados.length ? `${asistentesSeleccionados.length} seleccionado${asistentesSeleccionados.length > 1 ? "s" : ""}` : "Seleccionar asistentes..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {asistentesSeleccionados.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {asistentesSeleccionados.map(n => (
                      <span key={n} className="text-xs bg-[#630027]/10 text-[#630027] px-2 py-0.5 rounded-full flex items-center gap-1">
                        {n}
                        <button onClick={() => toggleAsistente(n)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
                      {integrantes.map(int => (
                        <button key={int.id} type="button" onClick={() => toggleAsistente(int.nombre)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-sm text-left">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${asistentesSeleccionados.includes(int.nombre) ? "bg-[#630027] border-[#630027]" : "border-gray-300"}`}>
                            {asistentesSeleccionados.includes(int.nombre) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-gray-700">{int.nombre}</span>
                          {int.cargo && <span className="text-xs text-gray-400 ml-auto">{int.cargo}</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium mb-1 block">Puntos tratados *</label>
                <textarea value={form.puntos} onChange={e => setForm(f => ({ ...f, puntos: e.target.value }))}
                  placeholder="Describe los puntos del orden del día..." rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium mb-1 block">Acuerdos adoptados</label>
                <textarea value={form.acuerdos} onChange={e => setForm(f => ({ ...f, acuerdos: e.target.value }))}
                  placeholder="Decisiones y acuerdos tomados..." rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 font-medium mb-1 block">Tareas derivadas</label>
                <textarea value={form.tareas_derivadas} onChange={e => setForm(f => ({ ...f, tareas_derivadas: e.target.value }))}
                  placeholder="Acciones a llevar a cabo tras la reunión..." rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={guardar} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Guardar acta</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="rounded-xl">Cancelar</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de actas */}
      {actas.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400 text-sm">Sin actas registradas</div>
      )}

      <div className="space-y-3">
        {actas.map(acta => (
          <div key={acta.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => setExpandida(expandida === acta.id ? null : acta.id)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-sm">📋 Reunión del {acta.fecha}</span>
                  {acta.firmada && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Firmada</span>
                  )}
                </div>
                {acta.asistentes && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">👥 {acta.asistentes}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {puedeEditar && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); toggleFirmada(acta); }}
                      title={acta.firmada ? "Desmarcar firma" : "Marcar como firmada"}
                      className="text-gray-300 hover:text-green-500 transition-colors">
                      {acta.firmada ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); eliminar(acta.id); }}
                      className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                {expandida === acta.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>

            <AnimatePresence>
              {expandida === acta.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-gray-100">
                  <div className="px-4 py-3 space-y-3">
                    {acta.puntos && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Puntos tratados</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{acta.puntos}</p>
                      </div>
                    )}
                    {acta.acuerdos && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Acuerdos</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{acta.acuerdos}</p>
                      </div>
                    )}
                    {acta.tareas_derivadas && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tareas derivadas</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{acta.tareas_derivadas}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}