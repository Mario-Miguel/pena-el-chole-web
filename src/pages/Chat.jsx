import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/api/client";
import { Plus, ArrowLeft, Send, Upload, X, Users, Info, FileText, Link2, Camera, Paperclip, Image, Archive, Bot, Lock, MessageSquare, Trash2, Reply, SmilePlus } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/auth/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import TextoConEnlaces from "../components/TextoConEnlaces";
import { usePushNotifications } from "../components/notifications/usePushNotifications";
import { useLocation } from "react-router-dom";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
function extraerEnlaces(texto) { return texto?.match(URL_REGEX) || []; }

const BOT_ID = "__cholin_bot__";
const BOT_NOMBRE = "Cholín (Bot)";

const FILTROS = [
  { value: "imagenes", label: "🖼 Imágenes", icon: Image },
  { value: "archivos", label: "📎 Archivos", icon: Archive },
  { value: "enlaces", label: "🔗 Enlaces", icon: Link2 },
];

export default function Chat() {
  const { sesion, puedeConfigurar, integrantes: integrantesCtx, cargarIntegrantes } = useAuth();
  const usuarioId = sesion?.integranteId || "";
  const { showNotification } = usePushNotifications();
  const location = useLocation();

  const [grupos, setGrupos] = useState([]);
  const [integrantes, setIntegrantes] = useState([]);
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [adjuntos, setAdjuntos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [formGrupo, setFormGrupo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [infoGrupo, setInfoGrupo] = useState(false);
  const [filtroInfo, setFiltroInfo] = useState("imagenes");
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [mostrarNuevoPrivado, setMostrarNuevoPrivado] = useState(false);
  const [botCargando, setBotCargando] = useState(false);
  const [respondiendo, setRespondiendo] = useState(null); // {id, texto, autor}
  const [reaccionesVisibles, setReaccionesVisibles] = useState(null); // msg.id
  const [vista, setVista] = useState("grupos"); // "grupos" | "privados" | "bot"
  const [sesiones, setSesiones] = useState([]);
  const [confirmEliminarPrivado, setConfirmEliminarPrivado] = useState(null); // { grupo, nombre }
  const fileRef = useRef(null);
  const avatarRef = useRef(null);
  const mensajesRef = useRef(null);
  const textareaRef = useRef(null);

  const loadGrupos = useCallback(async () => {
    const [gs, ints] = await Promise.all([
      api.entities.ChatGrupo.list("-created_date"),
      api.entities.Integrante.list(),
    ]);
    let lista = gs;

    // Crear Chat General si no existe
    if (!gs.find((g) => g.es_general)) {
      const general = await api.entities.ChatGrupo.create({
        nombre: "Chat general",
        descripcion: "Grupo con todos los integrantes",
        es_general: true,
      });
      lista = [general, ...gs];
    }

    // Crear bot Cholín privado para cada usuario si no existe ya uno para este usuario
    // El bot se trata como un grupo privado con el userId en participantes
    const botDelUsuario = gs.find(g => g.es_bot && g.participantes?.includes(sesion?.integranteId || ""));
    if (!botDelUsuario && sesion?.integranteId) {
      const bot = await api.entities.ChatGrupo.create({
        nombre: BOT_NOMBRE,
        descripcion: "Asistente de la Peña El Chole",
        es_bot: true,
        participantes: [sesion.integranteId],
      });
      lista = [bot, ...lista];
    }

    const sorted = lista.sort((a, b) => {
      if (a.es_bot && !b.es_bot) return -1;
      if (!a.es_bot && b.es_bot) return 1;
      if (a.es_general && !b.es_general) return -1;
      if (!a.es_general && b.es_general) return 1;
      return 0;
    });

    setGrupos(sorted);
    setIntegrantes(ints.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setLoading(false);
  }, []);

  useEffect(() => { loadGrupos(); }, [loadGrupos]);
  useEffect(() => {
    api.entities.SesionUsuario.list().then(setSesiones);
  }, []);

  // Navegar al grupo si viene desde notificación de Inicio
  useEffect(() => {
    if (location.state?.grupoId && grupos.length > 0) {
      const grupo = grupos.find(g => g.id === location.state.grupoId);
      if (grupo) {
        setGrupoActivo(grupo);
        setInfoGrupo(false);
      }
    }
  }, [location.state, grupos]);

  useEffect(() => {
    if (!grupoActivo) return;
    api.entities.ChatMensaje.filter({ grupo_id: grupoActivo.id }, "created_date")
      .then(msgs => setMensajes([...msgs].sort((a, b) => new Date(a.created_date) - new Date(b.created_date))));
    const unsub = api.entities.ChatMensaje.subscribe((event) => {
      if (event.data?.grupo_id !== grupoActivo.id) return;
      if (event.type === "create") {
        setMensajes((prev) => {
          // Evitar duplicados (si ya está añadido optimistamente)
          if (prev.find(m => m.id === event.data.id)) return prev;
          // Push notification si no es mío
          if (event.data.autor_id !== usuarioId) {
            showNotification(`${event.data.autor_nombre}: ${event.data.texto || "📎 Archivo"}`, {
              body: grupoActivo.nombre,
            });
          }
          return [...prev, event.data];
        });
      } else if (event.type === "update") {
        setMensajes((prev) => prev.map((m) => m.id === event.data?.id ? { ...m, ...event.data } : m));
      } else if (event.type === "delete") {
        setMensajes((prev) => prev.filter((m) => m.id !== event.id));
      }
    });
    return unsub;
  }, [grupoActivo, usuarioId, showNotification]);

  useEffect(() => {
    if (mensajesRef.current) mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
  }, [mensajes]);

  const handleAdjuntos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSubiendo(true);
    const nuevos = await Promise.all(files.map(async (file) => {
      const { file_url } = await api.uploadFile({ file });
      let tipo = "documento";
      if (file.type.startsWith("image/")) tipo = "imagen";
      else if (file.type.startsWith("video/")) tipo = "video";
      return { url: file_url, tipo, nombre: file.name };
    }));
    setAdjuntos((prev) => [...prev, ...nuevos]);
    setSubiendo(false);
    e.target.value = "";
  };

  const handleEnviar = async () => {
    if ((!texto.trim() && adjuntos.length === 0) || !usuarioId || !grupoActivo) return;
    if (enviando) return;

    const textoEnviar = texto.trim();
    const adjuntosEnviar = [...adjuntos];
    const autorNombre = sesion?.nombre || "Desconocido";

    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId,
      grupo_id: grupoActivo.id,
      autor_id: usuarioId,
      autor_nombre: autorNombre,
      texto: textoEnviar,
      created_date: new Date().toISOString(),
      adjunto_url: adjuntosEnviar[0]?.url || null,
      adjunto_tipo: adjuntosEnviar[0]?.tipo || null,
      pie_texto: adjuntosEnviar[0]?.nombre || null,
      _temp: true,
    };
    setMensajes(prev => [...prev, tempMsg]);
    setTexto("");
    setAdjuntos([]);
    setRespondiendo(null);
    textareaRef.current?.focus();

    setEnviando(true);

    // Bot Cholín
    if (grupoActivo.es_bot) {
      setMensajes(prev => prev.filter(m => m.id !== tempId));
      await api.entities.ChatMensaje.create({
        grupo_id: grupoActivo.id,
        autor_id: usuarioId,
        autor_nombre: autorNombre,
        texto: textoEnviar,
      });
      try {
        setBotCargando(true);
        const respuesta = await api.invokeLLM({
          prompt: `Eres Cholín, el asistente simpático y cercano de la "Peña El Chole", una peña festiva española. 
Ayudas a los miembros con preguntas sobre la app, la peña, y el funcionamiento de las diferentes secciones (Cuentas, Cervezas, Calendario, Obra, Concurso, Integrantes, Votaciones, Chat, Notificaciones, Tareas, Almacén, Notas, Sugerencias, Galería/Memoria). 
Responde siempre en español, de forma amigable y concisa. Usa emojis ocasionalmente. Responde SOLO a lo que se te pregunta, sin inventar datos.
Mensaje del usuario: ${textoEnviar}`,
        });
        await api.entities.ChatMensaje.create({
          grupo_id: grupoActivo.id,
          autor_id: BOT_ID,
          autor_nombre: BOT_NOMBRE,
          texto: respuesta,
        });
      } finally {
        setBotCargando(false);
      }
    } else {
      if (adjuntosEnviar.length > 0) {
        for (let i = 0; i < adjuntosEnviar.length; i++) {
          const adj = adjuntosEnviar[i];
          await api.entities.ChatMensaje.create({
            grupo_id: grupoActivo.id,
            autor_id: usuarioId,
            autor_nombre: autorNombre,
            texto: i === 0 ? textoEnviar : "",
            adjunto_url: adj.url,
            adjunto_tipo: adj.tipo,
            pie_texto: adj.nombre,
          });
        }
      } else {
        await api.entities.ChatMensaje.create({
          grupo_id: grupoActivo.id,
          autor_id: usuarioId,
          autor_nombre: autorNombre,
          texto: textoEnviar,
          ...(respondiendo ? { responde_a_id: respondiendo.id, responde_a_texto: respondiendo.texto?.substring(0, 100), responde_a_autor: respondiendo.autor } : {}),
        });
      }
      // Remove temp (real message will arrive via subscription)
      setMensajes(prev => prev.filter(m => m.id !== tempId));
    }

    setEnviando(false);
  };

  const handleCrearGrupo = async () => {
    if (!formGrupo?.nombre?.trim()) return;
    await api.entities.ChatGrupo.create({
      nombre: formGrupo.nombre,
      descripcion: formGrupo.descripcion || "",
      es_general: false,
    });
    setFormGrupo(null);
    loadGrupos();
  };

  const handleIniciarPrivado = async (integrante) => {
    // Buscar si ya existe un chat privado entre estos dos
    const privados = grupos.filter(g => g.es_privado);
    const existente = privados.find(g =>
      g.participantes?.includes(usuarioId) && g.participantes?.includes(integrante.id)
    );
    if (existente) {
      setGrupoActivo(existente);
      setMostrarNuevoPrivado(false);
      return;
    }
    const nuevo = await api.entities.ChatGrupo.create({
      nombre: `${sesion?.nombre} & ${integrante.nombre}`,
      es_privado: true,
      participantes: [usuarioId, integrante.id],
    });
    setGrupos(prev => [...prev, nuevo]);
    setGrupoActivo(nuevo);
    setMostrarNuevoPrivado(false);
  };

  const handleCambiarAvatarGrupo = async (e) => {
    const file = e.target.files[0];
    if (!file || !grupoActivo) return;
    setSubiendoAvatar(true);
    const { file_url } = await api.uploadFile({ file });
    await api.entities.ChatGrupo.update(grupoActivo.id, { avatar_url: file_url });
    const updated = { ...grupoActivo, avatar_url: file_url };
    setGrupoActivo(updated);
    setGrupos((prev) => prev.map((g) => g.id === grupoActivo.id ? updated : g));
    setSubiendoAvatar(false);
    e.target.value = "";
  };

  const handleReaccionar = async (msg, emoji) => {
    const reaccionesActuales = msg.reacciones || {};
    const usuarios = reaccionesActuales[emoji] || [];
    const nuevos = usuarios.includes(usuarioId)
      ? usuarios.filter(u => u !== usuarioId)
      : [...usuarios, usuarioId];
    const nuevasReacciones = { ...reaccionesActuales, [emoji]: nuevos };
    await api.entities.ChatMensaje.update(msg.id, { reacciones: nuevasReacciones });
    setMensajes(prev => prev.map(m => m.id === msg.id ? { ...m, reacciones: nuevasReacciones } : m));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  // ═══ PANEL INFO GRUPO ═══
  if (grupoActivo && infoGrupo) {
    const msgsImagenes = mensajes.filter((m) => m.adjunto_tipo === "imagen");
    const msgsArchivos = mensajes.filter((m) => m.adjunto_tipo && m.adjunto_tipo !== "imagen" && m.adjunto_tipo !== "video");
    const msgsEnlaces = mensajes.filter((m) => m.texto && extraerEnlaces(m.texto).length > 0);
    const listaPorFiltro = filtroInfo === "imagenes" ? msgsImagenes : filtroInfo === "archivos" ? msgsArchivos : msgsEnlaces;

    return (
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
        <div className="bg-[#630027] px-4 py-3 flex items-center gap-3 border-b border-white/10 sticky top-0 z-10">
          <button onClick={() => setInfoGrupo(false)} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <p className="font-bold text-white flex-1">Info del grupo</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#faf8f6]">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-3">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-[#630027]/20 ${grupoActivo.es_bot ? "bg-[#630027]" : grupoActivo.es_general ? "bg-[#630027]" : "bg-gray-100"}`}>
                {grupoActivo.avatar_url
                  ? <img src={grupoActivo.avatar_url} alt="" className="w-full h-full object-cover" />
                  : grupoActivo.es_bot
                    ? <Bot className="w-9 h-9 text-white" />
                    : <Users className={`w-8 h-8 ${grupoActivo.es_general ? "text-white" : "text-gray-400"}`} />
                }
              </div>
              {!grupoActivo.es_bot && (
                <button onClick={() => avatarRef.current?.click()} disabled={subiendoAvatar} className="bg-[#630027] rounded-full absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center shadow hover:bg-[#4a001d] transition-colors">
                  {subiendoAvatar ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
                </button>
              )}
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleCambiarAvatarGrupo} />
            </div>
            <p className="font-bold text-[#630027] text-lg">{grupoActivo.nombre}</p>
            {grupoActivo.descripcion && <p className="text-sm text-gray-400">{grupoActivo.descripcion}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {FILTROS.map((f) => {
              const count = f.value === "imagenes" ? msgsImagenes.length : f.value === "archivos" ? msgsArchivos.length : msgsEnlaces.length;
              const Icon = f.icon;
              return (
                <button key={f.value} onClick={() => setFiltroInfo(f.value)} className={`p-3 text-center rounded-2xl transition-all border flex flex-col items-center gap-1 ${filtroInfo === f.value ? "bg-[#630027] text-white border-[#630027]" : "bg-white border-gray-100 text-gray-600 hover:bg-[#630027]/5 hover:text-[#630027]"}`}>
                  <Icon className="w-5 h-5" />
                  <p className="text-xs font-bold">{count}</p>
                  <p className={`text-xs ${filtroInfo === f.value ? "text-white/80" : "text-gray-400"}`}>{f.label.split(" ")[1]}</p>
                </button>
              );
            })}
          </div>
          {listaPorFiltro.length === 0
            ? <div className="text-center py-8 text-gray-300 text-sm">Sin contenido en esta categoría</div>
            : filtroInfo === "imagenes"
              ? <div className="grid grid-cols-3 gap-2">
                  {listaPorFiltro.map((m) => <a key={m.id} href={m.adjunto_url} target="_blank" rel="noreferrer"><img src={m.adjunto_url} alt="" className="w-full aspect-square object-cover rounded-xl" /></a>)}
                </div>
              : <div className="space-y-2">
                  {filtroInfo === "archivos"
                    ? listaPorFiltro.map((m) => (
                        <a key={m.id} href={m.adjunto_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 hover:border-[#630027]/30 transition-colors">
                          <FileText className="w-5 h-5 text-[#630027]/50 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{m.pie_texto || "Archivo"}</p>
                            <p className="text-xs text-gray-400">{m.autor_nombre}</p>
                          </div>
                        </a>
                      ))
                    : listaPorFiltro.map((m) => extraerEnlaces(m.texto).map((link, i) => (
                        <a key={`${m.id}-${i}`} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 hover:border-[#630027]/30 transition-colors">
                          <Link2 className="w-5 h-5 text-[#630027] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#630027] underline truncate">{link}</p>
                            <p className="text-xs text-gray-400">{m.autor_nombre}</p>
                          </div>
                        </a>
                      )))
                  }
                </div>
          }
        </div>
      </div>
    );
  }

  // ═══ VISTA MENSAJES ═══
  if (grupoActivo) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
        <div className="bg-[#630027] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => { setGrupoActivo(null); setMensajes([]); setInfoGrupo(false); }} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => !grupoActivo.es_bot && setInfoGrupo(true)} className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity">
            <div className={`w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${grupoActivo.es_bot ? "bg-white/20" : grupoActivo.es_privado ? "bg-white/10" : "bg-white/20"}`}>
              {grupoActivo.avatar_url
                ? <img src={grupoActivo.avatar_url} alt="" className="w-full h-full object-cover" />
                : grupoActivo.es_bot
                  ? <Bot className="w-4 h-4 text-white" />
                  : grupoActivo.es_privado
                    ? <Lock className="w-4 h-4 text-white" />
                    : <Users className="w-4 h-4 text-white" />
              }
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">
                {grupoActivo.es_privado
                  ? (() => { const otroId = grupoActivo.participantes?.find(p => p !== usuarioId); return integrantes.find(i => i.id === otroId)?.nombre || grupoActivo.nombre; })()
                  : grupoActivo.nombre
                }
              </p>
              {grupoActivo.es_bot && <p className="text-xs text-white/60 leading-tight">Asistente de la peña</p>}
              {grupoActivo.descripcion && !grupoActivo.es_bot && <p className="text-xs text-white/60 leading-tight">{grupoActivo.descripcion}</p>}
            </div>
          </button>
          {!grupoActivo.es_bot && !grupoActivo.es_privado && (
            <button onClick={() => setInfoGrupo(true)} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
              <Info className="w-5 h-5 text-white/70" />
            </button>
          )}
        </div>

        <div ref={mensajesRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#faf8f6]">
          {mensajes.length === 0 && !botCargando && (
            <div className="text-center py-12 text-gray-300 text-sm">
              {grupoActivo.es_bot
                ? <><p className="text-4xl mb-3">🤖</p><p>¡Hola! Soy Cholín, el asistente de la Peña El Chole.<br />Pregúntame lo que quieras sobre la app.</p></>
                : "Sin mensajes aún. ¡Sé el primero!"
              }
            </div>
          )}
          {[...mensajes].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)).map((msg) => {
            const esMio = msg.autor_id === usuarioId;
            const esBot = msg.autor_id === BOT_ID;
            const autorSesion = sesiones.find(s => s.integrante_id === msg.autor_id);
            const autorAvatar = autorSesion?.avatar_url || null;
            const autorIniciales = msg.autor_nombre?.[0]?.toUpperCase() || "?";
            // Mostrar avatar en grupos (no en privados ni bot)
            const mostrarAvatar = !esMio && !grupoActivo.es_privado && !grupoActivo.es_bot;
            return (
              <div key={msg.id} className={`flex gap-2 ${esMio ? "flex-row-reverse" : "flex-row"} items-end group`}>
                {/* Avatar en grupos */}
                {mostrarAvatar && (
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mb-1 bg-[#630027]/10 flex items-center justify-center">
                    {autorAvatar
                      ? <img src={autorAvatar} alt="" className="w-full h-full object-cover" />
                      : <span className="text-[#630027] font-bold text-xs">{autorIniciales}</span>
                    }
                  </div>
                )}
                {/* Espacio reservado para alinear mensajes propios cuando hay avatares */}
                {esMio && !grupoActivo.es_privado && !grupoActivo.es_bot && <div className="w-7 flex-shrink-0" />}
                <div className={`flex flex-col ${esMio ? "items-end" : "items-start"} max-w-[78%]`}>
                {!esMio && (
                  <div className="flex items-center gap-1 mb-1 ml-1">
                    <p className="text-xs text-[#630027]/60 font-semibold">{msg.autor_nombre}</p>
                  </div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm ${esMio ? "bg-[#630027] text-white rounded-br-sm" : esBot ? "bg-[#630027]/5 text-gray-800 rounded-bl-sm border border-[#630027]/20" : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"} ${msg._temp ? "opacity-60" : ""}`}>
                  {msg.responde_a_id && (
                    <div className={`mb-2 pl-2 border-l-2 rounded text-xs py-0.5 ${esMio ? "border-white/50 text-white/70" : "border-[#630027]/40 text-gray-500"}`}>
                      <p className="font-semibold leading-tight">{msg.responde_a_autor}</p>
                      <p className="truncate opacity-80">{msg.responde_a_texto}</p>
                    </div>
                  )}
                  {msg.adjunto_url && (
                    <div className="mb-1.5">
                      {msg.adjunto_tipo === "imagen"
                        ? <a href={msg.adjunto_url} target="_blank" rel="noreferrer"><img src={msg.adjunto_url} alt="" className="rounded-xl max-w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" /></a>
                        : msg.adjunto_tipo === "video"
                          ? <video src={msg.adjunto_url} controls className="rounded-xl max-w-full max-h-48" />
                          : <a href={msg.adjunto_url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-xl px-3 py-2 ${esMio ? "bg-white/10 hover:bg-white/20" : "bg-gray-50 hover:bg-gray-100"} transition-colors`}>
                              <FileText className={`w-5 h-5 flex-shrink-0 ${esMio ? "text-white/70" : "text-[#630027]/50"}`} />
                              <span className={`text-xs font-medium truncate ${esMio ? "text-white/90" : "text-gray-700"}`}>{msg.pie_texto || "Archivo"}</span>
                            </a>
                      }
                    </div>
                  )}
                  {msg.texto && (
                    <TextoConEnlaces
                      texto={msg.texto}
                      className="text-sm leading-relaxed"
                      linkClassName={esMio ? "underline text-white/80 hover:text-white" : "underline text-[#630027] hover:text-[#4a001d]"}
                    />
                  )}
                </div>
                <div className={`flex items-center gap-1.5 mt-0.5 ${esMio ? "justify-end mr-1" : "ml-1"}`}>
                  <p className="text-xs text-gray-400">
                    {format(new Date(msg.created_date), "HH:mm", { locale: es })}
                  </p>
                  {!msg._temp && !grupoActivo.es_bot && (
                    <button onClick={() => setRespondiendo({ id: msg.id, texto: msg.texto || "", autor: msg.autor_nombre })} className="opacity-0 group-hover:opacity-100 transition-opacity" title="Responder">
                      <Reply className="w-3 h-3 text-gray-400 hover:text-[#630027]" />
                    </button>
                  )}
                  {!msg._temp && !grupoActivo.es_bot && (
                    <button onClick={() => setReaccionesVisibles(v => v === msg.id ? null : msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" title="Reaccionar">
                      <SmilePlus className="w-3 h-3 text-gray-400 hover:text-[#630027]" />
                    </button>
                  )}
                </div>
                {reaccionesVisibles === msg.id && (
                  <div className={`flex gap-1 mt-1 ${esMio ? "justify-end mr-1" : "ml-1"} bg-white border border-gray-100 rounded-xl px-2 py-1.5 shadow-sm`}>
                    {["👍","❤️","😂","😮","😢","🔥"].map(emoji => (
                      <button key={emoji} onClick={() => { handleReaccionar(msg, emoji); setReaccionesVisibles(null); }} className="text-lg hover:scale-125 transition-transform leading-none">
                        {emoji}
                      </button>
                    ))}
                    <button onClick={() => setReaccionesVisibles(null)} className="text-xs text-gray-400 hover:text-gray-600 leading-none ml-1 px-1">✕</button>
                  </div>
                )}
                {msg.reacciones && Object.values(msg.reacciones).some(u => u.length > 0) && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${esMio ? "justify-end mr-1" : "ml-1"}`}>
                    {Object.entries(msg.reacciones).filter(([, users]) => users.length > 0).map(([emoji, users]) => (
                      <button key={emoji} onClick={() => handleReaccionar(msg, emoji)} className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${users.includes(usuarioId) ? "bg-[#630027]/10 border-[#630027]/30 text-[#630027]" : "bg-white border-gray-200 text-gray-600 hover:border-[#630027]/30"}`}>
                        <span>{emoji}</span>
                        <span className="font-semibold">{users.length}</span>
                      </button>
                    ))}
                  </div>
                )}
                </div>
              </div>
            );
          })}
          {(botCargando) && (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1 mb-1 ml-1">
                <Bot className="w-3 h-3 text-[#630027]" />
                <p className="text-xs text-[#630027]/60 font-semibold">{BOT_NOMBRE}</p>
              </div>
              <div className="bg-[#630027]/5 border border-[#630027]/20 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-[#630027]/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-[#630027]/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-[#630027]/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {usuarioId ? (
          <div className="bg-white border-t border-gray-100 px-4 py-3 space-y-2">
            {adjuntos.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {adjuntos.map((adj, i) => (
                  <div key={i} className="relative flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
                    {adj.tipo === "imagen" ? <img src={adj.url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" /> : <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                    <span className="text-xs text-gray-600 max-w-[80px] truncate">{adj.nombre}</span>
                    <button onClick={() => setAdjuntos((prev) => prev.filter((_, idx) => idx !== i))} className="ml-1">
                      <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {respondiendo && (
              <div className="flex items-center gap-2 bg-[#630027]/5 border-l-2 border-[#630027] rounded-xl px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#630027]">{respondiendo.autor}</p>
                  <p className="text-xs text-gray-500 truncate">{respondiendo.texto}</p>
                </div>
                <button onClick={() => setRespondiendo(null)}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              {!grupoActivo.es_bot && (
                <button onClick={() => fileRef.current?.click()} disabled={subiendo} className="p-2 rounded-xl border border-gray-200 hover:border-[#630027]/30 text-gray-400 hover:text-[#630027] transition-colors flex-shrink-0">
                  {subiendo ? <div className="w-5 h-5 border-2 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /> : <Paperclip className="w-5 h-5" />}
                </button>
              )}
              <Textarea
                ref={textareaRef}
                placeholder={grupoActivo.es_bot ? "Pregúntale algo a Cholín..." : "Escribe un mensaje..."}
                className="flex-1 rounded-xl border-gray-200 resize-none text-sm"
                rows={1}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
              />
              <Button
                onClick={handleEnviar}
                disabled={(!texto.trim() && adjuntos.length === 0) || enviando || botCargando}
                className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl h-9 flex-shrink-0 px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" multiple className="hidden" onChange={handleAdjuntos} />
          </div>
        ) : (
          <div className="bg-white border-t border-gray-100 px-4 py-3 text-center text-sm text-gray-400">
            Inicia sesión para enviar mensajes
          </div>
        )}
      </div>
    );
  }

  // ═══ LISTA GRUPOS / PRIVADOS / BOT ═══
  const gruposPublicos = grupos.filter(g => !g.es_privado && !g.es_bot);
  const grupoBot = grupos.find(g => g.es_bot && g.participantes?.includes(usuarioId));
  const gruposPrivados = grupos.filter(g => g.es_privado && g.participantes?.includes(usuarioId));
  const integrantesParaPrivado = integrantes.filter(i => i.id !== usuarioId);

  const confirmarEliminarPrivado = async () => {
    if (!confirmEliminarPrivado) return;
    const { grupo } = confirmEliminarPrivado;
    const msgs = await api.entities.ChatMensaje.filter({ grupo_id: grupo.id });
    await Promise.all(msgs.map(m => api.entities.ChatMensaje.delete(m.id)));
    await api.entities.ChatGrupo.delete(grupo.id);
    setGrupos(prev => prev.filter(g => g.id !== grupo.id));
    setConfirmEliminarPrivado(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <ConfirmDialog
        open={!!confirmEliminarPrivado}
        mensaje={`¿Eliminar el chat con ${confirmEliminarPrivado?.nombre}? Se borrarán todos los mensajes.`}
        textoConfirmar="Eliminar chat"
        onConfirm={confirmarEliminarPrivado}
        onCancel={() => setConfirmEliminarPrivado(null)}
      />
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[#630027] text-3xl font-black">Chat</h1>
            <HelpIcon section="chat" />
          </div>
          <p className="text-gray-400 text-sm mt-1">Mensajes de la peña</p>
        </div>
        <div className="flex gap-2">
          {puedeConfigurar && vista === "grupos" && (
            <Button onClick={() => setFormGrupo({ nombre: "", descripcion: "" })} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl h-9 px-4 text-sm">
              <Plus className="w-4 h-4 mr-1" /> Grupo
            </Button>
          )}
        </div>
      </div>

      {/* Tabs grupos / privados / bot */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setVista("grupos")} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${vista === "grupos" ? "bg-[#630027] text-white border-[#630027]" : "bg-white text-gray-600 border-gray-200"}`}>
          <Users className="w-4 h-4 inline mr-1" /> Grupos
        </button>
        <button onClick={() => setVista("privados")} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${vista === "privados" ? "bg-[#630027] text-white border-[#630027]" : "bg-white text-gray-600 border-gray-200"}`}>
          <Lock className="w-4 h-4 inline mr-1" /> Privados
        </button>
        <button onClick={() => setVista("bot")} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${vista === "bot" ? "bg-[#630027] text-white border-[#630027]" : "bg-white text-gray-600 border-gray-200"}`}>
          <Bot className="w-4 h-4 inline mr-1" /> Cholín
        </button>
      </div>

      <AnimatePresence>
        {formGrupo && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3">
            <Input placeholder="Nombre del grupo *" className="rounded-xl border-gray-200" value={formGrupo.nombre} onChange={(e) => setFormGrupo((v) => ({ ...v, nombre: e.target.value }))} autoFocus />
            <Input placeholder="Descripción (opcional)" className="rounded-xl border-gray-200" value={formGrupo.descripcion} onChange={(e) => setFormGrupo((v) => ({ ...v, descripcion: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setFormGrupo(null)} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleCrearGrupo} disabled={!formGrupo.nombre?.trim()} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Crear</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {vista === "grupos" && (
        <div className="space-y-3">
          {gruposPublicos.map((grupo) => (
            <motion.div key={grupo.id} whileHover={{ scale: 1.01 }} onClick={() => { setGrupoActivo(grupo); setInfoGrupo(false); }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden ${!grupo.avatar_url && (grupo.es_general ? "bg-[#630027]" : "bg-gray-100")}`}>
                {grupo.avatar_url
                  ? <img src={grupo.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <Users className={`w-6 h-6 ${grupo.es_general ? "text-white" : "text-gray-400"}`} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#630027] font-bold">{grupo.nombre}</p>
                {grupo.descripcion && <p className="text-xs text-gray-400 truncate">{grupo.descripcion}</p>}
              </div>
              <div className="flex gap-1.5">
                {grupo.es_general && <span className="bg-[#630027]/10 text-[#630027] px-2 py-0.5 text-xs font-semibold rounded-full">General</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {vista === "bot" && (
        <div>
          {grupoBot ? (
            <motion.div whileHover={{ scale: 1.01 }} onClick={() => { setGrupoActivo(grupoBot); setInfoGrupo(false); }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#630027]">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#630027] font-bold">{BOT_NOMBRE}</p>
                <p className="text-xs text-gray-400">Asistente de la Peña El Chole</p>
              </div>
              <span className="bg-[#630027]/10 text-[#630027] px-2 py-0.5 text-xs font-semibold rounded-full">Bot</span>
            </motion.div>
          ) : (
            <div className="text-center py-10 text-gray-300 text-sm">Cargando...</div>
          )}
        </div>
      )}

      {vista === "privados" && (
        <div className="space-y-3">
          <Button onClick={() => setMostrarNuevoPrivado(v => !v)} className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl h-9 text-sm">
            <Plus className="w-4 h-4 mr-1" /> Nuevo chat privado
          </Button>

          <AnimatePresence>
            {mostrarNuevoPrivado && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Iniciar chat con...</p>
                {integrantesParaPrivado.map(i => (
                  <button key={i.id} onClick={() => handleIniciarPrivado(i)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#630027]/5 transition-colors text-left">
                    <div className="w-8 h-8 rounded-full bg-[#630027]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#630027] font-bold text-sm">{i.nombre[0]?.toUpperCase()}</span>
                    </div>
                    <span className="font-medium text-gray-700 text-sm">{i.nombre}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {gruposPrivados.length === 0 && !mostrarNuevoPrivado && (
            <div className="text-center py-10 text-gray-300">
              <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aún no tienes chats privados</p>
            </div>
          )}

          {gruposPrivados.map((grupo) => {
            const otroId = grupo.participantes?.find(p => p !== usuarioId);
            const otro = integrantes.find(i => i.id === otroId);
            // Mostrar siempre el nombre del otro participante, no el nombre del grupo
            const nombreMostrar = otro?.nombre || (grupo.participantes?.filter(p => p !== usuarioId)?.[0]) || grupo.nombre;
            const handleEliminarPrivado = (e) => {
              e.stopPropagation();
              setConfirmEliminarPrivado({ grupo, nombre: nombreMostrar });
            };
            return (
              <motion.div key={grupo.id} whileHover={{ scale: 1.01 }} onClick={() => { setGrupoActivo(grupo); setInfoGrupo(false); }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-[#630027]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#630027] font-bold text-lg">{nombreMostrar?.[0]?.toUpperCase() || "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#630027] font-bold">{nombreMostrar}</p>
                  <p className="text-xs text-gray-400">Chat privado</p>
                </div>
                <button onClick={handleEliminarPrivado} className="p-1.5 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}