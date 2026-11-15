import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/api/client";
import { useAuth } from "../auth/AuthContext";
import { Send, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CuentasChart from "./CuentasChart";

export default function CuentasExternasPanel({ items = [], integrantes = [], onPagosActualizados }) {
  const { sesion } = useAuth();
  const [pagosRegistrados, setPagosRegistrados] = useState([]);
  const [form, setForm] = useState({ persona: "", es_otro: false, nombre_otro: "", pagado: "" });
  const [pagando, setPagando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  const puedePagar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente" || sesion?.cargo === "tesorero";
  const puedeTickets = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente" || sesion?.cargo === "tesorero" || sesion?.cargo === "secretario";

  const nombresIntegrantes = useMemo(() => integrantes.map(i => i.nombre), [integrantes]);

  useEffect(() => {
    api.entities.PagoRegistrado.list().then(todos => {
      setPagosRegistrados(todos.filter(p => !nombresIntegrantes.includes(p.persona)));
    });
  }, [nombresIntegrantes]);

  // Ítems externos: comprado=true y comprador NO es integrante
  const itemsExternos = useMemo(() =>
    items.filter(i => i.comprado && i.comprador_nombre && !nombresIntegrantes.includes(i.comprador_nombre)),
    [items, nombresIntegrantes]
  );

  const deudas = useMemo(() => {
    const map = {};
    itemsExternos.forEach(item => {
      if (!map[item.comprador_nombre]) map[item.comprador_nombre] = 0;
      map[item.comprador_nombre] += (item.precio || 0) * (item.cantidad || 1);
    });
    pagosRegistrados.forEach(p => { if (!(p.persona in map)) map[p.persona] = 0; });
    return map;
  }, [itemsExternos, pagosRegistrados]);

  const totalPagadoPor = useMemo(() => {
    const map = {};
    pagosRegistrados.forEach(p => {
      if (!map[p.persona]) map[p.persona] = 0;
      map[p.persona] += p.importe || 0;
    });
    return map;
  }, [pagosRegistrados]);

  const cuentas = useMemo(() => {
    const personas = new Set([...Object.keys(deudas)]);
    return [...personas].map(nombre => ({
      nombre,
      deuda: deudas[nombre] || 0,
      pagado: totalPagadoPor[nombre] || 0,
      restante: Math.max(0, (deudas[nombre] || 0) - (totalPagadoPor[nombre] || 0)),
    })).filter(c => c.deuda > 0 || c.pagado > 0);
  }, [deudas, totalPagadoPor]);

  const handlePersonaChange = (val) => {
    if (val === "__otro__") setForm(f => ({ ...f, persona: "", es_otro: true, pagado: "" }));
    else setForm(f => ({ ...f, persona: val, es_otro: false, nombre_otro: "", pagado: "" }));
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
    const nuevoPagoRecord = await api.entities.PagoRegistrado.create({
      persona: nombreEfectivo,
      importe: nuevoPago,
      registrado_por: sesion?.nombre || "Admin",
    });
    setPagosRegistrados(prev => [...prev, nuevoPagoRecord]);
    const totalPagadoTras = pagadoAcum + nuevoPago;
    if (totalPagadoTras >= deudaActual && deudaActual > 0) {
      const itemsDePersona = itemsExternos.filter(i => i.comprador_nombre === nombreEfectivo && !i.pagado);
      await Promise.all(itemsDePersona.map(i =>
        api.entities.ItemCompra.update(i.id, { pagado: true, fecha_pagado: new Date().toISOString() })
      ));
    }
    if (onPagosActualizados) await onPagosActualizados();
    setForm(f => ({ ...f, pagado: "" }));
    setConfirmado(true);
    setTimeout(() => setConfirmado(false), 2500);
    setPagando(false);
  };

  const nombresExternos = [...new Set(itemsExternos.map(i => i.comprador_nombre))];
  const ticketsExternos = itemsExternos.filter(i => (i.fotos_ticket || []).length > 0);

  return (
    <div>
      <CuentasChart cuentas={cuentas} />

      {cuentas.length > 0 ? (
        <div className="mb-5 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resumen de deudas externas</p>
          {cuentas.map(c => (
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
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-300 text-sm mb-4">No hay compras externas pendientes</div>
      )}

      {/* Tickets externos */}
      {puedeTickets && (
        <div className="border-t border-gray-100 dark:border-[#363636] mt-4 pt-4">
          <button
            onClick={() => {
              if (ticketsExternos.length === 0) { alert("No hay tickets de compras externas."); return; }
              ticketsExternos.forEach((item, idx) => {
                (item.fotos_ticket || []).forEach((url, fi) => {
                  setTimeout(() => {
                    const a = document.createElement("a");
                    a.href = url; a.download = `ticket_externo_${item.nombre}_${fi + 1}.jpg`; a.target = "_blank"; a.click();
                  }, idx * 300 + fi * 100);
                });
              });
            }}
            className="w-full border border-[#630027]/30 text-[#630027] rounded-xl py-2.5 text-sm font-semibold hover:bg-[#630027]/5 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Descargar tickets externos ({ticketsExternos.length})
          </button>
        </div>
      )}

      {/* Registrar pago */}
      {!puedePagar ? (
        <p className="text-xs text-gray-400 text-center py-2 border-t border-gray-100 dark:border-[#363636] pt-4 mt-4">Solo el presidente, vicepresidente o tesorero pueden registrar pagos</p>
      ) : (
        <div className="border-t border-gray-100 dark:border-[#363636] pt-4 mt-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrar pago externo</p>
          <div>
            <Label className="text-xs text-gray-600 dark:text-gray-300">Comprador externo</Label>
            <Select onValueChange={handlePersonaChange}>
              <SelectTrigger className="mt-1 rounded-xl border-gray-200 text-sm">
                <SelectValue placeholder="Seleccionar comprador externo" />
              </SelectTrigger>
              <SelectContent>
                {nombresExternos.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                <SelectItem value="__otro__">— Otro —</SelectItem>
              </SelectContent>
            </Select>
            {form.es_otro && (
              <Input className="mt-2 rounded-xl border-gray-200 text-sm" placeholder="Nombre del comprador" value={form.nombre_otro} onChange={e => setForm(f => ({ ...f, nombre_otro: e.target.value }))} />
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
              <Input type="number" className="rounded-xl border-gray-200 text-sm flex-1" placeholder="0.00" value={form.pagado} onChange={e => setForm(f => ({ ...f, pagado: e.target.value }))} />
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
  );
}