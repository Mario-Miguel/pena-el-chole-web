import React from "react";
import { Wrench, AlertTriangle, Clock } from "lucide-react";
import { differenceInDays, addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

function getEstadoMantenimiento(item) {
  if (!item.frecuencia_revision || item.frecuencia_revision <= 0) return null;
  const hoy = new Date();
  let proximaFecha;
  if (item.ultimo_mantenimiento) {
    const ultimo = parseISO(item.ultimo_mantenimiento);
    proximaFecha = addDays(ultimo, item.frecuencia_revision);
  } else {
    // Sin mantenimiento previo → ya está vencido
    return { estado: "vencido", diasRestantes: -999, proximaFecha: null };
  }
  const dias = differenceInDays(proximaFecha, hoy);
  if (dias < 0) return { estado: "vencido", diasRestantes: dias, proximaFecha };
  if (dias <= 7) return { estado: "proximo", diasRestantes: dias, proximaFecha };
  return { estado: "ok", diasRestantes: dias, proximaFecha };
}

export { getEstadoMantenimiento };

export default function MantenimientoPanel({ items, onAbrirDetalle }) {
  const alertas = items
    .map(item => ({ item, info: getEstadoMantenimiento(item) }))
    .filter(({ info }) => info && (info.estado === "vencido" || info.estado === "proximo"))
    .sort((a, b) => (a.info.diasRestantes - b.info.diasRestantes));

  if (alertas.length === 0) return null;

  const vencidos = alertas.filter(a => a.info.estado === "vencido");
  const proximos = alertas.filter(a => a.info.estado === "proximo");

  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="w-5 h-5 text-red-500 flex-shrink-0" />
        <h2 className="font-bold text-red-700 text-sm">
          Mantenimiento — {alertas.length} artículo{alertas.length !== 1 ? "s" : ""}
        </h2>
      </div>
      <div className="space-y-2">
        {alertas.map(({ item, info }) => {
          const imagenDisplay = item.miniatura_url || item.imagen_urls?.[0] || item.imagen_url || null;
          const esVencido = info.estado === "vencido";
          return (
            <div
              key={item.id}
              onClick={() => onAbrirDetalle?.(item)}
              className={`flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border cursor-pointer transition-colors hover:bg-red-50/50 ${
                esVencido ? "border-red-200" : "border-orange-200"
              }`}
            >
              {imagenDisplay ? (
                <img src={imagenDisplay} alt={item.nombre} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${esVencido ? "bg-red-100" : "bg-orange-100"}`}>
                  <Wrench className={`w-4 h-4 ${esVencido ? "text-red-400" : "text-orange-400"}`} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{item.nombre}</p>
                <p className={`text-xs font-medium ${esVencido ? "text-red-600" : "text-orange-500"}`}>
                  {esVencido
                    ? info.diasRestantes === -999
                      ? "Sin mantenimiento registrado"
                      : `Vencido hace ${Math.abs(info.diasRestantes)} días`
                    : `Vence en ${info.diasRestantes} día${info.diasRestantes !== 1 ? "s" : ""}`
                  }
                </p>
                {info.proximaFecha && (
                  <p className="text-xs text-gray-400">
                    Revisión: {format(info.proximaFecha, "d MMM yyyy", { locale: es })}
                  </p>
                )}
              </div>
              {esVencido
                ? <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                : <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}