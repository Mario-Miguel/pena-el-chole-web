import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Download, Plus, Trash2, ChevronDown } from "lucide-react";
import { api } from "@/api/client";

// ── Multi-select desplegable ─────────────────────────────────────
function MultiSelect({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const toggle = (val) =>
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white hover:border-[#630027]/30 transition-colors"
      >
        <span className="text-gray-600 truncate">
          {selected.length === 0 ? label : `${selected.length} seleccionados`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="rounded accent-[#630027]"
              />
              <span className="text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map(s => (
            <span key={s} className="inline-flex items-center gap-1 bg-[#630027]/10 text-[#630027] text-xs px-2 py-0.5 rounded-full">
              {s}
              <button type="button" onClick={() => toggle(s)} className="hover:text-[#4a001d]"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Lista dinámica de items ──────────────────────────────────────
function ListaDinamica({ label, items, onChange, placeholder = "Añadir elemento..." }) {
  const add = () => onChange([...items, ""]);
  const update = (i, val) => { const c = [...items]; c[i] = val; onChange(c); };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1.5">
          <input
            value={item}
            onChange={e => update(i, e.target.value)}
            placeholder={`${placeholder} ${i + 1}`}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"
          />
          <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 px-2">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs text-[#630027] font-semibold hover:underline mt-1">
        <Plus className="w-3.5 h-3.5" /> {label}
      </button>
    </div>
  );
}

// ── Generadores de texto por plantilla ──────────────────────────
function generarTexto(tipo, campos, meta) {
  const { fecha, año, presidente, secretario } = meta;

  if (tipo === "acta") {
    const asistentesTexto = campos.asistentes?.length
      ? campos.asistentes.map(a => `  · ${a}`).join("\n")
      : "  · [Sin asistentes seleccionados]";
    const puntosTexto = campos.puntos?.filter(Boolean).map((p, i) => `  ${i + 1}. ${p}`).join("\n") || "  1. [Punto 1]";
    const puntosDesarrollo = campos.puntos?.filter(Boolean).map((p, i) => `  ${i + 1}. ${p}\n  [Descripción del punto]`).join("\n\n") || "";
    const acuerdosTexto = campos.acuerdos?.filter(Boolean).map(a => `  · ${a}`).join("\n") || "  · [Acuerdo 1]";

    return `ACTA DE REUNIÓN — PEÑA DE CARROZAS DE VALDESOTO\n\nFecha: ${fecha}\nLugar: ${campos.lugar || "[Lugar]"}\nHora de inicio: ${campos.hora_inicio || "[HH:MM]"}\n\nASISTENTES:\n${asistentesTexto}\n\nORDEN DEL DÍA:\n${puntosTexto}\n\nDESARROLLO DE LA REUNIÓN:\n\n${puntosDesarrollo}\n\nACUERDOS ADOPTADOS:\n${acuerdosTexto}\n\nSin más asuntos que tratar, se levanta la sesión a las ${campos.hora_fin || "[HH:MM]"}.\n\nEl/La Secretario/a,              V.º B.º El/La Presidente/a,\n\n${secretario}                    ${presidente}`;
  }

  if (tipo === "convocatoria") {
    const puntos = campos.puntos?.filter(Boolean).map((p, i) => `  ${i + 1}. ${p}`).join("\n") || "  1. Lectura y aprobación del acta anterior\n  2. Informe de presidencia\n  3. Ruegos y preguntas";
    return `CONVOCATORIA DE ASAMBLEA GENERAL\n\nPEÑA DE CARROZAS DE VALDESOTO\n\nEn ${fecha}, el Presidente de la Peña convoca a todos los socios a la:\n\nASAMBLEA GENERAL ${(campos.tipo_asamblea || "ORDINARIA").toUpperCase()}\n\nFecha: ${campos.fecha_asamblea || "[DD/MM/YYYY]"}\nHora: ${campos.hora_primera || "[HH:MM]"} en primera convocatoria y ${campos.hora_segunda || "[HH:MM]"} en segunda\nLugar: ${campos.lugar || "[Lugar]"}\n\nORDEN DEL DÍA:\n${puntos}\n\nSe ruega puntual asistencia.\n\n[Lugar], ${fecha}\n\nEl/La Presidente/a,\n\n${presidente}`;
  }

  if (tipo === "presupuesto") {
    const ingresos = campos.ingresos || [];
    const gastos = campos.gastos || [];
    const totalIngresos = ingresos.reduce((s, i) => s + (parseFloat(i.importe) || 0), 0);
    const totalGastos = gastos.reduce((s, g) => s + (parseFloat(g.importe) || 0), 0);
    const balance = totalIngresos - totalGastos;
    const ingresosTexto = ingresos.map(i => `  · ${i.nombre || "[Partida]"}: ${i.importe || "___"}€`).join("\n") || "  · [Partida]: ___€";
    const gastosTexto = gastos.map(g => `  · ${g.nombre || "[Partida]"}: ${g.importe || "___"}€`).join("\n") || "  · [Partida]: ___€";
    return `PRESUPUESTO ANUAL ${año} — PEÑA DE CARROZAS DE VALDESOTO\n\nINGRESOS PREVISTOS:\n${ingresosTexto}\n  ────────────────────────\n  TOTAL INGRESOS: ${totalIngresos.toFixed(2)}€\n\nGASTOS PREVISTOS:\n${gastosTexto}\n  ────────────────────────\n  TOTAL GASTOS: ${totalGastos.toFixed(2)}€\n\nBALANCE PREVISTO: ${balance >= 0 ? "+" : ""}${balance.toFixed(2)}€\n\nAprobado en Asamblea General el ${fecha}\n\nEl/La Presidente/a,              El/La Tesorero/a,\n\n${presidente}                    [Tesorero]`;
  }

  if (tipo === "bajavoluntaria") {
    return `SOLICITUD DE BAJA VOLUNTARIA\n\nDon/Doña: ${campos.nombre_socio || "[Nombre completo]"}\nDNI/NIE: ${campos.dni || "[DNI]"}\nDomicilio: ${campos.domicilio || "[Dirección]"}\n\nDIRIGIDA A:\nJunta Directiva de la Peña de Carrozas de Valdesoto\n\nCon fecha ${fecha}, solicito causar baja como socio/a de la Peña de Carrozas de Valdesoto, a partir de la fecha de la presente comunicación.\n\nMotivo (opcional): ${campos.motivo || "[Motivo]"}\n\nQuedo a disposición de la Junta para cualquier aclaración necesaria.\n\nAtentamente,\n\n[Nombre y firma]\n\n[Lugar], ${fecha}`;
  }

  return "";
}

// ── Exportar HTML ────────────────────────────────────────────────
function exportarHTML(nombre, contenido) {
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${nombre}</title><style>body{font-family:monospace;white-space:pre-wrap;padding:40px;max-width:800px;margin:auto;font-size:13px;line-height:1.6;}</style></head><body>${contenido.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${nombre.replace(/\s+/g, "_")}.html`;
  a.click();
}

// ── Formularios por tipo ─────────────────────────────────────────
function FormActa({ campos, onChange, nombresIntegrantes }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Lugar de la reunión</label>
          <input value={campos.lugar || ""} onChange={e => onChange("lugar", e.target.value)}
            placeholder="Ej: Sede social" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Hora de inicio</label>
          <input type="time" value={campos.hora_inicio || ""} onChange={e => onChange("hora_inicio", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Asistentes a la reunión</label>
        <MultiSelect label="Seleccionar asistentes..." options={nombresIntegrantes}
          selected={campos.asistentes || []} onChange={v => onChange("asistentes", v)} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Puntos del orden del día</label>
        <ListaDinamica label="Añadir punto" placeholder="Punto" items={campos.puntos || [""]}
          onChange={v => onChange("puntos", v)} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Acuerdos adoptados</label>
        <ListaDinamica label="Añadir acuerdo" placeholder="Acuerdo" items={campos.acuerdos || [""]}
          onChange={v => onChange("acuerdos", v)} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Hora de cierre</label>
        <input type="time" value={campos.hora_fin || ""} onChange={e => onChange("hora_fin", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
      </div>
    </div>
  );
}

function FormConvocatoria({ campos, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Tipo de asamblea</label>
        <select value={campos.tipo_asamblea || "Ordinaria"} onChange={e => onChange("tipo_asamblea", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20">
          <option>Ordinaria</option>
          <option>Extraordinaria</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Fecha de la asamblea</label>
          <input type="date" value={campos.fecha_asamblea || ""} onChange={e => onChange("fecha_asamblea", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Lugar</label>
          <input value={campos.lugar || ""} onChange={e => onChange("lugar", e.target.value)}
            placeholder="Sede social" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">1ª convocatoria</label>
          <input type="time" value={campos.hora_primera || ""} onChange={e => onChange("hora_primera", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">2ª convocatoria</label>
          <input type="time" value={campos.hora_segunda || ""} onChange={e => onChange("hora_segunda", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Puntos del orden del día</label>
        <ListaDinamica label="Añadir punto" placeholder="Punto" items={campos.puntos || [""]}
          onChange={v => onChange("puntos", v)} />
      </div>
    </div>
  );
}

function FormPresupuesto({ campos, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Partidas de ingresos</p>
        {(campos.ingresos || []).map((item, i) => (
          <div key={i} className="flex gap-1.5 mb-1.5">
            <input value={item.nombre || ""} onChange={e => { const c = [...(campos.ingresos||[])]; c[i] = {...c[i], nombre: e.target.value}; onChange("ingresos", c); }}
              placeholder="Concepto" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            <input type="number" value={item.importe || ""} onChange={e => { const c = [...(campos.ingresos||[])]; c[i] = {...c[i], importe: e.target.value}; onChange("ingresos", c); }}
              placeholder="€" className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none text-right" />
            <button type="button" onClick={() => onChange("ingresos", (campos.ingresos||[]).filter((_, idx) => idx !== i))} className="text-red-400 px-1"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button type="button" onClick={() => onChange("ingresos", [...(campos.ingresos||[]), {nombre:"", importe:""}])}
          className="flex items-center gap-1.5 text-xs text-[#630027] font-semibold hover:underline">
          <Plus className="w-3.5 h-3.5" /> Añadir ingreso
        </button>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Partidas de gastos</p>
        {(campos.gastos || []).map((item, i) => (
          <div key={i} className="flex gap-1.5 mb-1.5">
            <input value={item.nombre || ""} onChange={e => { const c = [...(campos.gastos||[])]; c[i] = {...c[i], nombre: e.target.value}; onChange("gastos", c); }}
              placeholder="Concepto" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            <input type="number" value={item.importe || ""} onChange={e => { const c = [...(campos.gastos||[])]; c[i] = {...c[i], importe: e.target.value}; onChange("gastos", c); }}
              placeholder="€" className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none text-right" />
            <button type="button" onClick={() => onChange("gastos", (campos.gastos||[]).filter((_, idx) => idx !== i))} className="text-red-400 px-1"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button type="button" onClick={() => onChange("gastos", [...(campos.gastos||[]), {nombre:"", importe:""}])}
          className="flex items-center gap-1.5 text-xs text-[#630027] font-semibold hover:underline">
          <Plus className="w-3.5 h-3.5" /> Añadir gasto
        </button>
      </div>
    </div>
  );
}

function FormBaja({ campos, onChange, nombresIntegrantes }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre del socio</label>
        <MultiSelect label="Seleccionar socio..." options={nombresIntegrantes}
          selected={campos.nombre_socio ? [campos.nombre_socio] : []}
          onChange={v => onChange("nombre_socio", v[v.length - 1] || "")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">DNI/NIE</label>
          <input value={campos.dni || ""} onChange={e => onChange("dni", e.target.value)}
            placeholder="12345678A" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Domicilio</label>
          <input value={campos.domicilio || ""} onChange={e => onChange("domicilio", e.target.value)}
            placeholder="Dirección" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Motivo (opcional)</label>
        <textarea value={campos.motivo || ""} onChange={e => onChange("motivo", e.target.value)}
          rows={2} placeholder="Motivo de la baja..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20 resize-none" />
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────
const DEFAULTS = {
  acta: { lugar: "", hora_inicio: "", hora_fin: "", asistentes: [], puntos: [""], acuerdos: [""] },
  convocatoria: { tipo_asamblea: "Ordinaria", fecha_asamblea: "", hora_primera: "", hora_segunda: "", lugar: "", puntos: ["Lectura y aprobación del acta anterior", "Informe de presidencia", "Informe económico — Tesorero", "Ruegos y preguntas"] },
  presupuesto: { ingresos: [{ nombre: "Cuotas socios", importe: "" }, { nombre: "Subvenciones Ayuntamiento", importe: "" }], gastos: [{ nombre: "Materiales carroza", importe: "" }, { nombre: "Vehículo / camión", importe: "" }, { nombre: "Seguro RC", importe: "" }] },
  bajavoluntaria: { nombre_socio: "", dni: "", domicilio: "", motivo: "" },
};

export default function RellenarPlantillaEstructurada({ plantilla, integrantes = [], onClose, onGuardado }) {
  const [campos, setCampos] = useState(DEFAULTS[plantilla.tipoPlantilla] || {});
  const [nombre, setNombre] = useState(plantilla.nombre || "");
  const [guardando, setGuardando] = useState(false);

  const fecha = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const año = new Date().getFullYear();
  const presidente = integrantes.find(i => i.cargo === "presidente")?.nombre || "[Presidente]";
  const secretario = integrantes.find(i => i.cargo === "secretario")?.nombre || "[Secretario]";
  const nombresIntegrantes = integrantes.map(i => i.nombre).sort();
  const meta = { fecha, año, presidente, secretario };

  const setField = (key, val) => setCampos(prev => ({ ...prev, [key]: val }));
  const textoFinal = generarTexto(plantilla.tipoPlantilla, campos, meta);

  const guardar = async () => {
    setGuardando(true);
    await api.entities.Documento.create({
      nombre,
      tipo: plantilla.tipo,
      contenido: textoFinal,
      fecha: new Date().toISOString(),
      plantilla_id: `plantilla-${plantilla.tipoPlantilla}`,
      es_plantilla: false,
    });
    setGuardando(false);
    onGuardado?.();
  };

  const exportar = () => exportarHTML(nombre, textoFinal);

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col z-10">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-black text-gray-800 text-base">{plantilla.nombre}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Rellena los campos del documento</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Nombre del documento */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre del documento</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
            </div>

            <div className="border-t border-gray-100 pt-4">
              {plantilla.tipoPlantilla === "acta" && <FormActa campos={campos} onChange={setField} nombresIntegrantes={nombresIntegrantes} />}
              {plantilla.tipoPlantilla === "convocatoria" && <FormConvocatoria campos={campos} onChange={setField} />}
              {plantilla.tipoPlantilla === "presupuesto" && <FormPresupuesto campos={campos} onChange={setField} />}
              {plantilla.tipoPlantilla === "bajavoluntaria" && <FormBaja campos={campos} onChange={setField} nombresIntegrantes={nombresIntegrantes} />}
            </div>

            {/* Vista previa */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Vista previa</p>
              <pre className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-[10px] text-gray-600 whitespace-pre-wrap overflow-auto max-h-40 leading-relaxed">
                {textoFinal}
              </pre>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
            <button onClick={exportar}
              className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl py-2.5 hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" /> Exportar PDF
            </button>
            <button onClick={guardar} disabled={guardando || !nombre}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#630027] text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-[#4a001d] transition-colors disabled:opacity-60">
              <Save className="w-4 h-4" /> {guardando ? "Guardando..." : "Guardar documento"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}