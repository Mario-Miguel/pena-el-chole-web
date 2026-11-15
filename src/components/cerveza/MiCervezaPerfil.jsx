import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Beer, Wallet, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function MiCervezaPerfil({ sesion }) {
  const [entrada, setEntrada] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [precio, setPrecio] = useState(0.5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sesion?.nombre) { setLoading(false); return; }
    Promise.all([
      base44.entities.CervezaEntrada.filter({ nombre: sesion.nombre }),
      base44.entities.CervezaPago.filter({ integrante_nombre: sesion.nombre }),
      base44.entities.AppConfig.filter({ clave: "cerveza_precio" }),
    ]).then(([entradas, pagosData, configs]) => {
      setEntrada(entradas[0] || null);
      setPagos(pagosData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      if (configs.length > 0) setPrecio(parseFloat(configs[0].valor));
      setLoading(false);
    });
  }, [sesion]);

  if (loading) return (
    <div className="flex justify-center py-6">
      <div className="w-6 h-6 border-2 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  if (!entrada) return null;

  const totalConsumo = (entrada.cervezas || 0) * precio;
  const totalPagado = entrada.pagado || 0;
  const pendiente = Math.max(0, totalConsumo - totalPagado);
  const pct = totalConsumo > 0 ? Math.min(100, (totalPagado / totalConsumo) * 100) : 100;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6"
    >
      <p className="text-[#630027] mb-4 text-sm font-bold flex items-center gap-2">
        <Beer className="w-4 h-4" /> Mi cuenta de cervezas
      </p>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-amber-600">{entrada.cervezas || 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">🍺 Cervezas</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-green-600">{totalPagado.toFixed(2).replace(".", ",")}€</p>
          <p className="text-xs text-gray-400 mt-0.5">Pagado</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${pendiente > 0 ? "bg-red-50" : "bg-green-50"}`}>
          <p className={`text-lg font-black ${pendiente > 0 ? "text-[#630027]" : "text-green-600"}`}>
            {pendiente > 0 ? `${pendiente.toFixed(2).replace(".", ",")}€` : "✅"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{pendiente > 0 ? "Pendiente" : "Al día"}</p>
        </div>
      </div>

      {/* Barra progreso */}
      {totalConsumo > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progreso de pago</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${pct >= 100 ? "bg-green-400" : "bg-[#630027]"}`}
            />
          </div>
        </div>
      )}

      {/* Historial de pagos */}
      {pagos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Historial de pagos
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {pagos.map(pago => (
              <div key={pago.id} className="flex justify-between items-center text-xs bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span className="text-gray-500">
                    {pago.fecha ? format(new Date(pago.fecha), "d MMM yyyy", { locale: es }) : "—"}
                  </span>
                  {pago.notas && <span className="text-gray-400 italic truncate max-w-[80px]">{pago.notas}</span>}
                </div>
                <span className="font-bold text-green-600">+{pago.importe.toFixed(2).replace(".", ",")}€</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pagos.length === 0 && totalConsumo > 0 && (
        <p className="text-xs text-gray-300 text-center py-2">Sin pagos registrados aún</p>
      )}
    </motion.div>
  );
}