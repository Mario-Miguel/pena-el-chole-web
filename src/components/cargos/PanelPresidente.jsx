import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Users, Bell, BarChart2, ShoppingCart, Beer, CheckSquare, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SECCIONES = [
  { id: "resumen", label: "Resumen general", emoji: "📊" },
  { id: "integrantes", label: "Integrantes", emoji: "👥" },
  { id: "cuentas", label: "Cuentas y compras", emoji: "💳" },
  { id: "tareas", label: "Tareas pendientes", emoji: "✅" },
  { id: "votaciones", label: "Votaciones", emoji: "🗳️" },
];

export default function PanelPresidente() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seccionAbierta, setSeccionAbierta] = useState("resumen");

  const cargar = useCallback(async () => {
    const [integrantes, items, tareas, votaciones, notifs, cervezas] = await Promise.all([
      api.entities.Integrante.list(),
      api.entities.ItemCompra.list(),
      api.entities.Tarea.list(),
      api.entities.Votacion.list(),
      api.entities.Notificacion.list("-created_date", 5),
      api.entities.ConsumoCerveza.filter({ archivado: false }),
    ]);
    setDatos({ integrantes, items, tareas, votaciones, notifs, cervezas });
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>;

  const { integrantes, items, tareas, votaciones, notifs, cervezas } = datos;
  const itemsPendientes = items.filter(i => !i.comprado);
  const itemsComprados = items.filter(i => i.comprado && !i.pagado);
  const tareasPendientes = tareas.filter(t => !t.completada);
  const votacionesActivas = votaciones.filter(v => !v.completada);
  const deudaTotal = itemsComprados.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);

  const toggle = (id) => setSeccionAbierta(s => s === id ? null : id);

  return (
    <div className="space-y-3">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Integrantes", val: integrantes.length, emoji: "👥" },
          { label: "Por comprar", val: itemsPendientes.length, emoji: "🛒" },
          { label: "Deuda pendiente", val: `${deudaTotal.toFixed(2)}€`, emoji: "💰" },
          { label: "Tareas pendientes", val: tareasPendientes.length, emoji: "✅" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl mb-1">{c.emoji}</p>
            <p className="text-xl font-black text-[#630027]">{c.val}</p>
            <p className="text-xs text-gray-400">{c.label}</p>
          </div>
        ))}
      </div>

      {SECCIONES.map(sec => (
        <div key={sec.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => toggle(sec.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <span className="font-bold text-gray-700 flex items-center gap-2 text-sm">
              <span>{sec.emoji}</span> {sec.label}
            </span>
            {seccionAbierta === sec.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {seccionAbierta === sec.id && (
            <div className="px-5 pb-4 border-t border-gray-50 pt-3">
              {sec.id === "resumen" && (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• {votacionesActivas.length} votación(es) activa(s)</p>
                  <p>• {notifs.length} notificaciones recientes</p>
                  <p>• {cervezas.reduce((s, c) => s + (c.cantidad || 0), 0)} cervezas registradas en total</p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Link to={createPageUrl("Admin")} className="text-xs bg-[#630027] text-white px-3 py-1.5 rounded-xl hover:bg-[#4a001d] transition-colors">Panel Admin</Link>
                    <Link to={createPageUrl("Notificaciones")} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-200 transition-colors">Notificaciones</Link>
                  </div>
                </div>
              )}
              {sec.id === "integrantes" && (
                <div className="space-y-1.5">
                  {integrantes.map(i => (
                    <div key={i.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-700 font-medium">{i.nombre}</span>
                      <span className="text-xs text-gray-400 capitalize">{i.cargo || i.categoria}</span>
                    </div>
                  ))}
                  <Link to={createPageUrl("Integrantes")} className="text-xs text-[#630027] underline mt-2 block">Gestionar integrantes →</Link>
                </div>
              )}
              {sec.id === "cuentas" && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Pendientes de compra: <b>{itemsPendientes.length}</b></p>
                  <p className="text-sm text-gray-600">Comprados sin pagar: <b>{itemsComprados.length}</b> ({deudaTotal.toFixed(2)}€)</p>
                  <Link to={createPageUrl("Cuentas")} className="text-xs text-[#630027] underline mt-1 block">Ir a la lista de compra →</Link>
                </div>
              )}
              {sec.id === "tareas" && (
                <div className="space-y-1.5">
                  {tareasPendientes.slice(0, 8).map(t => (
                    <div key={t.id} className="text-sm text-gray-600 py-1 border-b border-gray-50 last:border-0">
                      <span className="font-medium">{t.nombre}</span>
                      {t.categoria && <span className="text-xs text-gray-400 ml-2 capitalize">({t.categoria})</span>}
                    </div>
                  ))}
                  {tareasPendientes.length === 0 && <p className="text-gray-300 text-sm">No hay tareas pendientes 🎉</p>}
                  <Link to={createPageUrl("ToDo")} className="text-xs text-[#630027] underline mt-1 block">Ver todas las tareas →</Link>
                </div>
              )}
              {sec.id === "votaciones" && (
                <div className="space-y-1.5">
                  {votacionesActivas.map(v => (
                    <div key={v.id} className="text-sm text-gray-600 py-1.5 border-b border-gray-50 last:border-0">
                      <span className="font-medium">{v.tema}</span>
                    </div>
                  ))}
                  {votacionesActivas.length === 0 && <p className="text-gray-300 text-sm">No hay votaciones activas</p>}
                  <Link to={createPageUrl("Votaciones")} className="text-xs text-[#630027] underline mt-1 block">Gestionar votaciones →</Link>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}