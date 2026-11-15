import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  AlertTriangle, ExternalLink, Thermometer, Wind, RefreshCw,
  Settings, X, Plus, Check, GripVertical
} from "lucide-react";
import { getPref } from "../../lib/uiPrefs";

// ─── Definición de todos los widgets disponibles ──────────────
const TODOS_LOS_WIDGETS = [
  { id: "fondos",      label: "Resumen de fondos",      emoji: "💰" },
  { id: "kpis",        label: "Resumen rápido",         emoji: "📊" },
  { id: "clima",       label: "Tiempo en Valdesoto",    emoji: "🌤️" },
  { id: "accesos",     label: "Accesos rápidos",        emoji: "⚡" },
  { id: "compras",     label: "Últimas compras",        emoji: "🛒" },
  { id: "caja",        label: "Caja reciente",          emoji: "💳" },
  { id: "votaciones",  label: "Votaciones activas",     emoji: "🗳️" },
  { id: "sugerencias", label: "Nuevas sugerencias",     emoji: "💡" },
  { id: "stockbajo",   label: "Alerta stock bajo",      emoji: "⚠️" },
  { id: "notifs",      label: "Notificaciones",         emoji: "🔔" },
  { id: "tareas",      label: "Tareas pendientes",      emoji: "✅" },
  { id: "cerveza",     label: "Control de cerveza",     emoji: "🍺" },
  { id: "chat",        label: "Mensajes recientes",     emoji: "💬" },
  { id: "vehiculos",   label: "Vehículos",              emoji: "🚗" },
  { id: "integrantes", label: "Integrantes",            emoji: "👥" },
  { id: "actividades", label: "Próximas actividades",   emoji: "🎯" },
  { id: "cumpleanos",  label: "Próximos cumpleaños",    emoji: "🎂" },
];

// Por defecto solo vacío — la cuenta atrás vive en Inicio.jsx
const WIDGETS_DEFAULT = [];
const LS_KEY_ACTIVOS = "pena_widgets_activos_v2";
const LS_KEY_ORDEN   = "pena_widgets_orden_v2";

function getGuardado(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    if (s) return JSON.parse(s);
  } catch {}
  return fallback;
}

// ─── Accesos rápidos ──────────────────────────────────────────
const ACCESOS_RAPIDOS = [
  { label: "Inventario", emoji: "📦", path: "Almacen" },
  { label: "Finanzas",   emoji: "💰", path: "Finanzas" },
  { label: "Calendario", emoji: "📅", path: "Calendario" },
  { label: "Integrantes",emoji: "👥", path: "Integrantes" },
  { label: "Chat",       emoji: "💬", path: "Chat" },
  { label: "Desfile",    emoji: "🎪", path: "Desfile" },
  { label: "Cerveza",    emoji: "🍺", path: "Cerveza" },
  { label: "Seguridad",  emoji: "🚑", path: "Seguridad" },
];

// ─── Widget: Clima ────────────────────────────────────────────
function WidgetClima() {
  const [clima, setClima] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=43.37&longitude=-5.65&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh&timezone=Europe%2FMadrid")
      .then(r => r.json())
      .then(data => {
        const c = data.current;
        const code = c.weather_code;
        let desc = "Despejado", icon = "☀️";
        if (code >= 71) { desc = "Nieve"; icon = "❄️"; }
        else if (code >= 61) { desc = "Lluvia"; icon = "🌧️"; }
        else if (code >= 51) { desc = "Llovizna"; icon = "🌦️"; }
        else if (code >= 45) { desc = "Niebla"; icon = "🌫️"; }
        else if (code >= 3)  { desc = "Nublado"; icon = "☁️"; }
        else if (code >= 1)  { desc = "Parcialmente nublado"; icon = "⛅"; }
        setClima({ temp: Math.round(c.temperature_2m), hum: c.relative_humidity_2m, viento: Math.round(c.wind_speed_10m), desc, icon });
      })
      .catch(() => setClima(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-gray-300 text-xs"><RefreshCw className="w-3 h-3 animate-spin" /> Cargando...</div>;
  if (!clima) return <p className="text-gray-300 text-xs">No disponible</p>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{clima.icon}</span>
        <div>
          <p className="text-2xl font-black text-gray-800">{clima.temp}°C</p>
          <p className="text-xs text-gray-400">{clima.desc}</p>
        </div>
      </div>
      <div className="flex gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{clima.viento} km/h</span>
        <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" />{clima.hum}% hum.</span>
      </div>
      <p className="text-[10px] text-gray-300 mt-1">Valdesoto, Siero</p>
    </div>
  );
}

// ─── Tarjeta base ─────────────────────────────────────────────
function WidgetCard({ title, emoji, children, dragHandle }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>{emoji}</span> {title}
        </p>
        {dragHandle}
      </div>
      {children}
    </div>
  );
}

// ─── Renderizador de contenido por widget ─────────────────────
function calcDiasHastaCumple(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const parts = fechaNacimiento.split("-");
  if (parts.length !== 3) return null;
  const mes = parseInt(parts[1]), dia = parseInt(parts[2]);
  if (!mes || !dia) return null;
  const hoy = new Date();
  let sig = new Date(hoy.getFullYear(), mes - 1, dia);
  if (sig < hoy) sig = new Date(hoy.getFullYear() + 1, mes - 1, dia);
  return Math.ceil((sig - hoy) / (1000 * 60 * 60 * 24));
}

const WidgetContent = React.memo(function WidgetContent({ id, datos }) {
  const { compras, movimientos, votaciones, sugerencias, tareas, stockBajo,
          msgsRecientes, notifsVisibles, cervezas, integrantes, vehiculos, actividades, cumpleanos, fondos } = datos;

  switch (id) {
    case "fondos": {
      const { gastos, loteria, cuotas, subvenciones, cerveza, premio, otros, saldo } = fondos || {};
      const ingresos = (loteria||0) + (cuotas||0) + (subvenciones||0) + (cerveza||0) + (premio||0) + (otros||0);
      const lineas = [
        { label: "Lotería",      val: loteria||0,      color: "text-[#630027]",   emoji: "🎟️" },
        { label: "Cuotas",       val: cuotas||0,       color: "text-blue-600",    emoji: "💵" },
        { label: "Subvenciones", val: subvenciones||0, color: "text-emerald-600", emoji: "🏛️" },
        { label: "Premio/otros", val: (premio||0)+(otros||0), color: "text-purple-600", emoji: "🏆" },
        { label: "Cerveza",      val: cerveza||0,      color: "text-amber-600",   emoji: "🍺" },
      ].filter(l => l.val > 0);
      return (
        <div className="space-y-2">
          {/* Saldo total destacado */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Saldo neto</span>
            <span className={`text-base font-black ${(saldo||0) >= 0 ? "text-green-600" : "text-red-500"}`}>{(saldo||0) >= 0 ? "+" : ""}{(saldo||0).toFixed(2)}€</span>
          </div>
          {/* Ingresos desglosados */}
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Ingresos <span className="text-green-600 font-bold">+{ingresos.toFixed(2)}€</span></p>
            {lineas.length === 0 && <p className="text-[10px] text-gray-300">Sin ingresos registrados</p>}
            {lineas.map(l => (
              <div key={l.label} className="flex items-center justify-between py-0.5">
                <span className="text-[10px] text-gray-500 flex items-center gap-1"><span>{l.emoji}</span>{l.label}</span>
                <span className={`text-[11px] font-bold ${l.color}`}>+{l.val.toFixed(2)}€</span>
              </div>
            ))}
          </div>
          {/* Gastos */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2">
            <span className="text-[10px] text-gray-500 flex items-center gap-1"><span>📉</span>Gastos</span>
            <span className="text-[11px] font-bold text-red-500">-{(gastos||0).toFixed(2)}€</span>
          </div>
          <Link to={createPageUrl("Finanzas")} className="text-[10px] text-[#630027] underline block">Ver finanzas →</Link>
        </div>
      );
    }

    case "kpis":
      return (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Tareas",     val: tareas.length,        emoji: "✅", path: "Organizacion", color: tareas.length > 0 ? "text-amber-600" : "text-green-600" },
            { label: "Stock bajo", val: stockBajo.length,     emoji: "⚠️", path: "Almacen",      color: stockBajo.length > 0 ? "text-red-500" : "text-green-600" },
            { label: "Votaciones", val: votaciones.length,    emoji: "🗳️", path: "Comunidad",    color: "text-[#630027]" },
            { label: "Chat nuevo", val: msgsRecientes.length, emoji: "💬", path: "Chat",         color: msgsRecientes.length > 0 ? "text-blue-500" : "text-gray-400" },
          ].map(k => (
            <Link key={k.label} to={createPageUrl(k.path)} className="bg-gray-50 rounded-xl p-2 text-center block hover:bg-gray-100 transition-colors">
              <p className="text-base">{k.emoji}</p>
              <p className={`text-lg font-black ${k.color}`}>{k.val}</p>
              <p className="text-[9px] text-gray-400 leading-tight">{k.label}</p>
            </Link>
          ))}
        </div>
      );

    case "clima":
      return <WidgetClima />;

    case "accesos":
      return (
        <div className="grid grid-cols-4 gap-1.5">
          {ACCESOS_RAPIDOS.map(a => (
            <Link key={a.path} to={createPageUrl(a.path)} className="flex flex-col items-center gap-0.5 p-1 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-lg">{a.emoji}</span>
              <span className="text-[9px] text-gray-400 text-center leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      );

    case "compras":
      return compras.length === 0
        ? <p className="text-gray-300 text-xs">Sin registros</p>
        : <div className="space-y-1.5">
            {compras.slice(0, 3).map(c => (
              <div key={c.id} className="flex items-center justify-between gap-1">
                <span className="text-xs text-gray-600 truncate flex-1">{c.nombre}</span>
                <span className={`text-[10px] font-semibold flex-shrink-0 ${c.comprado ? "text-green-500" : "text-amber-500"}`}>{c.comprado ? "✓" : "⏳"}</span>
              </div>
            ))}
            <Link to={createPageUrl("Almacen")} className="text-[10px] text-[#630027] underline">Ver todo →</Link>
          </div>;

    case "caja":
      return movimientos.length === 0
        ? <p className="text-gray-300 text-xs">Sin movimientos</p>
        : <div className="space-y-1.5">
            {movimientos.slice(0, 3).map(m => (
              <div key={m.id} className="flex items-center justify-between gap-1">
                <span className="text-xs text-gray-600 truncate flex-1">{m.concepto || m.categoria}</span>
                <span className={`text-xs font-bold flex-shrink-0 ${m.tipo === "ingreso" ? "text-green-600" : "text-red-500"}`}>
                  {m.tipo === "ingreso" ? "+" : "-"}{Math.abs(m.importe || 0).toFixed(0)}€
                </span>
              </div>
            ))}
            <Link to={createPageUrl("Finanzas")} className="text-[10px] text-[#630027] underline">Ver todo →</Link>
          </div>;

    case "votaciones":
      return votaciones.length === 0
        ? <p className="text-gray-300 text-xs">Sin votaciones activas</p>
        : <div className="space-y-1.5">
            {votaciones.slice(0, 3).map(v => (
              <div key={v.id} className="text-xs text-gray-600 truncate">{v.tema}</div>
            ))}
            <Link to={createPageUrl("Comunidad")} className="text-[10px] text-[#630027] underline">Ir a votar →</Link>
          </div>;

    case "sugerencias":
      return sugerencias.length === 0
        ? <p className="text-gray-300 text-xs">Sin sugerencias recientes</p>
        : <div className="space-y-1.5">
            {sugerencias.slice(0, 3).map(s => (
              <div key={s.id} className="text-xs text-gray-600 truncate">{s.titulo}</div>
            ))}
            <Link to={createPageUrl("Comunidad")} className="text-[10px] text-[#630027] underline">Ver más →</Link>
          </div>;

    case "stockbajo":
      return stockBajo.length === 0
        ? <p className="text-gray-300 text-xs">Todo el stock en orden ✅</p>
        : <div className="space-y-1.5">
            {stockBajo.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-center justify-between gap-1">
                <span className="text-xs text-red-600 truncate flex-1">{a.nombre}</span>
                <span className="text-[10px] text-red-400 flex-shrink-0">{a.cantidad} uds.</span>
              </div>
            ))}
            <Link to={createPageUrl("Almacen")} className="text-[10px] text-[#630027] underline">Ver almacén →</Link>
          </div>;

    case "notifs":
      return notifsVisibles.length === 0
        ? <p className="text-gray-300 text-xs">Sin notificaciones nuevas</p>
        : <div className="space-y-1.5">
            {notifsVisibles.map(n => (
              <div key={n.id} className="text-xs text-gray-600 truncate">{n.titulo}</div>
            ))}
            <Link to={createPageUrl("Notificaciones")} className="text-[10px] text-[#630027] underline">Ver todo →</Link>
          </div>;

    case "tareas":
      return tareas.length === 0
        ? <p className="text-gray-300 text-xs">Sin tareas pendientes 🎉</p>
        : <div className="space-y-1.5">
            {tareas.slice(0, 3).map(t => (
              <div key={t.id} className="text-xs text-gray-600 truncate">{t.nombre}</div>
            ))}
            <Link to={createPageUrl("Organizacion")} className="text-[10px] text-[#630027] underline">Ver todo →</Link>
          </div>;

    case "cerveza":
      return (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Total consumido</span>
            <span className="text-lg font-black text-[#630027]">{cervezas.total} 🍺</span>
          </div>
          {cervezas.top.length > 0 && (
            <div className="space-y-1">
              {cervezas.top.map((e, i) => (
                <div key={e.id} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-300 w-3">{i + 1}.</span>
                  <span className="text-xs text-gray-600 flex-1 truncate">{e.nombre}</span>
                  <span className="text-xs font-bold text-[#630027]">{e.cervezas}</span>
                </div>
              ))}
            </div>
          )}
          <Link to={createPageUrl("Cerveza")} className="text-[10px] text-[#630027] underline mt-1.5 block">Ver más →</Link>
        </div>
      );

    case "chat":
      return msgsRecientes.length === 0
        ? <p className="text-gray-300 text-xs">Sin mensajes nuevos</p>
        : <div className="space-y-1.5">
            {msgsRecientes.slice(0, 3).map(m => (
              <div key={m.id} className="flex items-start gap-1.5">
                <span className="text-[10px] text-gray-400 font-semibold flex-shrink-0 mt-0.5">{m.autor_nombre?.split(" ")[0] || "?"}</span>
                <span className="text-xs text-gray-600 truncate">{m.texto}</span>
              </div>
            ))}
            <Link to={createPageUrl("Chat")} className="text-[10px] text-[#630027] underline">Abrir chat →</Link>
          </div>;

    case "vehiculos":
      return vehiculos.length === 0
        ? <p className="text-gray-300 text-xs">Sin vehículos registrados</p>
        : <div className="space-y-1.5">
            {vehiculos.slice(0, 3).map(v => (
              <div key={v.id} className="flex items-center justify-between gap-1">
                <span className="text-xs text-gray-600 truncate flex-1">{v.nombre || v.matricula}</span>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{v.matricula}</span>
              </div>
            ))}
            <Link to={createPageUrl("Vehiculos")} className="text-[10px] text-[#630027] underline">Ver todos →</Link>
          </div>;

    case "integrantes":
      return (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Total integrantes</span>
            <span className="text-xl font-black text-[#630027]">{integrantes.total}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {integrantes.resumen.map(r => (
              <span key={r.cat} className="text-[10px] bg-gray-50 px-2 py-0.5 rounded-full text-gray-500">{r.emoji} {r.count}</span>
            ))}
          </div>
          <Link to={createPageUrl("Integrantes")} className="text-[10px] text-[#630027] underline mt-1.5 block">Ver todos →</Link>
        </div>
      );

    case "cumpleanos":
      return (
        cumpleanos.length === 0
          ? <p className="text-gray-300 text-xs">Sin cumpleaños próximos</p>
          : <div className="space-y-2">
              {cumpleanos.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-700 truncate flex-1 font-medium">{c.nombre}</span>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {c.dias === 0 ? "🎉 Hoy!" : c.dias === 1 ? "Mañana" : `${c.dias}d`}
                  </span>
                  <span className="text-[10px] text-gray-300 flex-shrink-0">
                    {c.fecha_display}
                  </span>
                </div>
              ))}
            </div>
      );

    case "actividades":
      return actividades.length === 0
        ? <p className="text-gray-300 text-xs">Sin actividades próximas</p>
        : <div className="space-y-1.5">
            {actividades.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-start gap-2">
                <span className="text-base flex-shrink-0 mt-0.5">🎯</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 font-semibold truncate">{a.titulo}</p>
                  {a.fecha && <p className="text-[10px] text-gray-400">{new Date(a.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</p>}
                </div>
                <span className="text-[10px] text-gray-300 flex-shrink-0">{(a.inscritos_ids||[]).length} ins.</span>
              </div>
            ))}
            <Link to={createPageUrl("Actividades")} className="text-[10px] text-[#630027] underline">Ver todas →</Link>
          </div>;

    default:
      return null;
  }
});

// Mapa: widget → título y emoji para WidgetCard
const WIDGET_META = Object.fromEntries(TODOS_LOS_WIDGETS.map(w => [w.id, w]));

// ─── Panel de configuración con drag ─────────────────────────
function PanelConfig({ activos, orden, onToggle, onReorder, onClose }) {
  // orden visible: los activos en su orden, luego los inactivos
  const activosOrdenados = orden.filter(id => activos.includes(id));
  const inactivos = TODOS_LOS_WIDGETS.filter(w => !activos.includes(w.id));

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(activosOrdenados);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    // nuevo orden = activos reordenados + inactivos al final
    onReorder([...items, ...inactivos.map(w => w.id)]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-gray-200 shadow-xl p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-gray-700">Personalizar widgets</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-3">Activa, desactiva y arrastra para reordenar.</p>

      {/* Activos (reordenables) */}
      {activosOrdenados.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-2">Activos (arrastra para ordenar)</p>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="activos">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                  {activosOrdenados.map((id, index) => {
                    const w = WIDGET_META[id];
                    return (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border bg-[#630027]/5 border-[#630027]/20 text-[#630027] ${snap.isDragging ? "shadow-lg opacity-90" : ""}`}
                          >
                            <span {...prov.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                            <span>{w?.emoji}</span>
                            <span className="flex-1 text-left">{w?.label}</span>
                            <button onClick={() => onToggle(id)} className="text-gray-300 hover:text-red-400 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Inactivos */}
      {inactivos.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-2">Disponibles</p>
          <div className="grid grid-cols-2 gap-1.5">
            {inactivos.map(w => (
              <button
                key={w.id}
                onClick={() => onToggle(w.id)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border bg-gray-50 border-gray-200 text-gray-400 hover:border-[#630027]/30 hover:text-[#630027] hover:bg-[#630027]/5 transition-all"
              >
                <span>{w.emoji}</span>
                <span className="flex-1 text-left">{w.label}</span>
                <Plus className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────
export default function WidgetsDashboard({ sesion }) {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activos, setActivos] = useState(() => getGuardado(LS_KEY_ACTIVOS, WIDGETS_DEFAULT));
  const [orden, setOrden] = useState(() => getGuardado(LS_KEY_ORDEN, TODOS_LOS_WIDGETS.map(w => w.id)));
  const [configAbierta, setConfigAbierta] = useState(false);

  const toggleWidget = useCallback((id) => {
    setActivos(prev => {
      const next = prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id];
      localStorage.setItem(LS_KEY_ACTIVOS, JSON.stringify(next));
      // Si se añade, asegurarlo en el orden
      setOrden(ord => {
        const nuevoOrden = ord.includes(id) ? ord : [id, ...ord];
        localStorage.setItem(LS_KEY_ORDEN, JSON.stringify(nuevoOrden));
        return nuevoOrden;
      });
      return next;
    });
  }, []);

  const handleReorder = useCallback((nuevoOrden) => {
    setOrden(nuevoOrden);
    localStorage.setItem(LS_KEY_ORDEN, JSON.stringify(nuevoOrden));
  }, []);

  const necesita = useCallback((ids) => ids.some(id => activos.includes(id)), [activos]);

  useEffect(() => {
    if (activos.length === 0) { setLoading(false); return; }
    const uid = sesion?.integranteId || "";
    const ahora = new Date();

    const peticiones = [
      necesita(["compras"])                          ? base44.entities.ItemCompra.list("-created_date", 10) : Promise.resolve([]),
      necesita(["caja", "fondos"])                   ? base44.entities.MovimientoCaja.list("-created_date", 5) : Promise.resolve([]),
      necesita(["votaciones", "kpis"])               ? base44.entities.Votacion.filter({ completada: false }) : Promise.resolve([]),
      necesita(["sugerencias"])                      ? base44.entities.Sugerencia.filter({ archivada: false }) : Promise.resolve([]),
      necesita(["tareas", "kpis"])                   ? base44.entities.Tarea.filter({ completada: false }) : Promise.resolve([]),
      necesita(["stockbajo", "kpis"])                ? base44.entities.ItemAlmacen.list("-created_date", 50) : Promise.resolve([]),
      necesita(["kpis", "chat"])                     ? base44.entities.ChatMensaje.list("-created_date", 20) : Promise.resolve([]),
      necesita(["notifs"])                           ? base44.entities.Notificacion.filter({ archivada: false }) : Promise.resolve([]),
      necesita(["cerveza"])                          ? base44.entities.CervezaEntrada.list("-cervezas", 3) : Promise.resolve([]),
      necesita(["integrantes"])                      ? base44.entities.Integrante.list() : Promise.resolve([]),
      necesita(["vehiculos"])                        ? base44.entities.Vehiculo.list() : Promise.resolve([]),
      necesita(["actividades"])                      ? base44.entities.Actividad.filter({ estado: "programada" }) : Promise.resolve([]),
      necesita(["cumpleanos"]) && !necesita(["integrantes"]) ? base44.entities.Integrante.list() : Promise.resolve([]),
      // Fondos: cuotas, talonarios lotería, lotes cerveza
      necesita(["fondos"])                           ? base44.entities.Cuota.filter({ pagada: true }) : Promise.resolve([]),
      necesita(["fondos"])                           ? base44.entities.TalonarioLoteria.list() : Promise.resolve([]),
      necesita(["fondos"])                           ? base44.entities.Loteria.list() : Promise.resolve([]),
      necesita(["fondos"])                           ? base44.entities.MovimientoCaja.list() : Promise.resolve([]),
    ];

    Promise.all(peticiones).then(([comprasRaw, movimientos, votaciones, sugerenciasRaw, tareas, almacen, msgs, notifs, cervezasTop, integrantesRaw, vehiculos, actividadesRaw, cumpleanosIntegrantesRaw, cuotasPagadas, talonarios, loteriasCampanas, todosMovimientos]) => {
      const integrantesParaCumple = necesita(["cumpleanos"]) ? (integrantesRaw.length > 0 ? integrantesRaw : (cumpleanosIntegrantesRaw || [])) : [];
      const cumpleanos = integrantesParaCumple
        .filter(i => i.fecha_nacimiento)
        .map(i => { const d = calcDiasHastaCumple(i.fecha_nacimiento); const p = i.fecha_nacimiento.split("-"); const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]; return { id: i.id, nombre: i.nombre, dias: d, fecha_display: `${parseInt(p[2])} ${meses[parseInt(p[1])-1]}` }; })
        .filter(i => i.dias !== null)
        .sort((a, b) => a.dias - b.dias);
      // Filtrar compras no eliminadas (solo las que existen en la BD, sin campo eliminado)
      const compras = comprasRaw.filter(c => !c.comprado || c.comprado).slice(0, 5); // todas las existentes
      const stockBajo = almacen.filter(a => a.stock_minimo > 0 && a.cantidad <= a.stock_minimo);
      const msgsRecientes = msgs.filter(m => m.autor_id !== uid && new Date(m.created_date) > new Date(Date.now() - 3 * 60 * 60 * 1000));
      const notifsVisibles = notifs
        .filter(n => !n.fecha_publicacion || new Date(n.fecha_publicacion) <= ahora)
        .filter(n => !(n.leida_por || []).includes(uid))
        .slice(0, 3);
      const sugerencias = sugerenciasRaw.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 3);
      const cervezaData = {
        total: cervezasTop.reduce((s, e) => s + (e.cervezas || 0), 0),
        top: cervezasTop.slice(0, 3),
      };
      const catEmoji = { cargos: "⚜️", socios: "🤝", contribuyentes: "💛", socios_honorificos: "🏅", patitas: "🐾" };
      const integrantesResumen = Object.entries(
        integrantesRaw.reduce((acc, i) => { acc[i.categoria] = (acc[i.categoria] || 0) + 1; return acc; }, {})
      ).map(([cat, count]) => ({ cat, count, emoji: catEmoji[cat] || "👤" }));

      const actividades = (actividadesRaw || []).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).slice(0, 5);

      // ── Cálculo fondos ──
      let fondosData = { gastos: 0, loteria: 0, cuotas: 0, subvenciones: 0, cerveza: 0, premio: 0, otros: 0, saldo: 0 };
      if (necesita(["fondos"])) {
        // Ingresos/gastos del libro de caja (cantidad: positivo=ingreso, negativo=gasto)
        (todosMovimientos || []).forEach(m => {
          const amt = m.cantidad || 0;
          if (amt < 0) { fondosData.gastos += Math.abs(amt); return; }
          const cat = m.categoria || "otros";
          if (cat === "subvencion") fondosData.subvenciones += amt;
          else if (cat === "cuota") fondosData.cuotas += amt;
          else if (cat === "evento") fondosData.premio += amt;
          else fondosData.otros += amt;
        });
        // Cuotas pagadas (entidad Cuota — no duplicar si ya están en caja)
        fondosData.cuotas += (cuotasPagadas || []).reduce((s, c) => s + (c.importe || 0), 0);
        // Lotería: talonarios entregados
        (talonarios || []).forEach(t => {
          const camp = (loteriasCampanas || []).find(l => l.id === t.loteria_id);
          const precio = camp?.precio_participacion || 1;
          if (t.entregado) fondosData.loteria += (t.cantidad_vendida || 0) * precio;
        });
        const ingresos = fondosData.loteria + fondosData.cuotas + fondosData.subvenciones + fondosData.cerveza + fondosData.premio + fondosData.otros;
        fondosData.saldo = ingresos - fondosData.gastos;
      }

      setDatos({
        compras,
        movimientos,
        votaciones,
        sugerencias,
        tareas,
        stockBajo,
        msgsRecientes,
        notifsVisibles,
        cervezas: cervezaData,
        integrantes: { total: integrantesRaw.length, resumen: integrantesResumen },
        vehiculos,
        actividades,
        cumpleanos,
        fondos: fondosData,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [sesion, activos, necesita]);

  // Si el cajón de apps está activo, ocultar widget 'accesos'
  const drawerActivo = getPref("pena_show_app_drawer", true);
  // Widgets en el orden guardado, solo los activos
  const widgetsOrdenados = orden.filter(id => activos.includes(id) && !(drawerActivo && id === "accesos"));

  if (activos.length === 0 && !configAbierta) {
    return (
      <div className="mb-4">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setConfigAbierta(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all border bg-white text-gray-400 border-gray-200 hover:border-[#630027]/40 hover:text-[#630027]"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir widgets
          </button>
        </div>
        <AnimatePresence>
          {configAbierta && (
            <PanelConfig activos={activos} orden={orden} onToggle={toggleWidget} onReorder={handleReorder} onClose={() => setConfigAbierta(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Botón configurar */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setConfigAbierta(v => !v)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all border ${
            configAbierta
              ? "bg-[#630027] text-white border-[#630027]"
              : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Widgets
        </button>
      </div>

      {/* Panel de configuración */}
      <AnimatePresence>
        {configAbierta && (
          <PanelConfig activos={activos} orden={orden} onToggle={toggleWidget} onReorder={handleReorder} onClose={() => setConfigAbierta(false)} />
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : datos && (
        <div className="space-y-3">
          {widgetsOrdenados.map(id => {
            const meta = WIDGET_META[id];
            if (!meta) return null;

            // Widgets de ancho completo
            const fullWidth = ["kpis", "stockbajo", "accesos", "fondos"].includes(id);

            return (
              <AnimatePresence key={id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {fullWidth ? (
                    <WidgetCard title={meta.label} emoji={meta.emoji}>
                      <WidgetContent id={id} datos={datos} />
                    </WidgetCard>
                  ) : (
                    // Agrupa pares de widgets no-full en grid de 2 cols
                    <WidgetCard title={meta.label} emoji={meta.emoji}>
                      <WidgetContent id={id} datos={datos} />
                    </WidgetCard>
                  )}
                </motion.div>
              </AnimatePresence>
            );
          })}

          {/* Alerta stock bajo como banner si no está ya como widget */}
          {!activos.includes("stockbajo") && datos.stockBajo.length > 0 && (
            <Link to={createPageUrl("Almacen")} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 hover:shadow-md transition-shadow">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-700">{datos.stockBajo.length} artículo{datos.stockBajo.length !== 1 ? "s" : ""} con stock bajo</p>
                <p className="text-xs text-red-400 truncate">{datos.stockBajo.slice(0, 2).map(a => a.nombre).join(", ")}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-red-400 flex-shrink-0" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}