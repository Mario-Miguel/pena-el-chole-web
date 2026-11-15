import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "../auth/AuthContext";
import { Plus, FileText, Trash2, ExternalLink, Search, Copy, Pencil, X, ArrowLeft, Download, Save, FolderOpen } from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";
import RellenarPlantillaDialog from "./RellenarPlantillaDialog";

const TIPOS = {
  contrato:    { label: "Contratos",     emoji: "📋", color: "bg-blue-50 border-blue-200",   badge: "bg-blue-100 text-blue-700" },
  permiso:     { label: "Permisos",      emoji: "🔑", color: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-700" },
  acta:        { label: "Actas",         emoji: "📝", color: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-700" },
  presupuesto: { label: "Presupuestos",  emoji: "💰", color: "bg-green-50 border-green-200",  badge: "bg-green-100 text-green-700" },
  seguro:      { label: "Seguros",       emoji: "🛡️", color: "bg-red-50 border-red-200",      badge: "bg-red-100 text-red-700" },
  otros:       { label: "Otros",         emoji: "📄", color: "bg-gray-50 border-gray-200",    badge: "bg-gray-100 text-gray-700" },
};

const FORM_VACIO = {
  nombre: "", tipo: "otros", descripcion: "", responsable: "",
  fecha: new Date().toISOString().split("T")[0], url: "", es_plantilla: false, contenido: "",
};

function exportarDocPDF(doc) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${doc.nombre}</title>
  <style>
    body{font-family:Arial,sans-serif;margin:40px;color:#333}
    h1{color:#630027;font-size:22px;margin-bottom:4px}
    .meta{color:#888;font-size:12px;margin-bottom:24px}
    .seccion{margin-bottom:20px}
    .label{font-size:11px;font-weight:bold;color:#630027;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
    .valor{font-size:14px;border-bottom:1px solid #ddd;padding-bottom:6px;min-height:28px}
    .contenido{font-size:14px;border:1px solid #ddd;padding:12px;border-radius:6px;white-space:pre-wrap;min-height:80px}
    .footer{margin-top:60px;border-top:1px solid #ddd;padding-top:12px;font-size:11px;color:#aaa;text-align:center}
    .firma{min-height:50px}
    @media print{body{margin:20px}}
  </style></head><body>
  <h1>${doc.nombre}</h1>
  <div class="meta">Tipo: ${TIPOS[doc.tipo]?.label || doc.tipo} · Fecha: ${doc.fecha || "-"}</div>
  <div class="seccion"><div class="label">Responsable</div><div class="valor">${doc.responsable || "&nbsp;"}</div></div>
  <div class="seccion"><div class="label">Descripción</div><div class="valor">${doc.descripcion || "&nbsp;"}</div></div>
  ${doc.contenido ? `<div class="seccion"><div class="label">Contenido</div><div class="contenido">${doc.contenido.replace(/\n/g,"<br/>")}</div></div>` : ""}
  <div style="margin-top:40px"><div class="seccion"><div class="label">Firma</div><div class="valor firma">&nbsp;</div></div></div>
  <div class="footer">Generado desde la app de la peña · ${new Date().toLocaleDateString("es-ES")}</div>
  </body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${doc.nombre.replace(/[^a-z0-9áéíóúñ ]/gi, "_")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function GestionDocumentalContent({ puedeEditar: puedeEditarProp }) {
  const { sesion } = useAuth();
  const puedeEditar = puedeEditarProp !== undefined
    ? puedeEditarProp
    : (sesion?.esAdmin || !!sesion?.cargo);

  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carpetaActiva, setCarpetaActiva] = useState(null);
  const [showCrear, setShowCrear] = useState(false);
  const [crearForm, setCrearForm] = useState(FORM_VACIO);
  const [subiendo, setSubiendo] = useState(false);
  const [editandoDoc, setEditandoDoc] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const [plantillaActiva, setPlantillaActiva] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargar = async () => {
    const data = await base44.entities.Documento.list("-fecha");
    setDocumentos(data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setCrearForm(f => ({ ...f, url: file_url }));
    setSubiendo(false);
  };

  const guardarNuevo = async () => {
    if (!crearForm.nombre) return;
    const tipo = carpetaActiva || crearForm.tipo;
    await base44.entities.Documento.create({ ...crearForm, tipo });
    setCrearForm({ ...FORM_VACIO, tipo: carpetaActiva || "otros" });
    setShowCrear(false);
    cargar();
  };

  const abrirEditar = (doc) => {
    setEditForm({
      nombre: doc.nombre || "",
      tipo: doc.tipo || "otros",
      descripcion: doc.descripcion || "",
      responsable: doc.responsable || "",
      fecha: doc.fecha || new Date().toISOString().split("T")[0],
      contenido: doc.contenido || "",
      es_plantilla: doc.es_plantilla || false,
    });
    setEditandoDoc(doc);
  };

  const guardarEdicion = async () => {
    if (!editForm.nombre) return;
    setGuardandoEdit(true);
    await base44.entities.Documento.update(editandoDoc.id, editForm);
    setGuardandoEdit(false);
    setEditandoDoc(null);
    cargar();
  };

  const eliminar = (id) => setConfirmEliminar(id);
  const confirmarEliminar = async () => {
    await base44.entities.Documento.delete(confirmEliminar);
    setConfirmEliminar(null);
    cargar();
  };

  const docsEnCarpeta = (tipo) => documentos.filter(d => d.tipo === tipo);
  const filtradosEnCarpeta = carpetaActiva
    ? docsEnCarpeta(carpetaActiva).filter(d =>
        !busqueda || d.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        d.responsable?.toLowerCase().includes(busqueda.toLowerCase()))
    : [];

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-7 h-7 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  // ── Vista de carpeta activa ──────────────────────────────────
  if (carpetaActiva) {
    const tipoInfo = TIPOS[carpetaActiva];
    return (
      <div className="space-y-4">
        <ConfirmDialog open={!!confirmEliminar} mensaje="¿Eliminar este documento?" textoConfirmar="Eliminar" onConfirm={confirmarEliminar} onCancel={() => setConfirmEliminar(null)} />
        {/* Header de carpeta */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setCarpetaActiva(null); setBusqueda(""); setShowCrear(false); }}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{tipoInfo.emoji}</span>
            <div>
              <h2 className="font-black text-[#630027] text-lg leading-tight">{tipoInfo.label}</h2>
              <p className="text-xs text-gray-400">{filtradosEnCarpeta.length} documento{filtradosEnCarpeta.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          {puedeEditar && (
            <button onClick={() => { setCrearForm({ ...FORM_VACIO, tipo: carpetaActiva }); setShowCrear(true); }}
              className="flex items-center gap-1.5 bg-[#630027] hover:bg-[#4a001d] text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Nuevo
            </button>
          )}
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar en esta carpeta..." value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm" />
        </div>

        {/* Formulario nuevo doc */}
        <AnimatePresence>
          {showCrear && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
              <p className="font-bold text-[#630027] text-sm">Nuevo documento en {tipoInfo.label}</p>
              <input type="text" placeholder="Nombre del documento" value={crearForm.nombre}
                onChange={e => setCrearForm(f => ({ ...f, nombre: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={crearForm.fecha}
                  onChange={e => setCrearForm(f => ({ ...f, fecha: e.target.value }))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                <input type="text" placeholder="Responsable" value={crearForm.responsable}
                  onChange={e => setCrearForm(f => ({ ...f, responsable: e.target.value }))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <textarea placeholder="Descripción (opcional)" value={crearForm.descripcion}
                onChange={e => setCrearForm(f => ({ ...f, descripcion: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none" rows={2} />
              <textarea placeholder="Contenido del documento..." value={crearForm.contenido}
                onChange={e => setCrearForm(f => ({ ...f, contenido: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none" rows={4} />
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-gray-200 rounded-xl px-3 py-2 text-center text-sm text-gray-400 hover:border-[#630027]/30 transition-colors">
                  {subiendo ? "Subiendo..." : crearForm.url ? "✅ Archivo subido" : "📎 Adjuntar archivo"}
                </div>
                <input type="file" className="hidden" onChange={handleFile} disabled={subiendo} />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input type="checkbox" checked={crearForm.es_plantilla}
                  onChange={e => setCrearForm(f => ({ ...f, es_plantilla: e.target.checked }))} className="rounded" />
                Guardar como plantilla reutilizable
              </label>
              <div className="flex gap-2">
                <button onClick={guardarNuevo}
                  className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5">
                  <Save className="w-4 h-4" /> Guardar en {tipoInfo.label}
                </button>
                <button onClick={() => setShowCrear(false)}
                  className="px-4 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de documentos */}
        {filtradosEnCarpeta.length === 0 && !showCrear ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p>No hay documentos en esta carpeta</p>
            {puedeEditar && (
              <button onClick={() => { setCrearForm({ ...FORM_VACIO, tipo: carpetaActiva }); setShowCrear(true); }}
                className="mt-3 text-[#630027] underline text-sm">Añadir el primero</button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtradosEnCarpeta.map(doc => (
              <div key={doc.id} className="relative bg-white rounded-xl border border-gray-100 px-4 pt-3 pb-8 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 text-sm">{doc.nombre}</p>
                      {doc.es_plantilla && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-medium">Plantilla</span>
                      )}
                    </div>
                    {doc.descripcion && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.descripcion}</p>}
                    {doc.contenido && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 italic">{doc.contenido.substring(0, 80)}...</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                      {doc.responsable && <span>👤 {doc.responsable}</span>}
                      {doc.fecha && <span>📅 {doc.fecha}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(doc.es_plantilla || puedeEditar) && (
                      <button onClick={() => setPlantillaActiva(doc)} title="Rellenar / crear copia"
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => exportarDocPDF(doc)} title="Exportar / Imprimir PDF"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {puedeEditar && (
                      <button onClick={() => eliminar(doc.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Lápiz edición — esquina inferior derecha */}
                {puedeEditar && (
                  <button
                    onClick={() => abrirEditar(doc)}
                    title="Editar documento"
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white border border-gray-100 shadow-sm hover:bg-[#630027]/5 text-gray-400 hover:text-[#630027] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dialog edición */}
        {editandoDoc && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-[#630027]" />
                  <h2 className="font-black text-[#630027] text-sm">Editar documento</h2>
                </div>
                <button onClick={() => setEditandoDoc(null)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
                <input type="text" placeholder="Nombre" value={editForm.nombre}
                  onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={editForm.tipo} onChange={e => setEditForm(f => ({ ...f, tipo: e.target.value }))}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                    {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <input type="date" value={editForm.fecha}
                    onChange={e => setEditForm(f => ({ ...f, fecha: e.target.value }))}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <input type="text" placeholder="Responsable" value={editForm.responsable}
                  onChange={e => setEditForm(f => ({ ...f, responsable: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                <textarea placeholder="Descripción" value={editForm.descripcion}
                  onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none" rows={2} />
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Contenido</label>
                  <textarea placeholder="Contenido del documento..." value={editForm.contenido}
                    onChange={e => setEditForm(f => ({ ...f, contenido: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none" rows={6} />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" checked={editForm.es_plantilla}
                    onChange={e => setEditForm(f => ({ ...f, es_plantilla: e.target.checked }))} className="rounded" />
                  Es plantilla reutilizable
                </label>
              </div>
              <div className="flex gap-2 px-5 py-4 border-t border-gray-100 flex-shrink-0">
                <button onClick={() => exportarDocPDF({ ...editandoDoc, ...editForm })}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" /> Exportar PDF
                </button>
                <button onClick={() => setEditandoDoc(null)}
                  className="px-4 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={guardarEdicion} disabled={guardandoEdit || !editForm.nombre}
                  className="flex-1 bg-[#630027] hover:bg-[#4a001d] disabled:opacity-50 text-white rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors">
                  <Save className="w-4 h-4" /> {guardandoEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        )}

        {plantillaActiva && (
          <RellenarPlantillaDialog
            plantilla={plantillaActiva}
            onClose={() => setPlantillaActiva(null)}
            onGuardado={() => { setPlantillaActiva(null); cargar(); }}
          />
        )}
      </div>
    );
  }

  // ── Vista de carpetas (raíz) ─────────────────────────────────
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">Selecciona una carpeta para ver y gestionar sus documentos.</p>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(TIPOS).map(([tipo, info]) => {
          const count = docsEnCarpeta(tipo).length;
          const plantillas = docsEnCarpeta(tipo).filter(d => d.es_plantilla).length;
          return (
            <motion.button
              key={tipo}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCarpetaActiva(tipo)}
              className={`text-left p-4 rounded-2xl border-2 ${info.color} hover:shadow-md transition-all duration-150 flex flex-col gap-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{info.emoji}</span>
                <span className="text-xs font-bold text-gray-400 bg-white/60 rounded-full px-2 py-0.5">
                  {count}
                </span>
              </div>
              <div>
                <p className="font-black text-gray-700 text-sm">{info.label}</p>
                {plantillas > 0 && (
                  <p className="text-[10px] text-amber-600 mt-0.5">{plantillas} plantilla{plantillas > 1 ? "s" : ""}</p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}