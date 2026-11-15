import React, { useState, useEffect, useRef } from "react";
import { api } from "@/api/client";
import { X, Cake } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CumpleanosPanel from "../integrantes/CumpleanosPanel";
import { useAuth } from "../auth/AuthContext";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function parseFecha(f) {
  if (!f) return null;
  const parts = f.split("-");
  if (parts.length !== 3) return null;
  return { mes: parseInt(parts[1]) - 1, dia: parseInt(parts[2]) };
}

function CalendarioCumpleanos({ integrantes }) {
  const hoy = new Date();
  const mesActual = hoy.getMonth();
  const [mesSel, setMesSel] = useState(mesActual);

  const porMes = Array.from({ length: 12 }, (_, m) =>
    integrantes.filter(i => { const p = parseFecha(i.fecha_nacimiento); return p && p.mes === m; })
  );

  const delMesSel = porMes[mesSel].sort((a, b) => {
    const pa = parseFecha(a.fecha_nacimiento);
    const pb = parseFecha(b.fecha_nacimiento);
    return (pa?.dia || 0) - (pb?.dia || 0);
  });

  return (
    <div className="space-y-3">
      {/* Selector de mes */}
      <div className="grid grid-cols-6 gap-1">
        {MESES.map((m, i) => {
          const tiene = porMes[i].length > 0;
          const esActual = i === mesActual;
          const esSel = i === mesSel;
          return (
            <button key={m} onClick={() => setMesSel(i)}
              className={`relative rounded-lg py-1.5 text-xs font-semibold transition-colors ${esSel ? "bg-[#630027] text-white" : esActual ? "bg-[#630027]/10 text-[#630027]" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
              {m}
              {tiene && !esSel && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Lista del mes seleccionado */}
      <div className="min-h-[60px]">
        {delMesSel.length === 0 ? (
          <p className="text-xs text-gray-300 text-center py-4">Sin cumpleaños en {MESES[mesSel]}</p>
        ) : (
          <div className="space-y-1.5">
            {delMesSel.map(i => {
              const p = parseFecha(i.fecha_nacimiento);
              const esHoy = hoy.getMonth() === mesSel && hoy.getDate() === p?.dia;
              return (
                <div key={i.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${esHoy ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}>
                  <span className="text-sm">{esHoy ? "🎂" : "🎈"}</span>
                  <span className="text-sm font-semibold text-gray-700 flex-1">{i.nombre}</span>
                  <span className="text-xs text-gray-400">{p?.dia} {MESES[mesSel]}</span>
                  {esHoy && <span className="text-xs font-bold text-amber-600">¡Hoy!</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CumpleanosModal({ open, onClose }) {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || ["presidente","vicepresidente","secretario"].includes(sesion?.cargo);
  const [integrantes, setIntegrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("calendario");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.entities.Integrante.list().then(data => {
      setIntegrantes(data.filter(i => i.categoria !== "patitas"));
      setLoading(false);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Cake className="w-5 h-5 text-amber-500" />
                <h2 className="font-black text-[#630027] text-base">Cumpleaños</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 pt-3 flex-shrink-0">
              {[["calendario","🗓️ Calendario"],["lista","📋 Lista"]].map(([v,l]) => (
                <button key={v} onClick={() => setTab(v)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${tab === v ? "bg-[#630027] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {l}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
                </div>
              ) : tab === "calendario" ? (
                <CalendarioCumpleanos integrantes={integrantes} />
              ) : (
                <CumpleanosPanel puedeEditar={puedeEditar} />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}