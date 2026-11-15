import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function PanelTesorero({ soloLectura = false }) {
  const { sesion } = useAuth();
  const [items, setItems] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seccion, setSeccion] = useState("deudas");

  const cargar = useCallback(async () => {
    const [its, pgs] = await Promise.all([
      api.entities.ItemCompra.list(),
      api.entities.PagoRegistrado.list(),
    ]);
    setItems(its);
    setPagos(pgs);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>;

  const comprados = items.filter(i => i.comprado);
  const deudas = {};
  comprados.forEach(i => {
    if (!i.comprador_nombre) return;
    if (!deudas[i.comprador_nombre]) deudas[i.comprador_nombre] = 0;
    deudas[i.comprador_nombre] += (i.precio || 0) * (i.cantidad || 1);
  });
  const pagadoPor = {};
  pagos.forEach(p => {
    if (!pagadoPor[p.persona]) pagadoPor[p.persona] = 0;
    pagadoPor[p.persona] += p.importe || 0;
  });
  const cuentas = Object.keys(deudas).map(n => ({
    nombre: n,
    deuda: deudas[n],
    pagado: pagadoPor[n] || 0,
    restante: Math.max(0, deudas[n] - (pagadoPor[n] || 0)),
  }));
  const totalDeuda = cuentas.reduce((s, c) => s + c.deuda, 0);
  const totalPagado = cuentas.reduce((s, c) => s + c.pagado, 0);
  const totalRestante = cuentas.reduce((s, c) => s + c.restante, 0);

  // Tickets con fotos
  const itemsConTicket = items.filter(i => (i.fotos_ticket || []).length > 0);

  const descargarTicket = (url, nombre) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre || "ticket.jpg";
    a.target = "_blank";
    a.click();
  };

  const descargarTodos = () => {
    itemsConTicket.forEach((item, idx) => {
      (item.fotos_ticket || []).forEach((url, fi) => {
        setTimeout(() => descargarTicket(url, `ticket_${item.nombre}_${fi + 1}.jpg`), idx * 300 + fi * 100);
      });
    });
  };

  const SECCIONES = [
    { id: "deudas", label: "Deudas y pagos", emoji: "💰" },
    { id: "tickets", label: "Tickets de compra", emoji: "🧾" },
  ];

  return (
    <div className="space-y-3">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Deuda total", val: `${totalDeuda.toFixed(2)}€`, color: "text-[#630027]" },
          { label: "Pagado", val: `${totalPagado.toFixed(2)}€`, color: "text-green-600" },
          { label: "Pendiente", val: `${totalRestante.toFixed(2)}€`, color: "text-red-500" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <p className={`text-lg font-black ${c.color}`}>{c.val}</p>
            <p className="text-xs text-gray-400">{c.label}</p>
          </div>
        ))}
      </div>

      {SECCIONES.map(sec => (
        <div key={sec.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => setSeccion(s => s === sec.id ? null : sec.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <span className="font-bold text-gray-700 flex items-center gap-2 text-sm"><span>{sec.emoji}</span> {sec.label}</span>
            {seccion === sec.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {seccion === sec.id && (
            <div className="px-5 pb-4 border-t border-gray-50 pt-3">
              {sec.id === "deudas" && (
                <div className="space-y-2">
                  {cuentas.length === 0 && <p className="text-gray-300 text-sm">No hay deudas registradas</p>}
                  {cuentas.map(c => (
                    <div key={c.nombre} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm font-medium text-gray-700">{c.nombre}</span>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${c.restante === 0 ? "text-green-600" : "text-[#630027]"}`}>
                          {c.restante === 0 ? "✓ Saldado" : `${c.restante.toFixed(2)}€ rest.`}
                        </span>
                        <p className="text-xs text-gray-400">Deuda: {c.deuda.toFixed(2)}€ · Pagado: {c.pagado.toFixed(2)}€</p>
                      </div>
                    </div>
                  ))}
                  {!soloLectura && (
                    <Link to={createPageUrl("Cuentas")} className="text-xs text-[#630027] underline mt-2 block">Registrar pagos →</Link>
                  )}
                </div>
              )}

              {sec.id === "tickets" && (
                <div className="space-y-3">
                  {itemsConTicket.length === 0 && <p className="text-gray-300 text-sm">No hay tickets subidos</p>}
                  {itemsConTicket.length > 0 && (
                    <button onClick={descargarTodos} className="w-full bg-[#630027] text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-[#4a001d] transition-colors flex items-center justify-center gap-2 mb-3">
                      <Download className="w-4 h-4" /> Descargar todos los tickets
                    </button>
                  )}
                  {itemsConTicket.map(item => (
                    <div key={item.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                      <p className="text-sm font-semibold text-gray-700">{item.nombre}</p>
                      <div className="flex flex-wrap gap-2">
                        {(item.fotos_ticket || []).map((url, i) => (
                          <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-100">
                            <img src={url} alt="ticket" className="w-full h-full object-cover" />
                            <button
                              onClick={() => descargarTicket(url, `ticket_${item.nombre}_${i + 1}.jpg`)}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <Download className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}