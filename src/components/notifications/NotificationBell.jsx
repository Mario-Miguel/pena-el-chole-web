import React, { useState, useEffect, useRef } from "react";
import { api } from "@/api/client";
import { Bell, MessageCircle, BarChart2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TIPO_EMOJI = { evento: "📅", reunion: "📋", votacion: "🗳️", compra: "🛒", otro: "📢" };

export default function NotificationBell() {
  const { sesion } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [votaciones, setVotaciones] = useState([]);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const integranteId = sesion?.integranteId;

  const cargandoRef = useRef(false);

  const cargar = async () => {
    if (!integranteId || cargandoRef.current) return;
    cargandoRef.current = true;
    setLoading(true);
    const ahora = new Date();
    const hace2h = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const [ns, vs, msgs] = await Promise.all([
      api.entities.Notificacion.filter({ archivada: false }),
      api.entities.Votacion.filter({ completada: false }),
      api.entities.ChatMensaje.list("-created_date", 50),
    ]);
    setNotifs(ns.filter(n => !n.fecha_publicacion || new Date(n.fecha_publicacion) <= ahora));
    setVotaciones(vs);
    setMensajesChat(msgs.filter(m => m.autor_id !== integranteId && new Date(m.created_date) > hace2h));
    setLoading(false);
    cargandoRef.current = false;
  };

  useEffect(() => { if (open) cargar(); }, [open]);

  // Actualizar badge en segundo plano cada 5 minutos
  useEffect(() => {
    if (!integranteId) return;
    cargar();
    const interval = setInterval(cargar, 5 * 60_000);
    return () => clearInterval(interval);
  }, [integranteId]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadNotifs = notifs.filter(n => !(n.leida_por || []).includes(integranteId));
  const badgeCount = unreadNotifs.length + votaciones.length + (mensajesChat.length > 0 ? 1 : 0);

  const marcarLeida = async (notif) => {
    if ((notif.leida_por || []).includes(integranteId)) return;
    await api.entities.Notificacion.update(notif.id, { leida_por: [...(notif.leida_por || []), integranteId] });
    setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, leida_por: [...(n.leida_por || []), integranteId] } : n));
  };

  const hayAlgo = notifs.length > 0 || votaciones.length > 0 || mensajesChat.length > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <Bell className="w-5 h-5 text-white" />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-1/2 -translate-x-1/2 top-16 w-80 max-h-[70vh] overflow-y-auto bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#363636] z-50">
          <div className="p-4 border-b border-gray-100 dark:border-[#363636]">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Novedades</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Mensajes de chat recientes */}
              {mensajesChat.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">Chat</p>
                  <Link
                    to={createPageUrl("Chat")}
                    state={{ grupoId: mensajesChat[0].grupo_id }}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors border-b border-gray-50 dark:border-[#2a2a2a] bg-blue-50 dark:bg-blue-900/10"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                        {mensajesChat.length === 1
                          ? `Mensaje de ${mensajesChat[0].autor_nombre}`
                          : `${mensajesChat.length} mensajes nuevos`}
                      </p>
                      <p className="text-xs text-gray-400">Últimas 2 horas</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  </Link>
                </div>
              )}

              {/* Notificaciones generales */}
              {notifs.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">Notificaciones</p>
                  {notifs.slice(0, 5).map(n => {
                    const leida = (n.leida_por || []).includes(integranteId);
                    return (
                      <Link
                        key={n.id}
                        to={createPageUrl("Notificaciones")}
                        onClick={() => { marcarLeida(n); setOpen(false); }}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors border-b border-gray-50 dark:border-[#2a2a2a] ${!leida ? "bg-[#630027]/5" : ""}`}
                      >
                        <span className="text-lg flex-shrink-0">{TIPO_EMOJI[n.tipo] || "📢"}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${!leida ? "font-bold text-gray-800 dark:text-gray-100" : "font-medium text-gray-600 dark:text-gray-300"}`}>{n.titulo}</p>
                          {n.mensaje && <p className="text-xs text-gray-400 truncate">{n.mensaje}</p>}
                        </div>
                        {!leida && <div className="w-2 h-2 rounded-full bg-[#630027] flex-shrink-0 mt-1.5" />}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Votaciones activas */}
              {votaciones.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">Votaciones activas</p>
                  {votaciones.slice(0, 3).map(v => (
                    <Link
                      key={v.id}
                      to={createPageUrl("Votaciones")}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors border-b border-gray-50 dark:border-[#2a2a2a] bg-amber-50 dark:bg-amber-900/10"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <BarChart2 className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{v.tema}</p>
                        <p className="text-xs text-gray-400">Votación activa — ¡Participa!</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}

              {!hayAlgo && (
                <div className="text-center py-8 text-gray-300 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Sin novedades</p>
                </div>
              )}

              <Link
                to={createPageUrl("Notificaciones")}
                onClick={() => setOpen(false)}
                className="block text-center text-xs text-[#630027] font-semibold py-3 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
              >
                Ver todas las notificaciones →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}