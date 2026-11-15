import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Calculator, FileText, Users, Wallet, CheckSquare,
  Download, ChevronDown, ChevronUp, ExternalLink, Copy, Check, PenLine
} from "lucide-react";
import RellenarPlantillaEstructurada from "../secretaria/RellenarPlantillaEstructurada";

// ─── Utilidades ───────────────────────────────────────────────
function Copied({ show }) {
  return show ? <span className="text-green-600 text-xs font-semibold flex items-center gap-1"><Check className="w-3 h-3" />Copiado</span> : null;
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return [copied, copy];
}

// ─── Calculadora reparto de cuotas ────────────────────────────
function CalcCuotas({ integrantes }) {
  const [totalGasto, setTotalGasto] = useState("");
  const [soloSocios, setSoloSocios] = useState(true);
  const [copied, copy] = useCopy();

  const base = soloSocios
    ? integrantes.filter(i => i.categoria === "socios" || i.categoria === "cargos")
    : integrantes;

  const porPersona = base.length > 0 && totalGasto > 0 ? (parseFloat(totalGasto) / base.length).toFixed(2) : null;

  const texto = porPersona
    ? `Reparto de cuota:\nTotal: ${totalGasto}€ ÷ ${base.length} personas = ${porPersona}€ por persona\n\nLista:\n${base.map((i, idx) => `${idx + 1}. ${i.nombre}: ${porPersona}€`).join("\n")}`
    : "";

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Calcula la cuota a pagar por cada integrante según el gasto total.</p>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Gasto total (€)"
          value={totalGasto}
          onChange={e => setTotalGasto(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input type="checkbox" checked={soloSocios} onChange={e => setSoloSocios(e.target.checked)} className="rounded" />
        Solo socios y cargos ({base.length} personas)
      </label>
      {porPersona && (
        <div className="bg-[#630027]/5 rounded-xl p-3">
          <p className="text-lg font-black text-[#630027]">{porPersona}€ <span className="text-sm font-normal text-gray-500">/ persona</span></p>
          <p className="text-xs text-gray-400">{base.length} personas · {totalGasto}€ total</p>
          <button onClick={() => copy(texto)} className="mt-2 flex items-center gap-1 text-xs text-[#630027] underline">
            <Copy className="w-3 h-3" /> Copiar lista
          </button>
          <Copied show={copied} />
        </div>
      )}
    </div>
  );
}

// ─── Calculadora presupuesto ──────────────────────────────────
function CalcPresupuesto() {
  const [partidas, setPartidas] = useState([
    { nombre: "Materiales carroza", importe: "" },
    { nombre: "Vehículo / camión", importe: "" },
    { nombre: "Seguro RC", importe: "" },
    { nombre: "Otros gastos", importe: "" },
  ]);
  const [ingresos, setIngresos] = useState([
    { nombre: "Cuotas socios", importe: "" },
    { nombre: "Subvenciones", importe: "" },
    { nombre: "Otros ingresos", importe: "" },
  ]);
  const [copied, copy] = useCopy();

  const totalGastos = partidas.reduce((s, p) => s + (parseFloat(p.importe) || 0), 0);
  const totalIngresos = ingresos.reduce((s, p) => s + (parseFloat(p.importe) || 0), 0);
  const balance = totalIngresos - totalGastos;

  const actualizar = (list, setList, idx, campo, val) => {
    const copia = [...list];
    copia[idx] = { ...copia[idx], [campo]: val };
    setList(copia);
  };

  const texto = `PRESUPUESTO PEÑA — ${new Date().getFullYear()}\n\nINGRESOS:\n${ingresos.map(i => `  ${i.nombre}: ${parseFloat(i.importe)||0}€`).join("\n")}\nTOTAL INGRESOS: ${totalIngresos.toFixed(2)}€\n\nGASTOS:\n${partidas.map(p => `  ${p.nombre}: ${parseFloat(p.importe)||0}€`).join("\n")}\nTOTAL GASTOS: ${totalGastos.toFixed(2)}€\n\nBALANCE: ${balance.toFixed(2)}€`;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Ingresos previstos</p>
        {ingresos.map((p, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <input value={p.nombre} onChange={e => actualizar(ingresos, setIngresos, i, "nombre", e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
            <input type="number" placeholder="€" value={p.importe} onChange={e => actualizar(ingresos, setIngresos, i, "importe", e.target.value)}
              className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none text-right" />
          </div>
        ))}
        <p className="text-right text-xs font-bold text-green-600">Total ingresos: {totalIngresos.toFixed(2)}€</p>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Gastos previstos</p>
        {partidas.map((p, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <input value={p.nombre} onChange={e => actualizar(partidas, setPartidas, i, "nombre", e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
            <input type="number" placeholder="€" value={p.importe} onChange={e => actualizar(partidas, setPartidas, i, "importe", e.target.value)}
              className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none text-right" />
          </div>
        ))}
        <p className="text-right text-xs font-bold text-[#630027]">Total gastos: {totalGastos.toFixed(2)}€</p>
      </div>
      <div className={`rounded-xl p-3 ${balance >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <p className={`text-lg font-black ${balance >= 0 ? "text-green-700" : "text-red-600"}`}>
          Balance: {balance >= 0 ? "+" : ""}{balance.toFixed(2)}€
        </p>
        <p className="text-xs text-gray-500 mt-1">{balance >= 0 ? "✅ Presupuesto equilibrado" : "⚠️ Déficit previsto"}</p>
        <button onClick={() => copy(texto)} className="mt-2 flex items-center gap-1 text-xs text-[#630027] underline">
          <Copy className="w-3 h-3" /> Copiar resumen
        </button>
        <Copied show={copied} />
      </div>
    </div>
  );
}

// ─── Deudas por integrante ────────────────────────────────────
function ResumenDeudas({ items, pagos }) {
  const [copied, copy] = useCopy();
  const comprados = items.filter(i => i.comprado);
  const deudas = {};
  comprados.forEach(i => {
    if (!i.comprador_nombre) return;
    deudas[i.comprador_nombre] = (deudas[i.comprador_nombre] || 0) + (i.precio || 0) * (i.cantidad || 1);
  });
  const pagadoPor = {};
  pagos.forEach(p => { pagadoPor[p.persona] = (pagadoPor[p.persona] || 0) + (p.importe || 0); });

  const cuentas = Object.keys(deudas).map(n => ({
    nombre: n,
    deuda: deudas[n],
    pagado: pagadoPor[n] || 0,
    restante: Math.max(0, deudas[n] - (pagadoPor[n] || 0)),
  })).sort((a, b) => b.restante - a.restante);

  const texto = `RESUMEN DEUDAS — ${new Date().toLocaleDateString("es-ES")}\n\n${cuentas.map(c => `${c.nombre}: Deuda ${c.deuda.toFixed(2)}€ | Pagado ${c.pagado.toFixed(2)}€ | Restante ${c.restante.toFixed(2)}€`).join("\n")}`;

  if (cuentas.length === 0) return <p className="text-gray-300 text-sm">No hay deudas registradas</p>;

  return (
    <div className="space-y-2">
      {cuentas.map(c => (
        <div key={c.nombre} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <span className="text-sm font-medium text-gray-700">{c.nombre}</span>
          <div className="text-right">
            <p className={`text-sm font-bold ${c.restante === 0 ? "text-green-600" : "text-[#630027]"}`}>
              {c.restante === 0 ? "✓ Saldado" : `${c.restante.toFixed(2)}€`}
            </p>
            <p className="text-[10px] text-gray-400">{c.deuda.toFixed(2)}€ deuda · {c.pagado.toFixed(2)}€ pagado</p>
          </div>
        </div>
      ))}
      <button onClick={() => copy(texto)} className="flex items-center gap-1 text-xs text-[#630027] underline mt-1">
        <Copy className="w-3 h-3" /> Copiar resumen
      </button>
      <Copied show={copied} />
    </div>
  );
}

// ─── Plantillas de documentos ─────────────────────────────────
const TIPO_MAP = { acta: "acta", convocatoria: "acta", presupuesto: "presupuesto", bajavoluntaria: "otros" };

function PlantillasDocumentos({ cargo, integrantes }) {
  const [copied, copy] = useCopy();
  const [rellenando, setRellenando] = useState(null);
  const fecha = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const año = new Date().getFullYear();

  const socios = integrantes.filter(i => i.categoria === "socios" || i.categoria === "cargos");
  const presidente = integrantes.find(i => i.cargo === "presidente")?.nombre || "[Presidente]";
  const secretario = integrantes.find(i => i.cargo === "secretario")?.nombre || "[Secretario]";

  const PLANTILLAS = {
    acta: {
      label: "Acta de reunión",
      emoji: "📋",
      texto: `ACTA DE REUNIÓN — PEÑA DE CARROZAS DE VALDESOTO\n\nFecha: ${fecha}\nLugar: [Lugar]\nHora de inicio: [HH:MM]\n\nASISTENTES:\n${socios.slice(0, 5).map(s => `  · ${s.nombre}`).join("\n")}\n  · ...\n\nORDEN DEL DÍA:\n  1. [Punto 1]\n  2. [Punto 2]\n  3. Ruegos y preguntas\n\nDESARROLLO DE LA REUNIÓN:\n\n  1. [Punto 1]\n  [Descripción]\n\n  2. [Punto 2]\n  [Descripción]\n\n  3. Ruegos y preguntas\n  [Descripción]\n\nACUERDOS ADOPTADOS:\n  · [Acuerdo 1]\n  · [Acuerdo 2]\n\nSin más asuntos que tratar, se levanta la sesión a las [HH:MM].\n\nEl/La Secretario/a,              V.º B.º El/La Presidente/a,\n\n${secretario}                    ${presidente}`,
    },
    convocatoria: {
      label: "Convocatoria Asamblea",
      emoji: "📣",
      texto: `CONVOCATORIA DE ASAMBLEA GENERAL\n\nPEÑA DE CARROZAS DE VALDESOTO\n\nEn ${fecha}, el Presidente de la Peña convoca a todos los socios a la:\n\nASAMBLEA GENERAL [ORDINARIA / EXTRAORDINARIA]\n\nFecha: [DD/MM/YYYY]\nHora: [HH:MM] en primera convocatoria y [HH:MM] en segunda\nLugar: [Lugar]\n\nORDEN DEL DÍA:\n  1. Lectura y aprobación del acta anterior\n  2. Informe de presidencia\n  3. Informe económico — Tesorero\n  4. [Otros puntos]\n  5. Ruegos y preguntas\n\nSe ruega puntual asistencia.\n\n[Lugar], ${fecha}\n\nEl/La Presidente/a,\n\n${presidente}`,
    },
    presupuesto: {
      label: "Plantilla presupuesto",
      emoji: "📊",
      texto: `PRESUPUESTO ANUAL ${año} — PEÑA DE CARROZAS DE VALDESOTO\n\nINGRESOS PREVISTOS:\n  · Cuotas socios (${socios.length} personas × ___€): ___€\n  · Subvenciones Ayuntamiento de Siero: ___€\n  · Ayudas Consejería de Cultura (Principado de Asturias): ___€\n  · Premios del desfile (estimado): ___€\n  · Otros ingresos: ___€\n  ────────────────────────\n  TOTAL INGRESOS: ___€\n\nGASTOS PREVISTOS:\n  · Construcción de la carroza:\n      - Materiales estructurales: ___€\n      - Decoración y acabados: ___€\n      - Enramado: ___€\n  · Vehículo (camión / plataforma): ___€\n  · Seguro de Responsabilidad Civil: ___€\n  · Sede social (alquiler, suministros): ___€\n  · Fondo de reserva (10% recomendado): ___€\n  · Gastos administrativos: ___€\n  ────────────────────────\n  TOTAL GASTOS: ___€\n\nBALANCE PREVISTO: ___€\n\nAprobado en Asamblea General el ${fecha}\n\nEl/La Presidente/a,              El/La Tesorero/a,\n\n${presidente}                    [Tesorero]`,
    },
    bajavoluntaria: {
      label: "Solicitud baja socio",
      emoji: "👤",
      texto: `SOLICITUD DE BAJA VOLUNTARIA\n\nDon/Doña: [Nombre completo]\nDNI/NIE: [DNI]\nDomicilio: [Dirección]\n\nDIRIGIDA A:\nJunta Directiva de la Peña de Carrozas de Valdesoto\n\nCon fecha ${fecha}, solicito causar baja como socio/a de la Peña de Carrozas de Valdesoto, a partir de la fecha de la presente comunicación.\n\nMotivo (opcional): [Motivo]\n\nQuedo a disposición de la Junta para cualquier aclaración necesaria.\n\nAtentamente,\n\n[Nombre y firma]\n\n[Lugar], ${fecha}`,
    },
  };

  const tabs = cargo === "secretario"
    ? ["acta", "convocatoria", "bajavoluntaria"]
    : cargo === "presidente" || cargo === "vicepresidente"
    ? ["acta", "convocatoria", "presupuesto", "bajavoluntaria"]
    : cargo === "tesorero"
    ? ["presupuesto"]
    : ["acta"];

  const [activa, setActiva] = useState(tabs[0]);

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiva(t)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activa === t ? "bg-[#630027] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {PLANTILLAS[t].emoji} {PLANTILLAS[t].label}
          </button>
        ))}
      </div>
      {PLANTILLAS[activa] && (
        <div>
          <pre className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-[10px] text-gray-600 whitespace-pre-wrap overflow-auto max-h-56 leading-relaxed">
            {PLANTILLAS[activa].texto}
          </pre>
          <div className="mt-2 flex gap-2">
            <button onClick={() => copy(PLANTILLAS[activa].texto)}
              className="flex-1 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl py-2 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
              <Copy className="w-3.5 h-3.5" /> Copiar
            </button>
            <button
              onClick={() => setRellenando({
                tipoPlantilla: activa,
                nombre: PLANTILLAS[activa].label,
                tipo: TIPO_MAP[activa] || "otros",
              })}
              className="flex-1 bg-[#630027] text-white text-xs font-semibold rounded-xl py-2 flex items-center justify-center gap-1.5 hover:bg-[#4a001d] transition-colors">
              <PenLine className="w-3.5 h-3.5" /> Rellenar y guardar
            </button>
          </div>
          <Copied show={copied} />
          {rellenando && (
            <RellenarPlantillaEstructurada
              plantilla={rellenando}
              integrantes={integrantes}
              onClose={() => setRellenando(null)}
              onGuardado={() => setRellenando(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Resumen de integrantes con cuotas ────────────────────────
function ResumenIntegrantes({ integrantes, cuotas }) {
  const [copied, copy] = useCopy();

  const conCuota = integrantes.map(i => {
    const cuotasSocio = cuotas.filter(c => c.integrante_id === i.id);
    const totalPagado = cuotasSocio.filter(c => c.pagada).reduce((s, c) => s + (c.importe || 0), 0);
    const totalPendiente = cuotasSocio.filter(c => !c.pagada).reduce((s, c) => s + (c.importe || 0), 0);
    return { ...i, totalPagado, totalPendiente };
  });

  const texto = conCuota.map(i => `${i.nombre}: ${i.totalPagado.toFixed(2)}€ pagado, ${i.totalPendiente.toFixed(2)}€ pendiente`).join("\n");

  return (
    <div className="space-y-1.5">
      {conCuota.slice(0, 10).map(i => (
        <div key={i.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
          <div>
            <p className="text-sm text-gray-700 font-medium">{i.nombre}</p>
            <p className="text-[10px] text-gray-400 capitalize">{i.cargo || i.categoria}</p>
          </div>
          <div className="text-right">
            {i.totalPendiente > 0
              ? <p className="text-xs font-bold text-red-500">{i.totalPendiente.toFixed(2)}€ pend.</p>
              : <p className="text-xs font-bold text-green-600">✓ Al día</p>
            }
            {i.totalPagado > 0 && <p className="text-[10px] text-gray-400">{i.totalPagado.toFixed(2)}€ pagado</p>}
          </div>
        </div>
      ))}
      {conCuota.length > 10 && <p className="text-xs text-gray-400">...y {conCuota.length - 10} más</p>}
      <button onClick={() => copy(texto)} className="flex items-center gap-1 text-xs text-[#630027] underline mt-1">
        <Copy className="w-3 h-3" /> Copiar lista
      </button>
      <Copied show={copied} />
      <Link to={createPageUrl("Finanzas")} className="text-xs text-[#630027] underline block">Gestionar cuotas →</Link>
    </div>
  );
}

// ─── Accesos directos por cargo ────────────────────────────────
const ACCESOS_CARGO = {
  presidente: [
    { label: "Panel Admin", path: "Admin", emoji: "🛡️" },
    { label: "Finanzas", path: "Finanzas", emoji: "💰" },
    { label: "Integrantes", path: "Integrantes", emoji: "👥" },
    { label: "Comunidad", path: "Comunidad", emoji: "💬" },
    { label: "Notificaciones", path: "Notificaciones", emoji: "🔔" },
    { label: "Organización", path: "Organizacion", emoji: "📋" },
  ],
  vicepresidente: [
    { label: "Organización", path: "Organizacion", emoji: "📋" },
    { label: "Integrantes", path: "Integrantes", emoji: "👥" },
    { label: "Finanzas", path: "Finanzas", emoji: "💰" },
    { label: "Comunidad", path: "Comunidad", emoji: "💬" },
    { label: "Calendario", path: "Calendario", emoji: "📅" },
  ],
  secretario: [
    { label: "Integrantes", path: "Integrantes", emoji: "👥" },
    { label: "Notificaciones", path: "Notificaciones", emoji: "🔔" },
    { label: "Comunidad", path: "Comunidad", emoji: "💬" },
    { label: "Calendario", path: "Calendario", emoji: "📅" },
  ],
  tesorero: [
    { label: "Finanzas", path: "Finanzas", emoji: "💰" },
    { label: "Inventario", path: "Almacen", emoji: "📦" },
    { label: "Integrantes", path: "Integrantes", emoji: "👥" },
  ],
  vocal: [
    { label: "Organización", path: "Organizacion", emoji: "📋" },
    { label: "Comunidad", path: "Comunidad", emoji: "💬" },
    { label: "Inventario", path: "Almacen", emoji: "📦" },
    { label: "Calendario", path: "Calendario", emoji: "📅" },
  ],
};

// ─── Componente principal ──────────────────────────────────────
const HERRAMIENTAS_POR_CARGO = {
  presidente:     ["accesos", "cuotas", "deudas", "calc_cuotas", "presupuesto", "plantillas"],
  vicepresidente: ["accesos", "cuotas", "calc_cuotas", "plantillas"],
  secretario:     ["accesos", "cuotas", "plantillas"],
  tesorero:       ["accesos", "deudas", "presupuesto", "calc_cuotas"],
  vocal:          ["accesos", "calc_cuotas"],
};

export default function HerramientasCargo({ cargo }) {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [abiertos, setAbiertos] = useState({ accesos: true });

  const toggle = (id) => setAbiertos(prev => ({ ...prev, [id]: !prev[id] }));

  const cargar = useCallback(async () => {
    const [integrantes, items, pagos, cuotas] = await Promise.all([
      api.entities.Integrante.list(),
      api.entities.ItemCompra.list(),
      api.entities.PagoRegistrado.list(),
      api.entities.Cuota.list().catch(() => []),
    ]);
    setDatos({ integrantes, items, pagos, cuotas });
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>;

  const herramientas = HERRAMIENTAS_POR_CARGO[cargo] || HERRAMIENTAS_POR_CARGO["vocal"];
  const accesos = ACCESOS_CARGO[cargo] || [];
  const { integrantes, items, pagos, cuotas } = datos;

  const SECCIONES_CONFIG = {
    accesos: { label: "Accesos rápidos", emoji: "⚡" },
    cuotas: { label: "Estado de cuotas por integrante", emoji: "💳" },
    deudas: { label: "Deudas y pagos de compras", emoji: "🧾" },
    calc_cuotas: { label: "Calculadora de cuotas", emoji: "🧮" },
    presupuesto: { label: "Calculadora de presupuesto", emoji: "📊" },
    plantillas: { label: "Plantillas de documentos", emoji: "📄" },
  };

  return (
    <div className="space-y-3">
      {herramientas.map(id => {
        const cfg = SECCIONES_CONFIG[id];
        if (!cfg) return null;
        return (
          <div key={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => toggle(id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <span className="font-bold text-gray-700 flex items-center gap-2 text-sm">
                <span>{cfg.emoji}</span> {cfg.label}
              </span>
              {abiertos[id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {abiertos[id] && (
              <div className="px-5 pb-5 border-t border-gray-50 pt-4">
                {id === "accesos" && (
                  <div className="grid grid-cols-3 gap-2">
                    {accesos.map(a => (
                      <Link key={a.path} to={createPageUrl(a.path)}
                        className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-xl hover:bg-[#630027]/5 transition-colors">
                        <span className="text-xl">{a.emoji}</span>
                        <span className="text-xs text-gray-600 font-medium text-center">{a.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {id === "cuotas" && <ResumenIntegrantes integrantes={integrantes} cuotas={cuotas} />}
                {id === "deudas" && <ResumenDeudas items={items} pagos={pagos} />}
                {id === "calc_cuotas" && <CalcCuotas integrantes={integrantes} />}
                {id === "presupuesto" && <CalcPresupuesto />}
                {id === "plantillas" && <PlantillasDocumentos cargo={cargo} integrantes={integrantes} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}