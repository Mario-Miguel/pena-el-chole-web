import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Users, UserPlus, UserMinus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/auth/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import HelpIcon from "../components/layout/HelpIcon";

const EMOJIS_GRUPO = ["👷", "🎨", "🔧", "🔩", "🪚", "🪣", "⚡", "🌿", "🎭", "🏗️", "🛠️", "✨"];
const COLORES = [
  { label: "Rojo",    value: "bg-red-500" },
  { label: "Azul",    value: "bg-blue-500" },
  { label: "Verde",   value: "bg-green-600" },
  { label: "Naranja", value: "bg-orange-500" },
  { label: "Morado",  value: "bg-purple-600" },
  { label: "Grana",   value: "bg-[#630027]" },
  { label: "Índigo",  value: "bg-indigo-600" },
  { label: "Teal",    value: "bg-teal-600" },
];

export default function GruposTrabajo() {
  const { sesion } = useAuth();
  const puedeGestionar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";

  const [grupos, setGrupos] = useState([]);
  const [integrantes, setIntegrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandido, setExpandido] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [addMiembroGrupoId, setAddMiembroGrupoId] = useState(null);
  const [integranteSeleccionado, setIntegranteSeleccionado] = useState("");

  const [fNombre, setFNombre] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fEmoji, setFEmoji] = useState("👷");
  const [fColor, setFColor] = useState("bg-blue-500");

  const cargar = async () => {
    const [g, i] = await Promise.all([
      base44.entities.GrupoTrabajo.list(),
      base44.entities.Integrante.list(),
    ]);
    setGrupos(g);
    setIntegrantes(i.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const crearGrupo = async () => {
    if (!fNombre.trim()) return;
    await base44.entities.GrupoTrabajo.create({
      nombre: fNombre.trim(), descripcion: fDesc.trim(),
      emoji: fEmoji, color: fColor, miembros: [],
    });
    setFNombre(""); setFDesc(""); setFEmoji("👷"); setFColor("bg-blue-500");
    setShowForm(false);
    cargar();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await base44.entities.GrupoTrabajo.delete(confirmDelete);
    setConfirmDelete(null);
    cargar();
  };

  const agregarMiembro = async (grupoId) => {
    if (!integranteSeleccionado) return;
    const grupo = grupos.find(g => g.id === grupoId);
    const integrante = integrantes.find(i => i.id === integranteSeleccionado);
    if (!integrante) return;
    const miembros = grupo.miembros || [];
    if (miembros.find(m => m.id === integrante.id)) return;
    await base44.entities.GrupoTrabajo.update(grupoId, {
      miembros: [...miembros, { id: integrante.id, nombre: integrante.nombre }]
    });
    setIntegranteSeleccionado("");
    setAddMiembroGrupoId(null);
    cargar();
  };

  const quitarMiembro = async (grupo, miembroId) => {
    const miembros = (grupo.miembros || []).filter(m => m.id !== miembroId);
    await base44.entities.GrupoTrabajo.update(grupo.id, { miembros });
    cargar();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">👷 Grupos</h1>
            <HelpIcon section="grupos" />
          </div>
          <p className="text-gray-400 text-sm mt-1">Grupos de trabajo de la peña</p>
        </div>
        {puedeGestionar && (
          <Button onClick={() => setShowForm(v => !v)} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-sm">
            <Plus className="w-4 h-4 mr-1" /> Grupo
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 overflow-hidden">
            <p className="text-sm font-bold text-gray-700">Nuevo grupo de trabajo</p>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS_GRUPO.map(e => (
                <button key={e} onClick={() => setFEmoji(e)}
                  className={`w-9 h-9 rounded-xl text-lg border-2 transition-all ${fEmoji === e ? "border-[#630027] bg-[#630027]/5" : "border-gray-100 hover:border-gray-200"}`}>{e}</button>
              ))}
            </div>
            <input value={fNombre} onChange={e => setFNombre(e.target.value)} placeholder="Nombre del grupo (ej: Grupo Pintura)" autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
            <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Descripción (opcional)"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none" />
            <div className="flex gap-2 flex-wrap">
              {COLORES.map(c => (
                <button key={c.value} onClick={() => setFColor(c.value)}
                  className={`w-8 h-8 rounded-full border-4 transition-all ${c.value} ${fColor === c.value ? "border-gray-800 scale-110" : "border-transparent hover:scale-105"}`} title={c.label} />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={crearGrupo} disabled={!fNombre.trim()} className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Crear</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {grupos.length === 0 && (
        <div className="text-center py-16 text-gray-300">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay grupos de trabajo</p>
        </div>
      )}

      <div className="space-y-3">
        {grupos.map(g => {
          const isOpen = expandido[g.id];
          const miembros = g.miembros || [];
          return (
            <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className={`${g.color || "bg-blue-500"} px-5 py-4 flex items-center justify-between cursor-pointer`}
                onClick={() => setExpandido(prev => ({ ...prev, [g.id]: !prev[g.id] }))}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{g.emoji || "👷"}</span>
                  <div>
                    <h2 className="text-white font-bold text-base">{g.nombre}</h2>
                    {g.descripcion && <p className="text-white/70 text-xs">{g.descripcion}</p>}
                  </div>
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">{miembros.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  {puedeGestionar && (
                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(g.id); }}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  </motion.div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                    <div className="p-4 space-y-3">
                      {miembros.length === 0 && <p className="text-gray-300 text-sm text-center py-2">Sin miembros aún</p>}
                      <div className="space-y-1">
                        {miembros.map(m => (
                          <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 group">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                              {m.nombre[0].toUpperCase()}
                            </div>
                            <span className="text-sm text-gray-700 flex-1">{m.nombre}</span>
                            {puedeGestionar && (
                              <button onClick={() => quitarMiembro(g, m.id)}
                                className="p-1 rounded-lg text-gray-200 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {puedeGestionar && (
                        <>
                          {addMiembroGrupoId === g.id ? (
                            <div className="flex gap-2">
                              <select value={integranteSeleccionado} onChange={e => setIntegranteSeleccionado(e.target.value)}
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                                <option value="">Seleccionar integrante...</option>
                                {integrantes.filter(i => !miembros.find(m => m.id === i.id)).map(i => (
                                  <option key={i.id} value={i.id}>{i.nombre}</option>
                                ))}
                              </select>
                              <button onClick={() => agregarMiembro(g.id)}
                                className="p-2 bg-[#630027]/10 text-[#630027] rounded-xl hover:bg-[#630027]/20 transition-colors">
                                <UserPlus className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setAddMiembroGrupoId(null); setIntegranteSeleccionado(""); }}
                                className="p-2 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => { setAddMiembroGrupoId(g.id); setIntegranteSeleccionado(""); }}
                              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm hover:border-[#630027]/40 hover:text-[#630027] transition-colors">
                              <UserPlus className="w-3.5 h-3.5" /> Añadir miembro
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        mensaje="¿Eliminar este grupo de trabajo? Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </motion.div>
  );
}