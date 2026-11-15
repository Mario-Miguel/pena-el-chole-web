import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const CATEGORIA_COLORES = {
  obra: "#b45309",
  compras: "#0891b2",
  eventos: "#7c3aed",
  reunion: "#059669",
  limpieza: "#db2777",
  mantenimiento: "#d97706",
  otro: "#6b7280",
};

export default function CalendarioGrid({ mesActual, onMesChange, diasConDatos, plazos, actividades, tareas, onDiaClick, diaSeleccionado }) {
  const primerDia = startOfMonth(mesActual);
  const ultimoDia = endOfMonth(mesActual);
  const inicioGrid = startOfWeek(primerDia, { weekStartsOn: 1 });
  const finGrid = endOfWeek(ultimoDia, { weekStartsOn: 1 });
  const dias = eachDayOfInterval({ start: inicioGrid, end: finGrid });

  const plazosDelMes = useMemo(() => {
    return (plazos || []).filter(p => {
      const ini = new Date(p.fecha_inicio);
      const fin = new Date(p.fecha_fin);
      return ini <= ultimoDia && fin >= primerDia;
    });
  }, [plazos, primerDia, ultimoDia]);

  const getPlazosParaDia = (dia) => {
    const fechaStr = format(dia, "yyyy-MM-dd");
    return plazosDelMes.filter(p => {
      return fechaStr >= p.fecha_inicio && fechaStr <= p.fecha_fin;
    });
  };

  const getActividadesParaDia = (dia) => {
    const fechaStr = format(dia, "yyyy-MM-dd");
    return (actividades || []).filter(a => {
      if (!a.fecha) return false;
      return format(new Date(a.fecha), "yyyy-MM-dd") === fechaStr;
    });
  };

  const getTareasParaDia = (dia) => {
    const fechaStr = format(dia, "yyyy-MM-dd");
    return (tareas || []).filter(t => t.fecha_limite === fechaStr);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header mes */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <button onClick={() => onMesChange(subMonths(mesActual, 1))} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h2 className="text-lg font-bold text-gray-800 capitalize">
          {format(mesActual, "MMMM yyyy", { locale: es })}
        </h2>
        <button onClick={() => onMesChange(addMonths(mesActual, 1))} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Cabecera días semana */}
      <div className="grid grid-cols-7 border-b border-gray-50">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid días */}
      <div className="grid grid-cols-7">
        {dias.map((dia, idx) => {
          const esMes = isSameMonth(dia, mesActual);
          const esHoy = isToday(dia);
          const esSeleccionado = diaSeleccionado && isSameDay(dia, diaSeleccionado);
          const fechaStr = format(dia, "yyyy-MM-dd");
          const tieneDatos = diasConDatos.has(fechaStr);
          const plazosHoy = getPlazosParaDia(dia);
          const actividadesHoy = getActividadesParaDia(dia);
          const tareasHoy = getTareasParaDia(dia);

          return (
            <button
              key={idx}
              onClick={() => esMes && onDiaClick(dia)}
              disabled={!esMes}
              className={`
                relative min-h-[60px] sm:min-h-[72px] p-1 border-b border-r border-gray-50 flex flex-col items-center transition-all
                ${!esMes ? "bg-gray-50/50 cursor-default" : "hover:bg-[#630027]/5 cursor-pointer"}
                ${esSeleccionado ? "bg-[#630027]/10 ring-2 ring-inset ring-[#630027]/30" : ""}
              `}
            >
              <span className={`
                w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mt-1
                ${!esMes ? "text-gray-300" : esHoy ? "bg-[#630027] text-white" : esSeleccionado ? "text-[#630027]" : "text-gray-700"}
              `}>
                {format(dia, "d")}
              </span>

              {/* Indicadores de plazos */}
              <div className="flex flex-col w-full px-0.5 gap-0.5 mt-1">
                {plazosHoy.slice(0, 2).map(p => (
                  <div
                    key={p.id}
                    className="h-1.5 rounded-full w-full opacity-80"
                    style={{ backgroundColor: CATEGORIA_COLORES[p.categoria] || "#6b7280" }}
                    title={p.titulo}
                  />
                ))}
              </div>

              {/* Indicadores de actividades y tareas */}
              {esMes && (actividadesHoy.length > 0 || tareasHoy.length > 0) && (
                <div className="flex gap-0.5 mt-0.5 justify-center">
                  {actividadesHoy.length > 0 && (
                    <div className="w-2 h-2 rounded-full bg-purple-500" title={`${actividadesHoy.length} actividad(es)`} />
                  )}
                  {tareasHoy.length > 0 && (
                    <div className="w-2 h-2 rounded-full bg-red-500" title={`${tareasHoy.length} tarea(s) vencen`} />
                  )}
                </div>
              )}

              {/* Punto fotos/notas */}
              {tieneDatos && esMes && (
                <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#630027]/60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}