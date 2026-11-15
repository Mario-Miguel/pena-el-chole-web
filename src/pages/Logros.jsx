import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "../components/auth/AuthContext";
import { motion } from "framer-motion";
import { Trophy, Medal, Lock, Star } from "lucide-react";
import { CATEGORIAS_LOGRO, computarGamificacion } from "../lib/gamificaciones";

const GAMIF_KEY = "gamificaciones_activadas";

export default function Logros() {
  const { sesion } = useAuth();
  const [activada, setActivada] = useState(false);
  const [logros, setLogros] = useState([]);
  const [integrantes, setIntegrantes] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [computando, setComputando] = useState(false);

  const cargar = useCallback(async () => {
    const [cfg, lg, ints] = await Promise.all([
      base44.entities.AppConfig.filter({ clave: GAMIF_KEY }),
      base44.entities.Logro.list(),
      base44.entities.Integrante.list(),
    ]);
    setActivada(cfg[0]?.valor === "true");
    setLogros(lg);
    setIntegrantes(ints);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
    const onChange = () => cargar();
    window.addEventListener("gamificacionChanged", onChange);
    return () => window.removeEventListener("gamificacionChanged", onChange);
  }, [cargar]);

  const calcular = useCallback(async () => {
    setComputando(true);
    const res = await computarGamificacion(integrantes, logros);
    setRanking(res);
    setComputando(false);
  }, [integrantes, logros]);

  useEffect(() => {
    if (integrantes.length > 0 && logros.length > 0) calcular();
  }, [calcular, integrantes, logros]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  if (!activada) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <Trophy className="w-12 h-12 text-gray-200 mb-3" />
      <p className="text-gray-400 font-medium">Las gamificaciones no están activas</p>
      <p className="text-xs text-gray-300 mt-1">El administrador puede activarlas desde el Panel Admin.</p>
    </div>
  );

  const miResultado = ranking.find(r => r.integrante.id === sesion?.integranteId);
  const miPosicion = ranking.findIndex(r => r.integrante.id === sesion?.integranteId);
  const logrosActivos = logros.filter(l => l.activo);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#630027]">Logros</h1>
          <p className="text-gray-400 text-xs">Supera retos y sube en la clasificación</p>
        </div>
      </div>

      {/* Mi resumen */}
      {miResultado && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#630027] to-[#4a001d] rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Tu puntuación</p>
              <p className="text-3xl font-black">{miResultado.puntos} <span className="text-sm font-normal text-white/60">pts</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">Posición</p>
              <p className="text-2xl font-black">#{miPosicion + 1}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
            <Star className="w-4 h-4 text-amber-300" />
            <p className="text-xs text-white/80">{miResultado.completadosCount} de {logrosActivos.length} logros desbloqueados</p>
          </div>
        </motion.div>
      )}

      {/* Mis logros */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tus logros</p>
        <div className="grid grid-cols-2 gap-2.5">
          {logrosActivos.map(logro => {
            const prog = miResultado?.progresoPorLogro[logro.id] || { progreso: 0, completado: false };
            const pct = logro.umbral > 0 ? Math.min(100, (prog.progreso / logro.umbral) * 100) : 0;
            const cat = CATEGORIAS_LOGRO[logro.categoria] || { emoji: "🏆" };
            return (
              <motion.div key={logro.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className={`relative rounded-2xl border p-3 ${prog.completado ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-white border-gray-100"}`}>
                {prog.completado && <span className="absolute top-2 right-2 text-amber-500"><Star className="w-3.5 h-3.5 fill-amber-400" /></span>}
                <div className={`text-3xl mb-1.5 ${prog.completado ? "" : "grayscale opacity-40"}`}>
                  {logro.icono || "🏆"}
                </div>
                <p className={`font-bold text-sm leading-tight ${prog.completado ? "text-gray-800" : "text-gray-500"}`}>{logro.nombre}</p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5 mb-2">{logro.descripcion}</p>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${prog.completado ? "bg-amber-400" : "bg-[#630027]"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400">{prog.progreso}/{logro.umbral}</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-gray-300">{cat.emoji} {cat.label}</span>
                  <span className="text-[10px] font-bold text-[#630027]">+{logro.puntos} pts</span>
                </div>
              </motion.div>
            );
          })}
          {logrosActivos.length === 0 && (
            <p className="col-span-2 text-center text-sm text-gray-400 py-6">Aún no hay logros definidos.</p>
          )}
        </div>
      </div>

      {/* Clasificación */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Medal className="w-3.5 h-3.5" /> Clasificación
        </p>
        <div className="space-y-1.5">
          {computando ? (
            <p className="text-center text-sm text-gray-400 py-4">Calculando…</p>
          ) : ranking.filter(r => r.puntos > 0).length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">Aún nadie ha conseguido puntos. ¡Sé el primero!</p>
          ) : ranking.filter(r => r.puntos > 0).map((r, i) => (
            <div key={r.integrante.id} className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 ${r.integrante.id === sesion?.integranteId ? "bg-[#630027]/5 border-[#630027]/20" : "bg-white border-gray-100"}`}>
              <span className={`w-7 text-center font-black text-sm ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-gray-300"}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{r.integrante.nombre}</p>
                <p className="text-[10px] text-gray-400">{r.completadosCount} logros</p>
              </div>
              <span className="text-sm font-bold text-[#630027]">{r.puntos} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}