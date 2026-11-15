import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function VotacionCard({ votacion, onComplete, onEliminar, onRepetir, esPresidente, usuarioId }) {
  const [votos, setVotos] = useState([]);
  const [, forceUpdate] = useState(0);
  const storageKey = `voto_${votacion.id}_${usuarioId || "anon"}`;
  const miVoto = usuarioId ? localStorage.getItem(storageKey) : null;
  const hasVoted = !!miVoto;

  useEffect(() => {
    api.entities.VotoRespuesta.filter({ votacion_id: votacion.id }).then(setVotos);
  }, [votacion.id]);

  const totalVotos = votos.length;

  const handleVotar = async (opcion) => {
    if (hasVoted || !usuarioId || votacion.completada) return;
    localStorage.setItem(storageKey, opcion);
    forceUpdate(n => n + 1);
    await api.entities.VotoRespuesta.create({ votacion_id: votacion.id, opcion, integrante_id: usuarioId });
    const actualizados = await api.entities.VotoRespuesta.filter({ votacion_id: votacion.id });
    setVotos(actualizados);
  };

  const getCount = (opcion) => votos.filter(v => v.opcion === opcion).length;
  const getPct = (opcion) => totalVotos === 0 ? 0 : Math.round((getCount(opcion) / totalVotos) * 100);

  const noHayUsuario = !usuarioId;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-bold text-gray-800">{votacion.tema}</h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {votacion.completada && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Completada</span>
          )}
        </div>
      </div>
      {votacion.descripcion && <p className="text-sm text-gray-400 mb-4">{votacion.descripcion}</p>}

      {noHayUsuario && !votacion.completada && (
        <div className="mb-3 text-xs text-amber-500 bg-amber-50 rounded-xl px-3 py-2">
          Solo los socios pueden votar

        </div>
      )}

      <div className="space-y-2">
        {(votacion.opciones || []).map(opcion => {
          const pct = getPct(opcion);
          const count = getCount(opcion);
          const esGanador = votacion.completada && count === Math.max(...(votacion.opciones || []).map(o => getCount(o)));
          return (
            <div key={opcion}>
              {!hasVoted && !votacion.completada && !noHayUsuario ? (
                <button
                  onClick={() => handleVotar(opcion)}
                  className="w-full text-left px-4 py-2.5 rounded-xl border-2 border-gray-100 hover:border-[#630027]/30 hover:bg-[#630027]/5 transition-all text-sm font-medium text-gray-700"
                >
                  {opcion}
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-100">
                  <div
                    className={`absolute inset-0 transition-all duration-700 ${esGanador ? "bg-[#630027]/15" : "bg-gray-50"}`}
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between px-4 py-2.5">
                    <span className={`text-sm font-medium ${esGanador ? "text-[#630027] font-bold" : "text-gray-700"}`}>
                      {opcion} {miVoto === opcion && <span className="text-xs text-gray-400">(tu voto)</span>}
                    </span>
                    <span className={`text-sm font-bold flex-shrink-0 ${esGanador ? "text-[#630027]" : "text-gray-400"}`}>
                      {pct}% <span className="text-xs font-normal text-gray-300">({count})</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 flex-wrap gap-2">
        <span className="text-xs text-gray-300">{totalVotos} {totalVotos === 1 ? "voto" : "votos"}</span>
        <div className="flex items-center gap-1.5">
          {/* Acciones presidenciales */}
          {esPresidente && (
            <>
              {votacion.completada && (
                <Button size="sm" variant="ghost" onClick={() => onRepetir(votacion)} className="text-xs text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl h-7">
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Repetir
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => onEliminar(votacion.id)} className="text-xs text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl h-7">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
              </Button>
            </>
          )}
          {!votacion.completada && esPresidente && (
            <Button size="sm" variant="ghost" onClick={() => onComplete(votacion.id)} className="text-xs text-gray-400 hover:text-[#630027] rounded-xl h-7">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Cerrar
            </Button>
          )}
          {!votacion.completada && !esPresidente && (
            <span className="text-xs text-gray-300">Votación activa</span>
          )}
          {votacion.completada && votacion.fecha_completada && !esPresidente && (
            <span className="text-xs text-gray-300">Cerrada el {format(new Date(votacion.fecha_completada), "d MMM yyyy", { locale: es })}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}