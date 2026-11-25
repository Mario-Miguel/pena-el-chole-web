import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Wallet, Plus, Check, Edit2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { claveCuenta, integranteIdDeClave, formatoImporte } from "@/lib/cerveza";

// entradas = cuentas calculadas en Cerveza.jsx ({ id, integranteId, nombre, cervezas, pagado })
export default function CuentasCerveza({ entradas, precio, puedeGestionar, onChange }) {
  const [pagoOpen, setPagoOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [importe, setImporte] = useState("");
  const [notas, setNotas] = useState("");
  const [modo, setModo] = useState("sumar"); // "sumar" | "restar" | "set"
  const [guardando, setGuardando] = useState(false);
  const [historialOpen, setHistorialOpen] = useState(null); // id de entrada con historial abierto
  const [pagosMap, setPagosMap] = useState({}); // { [id de la cuenta]: [pagos] }
  const [loadingPagos, setLoadingPagos] = useState(false);

  const cargarPagos = async () => {
    setLoadingPagos(true);
    const pagos = await api.entities.CervezaPago.filter({ archivado: false });
    const mapa = {};
    pagos.forEach(p => {
      const clave = claveCuenta(p.integrante_id);
      if (!mapa[clave]) mapa[clave] = [];
      mapa[clave].push(p);
    });
    // ordenar cada lista por fecha desc
    Object.keys(mapa).forEach(k => mapa[k].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    setPagosMap(mapa);
    setLoadingPagos(false);
  };

  useEffect(() => { cargarPagos(); }, []);

  const conDeuda = entradas.filter(e => {
    const total = (e.cervezas || 0) * precio;
    const pagado = e.pagado || 0;
    return total > 0 || pagado > 0;
  }).sort((a, b) => {
    const deudaA = (a.cervezas || 0) * precio - (a.pagado || 0);
    const deudaB = (b.cervezas || 0) * precio - (b.pagado || 0);
    return deudaB - deudaA;
  });

  const totalDeuda = conDeuda.reduce((sum, e) => {
    return sum + Math.max(0, (e.cervezas || 0) * precio - (e.pagado || 0));
  }, 0);

  const abrirPago = (entrada, modoInicial = "sumar") => {
    if (!puedeGestionar) return;
    const deudaPendiente = Math.max(0, (entrada.cervezas || 0) * precio - (entrada.pagado || 0));
    setSelected(entrada);
    setModo(modoInicial);
    setImporte(modoInicial === "sumar" ? deudaPendiente.toFixed(2) : (entrada.pagado || 0).toFixed(2));
    setNotas("");
    setPagoOpen(true);
  };

  const handleConfirmar = async () => {
    if (!selected || !importe) return;
    setGuardando(true);
    try {
      const val = parseFloat(importe) || 0;
      const pagadoActual = selected.pagado || 0;
      // Lo pagado es la suma de los pagos: cada operación es un pago nuevo,
      // con importe negativo si resta (así queda rastro de las correcciones)
      let diferencia;
      if (modo === "sumar") diferencia = val;
      else if (modo === "restar") diferencia = -Math.min(val, pagadoActual);
      else diferencia = val - pagadoActual;
      diferencia = Math.round(diferencia * 100) / 100;

      if (diferencia !== 0) {
        const notaPorDefecto = modo === "sumar" ? undefined : modo === "restar" ? "Descuento" : "Corrección manual";
        await api.entities.CervezaPago.create({
          integrante_id: integranteIdDeClave(selected.id),
          importe: diferencia,
          fecha: new Date().toISOString(),
          notas: notas.trim() || notaPorDefecto,
        });
      }

      await Promise.all([cargarPagos(), onChange?.()]);
      setPagoOpen(false);
      setSelected(null);
      setImporte("");
      setNotas("");
    } finally {
      setGuardando(false);
    }
  };

  if (conDeuda.length === 0) return (
    <div className="p-4 text-center">
      <p className="text-sm text-gray-300 py-4">Sin cuentas pendientes 🎉</p>
    </div>
  );

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#630027]" /> Cuentas
          </h2>
          <span className="text-xs font-bold text-[#630027] bg-[#630027]/10 px-2.5 py-1 rounded-full">
            {totalDeuda.toFixed(2).replace(".", ",")}€ pendiente
          </span>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {conDeuda.map(entrada => {
              const total = (entrada.cervezas || 0) * precio;
              const pagado = entrada.pagado || 0;
              const deuda = Math.max(0, total - pagado);
              const liquidado = deuda <= 0;
              const pct = total > 0 ? Math.min(100, (pagado / total) * 100) : 100;
              const pagosPersona = pagosMap[entrada.id] || [];
              const histAbierto = historialOpen === entrada.id;

              return (
                <motion.div
                  key={entrada.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border ${liquidado ? "border-green-100 bg-green-50" : "border-gray-100 bg-gray-50"}`}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {liquidado && <Check className="w-4 h-4 text-green-500 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${liquidado ? "text-green-700" : "text-gray-800"}`}>
                            {entrada.nombre}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {entrada.cervezas || 0} 🍺 · Total: <b>{total.toFixed(2).replace(".", ",")}€</b>
                            {pagado > 0 && <> · Pagado: <b className="text-green-600">{pagado.toFixed(2).replace(".", ",")}€</b></>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!liquidado && (
                          <span className="text-sm font-black text-[#630027]">
                            {deuda.toFixed(2).replace(".", ",")}€
                          </span>
                        )}
                        {puedeGestionar && (
                          <div className="flex gap-1">
                            {!liquidado && (
                              <button
                                onClick={() => abrirPago(entrada, "sumar")}
                                className="h-7 px-2.5 bg-[#630027] text-white text-xs font-semibold rounded-lg hover:bg-[#4a001d] transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Pago
                              </button>
                            )}
                            <button
                              onClick={() => abrirPago(entrada, "set")}
                              title="Corregir importe pagado"
                              className="h-7 w-7 bg-gray-100 text-gray-400 rounded-lg hover:bg-blue-50 hover:text-blue-500 transition-colors flex items-center justify-center"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {/* Toggle historial */}
                        {pagosPersona.length > 0 && (
                          <button
                            onClick={() => setHistorialOpen(histAbierto ? null : entrada.id)}
                            title="Ver historial"
                            className="h-7 w-7 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                          >
                            {histAbierto ? <ChevronUp className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    {total > 0 && (
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${liquidado ? "bg-green-400" : "bg-[#630027]"}`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Historial de pagos de esta persona */}
                  <AnimatePresence initial={false}>
                    {histAbierto && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-200 px-4 pb-3 pt-2 space-y-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pagos registrados
                          </p>
                          {pagosPersona.map(pago => (
                            <div key={pago.id} className="flex justify-between items-center text-xs bg-white rounded-lg px-3 py-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">
                                  {pago.fecha ? format(new Date(pago.fecha), "d MMM yyyy", { locale: es }) : "—"}
                                </span>
                                {pago.notas && <span className="text-gray-400 italic truncate max-w-[100px]">{pago.notas}</span>}
                              </div>
                              <span className={`font-bold ${pago.importe < 0 ? "text-amber-600" : "text-green-600"}`}>{formatoImporte(pago.importe)}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Dialog pago/corrección */}
      <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#630027]">
              {modo === "set" ? "Corregir pagado" : "Registrar pago"} — {selected?.nombre}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Total consumo</span>
                  <span className="font-bold">{((selected.cervezas || 0) * precio).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Ya pagado</span>
                  <span className="font-bold text-green-600">{(selected.pagado || 0).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                  <span className="font-semibold">Pendiente</span>
                  <span className="font-black text-[#630027]">
                    {Math.max(0, (selected.cervezas || 0) * precio - (selected.pagado || 0)).toFixed(2)}€
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setModo("sumar"); setImporte(Math.max(0, (selected.cervezas || 0) * precio - (selected.pagado || 0)).toFixed(2)); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${modo === "sumar" ? "bg-[#630027] text-white border-[#630027]" : "bg-white text-gray-600 border-gray-200"}`}>
                  + Añadir pago
                </button>
                <button onClick={() => { setModo("restar"); setImporte(""); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${modo === "restar" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200"}`}>
                  − Descontar
                </button>
                <button onClick={() => { setModo("set"); setImporte((selected.pagado || 0).toFixed(2)); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${modo === "set" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200"}`}>
                  ✎ Fijar
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                  {modo === "sumar" && "Importe a añadir (€)"}
                  {modo === "restar" && "Importe a descontar (€)"}
                  {modo === "set" && "Establecer total pagado (€)"}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={importe}
                  onChange={e => setImporte(e.target.value)}
                  className="rounded-xl border-gray-200"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                  Notas (opcional)
                </label>
                <Input
                  placeholder="Ej: Pago en efectivo"
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <Button
                onClick={handleConfirmar}
                disabled={importe === "" || guardando}
                className={`w-full text-white rounded-xl ${modo === "restar" ? "bg-amber-500 hover:bg-amber-600" : modo === "set" ? "bg-blue-500 hover:bg-blue-600" : "bg-[#630027] hover:bg-[#4a001d]"}`}
              >
                <Wallet className="w-4 h-4 mr-2" /> Confirmar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}