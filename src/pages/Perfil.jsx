import React, { useState, useEffect, useRef } from "react";
import { api } from "@/api/client";
import { useAuth } from "../components/auth/AuthContext";
import { LogOut, Camera, Eye, EyeOff, Save, Beer, Wallet, Cake, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import NotasButton from "../components/notas/NotasButton";
import MiCervezaPerfil from "../components/cerveza/MiCervezaPerfil";

export default function Perfil() {
  const { sesion, logout, refreshSesion } = useAuth();
  const [integrante, setIntegrante] = useState(null);
  const [itemsDeuda, setItemsDeuda] = useState([]);
  const [deudaCerveza, setDeudaCerveza] = useState(0);
  const [deudaCuotas, setDeudaCuotas] = useState(0);
  const [editandoCumple, setEditandoCumple] = useState(false);
  const [cumpleVal, setCumpleVal] = useState("");
  const [cumpleDia, setCumpleDia] = useState("");
  const [cumpleMes, setCumpleMes] = useState("");
  const [cumpleAnio, setCumpleAnio] = useState("");
  const [guardandoCumple, setGuardandoCumple] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cambioPass, setCambioPass] = useState({ nueva: "", confirmar: "" });
  const [showPass, setShowPass] = useState(false);
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [msgPass, setMsgPass] = useState("");
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [tareasReunion, setTareasReunion] = useState([]);
  const avatarRef = useRef(null);

  useEffect(() => {
    if (!sesion || sesion.esAdmin) { setLoading(false); return; }
    Promise.all([
      api.entities.Integrante.filter({ id: sesion.integranteId }),
      api.entities.ItemCompra.filter({ comprador_nombre: sesion.nombre }),
      api.entities.CervezaEntrada.filter({ nombre: sesion.nombre }),
      api.entities.AppConfig.filter({ clave: "cerveza_precio" }),
      api.entities.Cuota.list(),
      api.entities.TareaReunion.filter({ integrante_id: sesion.integranteId }),
    ]).then(([ints, items, cervezaEntradas, precioCfg, cuotas, tareasR]) => {
      const int = ints[0] || null;
      setIntegrante(int);
      const fn = int?.fecha_nacimiento || "";
      setCumpleVal(fn);
      if (fn) {
        const parts = fn.split("-");
        if (parts.length === 3) {
          setCumpleAnio(parts[0] === "0000" ? "" : parts[0]);
          setCumpleMes(parts[1]);
          setCumpleDia(parts[2]);
        }
      }
      setItemsDeuda(items.filter(i => i.comprado && !i.pagado));
      // Deuda cerveza
      const precio = precioCfg.length > 0 ? parseFloat(precioCfg[0].valor) : 0.5;
      const cervezas = cervezaEntradas[0]?.cervezas || 0;
      setDeudaCerveza(cervezas * precio);
      // Deuda cuotas pendientes
      const misCuotas = cuotas.filter(c => c.integrante_id === sesion.integranteId && !c.pagada);
      setDeudaCuotas(misCuotas.reduce((s, c) => s + (c.importe || 0), 0));
      setTareasReunion(tareasR.sort((a, b) => (a.estado === "completada" ? 1 : 0) - (b.estado === "completada" ? 1 : 0)));
      setLoading(false);
    });
  }, [sesion]);

  const deudaTotal = itemsDeuda.reduce((sum, i) => sum + (i.precio || 0) * (i.cantidad || 1), 0);

  const handleGuardarCumple = async () => {
    if (!integrante || !cumpleDia || !cumpleMes) return;
    setGuardandoCumple(true);
    const anio = cumpleAnio ? cumpleAnio.padStart(4, "0") : "0000";
    const mes = cumpleMes.padStart(2, "0");
    const dia = cumpleDia.padStart(2, "0");
    const valor = `${anio}-${mes}-${dia}`;
    await api.entities.Integrante.update(integrante.id, { fecha_nacimiento: valor });
    setIntegrante(prev => ({ ...prev, fecha_nacimiento: valor }));
    setCumpleVal(valor);
    setEditandoCumple(false);
    setGuardandoCumple(false);
  };

  const handleCambiarPassword = async () => {
    if (!cambioPass.nueva || cambioPass.nueva !== cambioPass.confirmar) {
      setMsgPass("Las contraseñas no coinciden");
      return;
    }
    if (cambioPass.nueva.length < 6) {
      setMsgPass("Mínimo 6 caracteres");
      return;
    }
    setGuardandoPass(true);
    const sesiones = await api.entities.SesionUsuario.filter({ integrante_id: sesion.integranteId });
    if (sesiones.length > 0) {
      await api.entities.SesionUsuario.update(sesiones[0].id, { contrasena: cambioPass.nueva });
    }
    setCambioPass({ nueva: "", confirmar: "" });
    setMsgPass("✅ Contraseña actualizada");
    setGuardandoPass(false);
    setTimeout(() => setMsgPass(""), 3000);
  };

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendoAvatar(true);
    const { file_url } = await api.uploadFile({ file });
    const sesiones = await api.entities.SesionUsuario.filter({ integrante_id: sesion.integranteId });
    if (sesiones.length > 0) {
      await api.entities.SesionUsuario.update(sesiones[0].id, { avatar_url: file_url });
    }
    await refreshSesion();
    setSubiendoAvatar(false);
    e.target.value = "";
  };

  const getIniciales = (nombre) => nombre ? nombre.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() : "?";

  const handleLogout = () => {
    logout();
    window.location.href = createPageUrl("Login");
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#4B1924]/20 border-t-[#4B1924] rounded-full animate-spin" />
    </div>);


  if (!sesion) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Link to={createPageUrl("Login")} className="text-[#4B1924] underline">Inicia sesión</Link>
    </div>);


  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.03 } } }}
      className="max-w-md mx-auto px-4 py-10 relative"
    >
      {/* Botón notas (esquina superior derecha de la página) */}
      {!sesion.esAdmin && (
        <div className="absolute top-10 right-4">
          <NotasButton variant="page" />
        </div>
      )}

      <motion.div
        variants={{ hidden: { opacity: 0, y: -16 }, show: { opacity: 1, y: 0, transition: { duration: 0.44, ease: [0.34, 1.56, 0.64, 1] } } }}
      >
        {/* Avatar y nombre */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } } }}
            className="relative mb-4"
          >
            <div className="w-24 h-24 rounded-full bg-[#4B1924]/10 flex items-center justify-center overflow-hidden border-4 border-[#4B1924]/20 shadow-lg">
              {sesion.avatarUrl ?
              <img src={sesion.avatarUrl} alt="" className="w-full h-full object-cover" /> :

              <span className="text-[#630027] text-3xl font-black">{getIniciales(sesion.nombre)}</span>
              }
            </div>
            {!sesion.esAdmin &&
            <button
              onClick={() => avatarRef.current?.click()}
              disabled={subiendoAvatar} className="bg-[#630027] rounded-full absolute bottom-0 right-0 w-8 h-8 flex items-center justify-center shadow-md hover:bg-[#3a1019] transition-colors">


                {subiendoAvatar ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
              </button>
            }
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </motion.div>
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } }}
            className="text-[#630027] text-2xl font-black"
          >{sesion.nombre}</motion.h1>
          {sesion.cargo && <motion.p variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="text-sm text-gray-500 capitalize font-medium mt-1">⚜️ {sesion.cargo}</motion.p>}
          {sesion.esAdmin && <motion.p variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="text-sm text-amber-600 font-bold mt-1">🔑 Administrador</motion.p>}
        </div>

        {/* Stats cervezas */}
        {!sesion.esAdmin && integrante && (
          <motion.div
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 text-center"
          >
            <Beer className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <p className="text-[#630027] text-2xl font-black">{integrante.cervezas || 0}</p>
            <p className="text-xs text-gray-400">Cervezas consumidas</p>
          </motion.div>
        )}

        {/* Resumen de deudas */}
        {!sesion.esAdmin && integrante && (
          <motion.div
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6"
          >
            <p className="text-sm font-bold text-gray-700 mb-4">💳 Resumen de deudas</p>
            <div className="space-y-3">
              {/* Deuda cerveza */}
              <div className={`flex items-center justify-between p-3 rounded-xl ${deudaCerveza > 0 ? "bg-amber-50 border border-amber-100" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2">
                  <Beer className={`w-4 h-4 ${deudaCerveza > 0 ? "text-amber-500" : "text-gray-300"}`} />
                  <span className="text-sm font-medium text-gray-600">Deuda por cerveza</span>
                </div>
                <span className={`text-sm font-black ${deudaCerveza > 0 ? "text-amber-600" : "text-gray-300"}`}>
                  {deudaCerveza > 0 ? `${deudaCerveza.toFixed(2)}€` : "Sin deuda"}
                </span>
              </div>
              {/* Deuda cuotas */}
              <div className={`flex items-center justify-between p-3 rounded-xl ${deudaCuotas > 0 ? "bg-red-50 border border-red-100" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2">
                  <AlertCircle className={`w-4 h-4 ${deudaCuotas > 0 ? "text-red-500" : "text-gray-300"}`} />
                  <span className="text-sm font-medium text-gray-600">Cuotas pendientes</span>
                </div>
                <span className={`text-sm font-black ${deudaCuotas > 0 ? "text-red-500" : "text-gray-300"}`}>
                  {deudaCuotas > 0 ? `${deudaCuotas.toFixed(2)}€` : "Sin deuda"}
                </span>
              </div>
              {/* Otras deudas */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-300" />
                  <span className="text-sm font-medium text-gray-600">Otras deudas</span>
                </div>
                <span className="text-sm font-black text-gray-300">Sin deuda</span>
              </div>
              {/* Lo que me debe la peña */}
              <div className={`flex items-center justify-between p-3 rounded-xl ${deudaTotal > 0 ? "bg-green-50 border border-green-100" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2">
                  <Wallet className={`w-4 h-4 ${deudaTotal > 0 ? "text-green-600" : "text-gray-300"}`} />
                  <span className="text-sm font-medium text-gray-600">La peña me debe</span>
                </div>
                <span className={`text-sm font-black ${deudaTotal > 0 ? "text-green-600" : "text-gray-300"}`}>
                  {deudaTotal > 0 ? `${deudaTotal.toFixed(2)}€` : "Nada pendiente"}
                </span>
              </div>
            </div>
            {/* Detalle compras pendientes */}
            {itemsDeuda.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Detalle compras pendientes de cobro</p>
                <div className="space-y-1.5">
                  {itemsDeuda.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 truncate">{item.nombre}</span>
                      <span className="font-bold text-green-600 ml-2">{((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Cumpleaños */}
        {!sesion.esAdmin && integrante && (
          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#630027] text-sm font-bold flex items-center gap-1.5"><Cake className="w-4 h-4" /> Mi cumpleaños</p>
              {!editandoCumple && (
                <button onClick={() => setEditandoCumple(true)} className="text-xs text-gray-400 hover:text-[#630027] underline">Editar</button>
              )}
            </div>
            {editandoCumple ? (
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase">Día *</label>
                    <input type="number" min="1" max="31" value={cumpleDia} onChange={e => setCumpleDia(e.target.value)} placeholder="DD"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase">Mes *</label>
                    <input type="number" min="1" max="12" value={cumpleMes} onChange={e => setCumpleMes(e.target.value)} placeholder="MM"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase">Año</label>
                    <input type="number" min="1900" max="2099" value={cumpleAnio} onChange={e => setCumpleAnio(e.target.value)} placeholder="Opcional"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleGuardarCumple} disabled={guardandoCumple || !cumpleDia || !cumpleMes}
                    className="flex-1 bg-[#630027] text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#4a001d] transition-colors disabled:opacity-50">
                    {guardandoCumple ? "..." : "Guardar"}
                  </button>
                  <button onClick={() => {
                    setEditandoCumple(false);
                    const fn = integrante.fecha_nacimiento || "";
                    if (fn) { const p = fn.split("-"); setCumpleAnio(p[0]==="0000"?"":p[0]); setCumpleMes(p[1]); setCumpleDia(p[2]); }
                  }} className="text-gray-400 text-xs hover:text-red-400 px-2">✕</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {integrante.fecha_nacimiento ? (() => {
                  const p = integrante.fecha_nacimiento.split("-");
                  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
                  const label = `${parseInt(p[2])} de ${meses[parseInt(p[1])-1]}`;
                  return p[0] !== "0000" ? `${label} de ${p[0]}` : label;
                })() : <span className="text-gray-300 italic">Sin fecha configurada</span>}
              </p>
            )}
          </motion.div>
        )}

        {/* Tareas derivadas de reuniones */}
        {!sesion.esAdmin && tareasReunion.length > 0 && (
          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
            <p className="text-[#630027] text-sm font-bold mb-3 flex items-center gap-1.5">📋 Mis tareas de reuniones</p>
            <div className="space-y-2">
              {tareasReunion.map(t => {
                const colores = { pendiente: "bg-gray-100 text-gray-500", en_progreso: "bg-blue-50 text-blue-500", completada: "bg-green-50 text-green-500" };
                const labels = { pendiente: "Pendiente", en_progreso: "En progreso", completada: "Completada" };
                return (
                  <div key={t.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50">
                    <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 flex-shrink-0 ${colores[t.estado] || colores.pendiente}`}>{labels[t.estado] || t.estado}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${t.estado === "completada" ? "line-through text-gray-300" : "text-gray-700"}`}>{t.descripcion}</p>
                      {t.acta_fecha && <p className="text-[10px] text-gray-400 mt-0.5">Reunión del {t.acta_fecha}</p>}
                      {t.fecha_limite && <p className="text-[10px] text-gray-400">📅 Límite: {t.fecha_limite}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Mi cuenta de cervezas */}
        {!sesion.esAdmin && <MiCervezaPerfil sesion={sesion} />}

        {/* Cambiar contraseña */}
        {!sesion.esAdmin &&
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6"
        >
            <p className="text-[#630027] mb-3 text-sm font-bold">Cambiar contraseña</p>
            <div className="space-y-3">
              <div className="relative">
                <Input
                type={showPass ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={cambioPass.nueva}
                onChange={(e) => setCambioPass((v) => ({ ...v, nueva: e.target.value }))}
                className="rounded-xl border-gray-200 pr-10" />

                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Input
              type={showPass ? "text" : "password"}
              placeholder="Confirmar contraseña"
              value={cambioPass.confirmar}
              onChange={(e) => setCambioPass((v) => ({ ...v, confirmar: e.target.value }))}
              className="rounded-xl border-gray-200" />

              {msgPass && <p className={`text-xs font-medium ${msgPass.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{msgPass}</p>}
              <Button
              onClick={handleCambiarPassword}
              disabled={!cambioPass.nueva || guardandoPass} className="bg-[#630027] text-white px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 w-full hover:bg-[#3a1019]">


                <Save className="w-4 h-4 mr-2" /> Guardar contraseña
              </Button>
            </div>
          </motion.div>
        }

        {/* Cerrar sesión */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>);

}