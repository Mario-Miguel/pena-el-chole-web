import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, Trash2, Plus, ImageIcon, FileSpreadsheet, FileText, Download, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../auth/AuthContext";
import MediaGaleria from "../shared/MediaGaleria";

function getFileType(url) {
  if (!url) return "otro";
  const lower = url.toLowerCase().split("?")[0];
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(lower)) return "imagen";
  if (/\.(pdf)$/i.test(lower)) return "pdf";
  if (/\.(xls|xlsx|csv|ods)$/i.test(lower)) return "excel";
  return "otro";
}

function getFileName(url, idx, tipo) {
  try {
    const decoded = decodeURIComponent(url.split("/").pop().split("?")[0]);
    if (decoded && decoded.length > 0 && decoded !== "/") return decoded;
  } catch {}
  if (tipo === "imagen") return `Imagen ${idx + 1}`;
  if (tipo === "pdf") return `PDF ${idx + 1}`;
  if (tipo === "excel") return `Excel ${idx + 1}`;
  return `Archivo ${idx + 1}`;
}

export default function ResultadoAnioCard({ resultado, onDelete }) {
  const { puedeConfigurar, sesion } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [filas, setFilas] = useState(resultado.filas || []);
  const [todosUrls, setTodosUrls] = useState([
    ...(resultado.imagenes_urls || []).map(u => ({ url: u, tipo: "imagen" })),
    ...(resultado.excel_urls || []).map(u => ({ url: u, tipo: getFileType(u) === "imagen" ? "imagen" : getFileType(u) })),
  ]);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const titulo = resultado.titulo || `Puntuaciones San Félix ${resultado.anio}`;
  const autorNombre = sesion?.nombre || "Admin";

  const handleAddFila = () => {
    setFilas(prev => [...prev, { posicion: prev.length + 1, penya: "", obra_nombre: "", puntuacion: 0, premio: 0, notas: "" }]);
  };

  const handleFilaChange = (i, campo, valor) => {
    setFilas(prev => prev.map((f, idx) => idx === i ? { ...f, [campo]: valor } : f));
  };

  const handleRemoveFila = (i) => {
    setFilas(prev => prev.filter((_, idx) => idx !== i).map((f, idx) => ({ ...f, posicion: idx + 1 })));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    const imagenesUrls = todosUrls.filter(f => f.tipo === "imagen").map(f => f.url);
    const excelUrls = todosUrls.filter(f => f.tipo !== "imagen").map(f => f.url);
    await base44.entities.ResultadoAnio.update(resultado.id, { filas, imagenes_urls: imagenesUrls, excel_urls: excelUrls });
    setGuardando(false);
  };

  const handleSubirArchivos = async (e, tipoForzado = null) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSubiendo(true);
    const nuevos = await Promise.all(files.map(async f => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      const tipo = tipoForzado || getFileType(file_url) || getFileType(f.name);
      return { url: file_url, tipo, nombre: f.name };
    }));
    const actualizado = [...todosUrls, ...nuevos.map(n => ({ url: n.url, tipo: n.tipo }))];
    setTodosUrls(actualizado);
    const imagenesUrls = actualizado.filter(f => f.tipo === "imagen").map(f => f.url);
    const excelUrls = actualizado.filter(f => f.tipo !== "imagen").map(f => f.url);
    await base44.entities.ResultadoAnio.update(resultado.id, { imagenes_urls: imagenesUrls, excel_urls: excelUrls });
    setSubiendo(false);
    e.target.value = "";
  };

  const handleEliminarArchivo = async (item, idx) => {
    if (!confirm(`¿Eliminar este archivo?`)) return;
    const nuevos = todosUrls.filter((_, i) => i !== idx);
    setTodosUrls(nuevos);
    const imagenesUrls = nuevos.filter(f => f.tipo === "imagen").map(f => f.url);
    const excelUrls = nuevos.filter(f => f.tipo !== "imagen").map(f => f.url);
    await base44.entities.ResultadoAnio.update(resultado.id, { imagenes_urls: imagenesUrls, excel_urls: excelUrls });
    await base44.entities.Papelera.create({
      entidad: "ResultadoAnio",
      descripcion: `Archivo de ${titulo}`,
      datos_json: JSON.stringify({ url: item.url, tipo: item.tipo, anio: resultado.anio }),
      eliminado_por: autorNombre,
    });
  };

  const imagenes = todosUrls.filter(f => f.tipo === "imagen");
  const pdfs = todosUrls.filter(f => f.tipo === "pdf");
  const excels = todosUrls.filter(f => f.tipo === "excel" || f.tipo === "otro");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div>
          <p className="font-bold text-[#630027] text-lg">{titulo}</p>
          <p className="text-xs text-gray-400">{filas.length} posiciones · {resultado.anio}</p>
        </div>
        <div className="flex items-center gap-2">
          {puedeConfigurar && (
            <button
              onClick={e => { e.stopPropagation(); if (confirm("¿Eliminar este año de resultados?")) onDelete(resultado.id); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {/* Tabla de posiciones */}
          <div className="space-y-2">
            {filas.map((fila, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                {/* Fila superior: posición + nombre */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 rounded-full bg-[#630027]/10 flex items-center justify-center text-xs font-black text-[#630027] flex-shrink-0">
                    {fila.posicion}
                  </span>
                  <input
                    value={fila.penya}
                    onChange={e => handleFilaChange(i, "penya", e.target.value)}
                    placeholder="Nombre de la peña"
                    disabled={!puedeConfigurar}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-[#630027]/30 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:font-semibold disabled:text-gray-700"
                  />
                  {puedeConfigurar && (
                    <button onClick={() => handleRemoveFila(i)} className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Nombre de la obra */}
                <div className="flex items-center gap-1.5 pl-9 mb-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">Obra:</span>
                  <input
                    value={fila.obra_nombre || ""}
                    onChange={e => handleFilaChange(i, "obra_nombre", e.target.value)}
                    placeholder="Nombre de la obra presentada"
                    disabled={!puedeConfigurar}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#630027]/30 disabled:bg-transparent disabled:border-transparent disabled:px-0"
                  />
                </div>

                {/* Fila inferior: puntuación + premio */}
                <div className="flex items-center gap-3 pl-9">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Pts:</span>
                    <input
                      type="number"
                      value={fila.puntuacion ?? ""}
                      onChange={e => handleFilaChange(i, "puntuacion", parseFloat(e.target.value) || 0)}
                      onFocus={e => e.target.select()}
                      placeholder="0"
                      disabled={!puedeConfigurar}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold text-[#630027] bg-white focus:outline-none focus:ring-1 focus:ring-[#630027]/30 disabled:bg-transparent disabled:border-transparent disabled:px-0"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Premio:</span>
                    <input
                      type="number"
                      value={fila.premio ?? ""}
                      onChange={e => handleFilaChange(i, "premio", parseFloat(e.target.value) || 0)}
                      onFocus={e => e.target.select()}
                      placeholder="0"
                      disabled={!puedeConfigurar}
                      className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold text-green-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#630027]/30 disabled:bg-transparent disabled:border-transparent disabled:px-0"
                    />
                    <span className="text-xs text-green-600 font-semibold">€</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {puedeConfigurar && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleAddFila} className="rounded-xl text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> Añadir fila
              </Button>
              <Button size="sm" onClick={handleGuardar} disabled={guardando} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-xs">
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          )}

          {/* Media: fotos, vídeos, enlaces y YouTube */}
          <MediaGaleria parentId={`resultado_${resultado.id}`} seccion="resultado_media" puedeEditar={puedeConfigurar} />
        </div>
      )}
    </div>
  );
}