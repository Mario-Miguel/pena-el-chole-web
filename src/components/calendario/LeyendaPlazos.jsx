import React from "react";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CATEGORIAS = {
  obra: { label: "Obra", color: "#b45309" },
  compras: { label: "Compras", color: "#0891b2" },
  eventos: { label: "Eventos", color: "#7c3aed" },
  reunion: { label: "Reunión", color: "#059669" },
  limpieza: { label: "Limpieza", color: "#db2777" },
  mantenimiento: { label: "Mantenimiento", color: "#d97706" },
  otro: { label: "Otro", color: "#6b7280" },
};

export default function LeyendaPlazos({ plazos, onEliminar }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-bold text-gray-800 text-sm mb-4">Plazos y planificación</h3>

      {/* Leyenda categorías */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(CATEGORIAS).map(([key, { label, color }]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Lista de plazos */}
      {plazos.length === 0 ? (
        <p className="text-xs text-gray-300 text-center py-3">No hay plazos añadidos</p>
      ) : (
        <div className="space-y-2">
          {plazos.map(p => {
            const cat = CATEGORIAS[p.categoria];
            return (
              <div key={p.id} className="flex items-center gap-3 group">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.color || "#6b7280" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{p.titulo}</p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(p.fecha_inicio + "T12:00:00"), "d MMM", { locale: es })} — {format(new Date(p.fecha_fin + "T12:00:00"), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
                <button
                  onClick={() => onEliminar(p.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}