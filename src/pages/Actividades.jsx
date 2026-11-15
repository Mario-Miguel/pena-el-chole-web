import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus, Calendar, Lightbulb, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "../components/auth/AuthContext";
import ActividadCard from "../components/actividades/ActividadCard";
import ActividadDialog from "../components/actividades/ActividadDialog";
import SugerenciasActividades from "../components/actividades/SugerenciasActividades";
import ConfirmDialog from "../components/ConfirmDialog";
import HelpIcon from "../components/layout/HelpIcon";
import { isFuture, isPast } from "date-fns";

const TABS = [
  { id: "proximas",   label: "Próximas",     icon: Calendar },
  { id: "pasadas",    label: "Historial",    icon: Calendar },
  { id: "sugerencias",label: "Sugerencias",  icon: Lightbulb },
];

export default function Actividades() {
  const { sesion, puedeConfigurar } = useAuth();
  const puedeGestionar = puedeConfigurar || sesion?.cargo != null;
  const [tab, setTab] = useState("proximas");
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [notifEnviada, setNotifEnviada] = useState(false);

  const load = useCallback(async () => {
    const data = await api.entities.Actividad.list("-fecha");
    setActividades(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    await api.entities.Actividad.delete(confirmDelete.id);
    setConfirmDelete(null);
    load();
  };

  const handleToggleInscripcion = async (actividad) => {
    const uid = sesion?.integranteId;
    if (!uid) return;
    const inscritos = actividad.inscritos_ids || [];
    const nuevos = inscritos.includes(uid) ? inscritos.filter(i => i !== uid) : [...inscritos, uid];
    await api.entities.Actividad.update(actividad.id, { inscritos_ids: nuevos });
    load();
  };

  const handleNotificar = async (actividad) => {
    // Crea una notificación en el sistema para todos los usuarios
    await api.entities.Notificacion.create({
      titulo: `📅 Nueva actividad: ${actividad.titulo}`,
      mensaje: `${actividad.lugar ? `📍 ${actividad.lugar} · ` : ""}${actividad.fecha ? new Date(actividad.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : ""}`,
      tipo: "evento",
      leida_por: [],
      archivada: false,
    });
    await api.entities.Actividad.update(actividad.id, { notificacion_enviada: true });
    setNotifEnviada(true);
    setTimeout(() => setNotifEnviada(false), 3000);
    load();
  };

  const proximas = actividades.filter(a => {
    if (a.estado === "cancelada" || a.estado === "finalizada") return false;
    return !a.fecha || isFuture(new Date(a.fecha)) || a.estado === "en_curso";
  });
  const pasadas = actividades.filter(a => a.estado === "finalizada" || a.estado === "cancelada" || (a.fecha && isPast(new Date(a.fecha)) && a.estado === "programada"));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div
      initial="hidden" animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } } }}
      className="max-w-2xl mx-auto px-4 py-10"
    >
      {/* Header */}
      <motion.div variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-[#630027]">Actividades</h1>
              <HelpIcon section="actividades" />
            </div>
            <p className="text-gray-400 text-sm mt-1">{proximas.length} actividad{proximas.length !== 1 ? "es" : ""} próxima{proximas.length !== 1 ? "s" : ""}</p>
          </div>
          {puedeGestionar && (
            <Button onClick={() => { setEditando(null); setDialogOpen(true); }} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
              <Plus className="w-4 h-4 mr-1" /> Nueva
            </Button>
          )}
        </div>

        {/* Notif confirmación */}
        <AnimatePresence>
          {notifEnviada && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700 font-medium"
            >
              ✅ Notificación enviada a todos los integrantes
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6"
      >
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? "bg-white shadow text-[#630027]" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </motion.div>

      {/* Contenido */}
      <AnimatePresence mode="wait">
        {tab === "proximas" && (
          <motion.div key="proximas" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            {proximas.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">📅</p>
                <p className="text-gray-300 text-sm">No hay actividades programadas</p>
                {puedeGestionar && <p className="text-gray-200 text-xs mt-1">Pulsa "Nueva" para añadir una</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {proximas.map(a => (
                  <div key={a.id}>
                    <ActividadCard
                      actividad={a}
                      usuarioId={sesion?.integranteId}
                      puedeGestionar={puedeGestionar}
                      onEdit={(act) => { setEditando(act); setDialogOpen(true); }}
                      onDelete={setConfirmDelete}
                      onToggleInscripcion={handleToggleInscripcion}
                    />
                    {puedeGestionar && !a.notificacion_enviada && (
                      <button onClick={() => handleNotificar(a)}
                        className="mt-1 flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#630027] transition-colors ml-2"
                      >
                        <Bell className="w-3 h-3" /> Notificar a todos
                      </button>
                    )}
                    {a.notificacion_enviada && (
                      <p className="mt-1 text-[10px] text-gray-300 ml-2 flex items-center gap-1"><Bell className="w-3 h-3" /> Notificación enviada</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "pasadas" && (
          <motion.div key="pasadas" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            {pasadas.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🗃️</p>
                <p className="text-gray-300 text-sm">No hay actividades en el historial</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pasadas.map(a => (
                  <ActividadCard
                    key={a.id}
                    actividad={a}
                    usuarioId={sesion?.integranteId}
                    puedeGestionar={puedeGestionar}
                    onEdit={(act) => { setEditando(act); setDialogOpen(true); }}
                    onDelete={setConfirmDelete}
                    onToggleInscripcion={handleToggleInscripcion}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "sugerencias" && (
          <motion.div key="sugerencias" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <SugerenciasActividades sesion={sesion} puedeGestionar={puedeGestionar} />
          </motion.div>
        )}
      </AnimatePresence>

      <ActividadDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditando(null); }}
        actividad={editando}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        mensaje={`¿Eliminar la actividad "${confirmDelete?.titulo}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </motion.div>
  );
}