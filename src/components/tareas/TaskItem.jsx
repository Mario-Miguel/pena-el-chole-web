import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const CATEGORIA_LABELS = {
  estructural: "Estructural",
  soldadura: "Soldadura",
  pintura: "Pintura",
  decoracion: "Decoración",
  enramado: "Enramado",
  acabados: "Acabados",
  preparacion_materiales: "Prep. materiales",
  otros: "Otros",
};

const CATEGORIA_COLORS = {
  estructural: "bg-slate-100 text-slate-600",
  soldadura: "bg-orange-100 text-orange-700",
  pintura: "bg-blue-100 text-blue-700",
  decoracion: "bg-pink-100 text-pink-700",
  enramado: "bg-green-100 text-green-700",
  acabados: "bg-purple-100 text-purple-700",
  preparacion_materiales: "bg-yellow-100 text-yellow-700",
  otros: "bg-gray-100 text-gray-600",
};

export default function TaskItem({ tarea, onToggle, onClick }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3 group cursor-pointer hover:border-[#630027]/20 hover:shadow-md transition-all"
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          tarea.completada
            ? "bg-[#630027] border-[#630027]"
            : "border-gray-300 hover:border-[#630027]/50"
        }`}
      >
        {tarea.completada && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={onClick}>
        <p className={`font-semibold text-sm truncate ${tarea.completada ? "line-through text-gray-400" : "text-gray-800"}`}>
          {tarea.nombre}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {tarea.categoria && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORIA_COLORS[tarea.categoria]}`}>
              {CATEGORIA_LABELS[tarea.categoria]}
            </span>
          )}
          {tarea.descripcion && (
            <span className="text-xs text-gray-400 truncate max-w-[160px]">{tarea.descripcion}</span>
          )}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#630027]/40 flex-shrink-0 transition-colors" onClick={onClick} />
    </motion.div>
  );
}