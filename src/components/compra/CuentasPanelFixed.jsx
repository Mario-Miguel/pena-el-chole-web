import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { base44 } from "@/api/base44Client";
import { X, Send, Download, Users, Building2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import CuentasChart from "./CuentasChart";
import CuentasExternasPanel from "./CuentasExternasPanel";

const TABS = [
  { id: "internas",  label: "Internas",  icon: Users },
  { id: "externas",  label: "Externas",  icon: Building2 },
  { id: "totales",   label: "Totales",   icon: BarChart3 },
];

export default function CuentasPanelFixed({ items = [], onClose, onPagosActualizados }) {
  const { sesion } = useAuth();
  const puedePagar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente" || sesion?.cargo === "tesorero";
  const puedeTickets = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente" || sesion?.cargo === "tesorero" || sesion?.cargo === "secretario";
  const [tab, setTab] = useState("internas");
  const [integrantes, setIntegrantes] = useState([]);
  const [pagosRegistrados, setPagosRegistrados] = useState([]);
  const [form, setForm] = useState({ persona: "", es_otro: false, nombre_otro: "", pagado: "" });
  const [pagando, setPagando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    base44.entities.Integrante.list().then(setIntegrantes);
    base44.entities.PagoRegistrado.list().then(setPagosRegistrados);
  }, []);

  // ── Deudas internas (solo integrantes) ──
  const deudas = useMemo(() => {
    const nombres = integrantes.map(i => i.nombre);
    const map = {};
    items.forEach((item) => {
      if (!item.comprador_nombre || !item.comprado) return;
      if (!nombres.includes(item.comprador_nombre)) return; // excluir externos
      if (!map[item.comprador_nombre]) map[item.comprador_nombre] = 0;
      map[item.comprador_nombre] += (item.precio || 0) * (item.cantidad || 1);
    });
    // solo añadir pagos de integrantes
    pagosRegistrados.filter(p => nombres.includes(p.persona)).forEach(p => {
      if (!(p.persona in map)) map[p.persona] = 0;
    });
    return map;
  }, [items, pagosRegistrados, integrantes]);

  const totalPagadoPor = useMemo(() => {
    const nombres = integrantes.map(i => i.nombre);
    const map = {};
    pagosRegistrados.filter(p => nombres.includes(p.persona)).forEach(p => {
      if (!map[p.persona]) map[p.persona] = 0;
      map[p.persona] += p.importe || 0;
    });
    return map;
  }, [pagosRegistrados, integrantes]);

  const cuentas = useMemo(() => {
    const personas = new Set([...Object.keys(deudas)]);
    return [...personas].map(nombre => ({
      nombre,
      deuda: deudas[nombre] || 0,
      pagado: totalPagadoPor[nombre] || 0,
      restante: Math.max(0, (deudas[nombre] || 0) - (totalPagadoPor[nombre] || 0)),
    })).filter(c => c.deuda > 0 || c.pagado > 0);
  }, [deudas, totalPagadoPor]);

  // ── Deudas externas (calculadas aquí para totales) ──
  const nombresIntegrantes = useMemo(() => integrantes.map(i => i.nombre), [integrantes]);
  const itemsExternos = useMemo(() =>
    items.filter(i => i.comprado && i.comprador_nombre && !nombresIntegrantes.includes(i.comprador_nombre)),
    [items, nombresIntegrantes]
  );
  const deudasExternas = useMemo(() => {
    const map = {};
    itemsExternos.forEach(item => {
      if (!map[item.comprador_nombre]) map[item.comprador_nombre] = 0;
      map[item.comprador_nombre] += (item.precio || 0) * (item.cantidad || 1);
    });
    return map;
  }, [itemsExternos]);
  const pagosExternos = useMemo(() => {
    const map = {};
    pagosRegistrados.filter(p => !nombresIntegrantes.includes(p.persona)).forEach(p => {
      if (!map[p.persona]) map[p.persona] = 0;
      map[p.persona] += p.importe || 0;
    });
    return map;
  }, [pagosRegistrados, nombresIntegrantes]);
  const totalExternPendiente = useMemo(() =>
    Object.keys(deudasExternas).reduce((s, n) => s + Math.max(0, (deudasExternas[n] || 0) - (pagosExternos[n] || 0)), 0),
    [deudasExternas, pagosExternos]
  );
  const totalExternDeuda = useMemo(() =>
    Object.values(deudasExternas).reduce((s, v) => s + v, 0),
    [deudasExternas]
  );
  const totalExternPagado = useMemo(() =>
    Object.keys(deudasExternas).reduce((s, n) => s + Math.min(deudasExternas[n] || 0, pagosExternos[n] || 0), 0),
    [deudasExternas, pagosExternos]
  );

  // ── Totales globales ──
  const totalInternaDeuda = cuentas.reduce((s, c) => s + c.deuda, 0);
  const totalInternaPagado = cuentas.reduce((s, c) => s + c.pagado, 0);
  const totalInternaRestante = cuentas.reduce((s, c) => s + c.restante, 0);

  // ── Registro de pago ──
  const handlePersonaChange = (val) => {
    if (val === "__otro__") setForm((f) => ({ ...f, persona: "", es_otro: true, pagado: "" }));
    else setForm((f) => ({ ...f, persona: val, es_otro: false, nombre_otro: "", pagado: "" }));
  };

  const nombreEfectivo = form.es_otro ? form.nombre_otro : form.persona;
  const cuentaActual = cuentas.find(c => c.nombre === nombreEfectivo);
  const deudaActual = cuentaActual?.deuda || 0;
  const pagadoAcum = cuentaActual?.pagado || 0;
  const nuevoPago = parseFloat(form.pagado) || 0;
  const restante = Math.max(0, deudaActual - pagadoAcum - nuevoPago);

  const handleRegistrarPago = async () => {
    if (!nombreEfectivo || nuevoPago <= 0) return;
    setPagando(true);
    const nuevoPagoRecord = await base44.entities.PagoRegistrado.create({
      persona: nombreEfectivo,
      importe: nuevoPago,
      registrado_por: sesion?.nombre || "Admin",
    });
    setPagosRegistrados(prev => [...prev, nuevoPagoRecord]);
    const totalPagadoTras = pagadoAcum + nuevoPago;
    if (totalPagadoTras >= deudaActual && deudaActual > 0) {
      const itemsDePersona = items.filter((i) => i.comprador_nombre === nombreEfectivo && i.comprado && !i.pagado);
      await Promise.all(itemsDePersona.map((i) =>
        base44.entities.ItemCompra.update(i.id, { pagado: true, fecha_pagado: new Date().toISOString() })
      ));
      if (onPagosActualizados) await onPagosActualizados();
    }
    setForm((f) => ({ ...f, pagado: "" }));
    setConfirmado(true);
    setTimeout(() => setConfirmado(false), 2500);
    setPagando(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-[#363636] shadow-xl p-5 mb-6">

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#630027] text-lg font-bold">Cuentas y compras</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-xl p-1 mb-5">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id
                  ? "bg-white dark:bg-[#363636] text-[#630027] shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB: CUENTAS INTERNAS ── */}
      {tab === "internas" && (
        <div>
          <CuentasChart cuentas={cuentas} />

          {cuentas.length > 0 ? (
            <div className="mb-5 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resumen de deudas internas</p>
              {cuentas.map((c) =>
                <div key={c.nombre} className="bg-gray-50 dark:bg-[#252525] rounded-xl px-4 py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{c.nombre}</span>
                    <span className={`font-bold text-sm ${c.restante === 0 ? "text-green-600" : "text-[#630027]"}`}>
                      {c.restante === 0 ? "✓ Saldado" : `${c.restante.toFixed(2)}€ rest.`}
                    </span>
                  </div>
                  {(c.pagado > 0 || c.deuda > 0) && (
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>Deuda: <b className="text-gray-600 dark:text-gray-300">{c.deuda.toFixed(2)}€</b></span>
                      <span>Pagado: <b className="text-green-600">{c.pagado.toFixed(2)}€</b></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-300 text-sm mb-4">No hay deudas pendientes</div>
          )}

          {/* Tickets internos */}
          {puedeTickets && (
            <div className="border-t border-gray-100 dark:border-[#363636] mt-4 pt-4">
              <button
                onClick={() => {
                  const itemsInternos = items.filter(i => {
                    if (!i.comprador_nombre) return false;
                    return integrantes.some(int => int.nombre === i.comprador_nombre);
                  });
                  const conTicket = itemsInternos.filter(i => (i.fotos_ticket || []).length > 0);
                  if (conTicket.length === 0) { alert("No hay tickets de compras internas."); return; }
                  conTicket.forEach((item, idx) => {

                    (item.fotos_ticket || []).forEach((url, fi) => {
                      setTimeout(() => {
                        const a = document.createElement("a");
                        a.href = url; a.download = `ticket_interno_${item.nombre}_${fi + 1}.jpg`; a.target = "_blank"; a.click();
                      }, idx * 300 + fi * 100);
                    });
                  });
                }}
                className="w-full border border-[#630027]/30 text-[#630027] rounded-xl py-2.5 text-sm font-semibold hover:bg-[#630027]/5 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Descargar tickets internos ({(() => { const int = items.filter(i => i.comprador_nombre && integrantes.some(in2 => in2.nombre === i.comprador_nombre)); return int.filter(i => (i.fotos_ticket||[]).length > 0).length; })()})
              </button>
            </div>
          )}

          {/* Registrar pago */}
          {!puedePagar && (
            <p className="text-xs text-gray-400 text-center py-2 border-t border-gray-100 dark:border-[#363636] pt-4 mt-4">Solo el presidente, vicepresidente o tesorero pueden registrar pagos</p>
          )}
          {puedePagar && (
            <div className="border-t border-gray-100 dark:border-[#363636] pt-4 mt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrar pago</p>
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-300">Persona</Label>
                <Select onValueChange={handlePersonaChange}>
                  <SelectTrigger className="mt-1 rounded-xl border-gray-200 text-sm">
                    <SelectValue placeholder="Seleccionar persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {integrantes.map((i) => <SelectItem key={i.id} value={i.nombre}>{i.nombre}</SelectItem>)}
                    <SelectItem value="__otro__">— Otro —</SelectItem>
                  </SelectContent>
                </Select>
                {form.es_otro && (
                  <Input className="mt-2 rounded-xl border-gray-200 text-sm" placeholder="Nombre del comprador" value={form.nombre_otro} onChange={(e) => setForm((f) => ({ ...f, nombre_otro: e.target.value }))} />
                )}
              </div>
              {nombreEfectivo && (
                <div className="bg-[#4B1924]/5 dark:bg-[#4B1924]/20 rounded-xl px-4 py-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Deuda total</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{deudaActual.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Ya pagado</span>
                    <span className="font-bold text-green-600">{pagadoAcum.toFixed(2)}€</span>
                  </div>
                  {nuevoPago > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Este pago</span>
                      <span className="font-bold text-blue-600">+{nuevoPago.toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#4B1924]/10 pt-1 mt-1">
                    <span className="text-gray-600 dark:text-gray-300 font-semibold">Restante</span>
                    <span className={`font-black ${restante === 0 ? "text-green-600" : "text-[#4B1924]"}`}>{restante.toFixed(2)}€</span>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-300">Importe pagado (€)</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="number" className="rounded-xl border-gray-200 text-sm flex-1" placeholder="0.00" value={form.pagado} onChange={(e) => setForm((f) => ({ ...f, pagado: e.target.value }))} />
                  <Button onClick={handleRegistrarPago} disabled={!nombreEfectivo || nuevoPago <= 0 || pagando || deudaActual === 0} className="bg-[#630027] hover:bg-[#3a1019] text-white rounded-xl h-9 px-4">
                    {confirmado ? "✓" : pagando ? "..." : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                {confirmado && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    {(pagadoAcum + nuevoPago) >= deudaActual && deudaActual > 0 ? "✅ Deuda saldada." : "✅ Pago registrado."}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CUENTAS EXTERNAS ── */}
      {tab === "externas" && (
        <CuentasExternasPanel items={items} integrantes={integrantes} onPagosActualizados={onPagosActualizados} />
      )}

      {/* ── TAB: TOTALES ── */}
      {tab === "totales" && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resumen global</p>

          {/* Tickets totales */}
          {puedeTickets && (
            <div className="border-b border-gray-100 dark:border-[#363636] pb-4">
              <button
                onClick={() => {
                  const conTicket = items.filter(i => (i.fotos_ticket || []).length > 0);
                  if (conTicket.length === 0) { alert("No hay tickets subidos."); return; }
                  conTicket.forEach((item, idx) => {
                    (item.fotos_ticket || []).forEach((url, fi) => {
                      setTimeout(() => {
                        const a = document.createElement("a");
                        a.href = url; a.download = `ticket_${item.nombre}_${fi + 1}.jpg`; a.target = "_blank"; a.click();
                      }, idx * 300 + fi * 100);
                    });
                  });
                }}
                className="w-full border border-[#630027]/30 text-[#630027] rounded-xl py-2.5 text-sm font-semibold hover:bg-[#630027]/5 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Descargar todos los tickets ({items.filter(i => (i.fotos_ticket || []).length > 0).length})
              </button>
            </div>
          )}

          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#630027]/5 dark:bg-[#630027]/20 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total deuda interna</p>
              <p className="text-xl font-black text-[#630027]">{totalInternaDeuda.toFixed(2)}€</p>
              <p className="text-xs text-gray-400">{cuentas.length} persona{cuentas.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total deuda externa</p>
              <p className="text-xl font-black text-red-600">{totalExternDeuda.toFixed(2)}€</p>
              <p className="text-xs text-gray-400">{Object.keys(deudasExternas).length} persona{Object.keys(deudasExternas).length !== 1 ? "s" : ""}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total pagado (internos)</p>
              <p className="text-xl font-black text-green-600">{totalInternaPagado.toFixed(2)}€</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total pagado (externos)</p>
              <p className="text-xl font-black text-green-600">{totalExternPagado.toFixed(2)}€</p>
              <p className="text-xs text-gray-400">de {totalExternDeuda.toFixed(2)}€</p>
            </div>
          </div>

          {/* Deuda total pendiente */}
          <div className="bg-gray-50 dark:bg-[#252525] rounded-xl p-4 border border-gray-100 dark:border-[#363636]">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Deuda total pendiente</p>
              <p className="text-2xl font-black text-[#630027]">{(totalInternaRestante + totalExternPendiente).toFixed(2)}€</p>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-[#363636] flex justify-between text-xs text-gray-400">
              <span>Interna pendiente: <b className="text-gray-600 dark:text-gray-300">{totalInternaRestante.toFixed(2)}€</b></span>
              <span>Externa pendiente: <b className="text-gray-600 dark:text-gray-300">{totalExternPendiente.toFixed(2)}€</b></span>
            </div>
          </div>

          {/* Detalle internas */}
          {cuentas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Detalle internas</p>
              <div className="space-y-1.5">
                {cuentas.map(c => (
                  <div key={c.nombre} className="flex justify-between items-center px-3 py-2 bg-gray-50 dark:bg-[#252525] rounded-lg text-sm">
                    <span className="text-gray-700 dark:text-gray-200 font-medium">{c.nombre}</span>
                    <span className={`font-bold text-xs ${c.restante === 0 ? "text-green-600" : "text-[#630027]"}`}>
                      {c.restante === 0 ? "Saldado" : `${c.restante.toFixed(2)}€`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detalle externas */}
          {Object.keys(deudasExternas).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Detalle externas</p>
              <div className="space-y-1.5">
                {Object.keys(deudasExternas).map(nombre => {
                  const restExt = Math.max(0, (deudasExternas[nombre] || 0) - (pagosExternos[nombre] || 0));
                  return (
                    <div key={nombre} className="flex justify-between items-center px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
                      <span className="text-gray-700 dark:text-gray-200 font-medium truncate mr-2">{nombre}</span>
                      <span className={`font-bold text-xs ${restExt === 0 ? "text-green-600" : "text-red-600"}`}>
                        {restExt === 0 ? "Saldado" : `${restExt.toFixed(2)}€`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}