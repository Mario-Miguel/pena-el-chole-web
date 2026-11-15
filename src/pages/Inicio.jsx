import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useAuth } from "../components/auth/AuthContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MultipleCuentasAtras from "../components/countdown/MultipleCuentasAtras";
import CalendarioInicio from "../components/calendario/CalendarioInicio";
import WidgetsDashboard from "../components/inicio/WidgetsDashboard";
import { BarChart2 } from "lucide-react";

export default function Inicio() {
  const { sesion, puedeConfigurar } = useAuth();
  const [cuentasAtras, setCuentasAtras] = useState([]);
  const [votacionesActivas, setVotacionesActivas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = useCallback(async () => {
    const [cuentas, votaciones] = await Promise.all([
      base44.entities.CuentaAtras.list("-created_date"),
      base44.entities.Votacion.filter({ completada: false }),
    ]);
    setCuentasAtras(cuentas);
    setVotacionesActivas(votaciones);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargarDatos();
    let hiddenAt = null;
    const onVis = () => {
      if (document.visibilityState === "hidden") { hiddenAt = Date.now(); }
      else if (hiddenAt && Date.now() - hiddenAt > 2 * 60 * 1000) { cargarDatos(); hiddenAt = null; }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [cargarDatos]);

  const getIniciales = (nombre) => nombre ? nombre.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() : "?";

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#4B1924]/20 border-t-[#4B1924] rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } } }}
      initial="hidden"
      animate="show"
      className="px-4 py-10 max-w-3xl mx-auto"
    >
      {/* Banner votaciones activas */}
      {votacionesActivas.length > 0 && (
        <motion.div
          variants={{ hidden: { opacity: 0, y: -12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
          className="mb-6 space-y-2"
        >
          {votacionesActivas.map(v => (
            <Link key={v.id} to={createPageUrl("Comunidad")}
              className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 hover:bg-amber-100 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0">
                <BarChart2 className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">🗳️ Votación activa</p>
                <p className="text-sm font-semibold text-amber-800 truncate">{v.tema}</p>
              </div>
              <span className="text-xs text-amber-600 font-bold group-hover:underline flex-shrink-0">Votar →</span>
            </Link>
          ))}
        </motion.div>
      )}
      {/* Bienvenida */}
      {sesion && (
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } } }}
          className="mb-8 flex flex-col items-center gap-2"
        >
          <motion.div whileHover={{ scale: 1.1, rotate: 3 }} whileTap={{ scale: 0.93 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
            <Link to={createPageUrl("Perfil")} className="w-16 h-16 rounded-full bg-[#4B1924]/10 border-2 border-[#4B1924]/20 flex items-center justify-center overflow-hidden hover:border-[#4B1924]/50 transition-colors shadow-md block">
              {sesion.avatarUrl
                ? <img src={sesion.avatarUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                : <span className="text-[#630027] text-2xl font-black">{getIniciales(sesion.nombre)}</span>
              }
            </Link>
          </motion.div>
          <motion.p variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.15 } } }} className="text-gray-500 text-sm">Bienvenido,</motion.p>
          <motion.p variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.35 } } }} className="text-[#630027] text-xl font-black">{sesion.nombre}</motion.p>
          {sesion.cargo && (
            <motion.p variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.28 } } }} className="text-xs text-[#4B1924]/50 font-medium capitalize">⚜️ {sesion.cargo}</motion.p>
          )}
        </motion.div>
      )}

      {/* Cuentas atrás múltiples — elemento principal por defecto */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
        className="w-full flex flex-col items-center mb-8"
      >
        <MultipleCuentasAtras puedeConfigurar={puedeConfigurar} />
      </motion.div>

      {/* Widgets configurables */}
      <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.1 } } }}>
        <WidgetsDashboard sesion={sesion} />
      </motion.div>

      {/* Calendario integrado */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } } }}
        className="w-full"
      >
        <CalendarioInicio cuentasAtras={cuentasAtras} />
      </motion.div>
    </motion.div>
  );
}