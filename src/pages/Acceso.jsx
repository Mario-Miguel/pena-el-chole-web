import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth, ADMIN_ID } from "../components/auth/AuthContext";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, ChevronRight, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function Acceso() {
  const { login } = useAuth();
  const [integrantes, setIntegrantes] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [mode, setMode] = useState("form");
  const passRef = useRef(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Integrante.list(),
      base44.entities.SesionUsuario.list(),
    ]).then(([ints, sess]) => {
      setIntegrantes(ints.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setSesiones(sess);
      setCargando(false);
    });
  }, []);

  const accesibles = integrantes.filter(i => {
    if (i.categoria === "patitas") return false;
    const s = sesiones.find(s => s.integrante_id === i.id);
    return s && !s.disabled;
  }).map(int => {
    const s = sesiones.find(s => s.integrante_id === int.id);
    return { ...int, usuarioLogin: s.usuario || int.nombre };
  }).filter(int =>
    !busqueda || int.nombre.toLowerCase().includes(busqueda.toLowerCase()) || int.usuarioLogin.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!usuario || !password) return;
    setError("");
    setEnviando(true);
    try {
      await login(usuario.trim(), password);
      window.location.href = createPageUrl("Inicio");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const seleccionarRapido = (u) => {
    setUsuario(u);
    setError("");
    setTimeout(() => passRef.current?.focus(), 50);
  };

  const getIniciales = (nombre) => nombre ? nombre.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";

  if (cargando) return (
    <div className="min-h-screen bg-[#630027] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#630027] via-[#5a0023] to-[#3a1019] flex flex-col">
      {/* Decoración superior */}
      <div className="absolute top-0 left-0 right-0 h-64 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-10 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
        {/* Logo y título */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-6"
        >
          <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl mb-3 bg-white/10">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b172515293447819f485fc/28e5a7606_LogoApp.jpg"
              alt="logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-white text-3xl font-black tracking-wider uppercase text-center" style={{ fontFamily: "'Limelight', cursive" }}>
            El Chole
          </h1>
          <p className="text-white/50 text-xs mt-1">Peña El Chole · Valdesoto</p>
        </motion.div>

        {/* Card de acceso */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Tabs: Formulario / Selección rápida */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setMode("form")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${mode === "form" ? "text-[#630027] border-b-2 border-[#630027] bg-[#630027]/5" : "text-gray-400"}`}
            >
              <LogIn className="w-3.5 h-3.5" /> Acceso
            </button>
            <button
              onClick={() => setMode("quick")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${mode === "quick" ? "text-[#630027] border-b-2 border-[#630027] bg-[#630027]/5" : "text-gray-400"}`}
            >
              <Users className="w-3.5 h-3.5" /> Miembros
            </button>
          </div>

          <div className="p-5">
            {/* ─── Formulario ─── */}
            {mode === "form" && (
              <motion.form
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleLogin} className="space-y-3"
              >
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Usuario</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tu nombre de usuario"
                      value={usuario}
                      onChange={e => { setUsuario(e.target.value); setError(""); }}
                      autoFocus
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 placeholder-gray-300 focus:border-[#630027] focus:bg-white focus:ring-2 focus:ring-[#630027]/10 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Contraseña</label>
                  <div className="relative">
                    <input
                      ref={passRef}
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-sm font-medium text-gray-700 placeholder-gray-300 focus:border-[#630027] focus:bg-white focus:ring-2 focus:ring-[#630027]/10 focus:outline-none transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-500 text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                <Button type="submit" disabled={!usuario || !password || enviando}
                  className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-[#630027]/20 transition-all">
                  {enviando
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><LogIn className="w-4 h-4 mr-1.5" />Entrar</>}
                </Button>

                {accesibles.length > 0 && (
                  <p className="text-center text-xs text-gray-400 pt-1">
                    ¿No recuerdas tu usuario? Usa la pestaña <button type="button" onClick={() => setMode("quick")} className="text-[#630027] font-bold underline">Miembros</button>
                  </p>
                )}
              </motion.form>
            )}

            {/* ─── Selección rápida ─── */}
            {mode === "quick" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <input
                  type="text"
                  placeholder="Buscar miembro..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 mb-3 text-sm font-medium text-gray-700 placeholder-gray-300 focus:border-[#630027] focus:bg-white focus:outline-none transition-all"
                />
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {accesibles.map(int => (
                    <motion.button
                      key={int.id}
                      whileTap={{ scale: 0.93 }}
                      type="button"
                      onClick={() => { seleccionarRapido(int.usuarioLogin); setMode("form"); }}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border border-gray-100 hover:border-[#630027]/30 hover:bg-[#630027]/5 transition-all group"
                    >
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#630027]/15 to-[#630027]/5 flex items-center justify-center group-hover:from-[#630027] group-hover:to-[#4a001d] transition-all">
                        <span className="text-[#630027] group-hover:text-white font-bold text-sm transition-colors">{getIniciales(int.nombre)}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium text-center leading-tight truncate w-full">{int.nombre.split(" ")[0]}</span>
                    </motion.button>
                  ))}
                  {/* Admin */}
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    type="button"
                    onClick={() => { seleccionarRapido(ADMIN_ID); setMode("form"); }}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border border-dashed border-amber-300 hover:bg-amber-50 transition-all group"
                  >
                    <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-500 transition-all">
                      <Shield className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-[10px] text-amber-600 font-medium">Admin</span>
                  </motion.button>
                </div>
                {accesibles.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-4">No hay miembros con acceso activo</p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        <p className="text-white/30 text-[10px] mt-6 text-center">
          © {new Date().getFullYear()} Peña El Chole · Valdesoto, Siero
        </p>
      </div>
    </div>
  );
}