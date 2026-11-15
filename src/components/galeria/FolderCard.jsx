import React from "react";
import { FolderOpen, Trash2, Image } from "lucide-react";
import { motion } from "framer-motion";

export default function FolderCard({ carpeta, mediaCount, onClick, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white hover:shadow-lg transition-all"
      onClick={onClick}
    >
      {/* Miniatura */}
      <div className="aspect-video bg-gradient-to-br from-[#630027]/10 to-[#630027]/5 relative overflow-hidden">
        {carpeta.miniatura_url ? (
          <img
            src={carpeta.miniatura_url}
            alt={carpeta.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="w-12 h-12 text-[#630027]/20" />
          </div>
        )}
        {/* Overlay delete */}
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 text-red-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info */}
      <div className="px-4 py-3">
        <p className="font-bold text-gray-800 truncate">{carpeta.nombre}</p>
        <div className="flex items-center justify-between mt-0.5 gap-1">
          <div className="flex flex-col min-w-0">
            {carpeta.anio && <span className="text-xs text-[#630027]/60 font-medium">{carpeta.anio}</span>}
            {carpeta.created_date && (
              <span className="text-[10px] text-gray-300">
                {new Date(carpeta.created_date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
            <Image className="w-3 h-3" />
            {mediaCount}
          </span>
        </div>
      </div>
    </motion.div>
  );
}