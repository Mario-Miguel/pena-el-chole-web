import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus, Trash2, Check, EyeOff, Users, Archive, Clock, Search, ChevronDown } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/auth/AuthContext";
import { formatDistanceToNow, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";

// Convierte "2026-03-14" + "20:30" a ISO string con timezone local
function localDateTimeToISO(fecha, hora) {
  if (!fecha) return "";
  const dt = new Date(`${fecha}T${hora || "00:00"}:00`);
  return dt.toISOString();
}

// Extrae fecha y hora local desde un ISO string
function isoToLocal(iso) {
  if (!iso) return { fecha: "", hora: "" };
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  const fecha = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { fecha, hora };
}

function DateTimePickerField({ label, value, onChange }) {
  const { fecha, hora } = isoToLocal(value);
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          className="rounded-xl border-gray-200 text-sm"
          value={fecha}
          onChange={e => onChange(e.target.value ? localDateTimeToISO(e.target.value, hora || "00:00") : "")}
        />
        <Input
          type="time"
          className="rounded-xl border-gray-200 text-sm"
          value={hora}
          disabled={!fecha}
          placeholder="HH:MM"
          onChange={e => onChange(e.target.value ? localDateTimeToISO(fecha, e.target.value) : localDateTimeToISO(fecha, "00:00"))}
        />
      </div>
      {value && (
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-[#630027]/60">
            📅 {new Date(value).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
          <button onClick={() => onChange("")} className="text-xs text-gray-300 hover:text-red-400 transition-colors">✕ Quitar</button>
        </div>
      )}
    </div>
  );
}

const TIPO_CONFIG = {
  evento: { emoji: "🎉", color: "bg-purple-100 text-purple-700" },
  reunion: { emoji: "🤝", color: "bg-blue-100 text-blue-700" },
  votacion: { emoji: "🗳️", color: "bg-amber-100 text-amber-700" },
  compra: { emoji: "🛒", color: "bg-green-100 text-green-700" },
  otro: { emoji: "📢", color: "bg-gray-100 text-gray-700" }
};

const DEFAULT_FORM = { titulo: "", mensaje: "", tipo: "otro", fecha_publicacion: "", fecha_archivo: "" };

export default function Notificaciones() {
  const { sesion, puedeConfigurar } = useAuth();
  const usuarioId = sesion?.integranteId || "";
  const [notifs, setNotifs] = useState([]);
  const [programadas, setProgramadas] = useState([]);
  const [archivadas, setArchivadas] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [integrantes, setIntegrantes] = useState([]);
  const [verArchivadas, setVerArchivadas] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const loadData = useCallback(async () => {
    const [ns, ints, vs] = await Promise.all([
      api.entities.Notificacion.list("-created_date"),
      api.entities.Integrante.list(),
      api.entities.Votacion.filter({ completada: false }),
    ]);
    // Mostrar votaciones activas en el feed como "notificaciones" virtuales
    const votacionesComoNotifs = vs.map(v => ({
      id: `vot_${v.id}`,
      titulo: v.tema,
      mensaje: v.descripcion || "Votación activa — ¡Participa!",
      tipo: "votacion",
      leida_por: [],
      archivada: false,
      _es_votacion: true,
      created_date: v.created_date,
    }));
    // Auto-archivar las que ya pasaron su fecha_archivo
    const paraArchivar = ns.filter(n => !n.archivada && n.fecha_archivo && isPast(new Date(n.fecha_archivo)));
    if (paraArchivar.length > 0) {
      await Promise.all(paraArchivar.map(n => api.entities.Notificacion.update(n.id, { archivada: true })));
    }
    const nsFinales = paraArchivar.length > 0 ? await api.entities.Notificacion.list("-created_date") : ns;
    // Notifs activas (publicadas): sin fecha_publicacion o ya pasó
    const activas = nsFinales.filter(n => !n.archivada && (!n.fecha_publicacion || isPast(new Date(n.fecha_publicacion))));
    // Notifs programadas (futuras): solo visibles para quien puede configurar
    const programadas = nsFinales.filter(n => !n.archivada && n.fecha_publicacion && isFuture(new Date(n.fecha_publicacion)));
    // Combinar notifs reales + votaciones activas como notifs virtuales
    setNotifs([...activas, ...votacionesComoNotifs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setProgramadas(programadas);
    setArchivadas(nsFinales.filter(n => n.archivada));
    setIntegrantes(ints);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCrear = async () => {
    if (!form?.titulo?.trim()) return;
    await api.entities.Notificacion.create({
      titulo: form.titulo,
      mensaje: form.mensaje || "",
      tipo: form.tipo || "otro",
      leida_por: [],
      archivada: false,
      fecha_publicacion: form.fecha_publicacion || null,
      fecha_archivo: form.fecha_archivo || null,
    });
    setForm(null);
    loadData();
  };

  const handleEliminar = async (id) => {
    await api.entities.Notificacion.delete(id);
    loadData();
  };

  const handleArchivar = async (notif) => {
    await api.entities.Notificacion.update(notif.id, { archivada: true });
    loadData();
  };

  const handleDesarchivar = async (notif) => {
    await api.entities.Notificacion.update(notif.id, { archivada: false });
    loadData();
  };

  const handleMarcarLeida = async (notif) => {
    if (!usuarioId) return;
    const leidaPor = notif.leida_por || [];
    if (leidaPor.includes(usuarioId)) return;
    await api.entities.Notificacion.update(notif.id, { leida_por: [...leidaPor, usuarioId] });
    loadData();
  };

  const handleMarcarNoLeida = async (notif) => {
    if (!usuarioId) return;
    const leidaPor = (notif.leida_por || []).filter(id => id !== usuarioId);
    await api.entities.Notificacion.update(notif.id, { leida_por: leidaPor });
    loadData();
  };

  const q = busqueda.trim().toLowerCase();
  const notifsFiltradas = q ? notifs.filter(n => n.titulo.toLowerCase().includes(q) || (n.mensaje || "").toLowerCase().includes(q)) : notifs;
  const noLeidas = notifs.filter((n) => !(n.leida_por || []).includes(usuarioId));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#4B1924]/20 border-t-[#4B1924] rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } }}
      className="max-w-2xl mx-auto px-4 py-10"
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.42 } } }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[#630027] text-3xl font-black">Notificaciones</h1>
            <HelpIcon section="notificaciones" />
          </div>
          <p className="text-gray-400 text-sm mt-1">{noLeidas.length > 0 ? `${noLeidas.length} sin leer` : "Todo leído"}</p>
        </div>
        {puedeConfigurar && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
            <Button onClick={() => setForm({ ...DEFAULT_FORM })} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-sm">
              <Plus className="w-4 h-4 mr-1" /> Nueva
            </Button>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {form && (
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3"
          >
            <Input placeholder="Título *" className="rounded-xl border-gray-200" value={form.titulo} onChange={(e) => setForm((v) => ({ ...v, titulo: e.target.value }))} autoFocus />
            <Textarea placeholder="Mensaje (opcional)" className="rounded-xl border-gray-200 resize-none" rows={3} value={form.mensaje} onChange={(e) => setForm((v) => ({ ...v, mensaje: e.target.value }))} />
            <Select value={form.tipo} onValueChange={(val) => setForm((v) => ({ ...v, tipo: val }))}>
              <SelectTrigger className="rounded-xl border-gray-200 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="evento">🎉 Evento</SelectItem>
                <SelectItem value="reunion">🤝 Reunión</SelectItem>
                <SelectItem value="votacion">🗳️ Votación</SelectItem>
                <SelectItem value="compra">🛒 Compra</SelectItem>
                <SelectItem value="otro">📢 Otro</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-3">
              <DateTimePickerField
                label={<><Clock className="w-3 h-3" /> Publicar en (opcional)</>}
                value={form.fecha_publicacion}
                onChange={val => setForm(v => ({ ...v, fecha_publicacion: val }))}
              />
              <DateTimePickerField
                label={<><Archive className="w-3 h-3" /> Archivar en (opcional)</>}
                value={form.fecha_archivo}
                onChange={val => setForm(v => ({ ...v, fecha_archivo: val }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setForm(null)} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleCrear} disabled={!form.titulo?.trim()} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Publicar</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Programadas - solo visibles para admins */}
      {puedeConfigurar && programadas.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> Programadas ({programadas.length})
          </p>
          {programadas.map(notif => {
            const cfg = TIPO_CONFIG[notif.tipo] || TIPO_CONFIG.otro;
            return (
              <div key={notif.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 opacity-80">
                <span className="text-xl flex-shrink-0">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-700">{notif.titulo}</p>
                  {notif.mensaje && <p className="text-xs text-gray-400 mt-0.5">{notif.mensaje}</p>}
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Se publica el {new Date(notif.fecha_publicacion).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => handleEliminar(notif.id)} className="text-gray-200 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar notificación..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20 bg-white"
        />
      </div>

      {notifs.length === 0 && archivadas.length === 0 && programadas.length === 0 ? (
        <motion.div
          variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1, transition: { duration: 0.35 } } }}
          className="text-center py-16"
        >
          <motion.p
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl mb-3"
          >🔔</motion.p>
          <p className="text-gray-300 text-sm">No hay notificaciones</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {notifsFiltradas.map((notif, i) => {
            const leida = (notif.leida_por || []).includes(usuarioId);
            const cfg = TIPO_CONFIG[notif.tipo] || TIPO_CONFIG.otro;
            return (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: i * 0.05 }}
                whileHover={{ y: -1, boxShadow: leida ? "none" : "0 4px 16px rgba(99,0,39,0.09)" }}
                className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${leida ? "border-gray-100 opacity-70" : "border-[#630027]/20"}`}
              >
                <div className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">{cfg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className={`font-bold text-sm ${!leida ? "text-gray-800" : "text-gray-500"}`}>{notif.titulo}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{notif.tipo}</span>
                    </div>
                    {notif.mensaje && <p className="text-xs text-gray-500 leading-relaxed">{notif.mensaje}</p>}
                    <p className="text-xs text-gray-300 mt-1">{formatDistanceToNow(new Date(notif.created_date), { addSuffix: true, locale: es })}</p>
                    {notif.fecha_archivo && (
                      <p className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                        <Archive className="w-3 h-3" /> Se archiva {formatDistanceToNow(new Date(notif.fecha_archivo), { addSuffix: true, locale: es })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {!notif._es_votacion && !leida && usuarioId &&
                      <button onClick={() => handleMarcarLeida(notif)} className="text-gray-300 hover:text-green-500 transition-colors" title="Marcar como leída">
                        <Check className="w-4 h-4" />
                      </button>}
                    {!notif._es_votacion && leida && usuarioId &&
                      <button onClick={() => handleMarcarNoLeida(notif)} className="text-gray-300 hover:text-amber-500 transition-colors" title="Marcar como no leída">
                        <EyeOff className="w-4 h-4" />
                      </button>}
                    {!notif._es_votacion && puedeConfigurar && (
                      <button onClick={() => handleArchivar(notif)} className="text-gray-200 hover:text-amber-500 transition-colors" title="Archivar">
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    {!notif._es_votacion && puedeConfigurar &&
                      <button onClick={() => handleEliminar(notif.id)} className="text-gray-200 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>}
                  </div>
                </div>
                {puedeConfigurar && (notif.leida_por || []).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-300 flex items-center gap-1 flex-wrap">
                      <Users className="w-3 h-3 flex-shrink-0" /> Leído por:{" "}
                      {(notif.leida_por || []).map((id, i) => {
                        const ing = integrantes.find(x => x.id === id);
                        return (i > 0 ? ", " : "") + (ing?.nombre || id);
                      })}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Archivadas */}
          {archivadas.length > 0 && (
            <div className="pt-2">
              <motion.button
                onClick={() => setVerArchivadas(v => !v)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 font-semibold mb-3 transition-colors"
              >
                <Archive className="w-4 h-4" />
                Archivadas ({archivadas.length})
                <motion.span animate={{ rotate: verArchivadas ? 180 : 0 }} transition={{ duration: 0.22 }}>
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {verArchivadas && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2">
                    {archivadas.map(notif => {
                      const cfg = TIPO_CONFIG[notif.tipo] || TIPO_CONFIG.otro;
                      return (
                        <div key={notif.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex gap-3 opacity-60">
                          <span className="text-xl flex-shrink-0">{cfg.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-600 line-through">{notif.titulo}</p>
                            {notif.mensaje && <p className="text-xs text-gray-400">{notif.mensaje}</p>}
                          </div>
                          {puedeConfigurar && (
                            <div className="flex flex-col gap-1">
                              <button onClick={() => handleDesarchivar(notif)} className="text-gray-300 hover:text-blue-400 transition-colors" title="Desarchivar">
                                <EyeOff className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEliminar(notif.id)} className="text-gray-200 hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}