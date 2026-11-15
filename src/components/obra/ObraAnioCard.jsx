import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, Edit2, Check, X, ScrollText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ObraSeccion from "./ObraSeccion";
import GuionJurado from "./GuionJurado";
import { useAuth } from "../auth/AuthContext";
import { api } from "@/api/client";
import { Input } from "@/components/ui/input";

export default function ObraAnioCard({ obraAnio, onDelete }) {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(obraAnio.titulo || "");

  const handleGuardar = async () => {
    await api.entities.ObraAnio.update(obraAnio.id, { titulo: titulo.trim() || `Obra ${obraAnio.anio}` });
    setEditando(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        onClick={() => setAbierto(o => !o)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#630027]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[#630027] font-black text-sm">{obraAnio.anio}</span>
          </div>
          <div className="text-left flex-1 min-w-0">
            {editando ? (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <Input 
                  value={titulo} 
                  onChange={e => setTitulo(e.target.value)} 
                  className="rounded-xl border-gray-200 h-9 text-sm flex-1"
                  autoFocus
                  onKeyDown={e => { if (e.key === "Enter") handleGuardar(); if (e.key === "Escape") setEditando(false); }}
                />
                <button onClick={handleGuardar} className="p-1.5 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => { setEditando(false); setTitulo(obraAnio.titulo || ""); }} className="p-1.5 rounded-xl bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="font-bold text-gray-800 text-lg">{obraAnio.titulo || `Obra ${obraAnio.anio}`}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {puedeEditar && !editando && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setEditando(true); }}
                className="p-1.5 rounded-xl text-gray-300 hover:text-[#630027] hover:bg-[#630027]/5 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(obraAnio.id); }}
                className="p-1.5 rounded-xl text-gray-200 hover:text-red-400 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {abierto ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-gray-50 space-y-5">
              <ObraSeccion obraAnioId={obraAnio.id} seccion="planos" />
              <div className="border-t border-gray-100" />
              <ObraSeccion obraAnioId={obraAnio.id} seccion="memoria" />
              <div className="border-t border-gray-100" />
              <ObraSeccion obraAnioId={obraAnio.id} seccion="maqueta" />
              <div className="border-t border-gray-100" />
              <GuionJurado obraAnioId={obraAnio.id} obraAnio={obraAnio}
                titulo="Guión del jurado de valoración artística"
                descripcion="Criterios y guion para la valoración"
                campoTexto="guion_jurado"
                seccion="guion_jurado"
                placeholder="Escribe aquí el guión del jurado de valoración artística: criterios de evaluación, puntuaciones, aspectos a valorar (originalidad, ejecución técnica, acabados, iluminación, movimiento...)"
              />
              <div className="border-t border-gray-100" />
              <GuionJurado obraAnioId={obraAnio.id} obraAnio={obraAnio}
                titulo="Guión jurado general pre-desfile"
                descripcion="Guion general del jurado antes del desfile"
                campoTexto="guion_jurado_general"
                seccion="guion_jurado_general"
                placeholder="Escribe aquí el guión del jurado general pre-desfile: aspectos generales, normativa, criterios comunes, calendario de valoración..."
                icon={ScrollText}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}