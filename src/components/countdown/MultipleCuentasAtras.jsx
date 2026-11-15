import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pin, Trash2, ChevronDown, ChevronUp, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import CountdownDisplay from "./CountdownDisplay";

function calculateTimeLeft(target) {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  let years = target.getFullYear() - now.getFullYear();
  let months = target.getMonth() - now.getMonth();
  let totalMonths = years * 12 + months;
  const tempDate = new Date(now);
  tempDate.setMonth(tempDate.getMonth() + totalMonths);
  if (tempDate > target) { totalMonths--; tempDate.setMonth(tempDate.getMonth() - 1); }
  const remainingMs = target.getTime() - tempDate.getTime();
  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(remainingMs % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
  const minutes = Math.floor(remainingMs % (1000 * 60 * 60) / (1000 * 60));
  const seconds = Math.floor(remainingMs % (1000 * 60) / 1000);
  return { months: totalMonths, days, hours, minutes, seconds };
}

function FormCuentaAtras({ inicial, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(inicial?.nombre_evento || "");
  const [fecha, setFecha] = useState(inicial?.fecha_objetivo ? new Date(inicial.fecha_objetivo) : null);
  const [horaActiva, setHoraActiva] = useState(() => {
    if (!inicial?.fecha_objetivo) return false;
    const d = new Date(inicial.fecha_objetivo);
    return !(d.getHours() === 23 && d.getMinutes() === 59);
  });
  const [hora, setHora] = useState(() => {
    if (!inicial?.fecha_objetivo) return "00:00";
    const d = new Date(inicial.fecha_objetivo);
    if (d.getHours() === 23 && d.getMinutes() === 59) return "00:00";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!fecha) return;
    setGuardando(true);
    const objetivo = new Date(fecha);
    if (horaActiva && hora) {
      const [h, m] = hora.split(":").map(Number);
      objetivo.setHours(h, m, 0, 0);
    } else {
      objetivo.setHours(23, 59, 59, 999);
    }
    await onGuardar({ nombre_evento: nombre, fecha_objetivo: objetivo.toISOString() });
    setGuardando(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5 space-y-4 w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-[#630027] text-lg">{inicial ? "Editar evento" : "Nuevo evento"}</h3>
        <button onClick={onCancelar} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <div>
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nombre del evento</Label>
        <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Feria de Sevilla 2026" className="rounded-xl border-gray-200" />
      </div>
      <div>
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Fecha objetivo</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start rounded-xl border-gray-200 font-normal">
              <CalendarDays className="w-4 h-4 mr-2 text-[#630027]/60" />
              {fecha ? format(fecha, "d 'de' MMMM, yyyy", { locale: es }) : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-0 z-50" align="center">
            <Calendar mode="single" selected={fecha} onSelect={setFecha} weekStartsOn={1} locale={es} className="rounded-2xl" />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <button
            type="button"
            onClick={() => setHoraActiva(v => !v)}
            className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${horaActiva ? "bg-[#630027]" : "bg-gray-200"}`}
          >
            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${horaActiva ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer" onClick={() => setHoraActiva(v => !v)}>
            Hora específica
          </Label>
        </div>
        {horaActiva && (
          <input
            type="time"
            value={hora}
            onChange={e => setHora(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"
          />
        )}
      </div>
      <Button
        onClick={handleGuardar}
        disabled={!fecha || guardando}
        className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl"
      >
        {guardando ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}

export default function MultipleCuentasAtras({ puedeConfigurar }) {
  const [cuentas, setCuentas] = useState([]);
  const [fijadaId, setFijadaId] = useState(null);
  const [timeLeftMap, setTimeLeftMap] = useState({});
  const [mostrarResto, setMostrarResto] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState(null); // cuenta a editar

  const cargar = async () => {
    const todas = await api.entities.CuentaAtras.list("-created_date");
    setCuentas(todas);
    // La fijada: preferencia en localStorage, o la primera
    const storedFijada = localStorage.getItem("pena_cuenta_fijada");
    if (storedFijada && todas.find(c => c.id === storedFijada)) {
      setFijadaId(storedFijada);
    } else if (todas.length > 0) {
      setFijadaId(todas[0].id);
    }
  };

  useEffect(() => { cargar(); }, []);

  // Tick por segundo para todas las cuentas
  useEffect(() => {
    if (cuentas.length === 0) return;
    const tick = () => {
      const map = {};
      cuentas.forEach(c => {
        if (c.fecha_objetivo) map[c.id] = calculateTimeLeft(new Date(c.fecha_objetivo));
      });
      setTimeLeftMap(map);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cuentas]);

  const fijar = (id) => {
    setFijadaId(id);
    localStorage.setItem("pena_cuenta_fijada", id);
  };

  const crear = async (datos) => {
    const nueva = await api.entities.CuentaAtras.create(datos);
    await cargar();
    fijar(nueva.id);
    setFormOpen(false);
  };

  const actualizar = async (datos) => {
    await api.entities.CuentaAtras.update(editando.id, datos);
    setEditando(null);
    await cargar();
  };

  const eliminar = async (id) => {
    await api.entities.CuentaAtras.delete(id);
    const restantes = cuentas.filter(c => c.id !== id);
    if (fijadaId === id) {
      const nueva = restantes[0];
      setFijadaId(nueva?.id || null);
      if (nueva) localStorage.setItem("pena_cuenta_fijada", nueva.id);
      else localStorage.removeItem("pena_cuenta_fijada");
    }
    await cargar();
  };

  const fijada = cuentas.find(c => c.id === fijadaId);
  const resto = cuentas.filter(c => c.id !== fijadaId);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Formulario nueva cuenta */}
      <AnimatePresence>
        {formOpen && !editando && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 w-full max-w-sm">
            <FormCuentaAtras onGuardar={crear} onCancelar={() => setFormOpen(false)} />
          </motion.div>
        )}
        {editando && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 w-full max-w-sm">
            <FormCuentaAtras inicial={editando} onGuardar={actualizar} onCancelar={() => setEditando(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cuenta fijada */}
      {fijada ? (
        <div className="w-full text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-[#630027] text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
              {fijada.nombre_evento || "Cuenta Atrás"}
            </h1>
            {puedeConfigurar && (
              <button onClick={() => setEditando(fijada)} className="p-1.5 rounded-xl hover:bg-[#630027]/10 transition-colors flex-shrink-0" title="Editar">
                <Settings className="w-4 h-4 text-[#630027]/40 hover:text-[#630027]" />
              </button>
            )}
          </div>
          {fijada.fecha_objetivo && (
            <p className="text-[#4B1924]/40 text-sm font-medium tracking-wide mb-6">
              {new Date(fijada.fecha_objetivo).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
          {timeLeftMap[fijada.id] && <CountdownDisplay timeLeft={timeLeftMap[fijada.id]} />}
        </div>
      ) : (
        <div className="text-center mb-8">
          <motion.div animate={{ scale: [1, 1.06, 1], rotate: [0, 4, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#4B1924]/5 flex items-center justify-center">
            <span className="text-4xl">⏱️</span>
          </motion.div>
          <p className="text-[#4B1924]/30 text-sm max-w-xs mx-auto">
            {puedeConfigurar ? "Pulsa el botón para añadir la primera cuenta atrás" : "No hay ningún evento configurado"}
          </p>
        </div>
      )}

      {/* Acciones admin */}
      {puedeConfigurar && (
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => { setFormOpen(v => !v); setEditando(null); }}
            variant="outline"
            className="border-[#630027]/20 text-[#630027] hover:bg-[#630027]/5 rounded-xl h-9 text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Añadir evento
          </Button>
        </div>
      )}

      {/* Resto de cuentas en cascada */}
      {resto.length > 0 && (
        <div className="w-full max-w-md">
          <button
            onClick={() => setMostrarResto(v => !v)}
            className="flex items-center gap-2 text-sm text-[#630027]/50 hover:text-[#630027] transition-colors mx-auto mb-3"
          >
            {mostrarResto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {mostrarResto ? "Ocultar" : `Ver ${resto.length} evento${resto.length > 1 ? "s" : ""} más`}
          </button>
          <AnimatePresence initial={false}>
            {mostrarResto && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden space-y-3"
              >
                {resto.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-[#630027] text-sm">{c.nombre_evento || "Evento sin nombre"}</p>
                        {c.fecha_objetivo && (
                          <p className="text-xs text-gray-400">
                            {new Date(c.fecha_objetivo).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {puedeConfigurar && (
                          <>
                            <button onClick={() => fijar(c.id)} title="Fijar como principal" className="p-1.5 rounded-xl hover:bg-[#630027]/10 transition-colors">
                              <Pin className="w-3.5 h-3.5 text-[#630027]/40 hover:text-[#630027]" />
                            </button>
                            <button onClick={() => setEditando(c)} title="Editar" className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                              <Settings className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                            </button>
                            <button onClick={() => eliminar(c.id)} title="Eliminar" className="p-1.5 rounded-xl hover:bg-red-50 transition-colors">
                              <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {timeLeftMap[c.id] && (
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { v: timeLeftMap[c.id].months, l: "m" },
                          { v: timeLeftMap[c.id].days, l: "d" },
                          { v: timeLeftMap[c.id].hours, l: "h" },
                          { v: timeLeftMap[c.id].minutes, l: "min" },
                          { v: timeLeftMap[c.id].seconds, l: "s" },
                        ].map(({ v, l }) => (
                          <div key={l} className="bg-[#630027]/5 rounded-xl px-3 py-1.5 text-center min-w-[40px]">
                            <p className="text-[#630027] font-bold text-lg tabular-nums leading-none">{String(v).padStart(2, "0")}</p>
                            <p className="text-[#630027]/40 text-[9px] font-semibold uppercase">{l}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {puedeConfigurar && (
                      <button
                        onClick={() => fijar(c.id)}
                        className="mt-3 w-full text-xs text-[#630027]/50 hover:text-[#630027] border border-dashed border-[#630027]/20 hover:border-[#630027]/40 rounded-xl py-1.5 transition-colors"
                      >
                        <Pin className="w-3 h-3 inline mr-1" /> Fijar como principal
                      </button>
                    )}
                  </div>
                ))}
                {/* Eliminar la fijada también desde aquí */}
                {puedeConfigurar && fijada && (
                  <button
                    onClick={() => eliminar(fijada.id)}
                    className="w-full text-xs text-red-400/60 hover:text-red-500 border border-dashed border-red-200/50 hover:border-red-300 rounded-xl py-1.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" /> Eliminar evento principal
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Opción eliminar cuando solo hay una */}
      {puedeConfigurar && fijada && resto.length === 0 && (
        <button
          onClick={() => eliminar(fijada.id)}
          className="mt-2 text-xs text-red-400/50 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3 inline mr-1" /> Eliminar evento
        </button>
      )}
    </div>
  );
}