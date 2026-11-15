import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Download, Save, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function RellenarPlantillaDialog({ plantilla, onClose, onGuardado }) {
  const [campos, setCampos] = useState({
    nombre: `Copia - ${plantilla.nombre}`,
    fecha: new Date().toISOString().split("T")[0],
    responsable: plantilla.responsable || "",
    descripcion: plantilla.descripcion || "",
    contenido: plantilla.contenido || "",
  });
  const [guardando, setGuardando] = useState(false);
  const printRef = useRef(null);

  const guardar = async () => {
    setGuardando(true);
    await base44.entities.Documento.create({
      nombre: campos.nombre,
      tipo: plantilla.tipo,
      descripcion: campos.descripcion,
      responsable: campos.responsable,
      fecha: campos.fecha,
      plantilla_id: plantilla.id,
      es_plantilla: false,
    });
    setGuardando(false);
    onGuardado();
  };

  const exportarPDF = () => {
    const html = `
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>${campos.nombre}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #630027; font-size: 22px; margin-bottom: 4px; }
          .meta { color: #888; font-size: 12px; margin-bottom: 24px; }
          .seccion { margin-bottom: 20px; }
          .label { font-size: 11px; font-weight: bold; color: #630027; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
          .valor { font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 6px; min-height: 28px; }
          .contenido { font-size: 14px; border: 1px solid #ddd; padding: 12px; border-radius: 6px; white-space: pre-wrap; min-height: 120px; }
          .footer { margin-top: 60px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 11px; color: #aaa; text-align: center; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <h1>${campos.nombre}</h1>
        <div class="meta">Tipo: ${plantilla.tipo} · Fecha: ${campos.fecha}</div>
        <div class="seccion"><div class="label">Responsable</div><div class="valor">${campos.responsable || "&nbsp;"}</div></div>
        <div class="seccion"><div class="label">Descripción</div><div class="valor">${campos.descripcion || "&nbsp;"}</div></div>
        ${campos.contenido ? `<div class="seccion"><div class="label">Contenido</div><div class="contenido">${campos.contenido.replace(/\n/g, "<br/>")}</div></div>` : ""}
        <div style="margin-top:40px;"><div class="seccion"><div class="label">Firma</div><div class="valor" style="min-height:50px;">&nbsp;</div></div></div>
        <div class="footer">Generado desde la app de la peña · ${new Date().toLocaleDateString("es-ES")}</div>
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campos.nombre.replace(/[^a-z0-9]/gi, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#630027]" />
              <div>
                <h2 className="font-black text-[#630027] text-sm">Rellenar plantilla</h2>
                <p className="text-xs text-gray-400">{plantilla.nombre}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Formulario */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Nombre del documento</label>
              <input
                type="text"
                value={campos.nombre}
                onChange={e => setCampos(c => ({ ...c, nombre: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Fecha</label>
                <input
                  type="date"
                  value={campos.fecha}
                  onChange={e => setCampos(c => ({ ...c, fecha: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Responsable</label>
                <input
                  type="text"
                  value={campos.responsable}
                  onChange={e => setCampos(c => ({ ...c, responsable: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Nombre..."
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Descripción</label>
              <textarea
                value={campos.descripcion}
                onChange={e => setCampos(c => ({ ...c, descripcion: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none"
                rows={2}
                placeholder="Descripción del documento..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Contenido del documento</label>
              <textarea
                value={campos.contenido}
                onChange={e => setCampos(c => ({ ...c, contenido: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none"
                rows={6}
                placeholder="Escribe aquí el contenido del documento..."
              />
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2 px-5 py-4 border-t border-gray-100 flex-shrink-0">
            <Button
              onClick={exportarPDF}
              variant="outline"
              className="flex-1 rounded-xl gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button
              onClick={guardar}
              disabled={guardando || !campos.nombre}
              className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl gap-2"
            >
              <Save className="w-4 h-4" />
              {guardando ? "Guardando..." : "Guardar copia"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}