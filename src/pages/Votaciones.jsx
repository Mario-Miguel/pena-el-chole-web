import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import VotacionCard from "../components/votaciones/VotacionCard";
import NuevaVotacionDialog from "../components/votaciones/NuevaVotacionDialog";
import { useAuth } from "../components/auth/AuthContext";

export default function Votaciones() {
  const { sesion, puedeConfigurar } = useAuth();
  const [votaciones, setVotaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completadasOpen, setCompletadasOpen] = useState(false);
  const [integrantes, setIntegrantes] = useState([]);

  const usuarioId = sesion?.integranteId || "";

  const loadData = useCallback(async () => {
    const [data, miembros] = await Promise.all([
    api.entities.Votacion.list("-created_date"),
    api.entities.Integrante.list()]
    );
    setVotaciones(data);
    setIntegrantes(miembros.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setLoading(false);
  }, []);

  useEffect(() => {loadData();}, [loadData]);

  const handleCreate = async ({ tema, descripcion, opciones }) => {
    await api.entities.Votacion.create({ tema, descripcion, opciones, completada: false });
    setDialogOpen(false);
    loadData();
  };

  const handleComplete = async (id) => {
    await api.entities.Votacion.update(id, { completada: true, fecha_completada: new Date().toISOString() });
    loadData();
  };

  const handleEliminar = async (id) => {
    const votos = await api.entities.VotoRespuesta.filter({ votacion_id: id });
    await Promise.all(votos.map((v) => api.entities.VotoRespuesta.delete(v.id)));
    await api.entities.Votacion.delete(id);
    loadData();
  };

  const handleRepetir = async (votacion) => {
    const votos = await api.entities.VotoRespuesta.filter({ votacion_id: votacion.id });
    await Promise.all(votos.map((v) => api.entities.VotoRespuesta.delete(v.id)));
    await api.entities.Votacion.update(votacion.id, { completada: false, fecha_completada: null });
    integrantes.forEach((i) => localStorage.removeItem(`voto_${votacion.id}_${i.id}`));
    loadData();
  };

  // Solo socios y cargos pueden votar
  const integranteActual = integrantes.find(i => i.id === usuarioId);
  const puedeVotar = integranteActual && (integranteActual.categoria === "socios" || integranteActual.categoria === "cargos");

  const activas = votaciones.filter((v) => !v.completada);
  const completadas = votaciones.filter((v) => v.completada);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#4B1924]/20 border-t-[#4B1924] rounded-full animate-spin" />
    </div>);


  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.03 } } }}
      className="max-w-2xl mx-auto px-4 py-10"
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.42 } } }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[#630027] text-3xl font-black">Votaciones</h1>
            <HelpIcon section="votaciones" />
          </div>
          <p className="text-gray-400 text-sm mt-1">Sistema de votación de la peña</p>
          {puedeConfigurar && sesion?.cargo &&
          <span className="text-xs text-[#4B1924]/60 font-semibold bg-[#4B1924]/5 px-2 py-0.5 rounded-lg inline-block mt-1">⚜️ {sesion.cargo === "vicepresidente" ? "Vicepresidente" : "Presidente"}</span>
          }
        </div>
        {puedeConfigurar && (
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.93 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
            <Button onClick={() => setDialogOpen(true)} className="bg-[#630027] text-white px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center justify-center gap-2 whitespace-nowrap shadow h-9 hover:bg-[#3a1019]">
              <Plus className="w-4 h-4 mr-2" />
              Nueva votación
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Activas */}
      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
        className="space-y-4 mb-10"
      >
        {activas.length === 0 ?
        <motion.div
          variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1, transition: { duration: 0.35 } } }}
          className="text-center py-14"
        >
            <motion.p animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="text-5xl mb-3">🗳️</motion.p>
            <p className="text-gray-300 text-sm">No hay votaciones activas</p>
          </motion.div> :

        activas.map((v, i) =>
        <motion.div
          key={v.id}
          variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, delay: i * 0.05 } } }}
          whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(99,0,39,0.09)" }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <VotacionCard
            votacion={v}
            onComplete={handleComplete}
            onEliminar={handleEliminar}
            onRepetir={handleRepetir}
            esPresidente={puedeConfigurar}
            usuarioId={puedeVotar ? usuarioId : null} />
        </motion.div>
        )
        }
      </motion.div>

      {/* Completadas */}
      {completadas.length > 0 &&
      <div>
          <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} onClick={() => setCompletadasOpen((o) => !o)} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-4 select-none">
            Votaciones completadas ({completadas.length})
            <motion.span animate={{ rotate: completadasOpen ? 180 : 0 }} transition={{ duration: 0.22 }}><ChevronDown className="w-4 h-4" /></motion.span>
          </motion.button>
          <AnimatePresence initial={false}>
            {completadasOpen &&
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4">
                {completadas.map((v) =>
            <VotacionCard
              key={v.id}
              votacion={v}
              onComplete={handleComplete}
              onEliminar={handleEliminar}
              onRepetir={handleRepetir}
              esPresidente={puedeConfigurar}
              usuarioId={puedeVotar ? usuarioId : null} />

            )}
              </motion.div>
          }
          </AnimatePresence>
        </div>
      }

      <NuevaVotacionDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreate={handleCreate} />
    </motion.div>);

}