import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Beer } from "lucide-react";

export default function GuardarPendientes({ totalPendientes, precio, saving, onGuardar }) {
  return (
    <AnimatePresence>
      {totalPendientes > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 left-0 right-0 z-30 px-4"
        >
          <div className="max-w-2xl mx-auto bg-[#630027] rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-white">
              <div className="flex items-center gap-1.5">
                <Beer className="w-4 h-4" />
                <span className="font-bold text-lg">{totalPendientes}</span>
                <span className="text-sm text-white/70">pendiente{totalPendientes !== 1 ? "s" : ""}</span>
              </div>
              <p className="text-xs text-white/60">{(totalPendientes * precio).toFixed(2).replace(".", ",")}€ sin guardar</p>
            </div>
            <button
              onClick={onGuardar}
              disabled={saving}
              className="flex items-center gap-2 bg-white text-[#630027] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-60"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-[#630027]/30 border-t-[#630027] rounded-full animate-spin" /> Guardando...</>
              ) : (
                <><Save className="w-4 h-4" /> Guardar</>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}