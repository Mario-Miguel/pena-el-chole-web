import React, { useState, useEffect, useRef } from "react";
import { api } from "@/api/client";
import { X, Camera, StickyNote, Trash2, Upload, Download, Calendar, Flag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "../auth/AuthContext";

export default function DiaDrawer({ dia, onClose, onUpdate, actividades = [], tareas = [] }) {
  const { sesion } = useAuth();
  const puedeEditar = !!sesion; // Cualquier usuario autenticado puede añadir fotos y notas
  const [diaData, setDiaData] = useState(null);
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const fileInputRef = useRef();

  const fechaStr = dia ? format(dia, "yyyy-MM-dd") : null;

  const actividadesDelDia = actividades.filter(a => {
    if (!a.fecha || !fechaStr) return false;
    return format(new Date(a.fecha), "yyyy-MM-dd") === fechaStr;
  });

  const tareasDelDia = tareas.filter(t => t.fecha_limite === fechaStr);

  useEffect(() => {
    if (!fechaStr) return;
    api.entities.DiaCalendario.filter({ fecha: fechaStr }).then(results => {
      if (results.length > 0) {
        setDiaData(results[0]);
        setNotas(results[0].notas || "");
      } else {
        setDiaData(null);
        setNotas("");
      }
    });
  }, [fechaStr]);

  const guardarNotas = async () => {
    setGuardando(true);
    if (diaData) {
      const updated = await api.entities.DiaCalendario.update(diaData.id, { notas });
      setDiaData(updated);
    } else {
      const created = await api.entities.DiaCalendario.create({ fecha: fechaStr, notas, fotos: [] });
      setDiaData(created);
    }
    setGuardando(false);
    onUpdate();
  };

  const subirFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendo(true);
    const { file_url } = await api.uploadFile({ file });
    let fotosActuales = diaData?.fotos || [];
    fotosActuales = [...fotosActuales, file_url];
    if (diaData) {
      const updated = await api.entities.DiaCalendario.update(diaData.id, { fotos: fotosActuales });
      setDiaData(updated);
    } else {
      const created = await api.entities.DiaCalendario.create({ fecha: fechaStr, notas, fotos: fotosActuales });
      setDiaData(created);
    }
    setSubiendo(false);
    onUpdate();
    e.target.value = "";
  };

  const eliminarFoto = async (url) => {
    const fotosActuales = (diaData?.fotos || []).filter(f => f !== url);
    const updated = await api.entities.DiaCalendario.update(diaData.id, { fotos: fotosActuales });
    setDiaData(updated);
    onUpdate();
  };

  return (
    <AnimatePresence>
      {dia && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                  {dia && format(dia, "EEEE", { locale: es })}
                </p>
                <h2 className="text-2xl font-black text-[#630027] capitalize">
                  {dia && format(dia, "d 'de' MMMM", { locale: es })}
                </h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Actividades del día */}
              {actividadesDelDia.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <h3 className="font-bold text-gray-800 text-sm">Actividades</h3>
                  </div>
                  <div className="space-y-2">
                    {actividadesDelDia.map(a => (
                      <div key={a.id} className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-gray-800 text-sm">{a.titulo}</p>
                          {a.lugar && <span className="text-xs text-gray-500 whitespace-nowrap">📍 {a.lugar}</span>}
                        </div>
                        {a.descripcion && <p className="text-xs text-gray-500 mt-1">{a.descripcion}</p>}
                        {a.fecha && (
                          <p className="text-xs text-purple-600 mt-1 font-medium">
                            🕐 {format(new Date(a.fecha), "HH:mm")}h
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tareas con fecha límite */}
              {tareasDelDia.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Flag className="w-4 h-4 text-red-500" />
                    <h3 className="font-bold text-gray-800 text-sm">Tareas que vencen hoy</h3>
                  </div>
                  <div className="space-y-2">
                    {tareasDelDia.map(t => (
                      <div key={t.id} className="bg-red-50 rounded-xl p-3 border border-red-100">
                        <p className="font-semibold text-gray-800 text-sm">{t.descripcion}</p>
                        {t.integrante_nombre && (
                          <p className="text-xs text-gray-500 mt-1">👤 {t.integrante_nombre}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            t.estado === "completada" ? "bg-green-100 text-green-700" :
                            t.estado === "en_progreso" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {t.estado === "completada" ? "Completada" : t.estado === "en_progreso" ? "En progreso" : "Pendiente"}
                          </span>
                          {t.acta_fecha && <span className="text-xs text-gray-400">Acta: {t.acta_fecha}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fotos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#630027]" />
                    <h3 className="font-bold text-gray-800 text-sm">Fotos del día</h3>
                  </div>
                  {puedeEditar && <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={subiendo}
                    className="text-xs border-[#630027]/20 text-[#630027] hover:bg-[#630027]/5 rounded-xl h-8"
                  >
                    {subiendo ? (
                      <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-[#630027]/30 border-t-[#630027] rounded-full animate-spin" /> Subiendo...</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Añadir foto</span>
                      )}
                      </Button>}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={subirFoto} />
                </div>

                {(!diaData?.fotos || diaData.fotos.length === 0) ? (
                  puedeEditar ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer hover:border-[#630027]/30 hover:bg-[#630027]/5 transition-all"
                    >
                      <Camera className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-300">Pulsa para añadir fotos</p>
                    </div>
                  ) : <p className="text-xs text-gray-300 italic">Sin fotos</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {diaData.fotos.map((url, i) => (
                      <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer" onClick={() => window.open(url, "_blank")}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {puedeEditar && (
                          <button
                            onClick={e => { e.stopPropagation(); eliminarFoto(url); }}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        )}
                        <a
                          href={url}
                          download
                          onClick={e => e.stopPropagation()}
                          className="absolute bottom-1 right-1 w-6 h-6 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Download className="w-3 h-3 text-white" />
                        </a>
                      </div>
                    ))}
                    {puedeEditar && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-[#630027]/30 hover:bg-[#630027]/5 transition-all"
                      >
                        <Upload className="w-5 h-5 text-gray-300" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Notas */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <StickyNote className="w-4 h-4 text-[#630027]" />
                  <h3 className="font-bold text-gray-800 text-sm">Notas</h3>
                </div>
                <Textarea
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    placeholder="Escribe aquí las notas del día..."
                    disabled={!puedeEditar}
                    className="min-h-[120px] rounded-xl border-gray-200 focus:border-[#630027]/30 focus:ring-[#630027]/20 resize-none text-sm disabled:bg-gray-50"
                  />
                  {puedeEditar && (
                    <Button
                      onClick={guardarNotas}
                      disabled={guardando}
                      className="mt-3 w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl"
                    >
                      {guardando ? "Guardando..." : "Guardar notas"}
                    </Button>
                  )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}