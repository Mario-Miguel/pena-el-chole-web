import React, { useState } from "react";
import { api } from "@/api/client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, Settings, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ConfigCuentaAtras({ cuentaAtras, onGuardar, onEliminar }) {
  const [open, setOpen] = useState(false);
  const [nombreEvento, setNombreEvento] = useState(cuentaAtras?.nombre_evento || "");
  const [fecha, setFecha] = useState(cuentaAtras?.fecha_objetivo ? new Date(cuentaAtras.fecha_objetivo) : null);
  const [guardando, setGuardando] = useState(false);

  const handleOpen = () => {
    setNombreEvento(cuentaAtras?.nombre_evento || "");
    setFecha(cuentaAtras?.fecha_objetivo ? new Date(cuentaAtras.fecha_objetivo) : null);
    setOpen(true);
  };

  const handleGuardar = async () => {
    if (!fecha) return;
    setGuardando(true);
    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);
    await onGuardar({ nombre_evento: nombreEvento, fecha_objetivo: endOfDay.toISOString() });
    setGuardando(false);
    setOpen(false);
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        className="border-[#630027]/20 text-[#630027] hover:bg-[#630027]/5 rounded-xl px-4 h-9 text-sm"
      >
        <Settings className="w-4 h-4 mr-2" />
        Configurar
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-[#630027] text-xl">Configurar cuenta atrás</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Nombre del evento (opcional)
                </Label>
                <Input
                  value={nombreEvento}
                  onChange={e => setNombreEvento(e.target.value)}
                  placeholder="Ej: Feria de Sevilla 2025"
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Fecha objetivo
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start rounded-xl border-gray-200 font-normal">
                      <CalendarDays className="w-4 h-4 mr-2 text-[#630027]/60" />
                      {fecha ? format(fecha, "d 'de' MMMM, yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-0" align="center">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={setFecha}
                      weekStartsOn={1}
                      locale={es}
                      className="rounded-2xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleGuardar}
                  disabled={!fecha || guardando}
                  className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl"
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </Button>
                {cuentaAtras && (
                  <Button
                    onClick={() => { onEliminar(); setOpen(false); }}
                    variant="outline"
                    className="border-red-200 text-red-400 hover:bg-red-50 rounded-xl"
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}