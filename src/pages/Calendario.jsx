import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import { useAuth } from "../components/auth/AuthContext";
import { format } from "date-fns";
import CalendarioGrid from "../components/calendario/CalendarioGrid";
import DiaDrawer from "../components/calendario/DiaDrawer";
import AnadirPlazoDialog from "../components/calendario/AnadirPlazoDialog";
import LeyendaPlazos from "../components/calendario/LeyendaPlazos";
import { motion } from "framer-motion";

export default function Calendario() {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [diasConDatos, setDiasConDatos] = useState(new Set());
  const [plazos, setPlazos] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [dialogPlazo, setDialogPlazo] = useState(false);

  const cargarDatos = useCallback(async () => {
    const [dias, plazosData, actividadesData, tareasData] = await Promise.all([
      base44.entities.DiaCalendario.list(),
      base44.entities.PlazoCalendario.list("-created_date"),
      base44.entities.Actividad.list("-fecha"),
      base44.entities.TareaReunion.list("-created_date"),
    ]);
    // Solo marcar días que tengan fotos O notas con contenido real
    const set = new Set(dias.filter(d => (d.fotos && d.fotos.length > 0) || (d.notas && d.notas.trim() !== "")).map(d => d.fecha));
    setDiasConDatos(set);
    setPlazos(plazosData);
    setActividades(actividadesData);
    setTareas(tareasData);
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleCrearPlazo = async (data) => {
    await base44.entities.PlazoCalendario.create(data);
    cargarDatos();
  };

  const handleEliminarPlazo = async (id) => {
    await base44.entities.PlazoCalendario.delete(id);
    cargarDatos();
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.03 } } }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.42 } } }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">Calendario</h1>
            <HelpIcon section="calendario" />
          </div>
          <p className="text-gray-400 text-sm mt-0.5">Pulsa un día para añadir fotos y notas</p>
        </div>
        {puedeEditar && (
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
            <Button
              onClick={() => setDialogPlazo(true)}
              className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl px-4 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span>Añadir</span>
            </Button>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.42 } } }}
        whileHover={{ boxShadow: "none" }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* Calendario */}
        <div className="lg:col-span-2">
          <CalendarioGrid
            mesActual={mesActual}
            onMesChange={setMesActual}
            diasConDatos={diasConDatos}
            plazos={plazos}
            actividades={actividades}
            tareas={tareas}
            onDiaClick={setDiaSeleccionado}
            diaSeleccionado={diaSeleccionado}
          />

          {/* Leyenda de indicadores */}
          <div className="flex items-center gap-4 mt-3 px-2 text-xs text-gray-500 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" /> Actividades
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" /> Tareas vencen
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#630027]/60" /> Fotos/Notas
            </div>
          </div>
        </div>

        {/* Leyenda + plazos */}
        <div>
          <LeyendaPlazos plazos={plazos} onEliminar={handleEliminarPlazo} />
        </div>
      </motion.div>

      {/* Drawer día */}
      <DiaDrawer
        dia={diaSeleccionado}
        onClose={() => setDiaSeleccionado(null)}
        onUpdate={cargarDatos}
        actividades={actividades}
        tareas={tareas}
      />

      {/* Dialog plazo */}
      <AnadirPlazoDialog
        open={dialogPlazo}
        onOpenChange={setDialogPlazo}
        onCrear={handleCrearPlazo}
      />
    </motion.div>
  );
}