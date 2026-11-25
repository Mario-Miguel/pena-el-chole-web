import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Eraser } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


function BeerRow({
  integrante, precioCerveza, onRemove, onClear, avatarUrl,
  tiposCerveza = [], ultimoTipo = null,
  pendingTipos = [], onAddPending, onRemovePending, onClearPending,
  destacada = false
}) {
  const [showTipoDialog, setShowTipoDialog] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");

  const pendingCount = pendingTipos.length;
  const displayedCount = (integrante.cervezas || 0) + pendingCount;

  const handleAdd = () => {
    if (tiposCerveza.length > 0) {
      setTipoSeleccionado(ultimoTipo || tiposCerveza[0] || "");
      setShowTipoDialog("add");
    } else {
      onAddPending(null);
    }
  };

  const handleAddTipo = (tipo) => {
    onAddPending(tipo);
  };

  const handleRemove = () => {
    if (displayedCount <= 0) return;
    if (pendingCount > 0) {
      onRemovePending();
    } else {
      onRemove(ultimoTipo || null);
    }
  };

  const handleClear = () => {
    if (pendingCount > 0) onClearPending();
    else if ((integrante.cervezas || 0) > 0) onClear();
  };

  const total = displayedCount * precioCerveza;

  return (
    <motion.div
      layout
      whileHover={{ y: -1, boxShadow: "0 4px 16px rgba(99,0,39,0.08)" }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`bg-white rounded-xl border shadow-sm px-4 py-3 relative ${destacada ? "border-[#630027]/30 ring-1 ring-[#630027]/10" : "border-gray-100"}`}
    >
      {pendingCount > 0 && (
        <div className="absolute -top-2 -right-2 z-10 bg-amber-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
          +{pendingCount}
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#630027]/10 flex items-center justify-center text-[#630027] font-bold text-sm flex-shrink-0 overflow-hidden">
          {avatarUrl
            ? <img src={avatarUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
            : integrante.nombre[0].toUpperCase()
          }
        </div>
        <span className="font-semibold text-gray-800 flex-1 truncate text-sm sm:text-base">
          {integrante.nombre}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRemove}
            className="h-8 w-8 rounded-full border-gray-200 text-gray-500 hover:border-[#630027]/30 hover:text-[#630027]"
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>

          <span className="w-8 text-center font-bold text-gray-800 tabular-nums text-sm select-none">
            {displayedCount}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={handleAdd}
            className="h-8 w-8 rounded-full border-[#630027]/30 text-[#630027] hover:bg-[#630027]/5"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            title="Limpiar cervezas"
            className="h-8 w-8 rounded-full text-gray-300 hover:text-amber-500 hover:bg-amber-50 ml-1"
          >
            <Eraser className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {displayedCount > 0 && (
        <div className="mt-2 ml-12 text-xs text-gray-400">
          <span className="font-medium text-gray-500">{displayedCount} cerv.</span>
          {" × "}
          <span>{precioCerveza.toFixed(2).replace(".", ",")}€/cerv.</span>
          {" = "}
          <span className="font-bold text-[#630027] text-sm">{total.toFixed(2).replace(".", ",")}€</span>
          {pendingCount > 0 && (
            <span className="ml-2 text-amber-500 font-medium">({pendingCount} pend.)</span>
          )}
        </div>
      )}

      <AnimatePresence>
        {showTipoDialog && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="mt-3 p-3 bg-[#630027]/5 border border-[#630027]/20 rounded-xl space-y-2"
          >
            <p className="text-xs font-semibold text-[#630027]">Toca para añadir cervezas 🍺</p>
            <div className="flex flex-wrap gap-2">
              {tiposCerveza.map(t => (
                <button
                  key={t}
                  onClick={() => handleAddTipo(t)}
                  className="px-3 py-2 rounded-xl bg-white border border-[#630027]/20 text-sm font-medium text-[#630027] hover:bg-[#630027] hover:text-white transition-colors active:scale-95"
                >
                  + {t}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTipoDialog(false)}
              className="rounded-xl w-full text-gray-500 hover:text-[#630027]"
            >
              Cerrar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default React.memo(BeerRow);