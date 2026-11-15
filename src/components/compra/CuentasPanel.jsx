import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "@/api/client";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

export default function CuentasPanel({ items = [], onClose, onPagosActualizados }) {
  const { sesion } = useAuth();
  const puedePagar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente" || sesion?.cargo === "tesorero";
  const [integrantes, setIntegrantes] = useState([]);
  const [form, setForm] = useState({ persona: "", es_otro: false, nombre_otro: "", pagado: "" });
  const [pagando, setPagando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    api.entities.Integrante.list().then(setIntegrantes);
  }, []);

  // Solo items comprados y no pagados generan deuda
  const cuentas = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      if (!item.comprador_nombre || item.pagado || !item.comprado) return;
      if (!map[item.comprador_nombre]) map[item.comprador_nombre] = { nombre: item.comprador_nombre, total: 0 };
      map[item.comprador_nombre].total += (item.precio || 0) * (item.cantidad || 1);
    });
    return Object.values(map);
  }, [items]);

  const handlePersonaChange = (val) => {
    if (val === "__otro__") setForm((f) => ({ ...f, persona: "", es_otro: true, pagado: "" }));else
    setForm((f) => ({ ...f, persona: val, es_otro: false, nombre_otro: "", pagado: "" }));
  };

  const nombreEfectivo = form.es_otro ? form.nombre_otro : form.persona;
  const cuenta = cuentas.find((c) => c.nombre === nombreEfectivo);
  const deuda = cuenta ? cuenta.total : 0;
  const pagadoNum = parseFloat(form.pagado) || 0;
  const restante = Math.max(0, deuda - pagadoNum);

  const handleRegistrarPago = async () => {
    if (!nombreEfectivo || pagadoNum <= 0) return;
    setPagando(true);

    // Si el pago cubre la deuda total → marcar todos sus items como pagados
    if (pagadoNum >= deuda && deuda > 0) {
      const itemsDePersona = items.filter((i) => i.comprador_nombre === nombreEfectivo && i.comprado && !i.pagado);
      await Promise.all(itemsDePersona.map((i) =>
      api.entities.ItemCompra.update(i.id, { pagado: true, fecha_pagado: new Date().toISOString() })
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
      className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5 mb-6">

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#630027] text-lg font-bold">Cuentas</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Resumen por persona */}
      {cuentas.length > 0 &&
      <div className="mb-5 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resumen de deudas</p>
          {cuentas.map((c) =>
        <div key={c.nombre} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
              <span className="font-medium text-gray-700 text-sm">{c.nombre}</span>
              <span className="text-[#630027] font-bold">{c.total.toFixed(2)}€</span>
            </div>
        )}
        </div>
      }

      {cuentas.length === 0 &&
      <div className="text-center py-4 text-gray-300 text-sm mb-4">No hay deudas pendientes</div>
      }

      {/* Registrar pago - solo presidente, vicepresidente, tesorero y admin */}
      {!puedePagar && (
        <p className="text-xs text-gray-400 text-center py-2 border-t border-gray-100 pt-4">Solo el presidente, vicepresidente o tesorero pueden registrar pagos</p>
      )}
      {puedePagar && <div className="border-t border-gray-100 pt-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrar pago</p>
        <div>
          <Label className="text-xs text-gray-600">Persona</Label>
          <Select onValueChange={handlePersonaChange}>
            <SelectTrigger className="mt-1 rounded-xl border-gray-200 text-sm">
              <SelectValue placeholder="Seleccionar persona" />
            </SelectTrigger>
            <SelectContent>
              {integrantes.map((i) => <SelectItem key={i.id} value={i.nombre}>{i.nombre}</SelectItem>)}
              <SelectItem value="__otro__">— Otro —</SelectItem>
            </SelectContent>
          </Select>
          {form.es_otro &&
          <Input className="mt-2 rounded-xl border-gray-200 text-sm" placeholder="Nombre del comprador" value={form.nombre_otro} onChange={(e) => setForm((f) => ({ ...f, nombre_otro: e.target.value }))} />
          }
        </div>

        {nombreEfectivo &&
        <div className="bg-[#4B1924]/5 rounded-xl px-4 py-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Deuda total</span>
              <span className="font-bold text-gray-800">{deuda.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pagado</span>
              <span className="font-bold text-green-600">{pagadoNum.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between border-t border-[#4B1924]/10 pt-1 mt-1">
              <span className="text-gray-600 font-semibold">Restante</span>
              <span className={`font-black ${restante === 0 && pagadoNum > 0 ? "text-green-600" : "text-[#4B1924]"}`}>{restante.toFixed(2)}€</span>
            </div>
          </div>
        }

        <div>
          <Label className="text-xs text-gray-600">Importe pagado (€)</Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="number"
              className="rounded-xl border-gray-200 text-sm flex-1"
              placeholder="0.00"
              value={form.pagado}
              onChange={(e) => setForm((f) => ({ ...f, pagado: e.target.value }))} />

            <Button
              onClick={handleRegistrarPago}
              disabled={!nombreEfectivo || pagadoNum <= 0 || pagando} className="bg-[#630027] text-white px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 hover:bg-[#3a1019]">


              {confirmado ? "✓" : pagando ? "..." : <Send className="w-4 h-4" />}
            </Button>
          </div>
          {confirmado &&
          <p className="text-xs text-green-600 mt-1 font-medium">
              {pagadoNum >= deuda && deuda > 0 ? "✅ Pago completo. Productos marcados como pagados." : "✅ Pago registrado."}
            </p>
          }
        </div>
      </div>}
    </motion.div>);

}