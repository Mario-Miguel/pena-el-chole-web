import React from "react";
import { format, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin, Users, Euro, Calendar, Trash2, Edit2, UserPlus, UserMinus } from "lucide-react";
import { motion } from "framer-motion";

const CAT_CONFIG = {
  excursion:     { emoji: "🥾", label: "Excursión",      color: "bg-green-100 text-green-700" },
  comida:        { emoji: "🍽️", label: "Comida",         color: "bg-amber-100 text-amber-700" },
  deporte:       { emoji: "⚽", label: "Deporte",        color: "bg-blue-100 text-blue-700" },
  cultural:      { emoji: "🎭", label: "Cultural",       color: "bg-purple-100 text-purple-700" },
  reunion_social:{ emoji: "🥂", label: "Reunión social", color: "bg-pink-100 text-pink-700" },
  otro:          { emoji: "📌", label: "Otro",           color: "bg-gray-100 text-gray-600" },
};

const ESTADO_CONFIG = {
  programada: { label: "Programada", color: "bg-blue-50 text-blue-600 border-blue-200" },
  en_curso:   { label: "En curso",   color: "bg-green-50 text-green-700 border-green-200" },
  finalizada: { label: "Finalizada", color: "bg-gray-50 text-gray-500 border-gray-200" },
  cancelada:  { label: "Cancelada",  color: "bg-red-50 text-red-500 border-red-200" },
};

export default function ActividadCard({ actividad, usuarioId, puedeGestionar, onEdit, onDelete, onToggleInscripcion }) {
  const cat = CAT_CONFIG[actividad.categoria] || CAT_CONFIG.otro;
  const estado = ESTADO_CONFIG[actividad.estado] || ESTADO_CONFIG.programada;
  const inscritos = actividad.inscritos_ids || [];
  const estaInscrito = inscritos.includes(usuarioId);
  const aforo = actividad.aforo_maximo || 0;
  const lleno = aforo > 0 && inscritos.length >= aforo;
  const pasado = actividad.estado === "finalizada" || actividad.estado === "cancelada";
  const fechaObj = actividad.fecha ? new Date(actividad.fecha) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${pasado ? "opacity-60" : "border-gray-100"}`}
    >
      {actividad.imagen_url && (
        <div className="h-36 overflow-hidden">
          <img src={actividad.imagen_url} alt={actividad.titulo} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${estado.color}`}>{estado.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.emoji} {cat.label}</span>
            </div>
            <h3 className="font-bold text-gray-800 text-base leading-tight">{actividad.titulo}</h3>
          </div>
          {puedeGestionar && !pasado && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onEdit(actividad)} className="p-1.5 rounded-lg text-gray-300 hover:text-[#630027] hover:bg-[#630027]/5 transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(actividad)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {actividad.descripcion && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{actividad.descripcion}</p>
        )}

        {/* Detalles */}
        <div className="space-y-1 mb-3">
          {fechaObj && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-[#630027]" />
              <span>{format(fechaObj, "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })}</span>
            </div>
          )}
          {actividad.lugar && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#630027]" />
              <span>{actividad.lugar}</span>
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#630027]" />
              {inscritos.length}{aforo > 0 ? `/${aforo}` : ""} inscritos
            </span>
            {actividad.precio > 0 && (
              <span className="flex items-center gap-1">
                <Euro className="w-3.5 h-3.5 text-[#630027]" />
                {actividad.precio.toFixed(2)}€/persona
              </span>
            )}
            {actividad.precio === 0 && <span className="text-green-600 font-semibold">Gratis</span>}
          </div>
        </div>

        {/* Botón inscripción */}
        {!pasado && usuarioId && (
          <button
            onClick={() => onToggleInscripcion(actividad)}
            disabled={lleno && !estaInscrito}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
              estaInscrito
                ? "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                : lleno
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#630027] text-white hover:bg-[#4a001d]"
            }`}
          >
            {estaInscrito
              ? <><UserMinus className="w-4 h-4" /> Cancelar inscripción</>
              : lleno
              ? "Aforo completo"
              : <><UserPlus className="w-4 h-4" /> Inscribirme</>
            }
          </button>
        )}
      </div>
    </motion.div>
  );
}