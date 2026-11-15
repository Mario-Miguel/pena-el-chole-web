import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CalendarioGrid from "./CalendarioGrid";
import DiaDrawer from "./DiaDrawer";
import LeyendaPlazos from "./LeyendaPlazos";
import AnadirPlazoDialog from "./AnadirPlazoDialog";
import { useAuth } from "../auth/AuthContext";

export default function CalendarioInicio({ cuentasAtras = [] }) {
  const { sesion } = useAuth();
  const puedeConfigurar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "secretario";

  const [mesActual, setMesActual] = useState(new Date());
  const [dias, setDias] = useState([]);
  const [plazos, setPlazos] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [plazoDialogOpen, setPlazoDialogOpen] = useState(false);

  const cargarDatos = useCallback(async () => {
    const [diasData, plazosData] = await Promise.all([
      base44.entities.DiaCalendario.list(),
      base44.entities.PlazoCalendario.list(),
    ]);
    setDias(diasData);

    // Plazos normales + plazos virtuales de las cuentas atrás
    const plazosCA = cuentasAtras
      .filter(c => c.fecha_objetivo)
      .map(c => ({
        id: `ca_${c.id}`,
        titulo: c.nombre_evento || "Cuenta atrás",
        fecha_inicio: format(new Date(c.fecha_objetivo), "yyyy-MM-dd"),
        fecha_fin: format(new Date(c.fecha_objetivo), "yyyy-MM-dd"),
        categoria: "eventos",
        _esCuentaAtras: true,
      }));

    setPlazos([...plazosData, ...plazosCA]);
  }, [cuentasAtras]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const diasConDatos = new Set(dias.filter(d => d.fotos?.length > 0 || d.notas).map(d => d.fecha));

  const handleCrearPlazo = async (datos) => {
    await base44.entities.PlazoCalendario.create(datos);
    cargarDatos();
  };

  const handleEliminarPlazo = async (id) => {
    if (String(id).startsWith("ca_")) return; // No se pueden eliminar las de cuenta atrás desde aquí
    await base44.entities.PlazoCalendario.delete(id);
    cargarDatos();
  };

  // Plazos reales (sin los virtuales de cuenta atrás) para la leyenda
  const plazosReales = plazos.filter(p => !p._esCuentaAtras);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-black text-[#630027]">Calendario</h2>
        {puedeConfigurar && (
          <Button
            onClick={() => setPlazoDialogOpen(true)}
            variant="outline"
            className="border-[#630027]/20 text-[#630027] hover:bg-[#630027]/5 rounded-xl h-8 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Añadir plazo
          </Button>
        )}
      </div>

      <CalendarioGrid
        mesActual={mesActual}
        onMesChange={setMesActual}
        diasConDatos={diasConDatos}
        plazos={plazos}
        onDiaClick={setDiaSeleccionado}
        diaSeleccionado={diaSeleccionado}
      />

      <LeyendaPlazos plazos={plazosReales} onEliminar={handleEliminarPlazo} />

      <DiaDrawer dia={diaSeleccionado} onClose={() => setDiaSeleccionado(null)} onUpdate={cargarDatos} />

      <AnadirPlazoDialog open={plazoDialogOpen} onOpenChange={setPlazoDialogOpen} onCrear={handleCrearPlazo} />
    </div>
  );
}