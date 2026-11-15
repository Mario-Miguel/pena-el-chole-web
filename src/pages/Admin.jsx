import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "../components/auth/AuthContext";
import {
  Plus, Trash2, RefreshCw, Eye, EyeOff, Users, MessageSquare, Bell,
  Shield, RotateCcw, ToggleLeft, ToggleRight, Database, Code,
  Settings, Activity, Wrench, ChevronDown, Trophy
} from "lucide-react";
import { ALL_PAGES, UNDISABLEABLE, DISABLED_PAGES_CONFIG_KEY } from "../lib/menuConfig";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import GestorDatos from "../components/admin/GestorDatos";
import IACreador from "../components/admin/IACreador";
import AuditoriaPanel from "../components/admin/AuditoriaPanel";
import PermisosPanel from "../components/admin/PermisosPanel";
import AjustesApp from "../components/admin/AjustesApp";
import ConfigNotificaciones from "../components/admin/ConfigNotificaciones";
import HistorialAuditoria from "../components/admin/HistorialAuditoria";
import { registrarLog } from "../lib/registrarLog";
import GestionSocios from "../components/socios/GestionSocios";
import GamificacionesPanel from "../components/admin/GamificacionesPanel";
import CopiaSeguridad from "../components/admin/CopiaSeguridad";
import CodigoApp from "../components/admin/CodigoApp";

const TABS = [
  { id: "miembros",       label: "Miembros",       icon: Users },
  { id: "ajustes",        label: "Ajustes",        icon: Settings },
  { id: "comunicacion",   label: "Comunicación",   icon: MessageSquare },
  { id: "actividad",      label: "Actividad",      icon: Activity },
  { id: "logros",         label: "Logros",         icon: Trophy },
  { id: "datos",          label: "Datos",          icon: Database },
  { id: "codigo",         label: "Código",         icon: Code },
  { id: "herramientas",   label: "Herramientas",   icon: Wrench },
];

const SECCION_CONFIG = {
  ItemCompra:      { emoji: "🛒", label: "Compras",          color: "bg-green-50 border-green-200 text-green-700" },
  Notificacion:    { emoji: "🔔", label: "Notificaciones",   color: "bg-purple-50 border-purple-200 text-purple-700" },
  Votacion:        { emoji: "🗳️", label: "Votaciones",       color: "bg-amber-50 border-amber-200 text-amber-700" },
  Integrante:      { emoji: "👤", label: "Integrantes",      color: "bg-blue-50 border-blue-200 text-blue-700" },
  ChatGrupo:       { emoji: "💬", label: "Grupos de Chat",   color: "bg-sky-50 border-sky-200 text-sky-700" },
  ChatMensaje:     { emoji: "✉️", label: "Mensajes",         color: "bg-sky-50 border-sky-200 text-sky-700" },
  Tarea:           { emoji: "✅", label: "Tareas",           color: "bg-teal-50 border-teal-200 text-teal-700" },
  MediaItem:       { emoji: "🖼️", label: "Imágenes/Vídeos", color: "bg-pink-50 border-pink-200 text-pink-700" },
  Carpeta:         { emoji: "📁", label: "Carpetas",         color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  DeudaProveedor:  { emoji: "💸", label: "Deudas",           color: "bg-red-50 border-red-200 text-red-700" },
  PagoRegistrado:  { emoji: "💰", label: "Pagos",            color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  DiaCalendario:   { emoji: "📅", label: "Calendario",       color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
  PlazoCalendario: { emoji: "📆", label: "Plazos",           color: "bg-indigo-50 border-indigo-200 text-indigo-700" },
  ItemAlmacen:     { emoji: "📦", label: "Almacén",          color: "bg-orange-50 border-orange-200 text-orange-700" },
  Sugerencia:      { emoji: "💡", label: "Sugerencias",      color: "bg-lime-50 border-lime-200 text-lime-700" },
  NotaPersonal:    { emoji: "📝", label: "Notas",            color: "bg-zinc-50 border-zinc-200 text-zinc-700" },
  ObraDocumento:   { emoji: "📐", label: "Documentos Obra",  color: "bg-slate-50 border-slate-200 text-slate-700" },
};

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
      {action}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-2 my-4">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-xs text-gray-300 font-medium">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

export default function Admin() {
  const { sesion } = useAuth();
  const [tab, setTab] = useState("miembros");
  const [subTab, setSubTab] = useState({});
  const [integrantes, setIntegrantes] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [papelera, setPapelera] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formUser, setFormUser] = useState(null);
  const [showPass, setShowPass] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [disabledPages, setDisabledPages] = useState([]);
  const [savingMenu, setSavingMenu] = useState(false);

  const cargar = useCallback(async () => {
    const [ints, sess, gs, notificaciones, logsData, papeleraData, fbData, appCfg] = await Promise.all([
      base44.entities.Integrante.list(),
      base44.entities.SesionUsuario.list(),
      base44.entities.ChatGrupo.list(),
      base44.entities.Notificacion.list("-created_date"),
      base44.entities.AdminLog.list("-created_date", 100),
      base44.entities.Papelera.list("-created_date"),
      base44.entities.FeedbackApp.list("-created_date"),
      base44.entities.AppConfig.filter({ clave: DISABLED_PAGES_CONFIG_KEY }),
    ]);
    setIntegrantes(ints.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setDisabledPages(appCfg[0]?.valor ? JSON.parse(appCfg[0].valor) : []);
    setSesiones(sess);
    setGrupos(gs);
    setNotifs(notificaciones);
    setLogs(logsData);
    setPapelera(papeleraData);
    setFeedbacks(fbData);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (!sesion?.esAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
        <Shield className="w-12 h-12 text-gray-200" />
        <p className="text-gray-400">Acceso restringido al administrador</p>
        <Link to={createPageUrl("Inicio")} className="text-[#4B1924] underline text-sm">Volver al inicio</Link>
      </div>
    );
  }

  const soloLectura = !!sesion?.soloLectura;

  const getSesion = (id) => sesiones.find(s => s.integrante_id === id);

  const togglePageDisabled = async (page) => {
    const newDisabled = disabledPages.includes(page)
      ? disabledPages.filter(p => p !== page)
      : [...disabledPages, page];
    setSavingMenu(true);
    const existing = await base44.entities.AppConfig.filter({ clave: DISABLED_PAGES_CONFIG_KEY });
    if (existing.length > 0) {
      await base44.entities.AppConfig.update(existing[0].id, { valor: JSON.stringify(newDisabled) });
    } else {
      await base44.entities.AppConfig.create({ clave: DISABLED_PAGES_CONFIG_KEY, valor: JSON.stringify(newDisabled) });
    }
    setDisabledPages(newDisabled);
    setSavingMenu(false);
    const accion = newDisabled.includes(page) ? "eliminar" : "crear";
    await registrarLog({ accion, entidad: "AppConfig", descripcion: `Sección "${page}" ${newDisabled.includes(page) ? "desactivada" : "activada"} en el menú`, autorNombre: sesion?.nombre });
    window.dispatchEvent(new Event("menuConfigChanged"));
  };

  const handleCrearSesion = async () => {
    if (!formUser?.integranteId || !formUser?.contrasena) return;
    const usuario = (formUser.usuario || "").trim();
    if (!usuario) return;
    setGuardando(true);
    const existing = sesiones.find(s => s.integrante_id === formUser.integranteId);
    const intNombre = integrantes.find(i => i.id === formUser.integranteId)?.nombre || formUser.integranteId;
    // Validar que el usuario no esté repetido
    const duplicado = sesiones.find(s => s.usuario && s.usuario.toLowerCase() === usuario.toLowerCase() && s.integrante_id !== formUser.integranteId);
    if (duplicado) {
      alert("Ese nombre de usuario ya está en uso. Elige otro.");
      setGuardando(false);
      return;
    }
    if (existing) {
      await base44.entities.SesionUsuario.update(existing.id, { contrasena: formUser.contrasena, usuario });
      await registrarLog({ accion: "editar", entidad: "SesionUsuario", descripcion: `Acceso actualizado para ${intNombre} (usuario: ${usuario})`, autorNombre: sesion?.nombre });
    } else {
      await base44.entities.SesionUsuario.create({ integrante_id: formUser.integranteId, usuario, contrasena: formUser.contrasena });
      await registrarLog({ accion: "crear", entidad: "SesionUsuario", descripcion: `Acceso creado para ${intNombre} (usuario: ${usuario})`, autorNombre: sesion?.nombre });
    }
    setFormUser(null);
    setGuardando(false);
    cargar();
  };

  const handleResetPass = async (integranteId) => {
    const nueva = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existing = sesiones.find(s => s.integrante_id === integranteId);
    const intNombre = integrantes.find(i => i.id === integranteId)?.nombre || integranteId;
    if (existing) {
      await base44.entities.SesionUsuario.update(existing.id, { contrasena: nueva });
    } else {
      await base44.entities.SesionUsuario.create({ integrante_id: integranteId, usuario: intNombre, contrasena: nueva });
    }
    await registrarLog({ accion: "editar", entidad: "SesionUsuario", descripcion: `Contraseña reseteada para ${intNombre}`, autorNombre: sesion?.nombre });
    alert(`Nueva contraseña: ${nueva}`);
    cargar();
  };

  const handleEliminarSesion = async (integranteId) => {
    const s = sesiones.find(s => s.integrante_id === integranteId);
    const intNombre = integrantes.find(i => i.id === integranteId)?.nombre || integranteId;
    if (s) {
      await base44.entities.SesionUsuario.delete(s.id);
      await registrarLog({ accion: "eliminar", entidad: "SesionUsuario", descripcion: `Acceso revocado para ${intNombre}`, autorNombre: sesion?.nombre });
    }
    cargar();
  };

  const handleToggleDisabled = async (integranteId) => {
    const s = sesiones.find(s => s.integrante_id === integranteId);
    if (!s) return;
    const intNombre = integrantes.find(i => i.id === integranteId)?.nombre || integranteId;
    const nuevoEstado = !s.disabled;
    await base44.entities.SesionUsuario.update(s.id, { disabled: nuevoEstado });
    await registrarLog({ accion: "editar", entidad: "SesionUsuario", descripcion: `${intNombre} ${nuevoEstado ? "desactivado" : "activado"}`, autorNombre: sesion?.nombre });
    cargar();
  };

  const deleteMsgsSequentially = async (msgs) => {
    for (const m of msgs) await base44.entities.ChatMensaje.delete(m.id);
  };

  const handleEliminarGrupo = async (grupoId) => {
    const grupo = grupos.find(g => g.id === grupoId);
    const msgs = await base44.entities.ChatMensaje.filter({ grupo_id: grupoId });
    await deleteMsgsSequentially(msgs);
    await base44.entities.ChatGrupo.delete(grupoId);
    await registrarLog({ accion: "eliminar", entidad: "ChatGrupo", descripcion: `Grupo eliminado: ${grupo?.nombre || grupoId}`, autorNombre: sesion?.nombre });
    cargar();
  };

  const handleEliminarMensajesGrupo = async (grupoId) => {
    const grupo = grupos.find(g => g.id === grupoId);
    const msgs = await base44.entities.ChatMensaje.filter({ grupo_id: grupoId });
    await deleteMsgsSequentially(msgs);
    await registrarLog({ accion: "eliminar", entidad: "ChatMensaje", descripcion: `Mensajes borrados: ${grupo?.nombre || grupoId} (${msgs.length})`, autorNombre: sesion?.nombre });
    alert("Mensajes eliminados");
    cargar();
  };

  const handleEliminarNotif = async (id) => {
    const notif = notifs.find(n => n.id === id);
    await base44.entities.Notificacion.delete(id);
    await registrarLog({ accion: "eliminar", entidad: "Notificacion", descripcion: `Notificación eliminada: "${notif?.titulo || id}"`, autorNombre: sesion?.nombre });
    cargar();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#4B1924]/20 border-t-[#4B1924] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header compacto */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#630027]/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[#630027]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#630027]">Panel Admin</h1>
            <HelpIcon section="admin" />
          </div>
          <p className="text-gray-400 text-xs">Gestión completa de la app</p>
        </div>
      </div>

      {soloLectura && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-amber-700 text-xs font-semibold">Modo solo lectura — puedes ver todo el contenido pero no modificar nada</p>
        </div>
      )}

      {/* Navegación de tabs con iconos */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? "bg-[#630027] text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-[#630027]/30 hover:text-[#630027]"
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={soloLectura ? "pointer-events-none select-none" : ""}
        >

          {/* ═══ MIEMBROS (Usuarios + Socios) ═══ */}
          {tab === "miembros" && (
            <div className="space-y-4">
              {/* Sub-tabs */}
              <div className="flex gap-1.5 bg-gray-50 p-1 rounded-xl">
                {[{ id: "accesos", label: "Accesos" }, { id: "socios", label: "Socios y cuotas" }].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setSubTab(p => ({ ...p, miembros: st.id }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      (subTab.miembros || "accesos") === st.id
                        ? "bg-white text-[#630027] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {(subTab.miembros || "accesos") === "accesos" && (
                <div className="space-y-2">
                  <SectionHeader
                    title={`${integrantes.length} integrantes`}
                    action={
                      <Button onClick={() => setFormUser({ integranteId: "", usuario: "", contrasena: "" })} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-xs h-7 px-2.5">
                        <Plus className="w-3 h-3 mr-1" /> Asignar acceso
                      </Button>
                    }
                  />

                  <AnimatePresence>
                    {formUser && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-white rounded-2xl border border-[#630027]/20 shadow-sm p-4 space-y-3 mb-3">
                        <div>
                          <Label className="text-xs text-gray-500">Integrante</Label>
                          <Select value={formUser.integranteId} onValueChange={v => setFormUser(f => ({ ...f, integranteId: v, usuario: f.usuario || (integrantes.find(i => i.id === v)?.nombre || "") }))}>
                            <SelectTrigger className="mt-1 rounded-xl border-gray-200 text-sm h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                            <SelectContent>{integrantes.map(i => <SelectItem key={i.id} value={i.id}>{i.nombre}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Usuario (para iniciar sesión)</Label>
                          <Input className="mt-1 rounded-xl border-gray-200 text-sm h-9" placeholder="Ej: juanperez" value={formUser.usuario || ""} onChange={e => setFormUser(f => ({ ...f, usuario: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Contraseña</Label>
                          <Input className="mt-1 rounded-xl border-gray-200 text-sm h-9" placeholder="Mínimo 6 caracteres" value={formUser.contrasena} onChange={e => setFormUser(f => ({ ...f, contrasena: e.target.value }))} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setFormUser(null)} className="rounded-xl text-xs h-8">Cancelar</Button>
                          <Button onClick={handleCrearSesion} disabled={!formUser.integranteId || !formUser.usuario || !formUser.contrasena || guardando} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-xs h-8">
                            {guardando ? "..." : "Guardar"}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {integrantes.map(int => {
                    const s = getSesion(int.id);
                    return (
                      <div key={int.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#630027]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#630027] font-bold text-xs">{int.nombre[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm leading-tight">{int.nombre}</p>
                          {s ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              {s.disabled
                                ? <span className="text-xs text-red-500 font-semibold">Desactivado</span>
                                : <>
                                    <span className="text-xs text-gray-500 font-semibold">@{s.usuario || int.nombre}</span>
                                    <span className="text-xs text-gray-300">·</span>
                                    <p className="text-xs text-gray-400 font-mono">{showPass[int.id] ? s.contrasena : "••••••"}</p>
                                    <button onClick={() => setShowPass(p => ({ ...p, [int.id]: !p[int.id] }))} className="text-gray-300 hover:text-gray-500">
                                      {showPass[int.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                  </>
                              }
                            </div>
                          ) : (
                            <p className="text-xs text-red-400">Sin acceso</p>
                          )}
                        </div>
                        <div className="flex gap-0.5">
                          {s && (
                            <button onClick={() => handleToggleDisabled(int.id)} title={s.disabled ? "Activar" : "Desactivar"} className={`p-1.5 rounded-lg transition-colors ${s.disabled ? "hover:bg-green-50 text-gray-300 hover:text-green-500" : "hover:bg-gray-50 text-green-500"}`}>
                              {s.disabled
                                ? <ToggleRight className="w-4 h-4" />
                                : <ToggleLeft className="w-4 h-4" />}
                            </button>
                          )}
                          <button onClick={() => handleResetPass(int.id)} title="Resetear" className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-400 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          {s && (
                            <button onClick={() => handleEliminarSesion(int.id)} title="Revocar" className="p-1.5 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(subTab.miembros || "accesos") === "socios" && <GestionSocios />}
            </div>
          )}

          {/* ═══ AJUSTES (Apariencia + Menú + Privacidad) ═══ */}
          {tab === "ajustes" && (
            <AjustesConCategorias
              disabledPages={disabledPages}
              savingMenu={savingMenu}
              togglePageDisabled={togglePageDisabled}
            />
          )}

          {/* ═══ COMUNICACIÓN (Chat + Notificaciones) ═══ */}
          {tab === "comunicacion" && (
            <div className="space-y-4">
              <div className="flex gap-1.5 bg-gray-50 p-1 rounded-xl">
                {[
                  { id: "grupos", label: "Grupos de chat" },
                  { id: "notifs", label: "Notificaciones" },
                  { id: "config_notif", label: "Config. canales" },
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setSubTab(p => ({ ...p, comunicacion: st.id }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      (subTab.comunicacion || "grupos") === st.id
                        ? "bg-white text-[#630027] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {(subTab.comunicacion || "grupos") === "grupos" && (
                <div className="space-y-2">
                  {grupos.filter(g => !g.es_bot && !g.es_privado).map(g => (
                    <div key={g.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2.5 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${g.es_general ? "bg-[#630027]" : "bg-gray-100"}`}>
                        <MessageSquare className={`w-4 h-4 ${g.es_general ? "text-white" : "text-gray-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{g.nombre}</p>
                        {g.descripcion && <p className="text-xs text-gray-400 truncate">{g.descripcion}</p>}
                      </div>
                      <div className="flex gap-0.5">
                        <button onClick={() => handleEliminarMensajesGrupo(g.id)} title="Vaciar mensajes" className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-400 transition-colors">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        {!g.es_general && (
                          <button onClick={async () => { if (!confirm(`¿Eliminar "${g.nombre}"?`)) return; await handleEliminarGrupo(g.id); }}
                            title="Eliminar grupo" className="p-1.5 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(subTab.comunicacion || "grupos") === "notifs" && (
                <div className="space-y-2">
                  {notifs.length === 0 && <p className="text-gray-300 text-sm text-center py-8">No hay notificaciones</p>}
                  {notifs.map(n => (
                    <div key={n.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-2.5 flex items-center gap-3">
                      <Bell className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{n.titulo}</p>
                        <p className="text-xs text-gray-400">{n.tipo} · {(n.leida_por || []).length} leídas</p>
                      </div>
                      <button onClick={() => handleEliminarNotif(n.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(subTab.comunicacion || "grupos") === "config_notif" && <ConfigNotificaciones />}
            </div>
          )}

          {/* ═══ ACTIVIDAD (Log + Historial + Auditoría + Feedback) ═══ */}
          {tab === "actividad" && (
            <div className="space-y-4">
              <div className="flex gap-1.5 bg-gray-50 p-1 rounded-xl overflow-x-auto">
                {[
                  { id: "log", label: "Log" },
                  { id: "historial", label: "Historial" },
                  { id: "auditoria", label: "Auditoría" },
                  { id: "feedback", label: `Feedback${feedbacks.filter(f => !f.leido).length > 0 ? ` (${feedbacks.filter(f => !f.leido).length})` : ""}` },
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setSubTab(p => ({ ...p, actividad: st.id }))}
                    className={`flex-shrink-0 flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap px-2 ${
                      (subTab.actividad || "log") === st.id
                        ? "bg-white text-[#630027] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {(subTab.actividad || "log") === "log" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">Últimas 100 acciones</p>
                    {logs.length > 0 && (
                      <button onClick={async () => { if (!confirm("¿Vaciar el log?")) return; await Promise.all(logs.map(l => base44.entities.AdminLog.delete(l.id))); cargar(); }}
                        className="text-xs text-red-400 hover:text-red-600 underline">Vaciar</button>
                    )}
                  </div>
                  {logs.length === 0 && <p className="text-gray-300 text-sm text-center py-8">Sin actividad registrada</p>}
                  {logs.map(log => {
                    const c = log.accion === "crear" ? "bg-green-100 text-green-700" : log.accion === "eliminar" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
                    return (
                      <div key={log.id} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-start gap-2">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${c}`}>{log.accion}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">{log.descripcion}</p>
                          <p className="text-xs text-gray-400">{log.autor_nombre} · {log.entidad} · {new Date(log.created_date).toLocaleString("es-ES")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(subTab.actividad || "log") === "historial" && <HistorialAuditoria />}
              {(subTab.actividad || "log") === "auditoria" && <AuditoriaPanel />}

              {(subTab.actividad || "log") === "feedback" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{feedbacks.length} mensaje(s)</p>
                    {feedbacks.length > 0 && (
                      <button onClick={async () => { if (!confirm("¿Borrar todos?")) return; await Promise.all(feedbacks.map(f => base44.entities.FeedbackApp.delete(f.id))); cargar(); }}
                        className="text-xs text-red-400 hover:text-red-600 underline">Borrar todos</button>
                    )}
                  </div>
                  {feedbacks.length === 0 && <p className="text-gray-300 text-sm text-center py-8">No hay mensajes</p>}
                  {feedbacks.map(fb => {
                    const tipoColor = { error: "bg-red-100 text-red-700", sugerencia: "bg-blue-100 text-blue-700", mejora: "bg-amber-100 text-amber-700", otro: "bg-gray-100 text-gray-600" };
                    return (
                      <div key={fb.id} className={`bg-white rounded-xl border shadow-sm p-3 ${!fb.leido ? "border-[#630027]/20" : "border-gray-100 opacity-70"}`}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tipoColor[fb.tipo] || tipoColor.otro}`}>{fb.tipo}</span>
                            <span className="text-xs text-gray-400">{fb.autor_nombre || "Anónimo"}</span>
                          </div>
                          <div className="flex gap-1">
                            {!fb.leido && (
                              <button onClick={() => base44.entities.FeedbackApp.update(fb.id, { leido: true }).then(cargar)} className="text-xs text-gray-300 hover:text-green-500" title="Marcar leído">✓</button>
                            )}
                            <button onClick={() => base44.entities.FeedbackApp.delete(fb.id).then(cargar)} className="p-1 rounded hover:bg-red-50 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{fb.mensaje}</p>
                        <p className="text-xs text-gray-300 mt-1">{new Date(fb.created_date).toLocaleString("es-ES")}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ LOGROS (Gamificaciones) ═══ */}
          {tab === "logros" && <GamificacionesPanel sesion={sesion} />}

          {/* ═══ DATOS (Copia de seguridad) ═══ */}
          {tab === "datos" && <CopiaSeguridad sesion={sesion} />}

          {/* ═══ CÓDIGO (Visualizar y descargar) ═══ */}
          {tab === "codigo" && <CodigoApp />}

          {/* ═══ HERRAMIENTAS (Papelera + Gestor + IA) ═══ */}
          {tab === "herramientas" && (
            <div className="space-y-4">
              <div className="flex gap-1.5 bg-gray-50 p-1 rounded-xl">
                {[
                  { id: "papelera", label: `🗑️ Papelera${papelera.length > 0 ? ` (${papelera.length})` : ""}` },
                  { id: "gestor", label: "💾 Datos" },
                  { id: "ia", label: "✨ IA" },
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setSubTab(p => ({ ...p, herramientas: st.id }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      (subTab.herramientas || "papelera") === st.id
                        ? "bg-white text-[#630027] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {(subTab.herramientas || "papelera") === "papelera" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{papelera.length} elemento(s) en la papelera</p>
                    {papelera.length > 0 && (
                      <button onClick={async () => { if (!confirm("¿Vaciar papelera?")) return; await Promise.all(papelera.map(p => base44.entities.Papelera.delete(p.id))); cargar(); }}
                        className="text-xs text-red-400 hover:text-red-600 underline">Vaciar</button>
                    )}
                  </div>
                  {papelera.length === 0 && <p className="text-gray-300 text-sm text-center py-8">La papelera está vacía</p>}
                  {(() => {
                    const secciones = {};
                    papelera.forEach(item => {
                      if (!secciones[item.entidad]) secciones[item.entidad] = [];
                      secciones[item.entidad].push(item);
                    });
                    return Object.entries(secciones).map(([entidad, items]) => {
                      const cfg = SECCION_CONFIG[entidad] || { emoji: "🗂️", label: entidad, color: "bg-gray-50 border-gray-200 text-gray-600" };
                      return (
                        <div key={entidad}>
                          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-bold mb-1.5 mt-3 ${cfg.color}`}>
                            <span>{cfg.emoji}</span><span>{cfg.label}</span>
                            <span className="ml-auto opacity-60">{items.length}</span>
                          </div>
                          <div className="space-y-1.5">
                            {items.map(item => (
                              <div key={item.id} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-700 text-sm truncate">{item.descripcion}</p>
                                  <p className="text-xs text-gray-400">Por {item.eliminado_por} · {new Date(item.created_date).toLocaleDateString("es-ES")}</p>
                                </div>
                                <div className="flex gap-0.5 flex-shrink-0">
                                  <button onClick={async () => {
                                    try { const datos = JSON.parse(item.datos_json); const { id, created_date, updated_date, created_by, ...rest } = datos; await base44.entities[item.entidad]?.create(rest); await base44.entities.Papelera.delete(item.id); cargar(); }
                                    catch (e) { alert("No se pudo restaurar: " + e.message); }
                                  }} title="Restaurar" className="p-1.5 rounded-lg hover:bg-green-50 text-green-400 transition-colors">
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={async () => { if (!confirm("¿Eliminar definitivamente?")) return; await base44.entities.Papelera.delete(item.id); cargar(); }}
                                    title="Eliminar" className="p-1.5 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {(subTab.herramientas || "papelera") === "gestor" && <GestorDatos />}
              {(subTab.herramientas || "papelera") === "ia" && <IACreador />}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ═══ AJUSTES CON CATEGORÍAS ═══
function AjustesConCategorias({ disabledPages, savingMenu, togglePageDisabled }) {
  const [abierto, setAbierto] = useState("apariencia");

  const categorias = [
    { id: "apariencia", label: "Apariencia", emoji: "🎨" },
    { id: "menu",       label: "Menú",       emoji: "📋" },
    { id: "privacidad", label: "Privacidad", emoji: "🔒" },
  ];

  return (
    <div className="space-y-2">
      {categorias.map(cat => (
        <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setAbierto(a => a === cat.id ? null : cat.id)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-base">{cat.emoji}</span>
            <span className="flex-1 text-sm font-semibold text-gray-700">{cat.label}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${abierto === cat.id ? "rotate-180" : ""}`} />
          </button>

          {abierto === cat.id && (
            <div className="border-t border-gray-50 px-4 pb-4 pt-3">
              {cat.id === "apariencia" && <AjustesApp />}

              {cat.id === "menu" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400">Activa o desactiva secciones para todos los usuarios.</p>
                    {savingMenu && <span className="text-xs text-gray-400 animate-pulse">Guardando…</span>}
                  </div>
                  {ALL_PAGES.filter(p => !p.fixedFirst && !p.fixedLast).map(p => {
                    const isDisabled = disabledPages.includes(p.page);
                    const undisableable = UNDISABLEABLE.includes(p.page);
                    return (
                      <div key={p.page} className={`flex items-center gap-3 bg-gray-50 rounded-xl border px-3 py-2 ${isDisabled ? "border-gray-100 opacity-50" : "border-gray-100"}`}>
                        <span className="text-sm">{p.emoji}</span>
                        <span className="flex-1 text-sm text-gray-700">{p.label}</span>
                        {undisableable ? (
                          <span className="text-xs text-gray-300 italic">fijo</span>
                        ) : (
                          <button onClick={() => togglePageDisabled(p.page)} disabled={savingMenu}
                            className={`transition-colors ${isDisabled ? "text-gray-300 hover:text-[#630027]" : "text-[#630027] hover:text-gray-400"}`}>
                            {isDisabled ? <ToggleLeft className="w-6 h-6" /> : <ToggleRight className="w-6 h-6" />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {cat.id === "privacidad" && <AccesoPrivacidad />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Acceso: Permisos + Privacidad con sub-tabs
function AccesoPrivacidad() {
  const [subTab, setSubTab] = useState("permisos");
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 bg-gray-50 p-1 rounded-xl">
        {[{ id: "permisos", label: "Permisos por rol" }, { id: "privacidad", label: "Privacidad" }].map(st => (
          <button key={st.id} onClick={() => setSubTab(st.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === st.id ? "bg-white text-[#630027] shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}>
            {st.label}
          </button>
        ))}
      </div>
      {subTab === "permisos" && <PermisosPanel />}
      {subTab === "privacidad" && <PrivacidadInline />}
    </div>
  );
}

// Privacidad inline (antes era componente externo con mocks)
function PrivacidadInline() {
  const MODULOS = [
    { id: "Cuentas",   label: "Cuentas",   emoji: "💰" },
    { id: "Cerveza",   label: "La despensa de Simón",   emoji: "🍺" },
    { id: "Calendario",label: "Calendario",emoji: "📅" },
    { id: "Almacen",   label: "Almacén",   emoji: "📦" },
    { id: "Resultados",label: "Resultados",emoji: "🏆" },
  ];
  const [estados, setEstados] = useState({});
  const [guardado, setGuardado] = useState(false);
  const handleToggle = (id) => setEstados(e => ({ ...e, [id]: !e[id] }));
  const handleGuardar = () => { setGuardado(true); setTimeout(() => setGuardado(false), 2000); };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 mb-3">Activa o desactiva el acceso público a cada sección.</p>
      {MODULOS.map(m => (
        <div key={m.id} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex items-center gap-3">
          <span className="text-base">{m.emoji}</span>
          <span className="flex-1 text-sm text-gray-700">{m.label}</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${estados[m.id] ? "text-gray-400" : "text-[#630027]"}`}>{estados[m.id] ? "Privado" : "Público"}</span>
            <button onClick={() => handleToggle(m.id)} className={`w-10 h-5 rounded-full transition-colors relative ${estados[m.id] ? "bg-gray-200" : "bg-[#630027]"}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${estados[m.id] ? "left-0.5" : "left-5.5"}`} />
            </button>
          </div>
        </div>
      ))}
      <button onClick={handleGuardar} className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold text-white bg-[#630027] hover:bg-[#4a001d] transition-colors">
        {guardado ? "✓ Guardado" : "Guardar cambios"}
      </button>
    </div>
  );
}