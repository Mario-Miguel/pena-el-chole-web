import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { useAuth } from "../components/auth/AuthContext";
import {
  Ticket, Plus, ChevronDown, ChevronUp, Save, X, Users,
  TrendingUp, Euro, Calendar, CheckCircle2, Clock, Edit2, Trash2,
  Search, RotateCcw, PackageOpen, History, AlertTriangle, BarChart2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { FileDown, Settings } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import HelpIcon from "../components/layout/HelpIcon";
import HerramientasGestion from "../components/loteria/HerramientasGestion";
import { Wrench } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Exportar PDF / CSV
// ─────────────────────────────────────────────────────────────────────────────
function exportarPDF(loterias, talonarios, anioFiltro) {
  const lotsFiltradas = anioFiltro
    ? loterias.filter(l => {
        const anio = l.fecha_limite ? new Date(l.fecha_limite).getFullYear()
          : l.created_date ? new Date(l.created_date).getFullYear() : null;
        return anio === anioFiltro;
      })
    : loterias;

  let html = `<html><head><meta charset="utf-8"/>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 24px; }
    h1 { color: #630027; font-size: 20px; margin-bottom: 4px; }
    h2 { color: #630027; font-size: 14px; margin: 16px 0 6px; border-bottom: 2px solid #630027; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th { background: #630027; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
    td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
    tr:nth-child(even) td { background: #fdf6f8; }
    .total-row td { font-weight: bold; background: #f0e0e5 !important; }
    .subtitle { color: #888; font-size: 11px; margin-bottom: 16px; }
  </style></head><body>
  <h1>🎫 Lotería — Informe de Recaudación</h1>
  <p class="subtitle">Generado el ${new Date().toLocaleDateString("es-ES", { day:"2-digit", month:"long", year:"numeric" })}${anioFiltro ? ` · Año ${anioFiltro}` : " · Todas las campañas"}</p>`;

  lotsFiltradas.forEach(l => {
    const tals = talonarios.filter(t => t.loteria_id === l.id);
    const totalVendidas = tals.reduce((s, t) => s + (t.cantidad_vendida || 0), 0);
    const totalAsignadas = tals.reduce((s, t) => s + (t.cantidad_asignada || 0), 0);
    const totalRec = totalVendidas * (l.precio_participacion || 1);
    html += `<h2>${l.nombre}</h2>
    <table><thead><tr>
      <th>Socio</th><th>Nº inicio</th><th>Nº fin</th><th>Asignadas</th><th>Vendidas</th><th>Pendientes</th><th>Recaudado (€)</th><th>Entregado</th>
    </tr></thead><tbody>`;
    tals.forEach(t => {
      const vendidas = t.cantidad_vendida || 0;
      const asignadas = t.cantidad_asignada || 0;
      const recaudado = vendidas * (l.precio_participacion || 1);
      html += `<tr><td>${t.integrante_nombre}</td><td>${t.numeros_inicio}</td><td>${t.numeros_fin}</td><td>${asignadas}</td><td>${vendidas}</td><td>${Math.max(0, asignadas - vendidas)}</td><td>${recaudado.toFixed(2)}€</td><td>${t.entregado ? "✓ Sí" : "No"}</td></tr>`;
    });
    html += `<tr class="total-row"><td colspan="3">TOTAL</td><td>${totalAsignadas}</td><td>${totalVendidas}</td><td>${Math.max(0, totalAsignadas - totalVendidas)}</td><td>${totalRec.toFixed(2)}€</td><td></td></tr>`;
    html += `</tbody></table>`;
  });
  html += `</body></html>`;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

function exportarCSV(loterias, talonarios, anioFiltro) {
  const lotsFiltradas = anioFiltro
    ? loterias.filter(l => {
        const anio = l.fecha_limite ? new Date(l.fecha_limite).getFullYear()
          : l.created_date ? new Date(l.created_date).getFullYear() : null;
        return anio === anioFiltro;
      })
    : loterias;
  const rows = [["Campaña", "Precio/participación", "Fecha límite", "Estado", "Socio", "Nº inicio", "Nº fin", "Asignadas", "Vendidas", "Pendientes", "Recaudado (€)", "Entregado"]];
  lotsFiltradas.forEach(l => {
    const tals = talonarios.filter(t => t.loteria_id === l.id);
    if (tals.length === 0) {
      rows.push([l.nombre, l.precio_participacion, l.fecha_limite || "", l.estado, "", "", "", "", "", "", "", ""]);
    } else {
      tals.forEach(t => {
        const vendidas = t.cantidad_vendida || 0;
        const recaudado = vendidas * (l.precio_participacion || 1);
        rows.push([l.nombre, l.precio_participacion, l.fecha_limite || "", l.estado, t.integrante_nombre, t.numeros_inicio, t.numeros_fin, t.cantidad_asignada || 0, vendidas, Math.max(0, (t.cantidad_asignada || 0) - vendidas), recaudado.toFixed(2), t.entregado ? "Sí" : "No"]);
      });
      const totalVendidas = tals.reduce((s, t) => s + (t.cantidad_vendida || 0), 0);
      const totalAsignadas = tals.reduce((s, t) => s + (t.cantidad_asignada || 0), 0);
      const totalRec = totalVendidas * (l.precio_participacion || 1);
      rows.push([`TOTAL — ${l.nombre}`, "", "", "", "", "", "", totalAsignadas, totalVendidas, totalAsignadas - totalVendidas, totalRec.toFixed(2), ""]);
      rows.push([]);
    }
  });
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `loteria_${anioFiltro || "todas"}_${new Date().toISOString().substring(0, 10)}.csv`;
  a.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const CARGOS_EDIT = ["presidente", "vicepresidente", "secretario", "tesorero", "vocal"];

function Badge({ children, color = "gray" }) {
  const colors = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-500",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color] || colors.gray}`}>{children}</span>;
}

/** Envía notificación a admin y todos los cargos */
async function notificarAdminYCargos(integrantes, titulo, mensaje) {
  api.entities.Notificacion.create({ titulo, mensaje, tipo: "otro" }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// FormLoteria
// ─────────────────────────────────────────────────────────────────────────────
function FormLoteria({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    nombre: "", precio_participacion: 1, precio_carroza: 0,
    total_papeletas: 0,
    numero_que_se_juega: "", fecha_limite: "", descripcion: "", estado: "activa",
    imagen_papeleta_url: ""
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const beneficioPorPapeleta = (form.precio_participacion || 0) - (form.precio_carroza || 0);

  const handleImagenPapeleta = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoImagen(true);
    const { file_url } = await api.uploadFile({ file });
    set("imagen_papeleta_url", file_url);
    setSubiendoImagen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="font-bold text-gray-800">{initial?.id ? "Editar lotería" : "Nueva campaña de lotería"}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 block mb-1">Nombre</label>
          <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Lotería Navidad 2026"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Número que se juega</label>
          <input value={form.numero_que_se_juega || ""} onChange={e => set("numero_que_se_juega", e.target.value)}
            placeholder="Ej: 12345"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Fecha límite de entrega</label>
          <input type="date" value={form.fecha_limite ? form.fecha_limite.substring(0, 10) : ""} onChange={e => set("fecha_limite", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>

        {/* Total papeletas adquiridas */}
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 block mb-1">Total papeletas adquiridas <span className="text-gray-400 font-normal">(límite máximo asignable)</span></label>
          <input type="number" min="0" step="1" value={form.total_papeletas || ""}
            onFocus={e => e.target.select()}
            onChange={e => set("total_papeletas", parseInt(e.target.value) || 0)}
            placeholder="Ej: 500"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
          <p className="text-[10px] text-gray-400 mt-1">Introduce el total de papeletas que la peña ha adquirido para esta campaña. Se usará para controlar la asignación.</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Precio por papeleta (€ total)</label>
          <input type="number" min="0" step="0.5" value={form.precio_participacion}
            onFocus={e => e.target.select()}
            onChange={e => set("precio_participacion", parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">Parte que se juega (€ para premio)</label>
          <input type="number" min="0" step="0.5" value={form.precio_carroza}
            onFocus={e => e.target.select()}
            onChange={e => set("precio_carroza", parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
        {(form.precio_participacion > 0 || form.precio_carroza > 0) && (
          <div className="sm:col-span-2 bg-[#630027]/5 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-gray-600">Beneficio neto para la peña:</span>
            <span className="text-sm font-black text-[#630027]">{beneficioPorPapeleta.toFixed(2)}€ / papeleta</span>
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 block mb-1">Imagen de la papeleta (opcional)</label>
          {form.imagen_papeleta_url ? (
            <div className="flex items-center gap-3">
              <img src={form.imagen_papeleta_url} alt="papeleta" className="h-16 rounded-lg object-contain border border-gray-100" />
              <button onClick={() => set("imagen_papeleta_url", "")} className="text-xs text-red-400 hover:text-red-600 font-semibold">Eliminar</button>
            </div>
          ) : (
            <label className={`flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-[#630027]/40 transition-colors ${subiendoImagen ? "opacity-60 pointer-events-none" : ""}`}>
              <input type="file" accept="image/*" className="hidden" onChange={handleImagenPapeleta} />
              <span className="text-xs text-gray-400">{subiendoImagen ? "Subiendo..." : "Haz clic para subir imagen de la papeleta"}</span>
            </label>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 block mb-1">Descripción / notas (opcional)</label>
          <textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)} rows={2} placeholder="Descripción de la campaña..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20 resize-none" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl py-2.5 hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button onClick={() => onSave(form)} disabled={!form.nombre}
          className="flex-1 bg-[#630027] text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-[#4a001d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> Guardar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfigTalonarios — con alerta de sobreasignación
// ─────────────────────────────────────────────────────────────────────────────
function ConfigTalonarios({ loteria, talonarios, integrantes, onGuardado }) {
  const loteriaId = loteria.id;
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState("auto");
  const [papeletasPorTalonario, setPapeletasPorTalonario] = useState("");
  const [primerNumero, setPrimerNumero] = useState(() => {
    if (talonarios.length === 0) return 1;
    return Math.max(...talonarios.map(t => t.numeros_fin || 0)) + 1;
  });
  const [talonariosPorPersona, setTalonariosPorPersona] = useState({});
  const [formManual, setFormManual] = useState({ integrante_id: "", numeros_inicio: "", numeros_fin: "" });
  const [guardando, setGuardando] = useState(false);

  const siguienteNumeroLibre = talonarios.length === 0 ? 1 : Math.max(...talonarios.map(t => t.numeros_fin || 0)) + 1;
  const ppp = parseInt(papeletasPorTalonario) || 0;
  const elegibles = integrantes.filter(i => i.categoria === "socios" || i.categoria === "cargos");
  const getTal = (id) => talonariosPorPersona[id] ?? 0;
  const setTal = (id, val) => setTalonariosPorPersona(prev => ({ ...prev, [id]: Math.max(0, val) }));
  const togglePersona = (id) => setTalonariosPorPersona(prev => prev[id] > 0 ? { ...prev, [id]: 0 } : { ...prev, [id]: 1 });
  const seleccionados = elegibles.filter(i => getTal(i.id) > 0);
  const toggleTodos = () => {
    if (seleccionados.length === elegibles.length) {
      setTalonariosPorPersona({});
    } else {
      const nuevo = {};
      elegibles.forEach(i => { nuevo[i.id] = getTal(i.id) || 1; });
      setTalonariosPorPersona(nuevo);
    }
  };

  // Ya asignadas previamente
  const yaAsignadas = talonarios.reduce((s, t) => s + (t.cantidad_asignada || 0), 0);
  const totalPapeletasAuto = ppp > 0 ? elegibles.reduce((s, i) => s + getTal(i.id) * ppp, 0) : 0;
  const totalSiGuardamos = yaAsignadas + totalPapeletasAuto;
  const limite = loteria.total_papeletas || 0;
  const sobreAsignado = limite > 0 && totalSiGuardamos > limite;
  const restanDisponibles = limite > 0 ? Math.max(0, limite - yaAsignadas) : null;
  const finPrevistaAuto = (parseInt(primerNumero) || siguienteNumeroLibre) + totalPapeletasAuto - 1;

  // Alerta en manual
  const cantidadManual = formManual.numeros_inicio && formManual.numeros_fin
    ? Math.max(0, parseInt(formManual.numeros_fin) - parseInt(formManual.numeros_inicio) + 1) : 0;
  const sobreAsignadoManual = limite > 0 && (yaAsignadas + cantidadManual) > limite;

  const guardarAuto = async () => {
    setGuardando(true);
    let inicio = parseInt(primerNumero) || siguienteNumeroLibre;
    const rows = [];
    for (const integ of elegibles) {
      const nTal = getTal(integ.id);
      for (let t = 0; t < nTal; t++) {
        const fin = inicio + ppp - 1;
        rows.push({
          loteria_id: loteriaId,
          integrante_id: integ.id,
          integrante_nombre: integ.nombre || "",
          numeros_inicio: inicio,
          numeros_fin: fin,
          cantidad_asignada: ppp,
          cantidad_vendida: 0,
        });
        inicio = fin + 1;
      }
    }
    await Promise.all(rows.map(r => api.entities.TalonarioLoteria.create(r)));
    // Notificar a cada socio asignado
    for (const integ of elegibles) {
      const nTal = getTal(integ.id);
      if (nTal > 0) {
        api.entities.Notificacion.create({
          titulo: `🎫 Te han asignado talonario de lotería`,
          mensaje: `Se te han asignado ${nTal} talonario(s) de ${nTal * ppp} papeletas para la lotería "${loteria.nombre}".`,
          tipo: "otro",
        }).catch(() => {});
      }
    }
    setGuardando(false);
    setOpen(false);
    setTalonariosPorPersona({});
    onGuardado();
  };

  const guardarManual = async () => {
    const { integrante_id, numeros_inicio, numeros_fin } = formManual;
    const cantidad = Math.max(0, parseInt(numeros_fin) - parseInt(numeros_inicio) + 1);
    const integ = integrantes.find(i => i.id === integrante_id);
    await api.entities.TalonarioLoteria.create({
      loteria_id: loteriaId, integrante_id,
      integrante_nombre: integ?.nombre || "",
      numeros_inicio: parseInt(numeros_inicio),
      numeros_fin: parseInt(numeros_fin),
      cantidad_asignada: cantidad, cantidad_vendida: 0,
    });
    // Notificar al socio
    api.entities.Notificacion.create({
      titulo: `🎫 Te han asignado un talonario de lotería`,
      mensaje: `Se te ha asignado el talonario de números ${numeros_inicio}–${numeros_fin} (${cantidad} papeletas) para la lotería "${loteria.nombre}".`,
      tipo: "otro",
    }).catch(() => {});
    setFormManual({ integrante_id: "", numeros_inicio: "", numeros_fin: "" });
    setOpen(false);
    onGuardado();
  };

  return (
    <div className="mt-3">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-[#630027] font-semibold hover:underline">
          <Plus className="w-4 h-4" /> Asignar talonarios
        </button>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase">Asignar talonarios</p>
            <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
              <button onClick={() => setModo("auto")} className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${modo === "auto" ? "bg-[#630027] text-white" : "text-gray-500"}`}>
                <Settings className="w-3 h-3 inline mr-1" />Automático
              </button>
              <button onClick={() => setModo("manual")} className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${modo === "manual" ? "bg-[#630027] text-white" : "text-gray-500"}`}>
                Manual
              </button>
            </div>
          </div>

          {/* Disponibles restantes */}
          {limite > 0 && (
            <div className={`rounded-lg px-3 py-2 text-xs flex items-center gap-2 ${restanDisponibles === 0 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>
              <BarChart2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                <strong>{yaAsignadas}</strong> de <strong>{limite}</strong> papeletas asignadas ·{" "}
                <strong>{restanDisponibles}</strong> disponibles para repartir
              </span>
            </div>
          )}

          {modo === "auto" ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Papeletas por talonario</label>
                  <input type="number" min={1} value={papeletasPorTalonario}
                    onFocus={e => e.target.select()}
                    onChange={e => setPapeletasPorTalonario(e.target.value)}
                    placeholder="Ej: 20"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Primer número</label>
                  <input type="number" min={1} value={primerNumero}
                    onFocus={e => e.target.select()}
                    onChange={e => setPrimerNumero(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Libre: {siguienteNumeroLibre}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-500">Personas y talonarios</label>
                  <button onClick={toggleTodos} className="text-[10px] text-[#630027] font-semibold hover:underline">
                    {seleccionados.length === elegibles.length ? "Quitar todos" : "Añadir todos (×1)"}
                  </button>
                </div>
                <div className="max-h-52 overflow-y-auto border border-gray-100 rounded-xl bg-white divide-y divide-gray-50">
                  {elegibles.length === 0 && <p className="text-xs text-gray-400 p-3">No hay socios disponibles</p>}
                  {elegibles.map(i => {
                    const n = getTal(i.id);
                    return (
                      <div key={i.id} className={`flex items-center justify-between px-3 py-2 transition-colors ${n > 0 ? "bg-[#630027]/5" : ""}`}>
                        <button onClick={() => togglePersona(i.id)} className="flex items-center gap-2 flex-1 text-left">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${n > 0 ? "bg-[#630027] border-[#630027]" : "border-gray-300"}`}>
                            {n > 0 && <span className="text-white text-[9px] font-black">✓</span>}
                          </div>
                          <span className={`text-sm ${n > 0 ? "font-semibold text-gray-800" : "text-gray-500"}`}>{i.nombre}</span>
                        </button>
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => setTal(i.id, n - 1)} disabled={n === 0}
                            className="w-6 h-6 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold">−</button>
                          <span className={`w-6 text-center text-sm font-black ${n > 0 ? "text-[#630027]" : "text-gray-300"}`}>{n}</span>
                          <button onClick={() => setTal(i.id, n + 1)}
                            className="w-6 h-6 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors text-sm font-bold">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {totalPapeletasAuto > 0 && ppp > 0 && (
                <div className={`rounded-lg p-3 text-xs space-y-1.5 ${sobreAsignado ? "bg-red-50 border border-red-200" : "bg-[#630027]/5"}`}>
                  {sobreAsignado && (
                    <div className="flex items-center gap-1.5 text-red-600 font-bold mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      ¡Sobreasignación! Estás asignando {totalSiGuardamos - limite} papeletas más de las disponibles
                    </div>
                  )}
                  <p className={`font-semibold ${sobreAsignado ? "text-red-600" : "text-gray-600"}`}>
                    Resumen de asignación:
                  </p>
                  <div className="space-y-0.5">
                    {seleccionados.map(i => {
                      const nTal = getTal(i.id);
                      return (
                        <p key={i.id} className={sobreAsignado ? "text-red-500" : "text-gray-600"}>
                          · <strong>{i.nombre}</strong>: {nTal} talonario{nTal !== 1 ? "s" : ""} ({nTal * ppp} papeletas)
                        </p>
                      );
                    })}
                  </div>
                  <p className={`pt-0.5 border-t ${sobreAsignado ? "text-red-600 border-red-200" : "text-gray-500 border-[#630027]/10"}`}>
                    Total: <strong>{totalPapeletasAuto}</strong> papeletas nuevas · Números: <strong>{primerNumero || siguienteNumeroLibre}</strong> → <strong>{finPrevistaAuto}</strong>
                    {limite > 0 && <> · Quedaría: <strong>{totalSiGuardamos}/{limite}</strong></>}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm rounded-xl py-2 hover:bg-white">Cancelar</button>
                <button onClick={guardarAuto} disabled={guardando || seleccionados.length === 0 || !ppp || sobreAsignado}
                  className="flex-1 bg-[#630027] text-white text-sm font-semibold rounded-xl py-2 hover:bg-[#4a001d] disabled:opacity-50">
                  {guardando ? "Guardando..." : `Asignar (${seleccionados.length} personas)`}
                </button>
              </div>
            </>
          ) : (
            <>
              <select value={formManual.integrante_id} onChange={e => setFormManual(p => ({ ...p, integrante_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white">
                <option value="">Seleccionar socio...</option>
                {elegibles.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Número inicio</label>
                  <input type="number" value={formManual.numeros_inicio} onChange={e => setFormManual(p => ({ ...p, numeros_inicio: e.target.value }))}
                    placeholder="001" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Número fin</label>
                  <input type="number" value={formManual.numeros_fin} onChange={e => setFormManual(p => ({ ...p, numeros_fin: e.target.value }))}
                    placeholder="020" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" />
                </div>
              </div>
              {cantidadManual > 0 && (
                <p className={`text-xs font-semibold ${sobreAsignadoManual ? "text-red-500" : "text-[#630027]"}`}>
                  {sobreAsignadoManual && "⚠ "}
                  {cantidadManual} participaciones
                  {sobreAsignadoManual && ` — supera el límite (disponibles: ${restanDisponibles})`}
                </p>
              )}
              <div className="flex gap-2">
                <button onClick={() => setOpen(false)} className="flex-1 border border-gray-200 text-gray-600 text-sm rounded-xl py-2 hover:bg-white">Cancelar</button>
                <button onClick={guardarManual} disabled={!formManual.integrante_id || !formManual.numeros_inicio || !formManual.numeros_fin || cantidadManual <= 0 || sobreAsignadoManual}
                  className="flex-1 bg-[#630027] text-white text-sm font-semibold rounded-xl py-2 hover:bg-[#4a001d] disabled:opacity-50">
                  Asignar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ModalDevolucion
// ─────────────────────────────────────────────────────────────────────────────
function ModalDevolucion({ talonario, onConfirm, onCancel }) {
  const pendientes = (talonario.cantidad_asignada || 0) - (talonario.cantidad_vendida || 0) - (talonario.cantidad_devuelta || 0);
  const [cantidad, setCantidad] = useState(pendientes);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center gap-3">
          <PackageOpen className="w-6 h-6 text-amber-500" />
          <h3 className="font-bold text-gray-800">Registrar devolución</h3>
        </div>
        <p className="text-sm text-gray-500"><strong>{talonario.integrante_nombre}</strong> — pendientes: <strong className="text-red-500">{pendientes}</strong></p>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">¿Cuántas participaciones se devuelven?</label>
          <input type="number" min={0} max={pendientes} value={cantidad}
            onChange={e => setCantidad(Math.min(pendientes, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl py-2.5 hover:bg-gray-50">Cancelar</button>
          <button onClick={() => onConfirm(cantidad)} disabled={cantidad <= 0}
            className="flex-1 bg-amber-500 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-amber-600 disabled:opacity-50">
            Confirmar devolución
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HistorialEntregas
// ─────────────────────────────────────────────────────────────────────────────
function HistorialEntregas({ loterias }) {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroLoteria, setFiltroLoteria] = useState("todas");

  useEffect(() => {
    api.entities.EntregaTalonario.list("-fecha_entrega", 200).then(data => {
      setEntregas(data);
      setLoading(false);
    });
  }, []);

  const filtradas = filtroLoteria === "todas" ? entregas : entregas.filter(e => e.loteria_id === filtroLoteria);

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-[#630027]" /> Historial de entregas
        </h3>
        <select value={filtroLoteria} onChange={e => setFiltroLoteria(e.target.value)}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none">
          <option value="todas">Todas las campañas</option>
          {loterias.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
        </select>
      </div>
      {filtradas.length === 0 ? (
        <div className="p-8 text-center">
          <History className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No hay entregas registradas</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtradas.map(e => (
            <div key={e.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50">
              <div>
                <p className="text-sm font-semibold text-gray-800">{e.integrante_nombre}</p>
                <p className="text-xs text-gray-400">
                  {e.loteria_nombre} · Nº {e.numeros_inicio}–{e.numeros_fin} · {e.cantidad_vendida}/{e.cantidad_asignada} vendidas
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <Badge color="green">✓ Entregado</Badge>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {format(new Date(e.fecha_entrega), "d MMM yyyy · HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TalonarioRow — fila admin con +/- para editar vendidas
// ─────────────────────────────────────────────────────────────────────────────
function TalonarioRow({ talonario, precio, puedeEditar, onUpdate, onDelete, todosLosTalonarios, loteria, integrantes }) {
  const [editVendidas, setEditVendidas] = useState(false);
  const [vendidas, setVendidas] = useState(talonario.cantidad_vendida || 0);
  const [inputManual, setInputManual] = useState("");
  const [editNumeros, setEditNumeros] = useState(false);
  const [numInicio, setNumInicio] = useState(talonario.numeros_inicio);
  const [numFin, setNumFin] = useState(talonario.numeros_fin);
  const [showDevolucion, setShowDevolucion] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const recaudado = (talonario.cantidad_vendida || 0) * precio;
  const devueltas = talonario.cantidad_devuelta || 0;
  const pendientes = Math.max(0, (talonario.cantidad_asignada || 0) - (talonario.cantidad_vendida || 0) - devueltas);

  // Sync local state cuando cambian los datos externos
  useEffect(() => {
    if (!editVendidas) setVendidas(talonario.cantidad_vendida || 0);
  }, [talonario.cantidad_vendida, editVendidas]);

  const guardarVendidas = async (nuevasVendidas) => {
    const val = Math.min(talonario.cantidad_asignada || 0, Math.max(0, nuevasVendidas));
    setVendidas(val);
    await onUpdate(talonario.id, { cantidad_vendida: val });
    setEditVendidas(false);
    setInputManual("");
    // Notificar a admin y cargos si vendió todo
    const asignadas = talonario.cantidad_asignada || 0;
    const yaEraCompleto = (talonario.cantidad_vendida || 0) >= asignadas;
    if (!yaEraCompleto && val >= asignadas && asignadas > 0) {
      notificarAdminYCargos(integrantes,
        `🎫 ${talonario.integrante_nombre} ha vendido todos sus números`,
        `${talonario.integrante_nombre} ha vendido las ${asignadas} participaciones del talonario Nº ${talonario.numeros_inicio}–${talonario.numeros_fin} de la lotería "${loteria?.nombre || ""}".`
      );
    }
  };

  const aplicarManual = () => {
    const v = parseInt(inputManual);
    if (!isNaN(v)) {
      setVendidas(Math.min(talonario.cantidad_asignada || 0, Math.max(0, vendidas + v)));
    }
    setInputManual("");
  };

  const guardarNumeros = async () => {
    const ini = parseInt(numInicio);
    const fin = parseInt(numFin);
    if (isNaN(ini) || isNaN(fin) || ini > fin) return;
    const cantidad = fin - ini + 1;
    await onUpdate(talonario.id, { numeros_inicio: ini, numeros_fin: fin, cantidad_asignada: cantidad });
    const siguientes = (todosLosTalonarios || [])
      .filter(t => t.id !== talonario.id && t.numeros_inicio >= ini)
      .sort((a, b) => a.numeros_inicio - b.numeros_inicio);
    let nextStart = fin + 1;
    for (const t of siguientes) {
      const tam = (t.numeros_fin || 0) - (t.numeros_inicio || 0);
      await onUpdate(t.id, { numeros_inicio: nextStart, numeros_fin: nextStart + tam, cantidad_asignada: tam + 1 });
      nextStart = nextStart + tam + 1;
    }
    setEditNumeros(false);
  };

  const confirmarDevolucion = async (cantidad) => {
    const nuevaDevuelta = devueltas + cantidad;
    await onUpdate(talonario.id, { cantidad_devuelta: nuevaDevuelta, devuelto: true });
    setShowDevolucion(false);
  };

  return (
    <>
      {showDevolucion && <ModalDevolucion talonario={talonario} onConfirm={confirmarDevolucion} onCancel={() => setShowDevolucion(false)} />}
      <ConfirmDialog
        open={confirmDelete}
        mensaje={`¿Eliminar el talonario de "${talonario.integrante_nombre}"?`}
        textoConfirmar="Eliminar"
        onConfirm={() => { onDelete(talonario.id); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-50 last:border-0 gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm">{talonario.integrante_nombre}</p>
          {editNumeros ? (
            <div className="flex items-center gap-1 mt-1">
              <input type="number" value={numInicio} onChange={e => setNumInicio(e.target.value)} onFocus={e => e.target.select()}
                className="w-16 border border-gray-200 rounded-lg px-1.5 py-0.5 text-xs text-center" />
              <span className="text-xs text-gray-400">–</span>
              <input type="number" value={numFin} onChange={e => setNumFin(e.target.value)} onFocus={e => e.target.select()}
                className="w-16 border border-gray-200 rounded-lg px-1.5 py-0.5 text-xs text-center" />
              <button onClick={guardarNumeros} className="text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => { setNumInicio(talonario.numeros_inicio); setNumFin(talonario.numeros_fin); setEditNumeros(false); }} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              Nº {talonario.numeros_inicio} – {talonario.numeros_fin} · {talonario.cantidad_asignada} asignadas{devueltas > 0 ? ` · ${devueltas} devueltas` : ""}
              {puedeEditar && (
                <button onClick={() => setEditNumeros(true)} className="text-gray-300 hover:text-[#630027] ml-0.5">
                  <Edit2 className="w-3 h-3 inline" />
                </button>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Control vendidas */}
          <div className="text-right">
            {editVendidas ? (
              <div className="flex flex-col gap-1 items-end">
                {/* Botones +/- y input */}
                <div className="flex items-center gap-1">
                  <button onClick={() => setVendidas(v => Math.max(0, v - 1))}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 text-base font-bold">−</button>
                  <span className="w-8 text-center text-sm font-black text-[#630027]">{vendidas}</span>
                  <button onClick={() => setVendidas(v => Math.min(talonario.cantidad_asignada || 0, v + 1))}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-green-50 hover:text-green-600 text-base font-bold">+</button>
                </div>
                {/* Input manual */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={inputManual}
                    onChange={e => setInputManual(e.target.value)}
                    placeholder="+N"
                    onKeyDown={e => { if (e.key === "Enter") aplicarManual(); }}
                    className="w-14 border border-gray-200 rounded-lg px-1.5 py-0.5 text-xs text-center"
                  />
                  <button onClick={aplicarManual} className="text-[10px] text-[#630027] font-semibold hover:underline">Añadir</button>
                </div>
                {/* Guardar/cancelar */}
                <div className="flex items-center gap-1">
                  <button onClick={() => guardarVendidas(vendidas)} className="text-green-600 hover:text-green-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditVendidas(false); setVendidas(talonario.cantidad_vendida || 0); setInputManual(""); }} className="text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div>
                  <p className="text-sm font-bold text-gray-700">{talonario.cantidad_vendida || 0}/{talonario.cantidad_asignada}</p>
                  <p className="text-[10px] text-gray-400">{recaudado.toFixed(2)}€ recaudado</p>
                </div>
                {puedeEditar && (
                  <button onClick={() => setEditVendidas(true)} className="text-gray-400 hover:text-[#630027] ml-1">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {talonario.entregado
              ? <Badge color="green">✓ Entregado</Badge>
              : talonario.devuelto && pendientes === 0
                ? <Badge color="blue">Devuelto ✓</Badge>
                : pendientes === 0
                  ? <Badge color="blue">Todo vendido</Badge>
                  : <Badge color="amber">{pendientes} pend.</Badge>
            }
            {puedeEditar && (
              <>
                <button onClick={async () => {
                  const nuevoEstado = !talonario.entregado;
                  await onUpdate(talonario.id, { entregado: nuevoEstado });
                  if (nuevoEstado) {
                    api.entities.EntregaTalonario.create({
                      loteria_id: loteria?.id || talonario.loteria_id,
                      loteria_nombre: loteria?.nombre || "",
                      talonario_id: talonario.id,
                      integrante_id: talonario.integrante_id,
                      integrante_nombre: talonario.integrante_nombre,
                      numeros_inicio: talonario.numeros_inicio,
                      numeros_fin: talonario.numeros_fin,
                      cantidad_vendida: talonario.cantidad_vendida || 0,
                      cantidad_asignada: talonario.cantidad_asignada || 0,
                      fecha_entrega: new Date().toISOString(),
                    }).catch(() => {});
                  }
                }}
                  title={talonario.entregado ? "Marcar como no entregado" : "Marcar como entregado"}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-600 transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                {pendientes > 0 && (
                  <button onClick={() => setShowDevolucion(true)} title="Registrar devolución"
                    className="p-1 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setConfirmDelete(true)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vista resumen de talonarios disponibles vs asignados
// ─────────────────────────────────────────────────────────────────────────────
function ResumenDisponibilidad({ loterias, talonarios }) {
  const filas = loterias
    .filter(l => (l.total_papeletas || 0) > 0)
    .map(l => {
      const tals = talonarios.filter(t => t.loteria_id === l.id);
      const asignadas = tals.reduce((s, t) => s + (t.cantidad_asignada || 0), 0);
      const disponibles = l.total_papeletas - asignadas;
      const pct = l.total_papeletas > 0 ? Math.round((asignadas / l.total_papeletas) * 100) : 0;
      const sobrePasado = asignadas > l.total_papeletas;
      return { ...l, asignadas, disponibles, pct, sobrePasado };
    });

  if (filas.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-[#630027]" />
        <h3 className="font-bold text-gray-700 text-sm">Disponibilidad de papeletas</h3>
      </div>
      <div className="p-4 space-y-4">
        {filas.map(f => (
          <div key={f.id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">{f.nombre}</span>
                <Badge color={f.estado === "activa" ? "green" : "gray"}>{f.estado}</Badge>
                {f.sobrePasado && <Badge color="red">⚠ Sobreasignado</Badge>}
              </div>
              <span className="text-xs text-gray-500 font-semibold">
                {f.asignadas}<span className="text-gray-300">/{f.total_papeletas}</span>
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all ${f.sobrePasado ? "bg-red-500" : f.pct >= 90 ? "bg-amber-400" : "bg-[#630027]"}`}
                style={{ width: `${Math.min(100, f.pct)}%` }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className={`text-[10px] font-semibold ${f.sobrePasado ? "text-red-500" : "text-gray-400"}`}>
                {f.sobrePasado
                  ? `⚠ ${Math.abs(f.disponibles)} papeletas de más asignadas`
                  : `${f.disponibles} sin repartir`}
              </span>
              <span className="text-[10px] text-gray-400">{f.pct}% asignado</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TablaResumen
// ─────────────────────────────────────────────────────────────────────────────
function TablaResumen({ loterias, talonarios }) {
  if (loterias.length === 0) return null;
  const filas = loterias.map(l => {
    const tals = talonarios.filter(t => t.loteria_id === l.id);
    const asignadas = tals.reduce((s, t) => s + (t.cantidad_asignada || 0), 0);
    const vendidas = tals.reduce((s, t) => s + (t.cantidad_vendida || 0), 0);
    const devueltas = tals.reduce((s, t) => s + (t.cantidad_devuelta || 0), 0);
    const pendientes = asignadas - vendidas - devueltas;
    const recaudado = vendidas * (l.precio_participacion || 1);
    const entregado = tals.filter(t => t.entregado).length;
    return { nombre: l.nombre, estado: l.estado, asignadas, vendidas, devueltas, pendientes, recaudado, entregado, total: tals.length };
  });
  const totRec = filas.reduce((s, f) => s + f.recaudado, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
          <Euro className="w-4 h-4 text-[#630027]" /> Resumen global de recaudación
        </h3>
        <span className="text-lg font-black text-[#630027]">{totRec.toFixed(2)}€ total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-400 uppercase">
              <th className="px-4 py-2 text-left font-semibold">Campaña</th>
              <th className="px-3 py-2 text-center font-semibold">Estado</th>
              <th className="px-3 py-2 text-center font-semibold">Talonarios</th>
              <th className="px-3 py-2 text-center font-semibold">Vendidas</th>
              <th className="px-3 py-2 text-center font-semibold">Devueltas</th>
              <th className="px-3 py-2 text-center font-semibold">Pendientes</th>
              <th className="px-3 py-2 text-center font-semibold">Recaudado</th>
              <th className="px-3 py-2 text-center font-semibold">Entregados</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-semibold text-gray-700">{f.nombre}</td>
                <td className="px-3 py-2.5 text-center"><Badge color={f.estado === "activa" ? "green" : "gray"}>{f.estado}</Badge></td>
                <td className="px-3 py-2.5 text-center text-gray-600">{f.total}</td>
                <td className="px-3 py-2.5 text-center font-bold text-blue-600">{f.vendidas}</td>
                <td className="px-3 py-2.5 text-center font-bold text-amber-600">{f.devueltas}</td>
                <td className="px-3 py-2.5 text-center font-bold text-red-500">{Math.max(0, f.pendientes)}</td>
                <td className="px-3 py-2.5 text-center font-black text-[#630027]">{f.recaudado.toFixed(2)}€</td>
                <td className="px-3 py-2.5 text-center text-green-600 font-bold">{f.entregado}/{f.total}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td colSpan={6} className="px-4 py-2.5 font-black text-gray-700">TOTAL</td>
              <td className="px-3 py-2.5 text-center font-black text-[#630027]">{totRec.toFixed(2)}€</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GraficoProgreso — gráfico por socio corregido
// ─────────────────────────────────────────────────────────────────────────────
function GraficoProgreso({ loterias, talonarios }) {
  const activas = loterias.filter(l => l.estado === "activa");
  const talsActivas = talonarios.filter(t => activas.some(l => l.id === t.loteria_id));

  const totalAsignadas = talsActivas.reduce((s, t) => s + (t.cantidad_asignada || 0), 0);
  const totalVendidas = talsActivas.reduce((s, t) => s + (t.cantidad_vendida || 0), 0);
  const totalPendientes = totalAsignadas - totalVendidas;
  const pct = totalAsignadas > 0 ? Math.round((totalVendidas / totalAsignadas) * 100) : 0;

  const pieData = [
    { name: "Vendidas", value: totalVendidas },
    { name: "Pendientes", value: Math.max(0, totalPendientes) },
  ];
  const COLORS = ["#630027", "#e5c8d0"];

  // Agrupar por socio (puede tener varios talonarios)
  const bySocioMap = {};
  talsActivas.forEach(t => {
    const nombre = t.integrante_nombre?.split(" ")[0] || "?";
    if (!bySocioMap[nombre]) bySocioMap[nombre] = { nombre, Vendidas: 0, Pendientes: 0 };
    bySocioMap[nombre].Vendidas += t.cantidad_vendida || 0;
    bySocioMap[nombre].Pendientes += Math.max(0, (t.cantidad_asignada || 0) - (t.cantidad_vendida || 0));
  });
  const bySocio = Object.values(bySocioMap);

  if (totalAsignadas === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
      <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#630027]" /> Progreso de ventas (campañas activas)</h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex-shrink-0">
          <PieChart width={140} height={140}>
            <Pie data={pieData} cx={65} cy={65} innerRadius={45} outerRadius={65} dataKey="value" startAngle={90} endAngle={-270}>
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [`${v} participaciones`, n]} />
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-black text-[#630027]">{pct}%</p>
            <p className="text-[10px] text-gray-400">vendido</p>
          </div>
        </div>

        <div className="flex-1 space-y-2 w-full">
          {[
            { label: "Vendidas", value: totalVendidas, color: "#630027" },
            { label: "Pendientes", value: Math.max(0, totalPendientes), color: "#e5c8d0" },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-gray-600">{item.label}</span>
                <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full transition-all" style={{ width: `${totalAsignadas > 0 ? (item.value / totalAsignadas) * 100 : 0}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 pt-1">{totalAsignadas} participaciones totales asignadas</p>
        </div>
      </div>

      {bySocio.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Papeletas por socio (vendidas vs pendientes)</p>
          <ResponsiveContainer width="100%" height={Math.max(120, bySocio.length * 36)}>
            <BarChart data={bySocio} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={70} />
              <Tooltip formatter={(v, n) => [`${v} papeletas`, n]} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Vendidas" stackId="a" fill="#630027" />
              <Bar dataKey="Pendientes" stackId="a" fill="#e5c8d0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GrupoSocioTalonarios — fila agrupada por socio con expansión individual
// ─────────────────────────────────────────────────────────────────────────────
function GrupoSocioTalonarios({ grupo, precio, puedeEditar, onUpdate, onDelete, todosLosTalonarios, loteria, integrantes, onAddTalonario, onRemoveTalonario, forceExpandAll }) {
  const { nombre, talonarios } = grupo;
  const [expandido, setExpandido] = useState(talonarios.length === 1);

  useEffect(() => {
    if (forceExpandAll !== null && forceExpandAll !== undefined) setExpandido(forceExpandAll);
  }, [forceExpandAll]);

  const totalAsignado = talonarios.reduce((s, t) => s + (t.cantidad_asignada || 0), 0);
  const totalVendido = talonarios.reduce((s, t) => s + (t.cantidad_vendida || 0), 0);
  const totalDevuelto = talonarios.reduce((s, t) => s + (t.cantidad_devuelta || 0), 0);
  const pendientes = Math.max(0, totalAsignado - totalVendido - totalDevuelto);
  const recaudado = totalVendido * precio;
  const todoEntregado = talonarios.every(t => t.entregado);
  const pct = totalAsignado > 0 ? Math.round((totalVendido / totalAsignado) * 100) : 0;



  return (
    <div className="border-b border-gray-50 last:border-0">
      {/* Cabecera agrupada */}
      <div className="flex items-center justify-between py-3 gap-2">
        <button onClick={() => setExpandido(e => !e)} className="flex items-center gap-2 flex-1 text-left min-w-0">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${expandido ? "bg-[#630027] border-[#630027]" : "border-gray-300"}`}>
            {expandido
              ? <ChevronUp className="w-3 h-3 text-white" />
              : <ChevronDown className="w-3 h-3 text-gray-400" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm">{nombre}</p>
            <p className="text-xs text-gray-400">{talonarios.length} talonario{talonarios.length !== 1 ? "s" : ""} ({totalAsignado} papeletas)</p>
          </div>
        </button>
        <div className="flex items-center gap-3 flex-shrink-0">
          {puedeEditar && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveTalonario(talonarios[0].integrante_id); }}
                title="Quitar 1 talonario"
                className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 text-sm font-bold transition-colors">−</button>
              <button
                onClick={(e) => { e.stopPropagation(); onAddTalonario(talonarios[0].integrante_id, nombre); }}
                title="Añadir 1 talonario"
                className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-green-50 hover:text-green-600 text-sm font-bold transition-colors">+</button>
            </div>
          )}
          <div className="text-right">
            <p className="text-sm font-black text-[#630027]">{totalVendido}/{totalAsignado}</p>
            <p className="text-[10px] text-gray-400">{recaudado.toFixed(2)}€ · {pct}%</p>
          </div>
          {todoEntregado
            ? <Badge color="green">✓ Entregado</Badge>
            : pendientes === 0
              ? <Badge color="blue">Todo vendido</Badge>
              : <Badge color="amber">{pendientes} pend.</Badge>}
        </div>
      </div>
      {/* Barra de progreso del socio */}
      <div className="mx-2 mb-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-1.5 rounded-full bg-[#630027] transition-all" style={{ width: `${pct}%` }} />
      </div>
      {/* Talonarios individuales expandidos */}
      {expandido && (
        <div className="ml-7 border-l-2 border-[#630027]/10 pl-3">
          {talonarios.map(t => (
            <TalonarioRow key={t.id} talonario={t} precio={precio} puedeEditar={puedeEditar}
              onUpdate={onUpdate} onDelete={onDelete} todosLosTalonarios={todosLosTalonarios}
              loteria={loteria} integrantes={integrantes} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PanelLoteria
// ─────────────────────────────────────────────────────────────────────────────
function PanelLoteria({ loteria, talonarios, integrantes, puedeEditar, onRefresh, onEditLoteria, onDeleteLoteria, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [sortBy, setSortBy] = useState("nombre");
  const [expandAll, setExpandAll] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [confirmAllEntregado, setConfirmAllEntregado] = useState(false);
  const talLoteria = talonarios.filter(t => t.loteria_id === loteria.id);
  const totalAsignadas = talLoteria.reduce((s, t) => s + (t.cantidad_asignada || 0), 0);
  const totalVendidas = talLoteria.reduce((s, t) => s + (t.cantidad_vendida || 0), 0);
  const totalRecaudado = totalVendidas * (loteria.precio_participacion || 1);
  const beneficioPorPapeleta = (loteria.precio_participacion || 1) - (loteria.precio_carroza || 0);
  const totalBeneficio = totalVendidas * beneficioPorPapeleta;
  const vencida = loteria.fecha_limite && new Date(loteria.fecha_limite) < new Date();
  const limite = loteria.total_papeletas || 0;
  const sobrePasado = limite > 0 && totalAsignadas > limite;

  const updateTalonario = async (id, data) => {
    await api.entities.TalonarioLoteria.update(id, data);
    onRefresh();
  };
  const deleteTalonario = async (id) => {
    await api.entities.TalonarioLoteria.delete(id);
    onRefresh();
  };

  const handleAddTalonario = async (integranteId, integranteNombre) => {
    const socioTals = talLoteria.filter(t => t.integrante_id === integranteId);
    const ppp = socioTals.length > 0 ? (socioTals[0].cantidad_asignada || 20) : 20;
    const nextStart = talLoteria.length > 0 ? Math.max(...talLoteria.map(t => t.numeros_fin || 0)) + 1 : 1;
    await api.entities.TalonarioLoteria.create({
      loteria_id: loteria.id,
      integrante_id: integranteId,
      integrante_nombre: integranteNombre,
      numeros_inicio: nextStart,
      numeros_fin: nextStart + ppp - 1,
      cantidad_asignada: ppp,
      cantidad_vendida: 0,
    });
    onRefresh();
  };

  const handleRemoveTalonario = (integranteId) => {
    const socioTals = talLoteria
      .filter(t => t.integrante_id === integranteId)
      .sort((a, b) => (b.numeros_fin || 0) - (a.numeros_fin || 0));
    if (socioTals.length === 0) return;
    setConfirmRemove({ integranteId, nombre: socioTals[0].integrante_nombre, talonarioId: socioTals[0].id });
  };

  const doRemoveTalonario = async () => {
    if (!confirmRemove) return;
    await api.entities.TalonarioLoteria.delete(confirmRemove.talonarioId);
    setConfirmRemove(null);
    onRefresh();
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${sobrePasado ? "border-red-200" : "border-gray-100"}`}>
      <ConfirmDialog
        open={!!confirmRemove}
        mensaje={`¿Eliminar el último talonario de "${confirmRemove?.nombre}"?`}
        textoConfirmar="Eliminar"
        onConfirm={doRemoveTalonario}
        onCancel={() => setConfirmRemove(null)}
      />
      <ConfirmDialog
        open={confirmAllEntregado}
        mensaje="¿Marcar TODOS los talonarios de esta campaña como entregados?"
        textoConfirmar="Marcar todos"
        onConfirm={async () => {
          await Promise.all(talLoteria.filter(t => !t.entregado).map(t => updateTalonario(t.id, { entregado: true })));
          setConfirmAllEntregado(false);
        }}
        onCancel={() => setConfirmAllEntregado(false)}
      />
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#630027]/10 flex items-center justify-center flex-shrink-0">
            <Ticket className="w-5 h-5 text-[#630027]" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 text-sm">{loteria.nombre}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-xs text-gray-400">{loteria.precio_participacion}€/papeleta</span>
              {loteria.numero_que_se_juega && (
                <span className="text-xs font-bold text-[#630027] bg-[#630027]/8 px-2 py-0.5 rounded-full">
                  🎫 Nº {loteria.numero_que_se_juega}
                </span>
              )}
              {loteria.fecha_limite && (
                <span className={`flex items-center gap-0.5 text-xs ${vencida ? "text-red-500" : "text-amber-600"}`}>
                  <Calendar className="w-3 h-3" />
                  {format(new Date(loteria.fecha_limite), "d MMM yyyy", { locale: es })}
                  {vencida && " (vencida)"}
                </span>
              )}
              <Badge color={loteria.estado === "activa" ? "green" : "gray"}>{loteria.estado}</Badge>
              {sobrePasado && <Badge color="red">⚠ Sobreasignado</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-[#630027]">{totalRecaudado.toFixed(2)}€</p>
            <p className="text-[10px] text-gray-400">{totalVendidas}/{totalAsignadas} vendidas</p>
            {limite > 0 && (
              <p className="text-[10px] text-gray-400">{totalAsignadas}/{limite} asignadas</p>
            )}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-50 px-5 pb-5 pt-4">
          {/* Imagen papeleta */}
          {loteria.imagen_papeleta_url && (
            <div className="mb-4">
              <img src={loteria.imagen_papeleta_url} alt="papeleta" className="max-h-28 rounded-xl object-contain border border-gray-100" />
            </div>
          )}

          {/* Barra disponibilidad inline */}
          {limite > 0 && (
            <div className="mb-4 bg-gray-50 rounded-xl p-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-gray-600">Papeletas asignadas</span>
                <span className={`font-bold ${sobrePasado ? "text-red-500" : "text-gray-700"}`}>
                  {totalAsignadas} / {limite}
                  {sobrePasado ? " ⚠ Sobreasignado" : ` · ${Math.max(0, limite - totalAsignadas)} disponibles`}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all ${sobrePasado ? "bg-red-500" : totalAsignadas / limite >= 0.9 ? "bg-amber-400" : "bg-[#630027]"}`}
                  style={{ width: `${Math.min(100, limite > 0 ? (totalAsignadas / limite) * 100 : 0)}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Asignadas", value: totalAsignadas, icon: Ticket, color: "text-gray-700" },
              { label: "Vendidas", value: totalVendidas, icon: TrendingUp, color: "text-blue-600" },
              { label: "Recaudado", value: `${totalRecaudado.toFixed(2)}€`, icon: Euro, color: "text-[#630027]" },
              { label: "Beneficio peña", value: `${totalBeneficio.toFixed(2)}€`, icon: CheckCircle2, color: "text-green-600" },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Desglose precio */}
          {loteria.precio_carroza > 0 && (
            <div className="bg-[#630027]/5 rounded-xl p-3 mb-4 grid grid-cols-3 text-center text-xs">
              <div>
                <p className="font-black text-gray-700">{loteria.precio_participacion}€</p>
                <p className="text-gray-400">Precio papeleta</p>
              </div>
              <div>
                <p className="font-black text-gray-500">{loteria.precio_carroza}€</p>
                <p className="text-gray-400">Se juega</p>
              </div>
              <div>
                <p className="font-black text-[#630027]">{beneficioPorPapeleta.toFixed(2)}€</p>
                <p className="text-gray-400">Para la peña</p>
              </div>
            </div>
          )}

          {/* Talonarios agrupados por socio */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-500 uppercase">Talonarios ({talLoteria.length})</p>
                {talLoteria.length > 0 && (
                  <button onClick={() => setExpandAll(v => v === false ? true : false)}
                    className="text-[10px] text-[#630027] font-semibold hover:underline">
                    {expandAll === false ? "↕ Expandir todos" : "↕ Contraer todos"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {talLoteria.length > 1 && (
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none bg-white">
                    <option value="nombre">A–Z</option>
                    <option value="vendidas">Más vendidas</option>
                    <option value="talonarios">Más talonarios</option>
                    <option value="pendientes">Más pendientes</option>
                  </select>
                )}
                {puedeEditar && talLoteria.length > 0 && (
                  <button onClick={() => setConfirmAllEntregado(true)}
                    className="text-[10px] text-green-600 font-semibold hover:underline">
                    ✓ Marcar todos entregados
                  </button>
                )}
              </div>
            </div>
            {talLoteria.length === 0
              ? <p className="text-sm text-gray-300 py-2">No hay talonarios asignados aún</p>
              : (() => {
                  // Agrupar por integrante
                  const grupos = {};
                  talLoteria.forEach(t => {
                    if (!grupos[t.integrante_id]) grupos[t.integrante_id] = { nombre: t.integrante_nombre, talonarios: [] };
                    grupos[t.integrante_id].talonarios.push(t);
                  });
                  const sortedGrupos = Object.values(grupos).sort((a, b) => {
                    if (sortBy === "vendidas") return b.talonarios.reduce((s,t) => s+(t.cantidad_vendida||0),0) - a.talonarios.reduce((s,t) => s+(t.cantidad_vendida||0),0);
                    if (sortBy === "talonarios") return b.talonarios.length - a.talonarios.length;
                    if (sortBy === "pendientes") {
                      const pA = a.talonarios.reduce((s,t) => s+Math.max(0,(t.cantidad_asignada||0)-(t.cantidad_vendida||0)),0);
                      const pB = b.talonarios.reduce((s,t) => s+Math.max(0,(t.cantidad_asignada||0)-(t.cantidad_vendida||0)),0);
                      return pB - pA;
                    }
                    return a.nombre.localeCompare(b.nombre, "es");
                  });
                  return sortedGrupos.map(grupo => (
                    <GrupoSocioTalonarios key={grupo.talonarios[0].integrante_id}
                      grupo={grupo} precio={loteria.precio_participacion || 1}
                      puedeEditar={puedeEditar} onUpdate={updateTalonario} onDelete={deleteTalonario}
                      todosLosTalonarios={talLoteria} loteria={loteria} integrantes={integrantes}
                      onAddTalonario={handleAddTalonario} onRemoveTalonario={handleRemoveTalonario}
                      forceExpandAll={expandAll} />
                  ));
                })()
            }
          </div>

          {puedeEditar && (
            <div className="mt-4 flex gap-2 flex-wrap">
              <ConfigTalonarios loteria={loteria} integrantes={integrantes} talonarios={talLoteria} onGuardado={onRefresh} />
              <button onClick={() => onEditLoteria(loteria)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-semibold hover:underline ml-4">
                <Edit2 className="w-3.5 h-3.5" /> Editar
              </button>
              <button onClick={async () => {
                await api.entities.Loteria.update(loteria.id, { estado: loteria.estado === "activa" ? "cerrada" : "activa" });
                onRefresh();
              }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-semibold hover:underline">
                {loteria.estado === "activa" ? "🔒 Cerrar" : "🔓 Reabrir"}
              </button>
              <button onClick={() => onDeleteLoteria(loteria)} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 font-semibold hover:underline">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MisTalonarios / MiTalonarioCard
// ─────────────────────────────────────────────────────────────────────────────
function MisTalonarios({ talonarios, loterias, integranteId }) {
  const misTalonarios = talonarios.filter(t => t.integrante_id === integranteId);

  if (misTalonarios.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <Ticket className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">No tienes talonarios asignados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {misTalonarios.map(t => {
        const loteria = loterias.find(l => l.id === t.loteria_id);
        const precio = loteria?.precio_participacion || 1;
        const vencida = loteria?.fecha_limite && new Date(loteria.fecha_limite) < new Date();
        return <MiTalonarioCard key={t.id} talonario={t} loteria={loteria} precio={precio} vencida={vencida} />;
      })}
    </div>
  );
}

function MiTalonarioCard({ talonario, loteria, precio, vencida, integrante }) {
  const [vendidas, setVendidas] = useState(talonario.cantidad_vendida || 0);
  const [inputManual, setInputManual] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const recaudadoCalc = vendidas * precio;
  const beneficioPorPapeleta = precio - (loteria?.precio_carroza || 0);
  const beneficio = vendidas * beneficioPorPapeleta;
  const pendientes = Math.max(0, (talonario.cantidad_asignada || 0) - vendidas);

  // Sync si cambian datos externos
  useEffect(() => {
    setVendidas(talonario.cantidad_vendida || 0);
  }, [talonario.cantidad_vendida]);

  const aplicarManual = () => {
    const v = parseInt(inputManual);
    if (!isNaN(v)) {
      setVendidas(prev => Math.min(talonario.cantidad_asignada || 0, Math.max(0, prev + v)));
    }
    setInputManual("");
  };

  const guardar = async () => {
    setGuardando(true);
    await api.entities.TalonarioLoteria.update(talonario.id, { cantidad_vendida: vendidas });
    // Notificar al admin si acaba de vender todos
    const asignadas = talonario.cantidad_asignada || 0;
    const yaEraCompleto = (talonario.cantidad_vendida || 0) >= asignadas;
    if (!yaEraCompleto && vendidas >= asignadas && asignadas > 0) {
      api.entities.Notificacion.create({
        titulo: `🎫 ${talonario.integrante_nombre} ha vendido todos sus números`,
        mensaje: `${talonario.integrante_nombre} ha completado la venta de las ${asignadas} participaciones (Nº ${talonario.numeros_inicio}–${talonario.numeros_fin}) de la lotería "${loteria?.nombre || ""}".`,
        tipo: "otro",
      }).catch(() => {});
    }
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800">{loteria?.nombre || "Lotería"}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{precio}€ por participación · {talonario.cantidad_asignada} asignadas</p>
        </div>
        {talonario.entregado
          ? <Badge color="green">✓ Entregado</Badge>
          : vencida
            ? <Badge color="red">⚠ Vencida</Badge>
            : loteria?.fecha_limite
              ? <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  Límite: {format(new Date(loteria.fecha_limite), "d MMM yyyy", { locale: es })}
                </span>
              : null
        }
      </div>

      {(loteria?.numero_que_se_juega || loteria?.imagen_papeleta_url) && (
        <div className="flex items-center gap-3 mb-3">
          {loteria?.imagen_papeleta_url && (
            <img src={loteria.imagen_papeleta_url} alt="papeleta" className="h-14 rounded-lg object-contain border border-gray-100" />
          )}
          {loteria?.numero_que_se_juega && (
            <div>
              <p className="text-[10px] text-gray-400">Número que se juega</p>
              <p className="text-xl font-black text-[#630027]">{loteria.numero_que_se_juega}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-[#630027]/5 rounded-xl p-3 mb-4 text-center">
        <p className="text-xs text-gray-500 mb-1">Tus números de participación</p>
        <p className="text-2xl font-black text-[#630027]">{String(talonario.numeros_inicio).padStart(3, "0")} – {String(talonario.numeros_fin).padStart(3, "0")}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-sm font-black text-blue-600">{vendidas}</p>
          <p className="text-[10px] text-gray-400">Vendidas</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-sm font-black text-[#630027]">{recaudadoCalc.toFixed(2)}€</p>
          <p className="text-[10px] text-gray-400">Recaudado</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-sm font-black text-green-600">{beneficio.toFixed(2)}€</p>
          <p className="text-[10px] text-gray-400">Beneficio peña</p>
        </div>
      </div>

      {!talonario.entregado && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 block">¿Cuántas has vendido?</label>

          {/* Contador +/- con valor actual */}
          <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-xl py-3">
            <button
              onClick={() => setVendidas(v => Math.max(0, v - 1))}
              className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-500 text-xl font-bold shadow-sm">−</button>
            <span className="text-3xl font-black text-[#630027] w-12 text-center">{vendidas}</span>
            <button
              onClick={() => setVendidas(v => Math.min(talonario.cantidad_asignada || 0, v + 1))}
              className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 text-xl font-bold shadow-sm">+</button>
          </div>

          {/* Input manual para añadir cantidad */}
          <div className="flex gap-2">
            <input
              type="number"
              value={inputManual}
              onChange={e => setInputManual(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") aplicarManual(); }}
              placeholder="Añadir número exacto..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"
            />
            <button onClick={aplicarManual} disabled={!inputManual}
              className="border border-gray-200 text-gray-600 text-sm font-semibold px-3 rounded-xl hover:bg-gray-50 disabled:opacity-40">
              Añadir
            </button>
          </div>

          <button onClick={guardar} disabled={guardando}
            className="w-full bg-[#630027] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#4a001d] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {guardado ? <><CheckCircle2 className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar ({vendidas} vendidas)</>}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Quedan <strong>{pendientes}</strong> sin vender · Total a entregar: <strong>{recaudadoCalc.toFixed(2)}€</strong>
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function Loteria() {
  const { sesion, integrantes: integrantesCtx } = useAuth();
  const [loterias, setLoterias] = useState([]);
  const [talonarios, setTalonarios] = useState([]);
  const [integrantes, setIntegrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("mis");
  const [crearLoteria, setCrearLoteria] = useState(false);
  const [editandoLoteria, setEditandoLoteria] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const esAdmin = sesion?.esAdmin === true;
  const miIntegrante = integrantes.find(i => i.nombre === sesion?.nombre);
  const esCargo = miIntegrante && CARGOS_EDIT.includes(miIntegrante.cargo);
  const puedeEditar = esAdmin || esCargo;

  const cargar = useCallback(async () => {
    const [lots, tals, ints] = await Promise.all([
      api.entities.Loteria.list("-created_date"),
      api.entities.TalonarioLoteria.list(),
      integrantesCtx?.length ? Promise.resolve(integrantesCtx) : api.entities.Integrante.list(),
    ]);
    setLoterias(lots);
    setTalonarios(tals);
    setIntegrantes(ints);
    setLoading(false);
  }, [integrantesCtx]);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminarLoteria = async (loteria) => setConfirmEliminar(loteria);

  const confirmarEliminarLoteria = async () => {
    if (!confirmEliminar) return;
    const talsLoteria = talonarios.filter(t => t.loteria_id === confirmEliminar.id);
    await Promise.all(talsLoteria.map(t => api.entities.TalonarioLoteria.delete(t.id)));
    await api.entities.Loteria.delete(confirmEliminar.id);
    setConfirmEliminar(null);
    cargar();
  };

  const guardarLoteria = async (form) => {
    if (editandoLoteria) {
      await api.entities.Loteria.update(editandoLoteria.id, form);
      setEditandoLoteria(null);
    } else {
      await api.entities.Loteria.create(form);
      setCrearLoteria(false);
    }
    cargar();
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <ConfirmDialog
        open={!!confirmEliminar}
        mensaje={`¿Eliminar la campaña "${confirmEliminar?.nombre}"? Se eliminarán también todos sus talonarios.`}
        textoConfirmar="Eliminar campaña"
        onConfirm={confirmarEliminarLoteria}
        onCancel={() => setConfirmEliminar(null)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#630027]/10 flex items-center justify-center">
            <Ticket className="w-5 h-5 text-[#630027]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-800">Lotería</h1>
              <HelpIcon section="loteria" />
            </div>
            <p className="text-xs text-gray-400">Gestión de talonarios y recaudación</p>
          </div>
        </div>
        {puedeEditar && (
          <div className="flex gap-2 items-center">
            <div className="relative">
              <button onClick={() => setShowExportMenu(v => !v)}
                className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                <FileDown className="w-4 h-4" /> Exportar
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-100 shadow-lg z-50 min-w-[180px] overflow-hidden">
                    <p className="text-[10px] font-bold text-gray-400 uppercase px-3 pt-2.5 pb-1 tracking-wider">Formato CSV</p>
                    <button onClick={() => { exportarCSV(loterias, talonarios, null); setShowExportMenu(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">📋 CSV — Todas</button>
                    {[...new Set(loterias.map(l => {
                      const d = l.fecha_limite ? new Date(l.fecha_limite) : l.created_date ? new Date(l.created_date) : null;
                      return d ? d.getFullYear() : null;
                    }).filter(Boolean))].sort((a, b) => b - a).map(anio => (
                      <button key={anio} onClick={() => { exportarCSV(loterias, talonarios, anio); setShowExportMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">📋 CSV — {anio}</button>
                    ))}
                    <div className="border-t border-gray-100 mt-1" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase px-3 pt-2 pb-1 tracking-wider">Formato PDF</p>
                    <button onClick={() => { exportarPDF(loterias, talonarios, null); setShowExportMenu(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">📄 PDF — Todas</button>
                    {[...new Set(loterias.map(l => {
                      const d = l.fecha_limite ? new Date(l.fecha_limite) : l.created_date ? new Date(l.created_date) : null;
                      return d ? d.getFullYear() : null;
                    }).filter(Boolean))].sort((a, b) => b - a).map(anio => (
                      <button key={`pdf-${anio}`} onClick={() => { exportarPDF(loterias, talonarios, anio); setShowExportMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">📄 PDF — {anio}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button onClick={() => { setCrearLoteria(true); setEditandoLoteria(null); }}
              className="flex items-center gap-1.5 bg-[#630027] text-white text-sm font-semibold px-3 py-2 rounded-xl hover:bg-[#4a001d] transition-colors">
              <Plus className="w-4 h-4" /> Nueva
            </button>
          </div>
        )}
      </div>

      {/* Formulario crear/editar */}
      {(crearLoteria || editandoLoteria) && (
        <FormLoteria
          initial={editandoLoteria}
          onSave={guardarLoteria}
          onCancel={() => { setCrearLoteria(false); setEditandoLoteria(null); }}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { id: "mis", label: "Mis talonarios", icon: Ticket },
          ...(puedeEditar ? [
            { id: "gestion", label: "Gestión", icon: Users },
            { id: "herramientas", label: "Herramientas", icon: Wrench },
            { id: "historial", label: "Historial", icon: History },
          ] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? "bg-white shadow-sm text-[#630027]" : "text-gray-500 hover:text-gray-700"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Contenido tabs */}
      {tab === "mis" && (
        <MisTalonarios talonarios={talonarios} loterias={loterias} integranteId={miIntegrante?.id} />
      )}

      {tab === "herramientas" && puedeEditar && (
        <HerramientasGestion loterias={loterias} talonarios={talonarios} onRefresh={cargar} />
      )}

      {tab === "historial" && puedeEditar && (
        <HistorialEntregas loterias={loterias} />
      )}

      {tab === "gestion" && puedeEditar && (
        <div className="space-y-4">
          <ResumenDisponibilidad loterias={loterias} talonarios={talonarios} />
          <TablaResumen loterias={loterias} talonarios={talonarios} />
          <GraficoProgreso loterias={loterias} talonarios={talonarios} />

          {loterias.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar socio..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
              </div>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option value="todas">Todas las campañas</option>
                <option value="activa">Solo activas</option>
                <option value="cerrada">Solo cerradas</option>
              </select>
            </div>
          )}

          {loterias.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <Ticket className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No hay campañas de lotería</p>
              <button onClick={() => setCrearLoteria(true)} className="mt-3 text-sm text-[#630027] font-semibold hover:underline">
                Crear la primera campaña
              </button>
            </div>
          ) : (
            loterias
              .filter(l => filtroEstado === "todas" || l.estado === filtroEstado)
              .filter(l => {
                if (!busqueda.trim()) return true;
                const q = busqueda.toLowerCase();
                const talsLoteria = talonarios.filter(t => t.loteria_id === l.id);
                return l.nombre.toLowerCase().includes(q) || talsLoteria.some(t => t.integrante_nombre?.toLowerCase().includes(q));
              })
              .map(l => (
                <PanelLoteria key={l.id} loteria={l}
                  talonarios={busqueda.trim()
                    ? talonarios.filter(t => t.loteria_id !== l.id || t.integrante_nombre?.toLowerCase().includes(busqueda.toLowerCase()))
                    : talonarios}
                  integrantes={integrantes}
                  puedeEditar={puedeEditar} onRefresh={cargar} onEditLoteria={setEditandoLoteria}
                  onDeleteLoteria={eliminarLoteria} defaultOpen={!!busqueda.trim()} />
              ))
          )}
        </div>
      )}
    </div>
  );
}