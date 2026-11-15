import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Euro, AlertTriangle, Users, RotateCcw,
  Bell, ClipboardList, Download, TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function Badge({ children, color = "gray" }) {
  const colors = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-500",
    blue: "bg-blue-100 text-blue-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color] || colors.gray}`}>{children}</span>;
}

/**
 * Panel de herramientas de gestión rápida para admin/cargos
 * - Resumen de pendientes de cobro por socio
 * - Acción masiva: marcar múltiples talonarios como entregados
 * - Envío de recordatorio de notificación a socios con pendientes
 * - Resumen de recaudación esperada vs real
 */
export default function HerramientasGestion({ loterias, talonarios, onRefresh }) {
  const [loteriaFiltro, setLoteriaFiltro] = useState("todas");
  const [accionando, setAccionando] = useState(false);
  const [secciones, setSecciones] = useState({ pendientes: true, cobro: false, recordatorio: false });

  const toggle = (s) => setSecciones(p => ({ ...p, [s]: !p[s] }));

  const lotsFiltradas = loteriaFiltro === "todas"
    ? loterias
    : loterias.filter(l => l.id === loteriaFiltro);

  // Agrupar talonarios por socio para la lotería seleccionada
  const talsEnFiltro = talonarios.filter(t => lotsFiltradas.some(l => l.id === t.loteria_id));

  const bySocio = {};
  talsEnFiltro.forEach(t => {
    if (!bySocio[t.integrante_id]) {
      bySocio[t.integrante_id] = {
        nombre: t.integrante_nombre,
        talonarios: [],
        totalAsignado: 0,
        totalVendido: 0,
        totalDevuelto: 0,
        totalEntregado: 0,
      };
    }
    const g = bySocio[t.integrante_id];
    g.talonarios.push(t);
    g.totalAsignado += t.cantidad_asignada || 0;
    g.totalVendido += t.cantidad_vendida || 0;
    g.totalDevuelto += t.cantidad_devuelta || 0;
    if (t.entregado) g.totalEntregado += 1;
  });

  const socios = Object.values(bySocio).sort((a, b) => {
    const pctA = a.totalAsignado > 0 ? a.totalVendido / a.totalAsignado : 0;
    const pctB = b.totalAsignado > 0 ? b.totalVendido / b.totalAsignado : 0;
    return pctA - pctB; // los que menos han vendido primero
  });

  const sociosPendientes = socios.filter(s => {
    const pend = s.totalAsignado - s.totalVendido - s.totalDevuelto;
    return pend > 0;
  });

  const sociosSinEntregar = socios.filter(s =>
    s.totalVendido >= s.totalAsignado && s.totalEntregado < s.talonarios.length
  );

  // Recaudación esperada vs real (solo campañas activas)
  const activas = loterias.filter(l => l.estado === "activa");
  const talsActivas = talonarios.filter(t => activas.some(l => l.id === t.loteria_id));
  const recEsperada = talsActivas.reduce((s, t) => {
    const lot = activas.find(l => l.id === t.loteria_id);
    return s + (t.cantidad_asignada || 0) * (lot?.precio_participacion || 1);
  }, 0);
  const recReal = talsActivas.reduce((s, t) => {
    const lot = activas.find(l => l.id === t.loteria_id);
    return s + (t.cantidad_vendida || 0) * (lot?.precio_participacion || 1);
  }, 0);

  const marcarTodosPendientesComoEntregados = async () => {
    if (!window.confirm(`¿Marcar ${sociosSinEntregar.length} socio(s) que ya vendieron todo como entregados?`)) return;
    setAccionando(true);
    const talsAMarcar = sociosSinEntregar.flatMap(s => s.talonarios.filter(t => !t.entregado));
    await Promise.all(talsAMarcar.map(t =>
      base44.entities.TalonarioLoteria.update(t.id, { entregado: true })
    ));
    setAccionando(false);
    onRefresh();
  };

  const enviarRecordatorios = async () => {
    if (!window.confirm(`¿Enviar notificación de recordatorio a ${sociosPendientes.length} socio(s) con papeletas pendientes?`)) return;
    setAccionando(true);
    for (const socio of sociosPendientes) {
      const pend = socio.totalAsignado - socio.totalVendido - socio.totalDevuelto;
      base44.entities.Notificacion.create({
        titulo: `🎫 Recuerda entregar el dinero de lotería`,
        mensaje: `Tienes ${pend} papeletas pendientes de vender o devolver. Por favor, gestiona tu talonario cuanto antes.`,
        tipo: "otro",
      }).catch(() => {});
    }
    setAccionando(false);
    alert("Recordatorios enviados");
  };

  return (
    <div className="space-y-3">
      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Sin vender todo",
            value: sociosPendientes.length,
            icon: AlertTriangle,
            color: sociosPendientes.length > 0 ? "text-amber-600" : "text-green-600",
            bg: sociosPendientes.length > 0 ? "bg-amber-50" : "bg-green-50",
          },
          {
            label: "Listos p/ entregar",
            value: sociosSinEntregar.length,
            icon: CheckCircle2,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Recaudado",
            value: `${recReal.toFixed(0)}€`,
            icon: Euro,
            color: "text-[#630027]",
            bg: "bg-[#630027]/5",
          },
          {
            label: "Esperado",
            value: `${recEsperada.toFixed(0)}€`,
            icon: TrendingUp,
            color: "text-gray-600",
            bg: "bg-gray-50",
          },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-3 text-center`}>
            <k.icon className={`w-4 h-4 mx-auto mb-1 ${k.color}`} />
            <p className={`text-lg font-black ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-gray-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtro por lotería */}
      <div className="flex items-center gap-2">
        <select value={loteriaFiltro} onChange={e => setLoteriaFiltro(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="todas">Todas las campañas</option>
          {loterias.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
        </select>
      </div>

      {/* Sección: Socios con pendientes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => toggle("pendientes")}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Socios con papeletas pendientes
            {sociosPendientes.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-black px-2 py-0.5 rounded-full">{sociosPendientes.length}</span>
            )}
          </span>
          <span className="text-gray-400 text-xs">{secciones.pendientes ? "▲" : "▼"}</span>
        </button>
        {secciones.pendientes && (
          <div className="border-t border-gray-50">
            {sociosPendientes.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <CheckCircle2 className="w-7 h-7 text-green-400 mx-auto mb-1" />
                <p className="text-sm text-gray-400">¡Todos los socios han completado sus ventas!</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-50">
                  {sociosPendientes.map(s => {
                    const pend = s.totalAsignado - s.totalVendido - s.totalDevuelto;
                    const pct = s.totalAsignado > 0 ? Math.round((s.totalVendido / s.totalAsignado) * 100) : 0;
                    return (
                      <div key={s.nombre} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{s.nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden max-w-[80px]">
                              <div className="h-1.5 rounded-full bg-[#630027]" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400">{s.totalVendido}/{s.totalAsignado} vendidas</span>
                          </div>
                        </div>
                        <Badge color="amber">{pend} pendientes</Badge>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-3 border-t border-gray-50">
                  <button onClick={enviarRecordatorios} disabled={accionando}
                    className="w-full flex items-center justify-center gap-2 border border-amber-200 text-amber-700 text-sm font-semibold rounded-xl py-2 hover:bg-amber-50 disabled:opacity-50">
                    <Bell className="w-4 h-4" />
                    Enviar recordatorio a todos ({sociosPendientes.length})
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sección: Cobro pendiente */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => toggle("cobro")}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Euro className="w-4 h-4 text-[#630027]" />
            Socios listos para entregar dinero
            {sociosSinEntregar.length > 0 && (
              <span className="bg-green-100 text-green-700 text-xs font-black px-2 py-0.5 rounded-full">{sociosSinEntregar.length}</span>
            )}
          </span>
          <span className="text-gray-400 text-xs">{secciones.cobro ? "▲" : "▼"}</span>
        </button>
        {secciones.cobro && (
          <div className="border-t border-gray-50">
            {sociosSinEntregar.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No hay socios pendientes de entrega de dinero</p>
            ) : (
              <>
                <div className="divide-y divide-gray-50">
                  {sociosSinEntregar.map(s => {
                    // Calcular dinero a cobrar
                    const importe = s.talonarios.reduce((acc, t) => {
                      const lot = loterias.find(l => l.id === t.loteria_id);
                      return acc + (t.cantidad_vendida || 0) * (lot?.precio_participacion || 1);
                    }, 0);
                    return (
                      <div key={s.nombre} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/50">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{s.nombre}</p>
                          <p className="text-xs text-gray-400">{s.totalVendido} papeletas vendidas</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-[#630027]">{importe.toFixed(2)}€</p>
                          <Badge color="blue">Pendiente entrega</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-3 border-t border-gray-50">
                  <button onClick={marcarTodosPendientesComoEntregados} disabled={accionando}
                    className="w-full flex items-center justify-center gap-2 bg-[#630027] text-white text-sm font-semibold rounded-xl py-2 hover:bg-[#4a001d] disabled:opacity-50">
                    <CheckCircle2 className="w-4 h-4" />
                    {accionando ? "Procesando..." : `Marcar todos como entregados (${sociosSinEntregar.length})`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sección: Resumen por socio */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => toggle("recordatorio")}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-500" />
            Tabla de estado por socio
          </span>
          <span className="text-gray-400 text-xs">{secciones.recordatorio ? "▲" : "▼"}</span>
        </button>
        {secciones.recordatorio && (
          <div className="border-t border-gray-50 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 uppercase">
                  <th className="px-3 py-2 text-left font-semibold">Socio</th>
                  <th className="px-3 py-2 text-center font-semibold">Asig.</th>
                  <th className="px-3 py-2 text-center font-semibold">Vend.</th>
                  <th className="px-3 py-2 text-center font-semibold">Pend.</th>
                  <th className="px-3 py-2 text-center font-semibold">%</th>
                  <th className="px-3 py-2 text-center font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {socios.map(s => {
                  const pend = Math.max(0, s.totalAsignado - s.totalVendido - s.totalDevuelto);
                  const pct = s.totalAsignado > 0 ? Math.round((s.totalVendido / s.totalAsignado) * 100) : 0;
                  const todosEntregados = s.totalEntregado === s.talonarios.length;
                  return (
                    <tr key={s.nombre} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-3 py-2 font-semibold text-gray-700">{s.nombre}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{s.totalAsignado}</td>
                      <td className="px-3 py-2 text-center font-bold text-blue-600">{s.totalVendido}</td>
                      <td className="px-3 py-2 text-center font-bold text-amber-600">{pend}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                            <div className="h-1.5 rounded-full bg-[#630027]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {todosEntregados
                          ? <Badge color="green">✓</Badge>
                          : pend === 0
                            ? <Badge color="blue">Vend. todo</Badge>
                            : <Badge color="amber">Pendiente</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}