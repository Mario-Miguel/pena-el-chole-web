import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "../auth/AuthContext";

// Fases de la carroza con colores fijos
const FASES = [
  { value: "planteamiento", label: "Planteamiento de Obra y Carroza", color: "#7c3aed", emoji: "📐" },
  { value: "estructura",    label: "Estructura",                      color: "#b45309", emoji: "🏗️" },
  { value: "pintura",       label: "Pintura",                         color: "#0891b2", emoji: "🎨" },
  { value: "suelo",         label: "Suelo",                           color: "#059669", emoji: "🪵" },
  { value: "acabados",      label: "Acabados",                        color: "#db2777", emoji: "✨" },
  { value: "enramar",       label: "Enramar",                         color: "#65a30d", emoji: "🌿" },
  { value: "ensayo",        label: "Ensayo",                          color: "#d97706", emoji: "🎭" },
];

const FASE_MAP = Object.fromEntries(FASES.map(f => [f.value, f]));

// Genera los meses que hay que mostrar (de la primera a la última fecha)
function getMesesRango(plazos) {
  if (plazos.length === 0) {
    const hoy = new Date();
    return [new Date(hoy.getFullYear(), hoy.getMonth(), 1)];
  }
  const fechas = plazos.flatMap(p => [parseISO(p.fecha_inicio + "T12:00:00"), parseISO(p.fecha_fin + "T12:00:00")]);
  const min = new Date(Math.min(...fechas));
  const max = new Date(Math.max(...fechas));
  const meses = [];
  let cur = new Date(min.getFullYear(), min.getMonth(), 1);
  const end = new Date(max.getFullYear(), max.getMonth(), 1);
  while (cur <= end) {
    meses.push(new Date(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return meses;
}

function DiaCelda({ dia, plazos, esHoy }) {
  const fasesActivas = plazos.filter(p => {
    const inicio = parseISO(p.fecha_inicio + "T12:00:00");
    const fin = parseISO(p.fecha_fin + "T12:00:00");
    return isWithinInterval(dia, { start: inicio, end: fin });
  });

  const n = fasesActivas.length;

  return (
    <div
      className={`relative rounded-lg overflow-hidden min-h-[2.8rem] flex flex-col ${esHoy ? "ring-2 ring-[#630027] ring-inset z-10" : ""}`}
    >
      {/* Fondo dividido en franjas verticales */}
      {n > 0 && (
        <div className="absolute inset-0 flex">
          {fasesActivas.map((p, idx) => (
            <div
              key={p.id}
              className="h-full flex-1"
              style={{ backgroundColor: (FASE_MAP[p.categoria]?.color || "#6b7280") + "33" }}
            />
          ))}
        </div>
      )}
      {/* Número del día */}
      <span className={`relative z-10 text-xs font-semibold leading-none pt-1 text-center w-full ${esHoy ? "text-[#630027]" : "text-gray-700"}`}>
        {dia.getDate()}
      </span>
      {/* Puntos de color */}
      {n > 0 && (
        <div className="relative z-10 flex justify-center gap-0.5 mt-auto pb-1 flex-wrap">
          {fasesActivas.map(p => (
            <div
              key={p.id}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: FASE_MAP[p.categoria]?.color || "#6b7280" }}
              title={FASE_MAP[p.categoria]?.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarioFases({ plazos }) {
  const meses = getMesesRango(plazos);
  const [mesIdx, setMesIdx] = useState(0);
  const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

  const mes = meses[mesIdx];
  const anio = mes.getFullYear();
  const mesNum = mes.getMonth();
  const primerDia = new Date(anio, mesNum, 1);
  const ultimoDia = new Date(anio, mesNum + 1, 0);
  let offsetInicio = primerDia.getDay() - 1;
  if (offsetInicio < 0) offsetInicio = 6;
  const dias = [];
  for (let i = 0; i < offsetInicio; i++) dias.push(null);
  for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(new Date(anio, mesNum, d));

  const hoyStr = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {/* Cabecera con navegación */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMesIdx(i => Math.max(0, i - 1))}
          disabled={mesIdx === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h3 className="font-bold text-gray-700 text-sm capitalize">
          {format(mes, "MMMM yyyy", { locale: es })}
        </h3>
        <button
          onClick={() => setMesIdx(i => Math.min(meses.length - 1, i + 1))}
          disabled={mesIdx === meses.length - 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>
      {/* Celdas */}
      <div className="grid grid-cols-7 gap-0.5">
        {dias.map((dia, i) => {
          if (!dia) return <div key={`empty-${i}`} className="min-h-[2.8rem]" />;
          const esHoy = format(dia, "yyyy-MM-dd") === hoyStr;
          return <DiaCelda key={i} dia={dia} plazos={plazos} esHoy={esHoy} />;
        })}
      </div>
      {/* Indicador de mes */}
      {meses.length > 1 && (
        <div className="flex justify-center gap-1 mt-3">
          {meses.map((_, i) => (
            <button
              key={i}
              onClick={() => setMesIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === mesIdx ? "bg-[#630027]" : "bg-gray-200"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DialogNuevoPlazo({ open, onOpenChange, onGuardar }) {
  const [fase, setFase] = useState("");
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [calAbierto, setCalAbierto] = useState(null); // "inicio" | "fin" | null
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!fase || !fechaInicio || !fechaFin) return;
    setGuardando(true);
    await onGuardar({
      titulo: FASE_MAP[fase].label,
      categoria: fase,
      fecha_inicio: format(fechaInicio, "yyyy-MM-dd"),
      fecha_fin: format(fechaFin, "yyyy-MM-dd"),
      color: FASE_MAP[fase].color,
    });
    setFase(""); setFechaInicio(null); setFechaFin(null); setCalAbierto(null);
    setGuardando(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm w-full overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-[#630027] font-black text-xl">Nueva fase</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Fase</Label>
            <Select value={fase} onValueChange={setFase}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="Elige una fase" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {FASES.map(f => (
                  <SelectItem key={f.value} value={f.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                      {f.emoji} {f.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha inicio */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Fecha inicio</Label>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-gray-200 text-sm font-normal h-10"
              onClick={() => setCalAbierto(calAbierto === "inicio" ? null : "inicio")}
            >
              <CalendarDays className="w-4 h-4 mr-2 text-gray-400" />
              {fechaInicio ? format(fechaInicio, "d MMM yyyy", { locale: es }) : "Seleccionar fecha"}
            </Button>
            {calAbierto === "inicio" && (
              <div className="mt-2 flex justify-center border border-gray-100 rounded-2xl overflow-hidden">
                <Calendar
                  mode="single"
                  selected={fechaInicio}
                  onSelect={d => { setFechaInicio(d); setCalAbierto(null); }}
                  weekStartsOn={1}
                  locale={es}
                  className="rounded-2xl"
                />
              </div>
            )}
          </div>

          {/* Fecha fin */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Fecha fin</Label>
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-gray-200 text-sm font-normal h-10"
              onClick={() => setCalAbierto(calAbierto === "fin" ? null : "fin")}
            >
              <CalendarDays className="w-4 h-4 mr-2 text-gray-400" />
              {fechaFin ? format(fechaFin, "d MMM yyyy", { locale: es }) : "Seleccionar fecha"}
            </Button>
            {calAbierto === "fin" && (
              <div className="mt-2 flex justify-center border border-gray-100 rounded-2xl overflow-hidden">
                <Calendar
                  mode="single"
                  selected={fechaFin}
                  onSelect={d => { setFechaFin(d); setCalAbierto(null); }}
                  weekStartsOn={1}
                  locale={es}
                  disabled={d => fechaInicio && d < fechaInicio}
                  className="rounded-2xl"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleGuardar}
            disabled={!fase || !fechaInicio || !fechaFin || guardando}
            className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl mt-2"
          >
            {guardando ? "Guardando..." : "Añadir fase"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PlazosContent() {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente" || sesion?.cargo === "secretario";
  const [plazos, setPlazos] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const cargar = useCallback(async () => {
    // Filtramos solo los plazos de fases de carroza (categorías de FASES)
    const fasesKeys = FASES.map(f => f.value);
    const data = await base44.entities.PlazoCalendario.list("fecha_inicio");
    setPlazos(data.filter(p => fasesKeys.includes(p.categoria)));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGuardar = async (data) => {
    await base44.entities.PlazoCalendario.create(data);
    cargar();
  };

  const handleEliminar = async (id) => {
    await base44.entities.PlazoCalendario.delete(id);
    cargar();
  };

  return (
    <div>
      {/* Leyenda de fases */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-700 text-sm">Fases de la carroza</h3>
          {puedeEditar && (
            <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1" /> Nueva fase
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {FASES.map(f => (
            <div key={f.value} className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
              {f.emoji} {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Lista de fases configuradas */}
      {plazos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 space-y-2">
          <h3 className="font-bold text-gray-700 text-sm mb-3">Fases programadas</h3>
          {FASES.map(fase => {
            const fasePlazos = plazos.filter(p => p.categoria === fase.value);
            if (fasePlazos.length === 0) return null;
            return fasePlazos.map(p => (
              <div key={p.id} className="flex items-center gap-3 group">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: fase.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{fase.emoji} {fase.label}</p>
                  <p className="text-xs text-gray-400">
                    {format(parseISO(p.fecha_inicio + "T12:00:00"), "d MMM", { locale: es })} — {format(parseISO(p.fecha_fin + "T12:00:00"), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
                {puedeEditar && (
                  <button
                    onClick={() => handleEliminar(p.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ));
          })}
        </div>
      )}

      {/* Calendario visual */}
      {plazos.length === 0 ? (
        <div className="text-center py-16 text-gray-300">
          <p className="text-4xl mb-2">📅</p>
          <p className="text-sm">Añade las fechas de cada fase para ver el calendario</p>
        </div>
      ) : (
        <CalendarioFases plazos={plazos} />
      )}

      <DialogNuevoPlazo open={dialogOpen} onOpenChange={setDialogOpen} onGuardar={handleGuardar} />
    </div>
  );
}