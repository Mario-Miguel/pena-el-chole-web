import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import VotacionCard from "../votaciones/VotacionCard";
import NuevaVotacionDialog from "../votaciones/NuevaVotacionDialog";
import { useAuth } from "../auth/AuthContext";

export default function VotacionesContent() {
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
      api.entities.Integrante.list()
    ]);
    setVotaciones(data);
    setIntegrantes(miembros.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
    await Promise.all(votos.map(v => api.entities.VotoRespuesta.delete(v.id)));
    await api.entities.Votacion.delete(id);
    loadData();
  };

  const handleRepetir = async (votacion) => {
    const votos = await api.entities.VotoRespuesta.filter({ votacion_id: votacion.id });
    await Promise.all(votos.map(v => api.entities.VotoRespuesta.delete(v.id)));
    await api.entities.Votacion.update(votacion.id, { completada: false, fecha_completada: null });
    integrantes.forEach(i => localStorage.removeItem(`voto_${votacion.id}_${i.id}`));
    loadData();
  };

  const integranteActual = integrantes.find(i => i.id === usuarioId);
  const puedeVotar = integranteActual && (integranteActual.categoria === "socios" || integranteActual.categoria === "cargos");

  const activas = votaciones.filter(v => !v.completada);
  const completadas = votaciones.filter(v => v.completada);

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-400">
          {activas.length} activa{activas.length !== 1 ? "s" : ""}
          {completadas.length > 0 && ` · ${completadas.length} completada${completadas.length !== 1 ? "s" : ""}`}
        </p>
        {puedeConfigurar && (
          <Button onClick={() => setDialogOpen(true)} className="bg-[#630027] text-white px-4 py-2 text-sm font-medium rounded-xl hover:bg-[#3a1019] h-9">
            <Plus className="w-4 h-4 mr-1" /> Nueva votación
          </Button>
        )}
      </div>

      <div className="space-y-4 mb-8">
        {activas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-3">🗳️</p>
            <p className="text-gray-300 text-sm">No hay votaciones activas</p>
          </div>
        ) : activas.map(v => (
          <VotacionCard key={v.id} votacion={v} onComplete={handleComplete} onEliminar={handleEliminar}
            onRepetir={handleRepetir} esPresidente={puedeConfigurar} usuarioId={puedeVotar ? usuarioId : null} />
        ))}
      </div>

      {completadas.length > 0 && (
        <div>
          <button onClick={() => setCompletadasOpen(o => !o)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-4 select-none">
            Votaciones completadas ({completadas.length})
            <ChevronDown className={`w-4 h-4 transition-transform ${completadasOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {completadasOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4">
                {completadas.map(v => (
                  <VotacionCard key={v.id} votacion={v} onComplete={handleComplete} onEliminar={handleEliminar}
                    onRepetir={handleRepetir} esPresidente={puedeConfigurar} usuarioId={puedeVotar ? usuarioId : null} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <NuevaVotacionDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreate={handleCreate} />
    </div>
  );
}