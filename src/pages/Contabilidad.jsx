import React, { useState, useEffect, useCallback } from "react";
import { BookOpen, Plus, RefreshCw, Users, ListFilter, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/auth/AuthContext";
import ResumenGeneral from "@/components/contabilidad/ResumenGeneral";
import MovimientosConsolidados from "@/components/contabilidad/MovimientosConsolidados";
import BalanceUsuarios from "@/components/contabilidad/BalanceUsuarios";
import NuevoMovimientoDialog from "@/components/contabilidad/NuevoMovimientoDialog";

function fmt(v) {
  const n = parseFloat(v) || 0;
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export default function Contabilidad() {
  const { sesion } = useAuth();
  const canEdit = sesion?.esAdmin === true || !!sesion?.cargo;

  const [tab, setTab] = useState("resumen");
  const [loading, setLoading] = useState(true);
  const [movimientos, setMovimientos] = useState([]);
  const [balances, setBalances] = useState([]);
  const [showNuevo, setShowNuevo] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar todas las fuentes en paralelo
      const [
        movCaja, tickets, cuotas, cervezasEntrada, cervezasPago,
        pagosRegistrados, lotesCerveza, deudasProveedor, loteria, talonarios
      ] = await Promise.all([
        base44.entities.MovimientoCaja.list("-fecha", 500),
        base44.entities.TicketFactura.list("-created_date", 200),
        base44.entities.Cuota.list("-created_date", 500),
        base44.entities.CervezaEntrada.list("-created_date", 500),
        base44.entities.CervezaPago.list("-fecha", 500),
        base44.entities.PagoRegistrado.list("-created_date", 500),
        base44.entities.LoteCerveza.list("-fecha", 200),
        base44.entities.DeudaProveedor.list("-fecha", 200),
        base44.entities.Loteria.list("-created_date", 50),
        base44.entities.TalonarioLoteria.list("-created_date", 500),
      ]);

      const movs = [];
      const userMap = {}; // nombre → { debe, haber, detalle }

      const addUser = (nombre) => {
        if (!nombre) return null;
        if (!userMap[nombre]) userMap[nombre] = { nombre, debe: 0, haber: 0, detalle: [] };
        return userMap[nombre];
      };

      // 1. Movimientos de caja manuales
      (movCaja || []).forEach(m => {
        const esIngreso = m.tipo === "ingreso" || (parseFloat(m.cantidad) || 0) > 0;
        const importe = Math.abs(parseFloat(m.cantidad) || 0);
        movs.push({
          fecha: m.fecha, concepto: m.concepto, categoria: m.categoria || "otros",
          tipo: esIngreso ? "ingreso" : "gasto", cantidad: importe,
          usuario: m.usuario, fuente: "manual", notas: m.notas,
        });
        if (m.usuario) {
          const u = addUser(m.usuario);
          if (esIngreso) u.haber += importe; else u.debe += importe;
          u.detalle.push(`${esIngreso ? "+" : "−"}${fmt(importe)} · ${m.concepto}`);
        }
      });

      // 2. Tickets / facturas → gastos
      (tickets || []).forEach(t => {
        const importe = parseFloat(t.importe) || 0;
        if (importe <= 0) return;
        const fecha = t.fecha || t.created_date;
        movs.push({
          fecha, concepto: `Ticket: ${t.nombre || t.proveedor || "Sin nombre"}`,
          categoria: "ticket", tipo: "gasto", cantidad: importe,
          usuario: t.integrante_nombre, fuente: "ticket",
        });
        if (t.integrante_nombre) {
          const u = addUser(t.integrante_nombre);
          u.debe += importe;
          u.detalle.push(`−${fmt(importe)} · Ticket ${t.nombre || ""}`);
        }
      });

      // 3. Cuotas → ingresos si pagadas, debe si no
      (cuotas || []).forEach(c => {
        const importe = parseFloat(c.importe) || 0;
        if (importe <= 0) return;
        if (c.pagada) {
          movs.push({
            fecha: c.fecha_pago || c.created_date, concepto: `Cuota: ${c.concepto || "Cuota"}`,
            categoria: "cuota", tipo: "ingreso", cantidad: importe,
            usuario: c.integrante_nombre, fuente: "cuota",
          });
          if (c.integrante_nombre) {
            const u = addUser(c.integrante_nombre);
            u.haber += importe;
            u.detalle.push(`+${fmt(importe)} · ${c.concepto}`);
          }
        } else {
          // Cuota pendiente: el usuario debe
          if (c.integrante_nombre) {
            const u = addUser(c.integrante_nombre);
            u.debe += importe;
            u.detalle.push(`−${fmt(importe)} · Cuota pendiente: ${c.concepto}`);
          }
        }
      });

      // 4. Cervezas: debe = cervezas * precio; haber = pagos acumulados
      // Obtener precio de cerveza de AppConfig
      let precioCerveza = 1;
      try {
        const cfgPrecio = await base44.entities.AppConfig.filter({ clave: "cerveza_precio" });
        if (cfgPrecio[0]?.valor) precioCerveza = parseFloat(cfgPrecio[0].valor) || 1;
      } catch {}

      (cervezasEntrada || []).forEach(ce => {
        const cervezas = parseFloat(ce.cervezas) || 0;
        const pagado = parseFloat(ce.pagado) || 0;
        const debeCerveza = cervezas * precioCerveza;
        const nombre = ce.nombre;
        if (nombre && (debeCerveza > 0 || pagado > 0)) {
          const u = addUser(nombre);
          u.debe += debeCerveza;
          u.haber += pagado;
          if (debeCerveza > 0) u.detalle.push(`−${fmt(debeCerveza)} · Cervezas (${cervezas} × ${fmt(precioCerveza)})`);
          if (pagado > 0) u.detalle.push(`+${fmt(pagado)} · Pago cerveza`);
        }
      });

      // Pagos de cerveza como movimientos
      (cervezasPago || []).forEach(p => {
        const importe = parseFloat(p.importe) || 0;
        if (importe <= 0) return;
        movs.push({
          fecha: p.fecha || p.created_date, concepto: `Pago cerveza: ${p.integrante_nombre || ""}`,
          categoria: "cerveza", tipo: "ingreso", cantidad: importe,
          usuario: p.integrante_nombre, fuente: "cerveza",
        });
      });

      // 5. Pagos registrados → ingresos
      (pagosRegistrados || []).forEach(p => {
        const importe = parseFloat(p.importe) || 0;
        if (importe <= 0) return;
        movs.push({
          fecha: p.created_date, concepto: `Pago: ${p.nota || p.persona || ""}`,
          categoria: "otros", tipo: "ingreso", cantidad: importe,
          usuario: p.persona, fuente: "pago",
        });
        if (p.persona) {
          const u = addUser(p.persona);
          u.haber += importe;
          u.detalle.push(`+${fmt(importe)} · Pago registrado`);
        }
      });

      // 6. Lotes de cerveza → gastos
      (lotesCerveza || []).forEach(l => {
        const coste = parseFloat(l.coste) || 0;
        if (coste <= 0) return;
        movs.push({
          fecha: l.fecha || l.created_date, concepto: `Lote cerveza: ${l.tipo || ""}`,
          categoria: "cerveza", tipo: "gasto", cantidad: coste,
          fuente: "compra",
        });
      });

      // 7. Deudas con proveedores → gastos (pendientes)
      (deudasProveedor || []).forEach(d => {
        const importe = parseFloat(d.importe) || 0;
        if (importe <= 0) return;
        movs.push({
          fecha: d.fecha_vencimiento || d.created_date, concepto: `Deuda: ${d.proveedor} - ${d.concepto || ""}`,
          categoria: "deuda", tipo: "gasto", cantidad: importe,
          fuente: "deuda",
        });
      });

      // 8. Lotería → beneficio = (precio_participacion - precio_carroza) * vendidas
      (loteria || []).forEach(lot => {
        const precioPart = parseFloat(lot.precio_participacion) || 0;
        const precioCarroza = parseFloat(lot.precio_carroza) || 0;
        const beneficio = precioPart - precioCarroza;
        if (beneficio <= 0) return;
        // Sumar vendidas de talonarios de esta lotería
        const vendidas = (talonarios || [])
          .filter(t => t.loteria_id === lot.id)
          .reduce((s, t) => s + (parseFloat(t.cantidad_vendida) || 0), 0);
        const totalBeneficio = beneficio * vendidas;
        if (totalBeneficio > 0) {
          movs.push({
            fecha: lot.created_date, concepto: `Beneficio lotería: ${lot.nombre || ""} (${vendidas} vend.)`,
            categoria: "loteria", tipo: "ingreso", cantidad: totalBeneficio,
            fuente: "loteria",
          });
        }
      });

      setMovimientos(movs);
      setBalances(Object.values(userMap));
    } catch (e) {
      console.error("Error cargando contabilidad:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const tabs = [
    { key: "resumen", label: "Resumen", icon: BarChart3 },
    { key: "movimientos", label: "Movimientos", icon: ListFilter },
    { key: "usuarios", label: "Usuarios", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f6]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#630027]/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#630027]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Contabilidad</h1>
              <p className="text-xs text-gray-400">Consolidado de toda la peña</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={cargar} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-[#630027]" title="Actualizar">
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            {canEdit && (
              <button onClick={() => setShowNuevo(true)} className="bg-[#630027] text-white rounded-xl px-3 py-2 text-sm font-bold flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Nuevo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${tab === t.key ? "bg-[#630027] text-white" : "text-gray-400 hover:text-gray-600"}`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {tab === "resumen" && <ResumenGeneral movimientos={movimientos} />}
            {tab === "movimientos" && <MovimientosConsolidados movimientos={movimientos} />}
            {tab === "usuarios" && <BalanceUsuarios balances={balances} />}
          </>
        )}
      </div>

      <NuevoMovimientoDialog open={showNuevo} onClose={() => setShowNuevo(false)} onSaved={cargar} />
    </div>
  );
}