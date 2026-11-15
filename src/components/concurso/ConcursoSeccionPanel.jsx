import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Trash2, FileText, ExternalLink, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../auth/AuthContext";

const TITULOS = {
  bases: { label: "Bases", emoji: "📋" },
  puntuaciones: { label: "Puntuaciones", emoji: "🏆" },
  penalizaciones: { label: "Penalizaciones", emoji: "⚠️" }
};

export default function ConcursoSeccionPanel({ tipo }) {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";
  const [seccion, setSeccion] = useState(null);
  const [contenido, setContenido] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);

  useEffect(() => {
    base44.entities.ConcursoSeccion.filter({ tipo }).then((res) => {
      if (res.length > 0) {
        setSeccion(res[0]);
        setContenido(res[0].contenido || "");
      }
    });
  }, [tipo]);

  const handleGuardar = async () => {
    setGuardando(true);
    if (seccion) {
      const updated = await base44.entities.ConcursoSeccion.update(seccion.id, { contenido });
      setSeccion(updated);
    } else {
      const created = await base44.entities.ConcursoSeccion.create({ tipo, contenido, archivos: [] });
      setSeccion(created);
    }
    setGuardando(false);
    setGuardadoOk(true);
    setTimeout(() => setGuardadoOk(false), 2000);
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSubiendo(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push({ nombre: file.name, url: file_url });
    }
    const archivosActuales = seccion?.archivos || [];
    const nuevosArchivos = [...archivosActuales, ...urls.map((u) => JSON.stringify(u))];
    if (seccion) {
      const updated = await base44.entities.ConcursoSeccion.update(seccion.id, { archivos: nuevosArchivos });
      setSeccion(updated);
    } else {
      const created = await base44.entities.ConcursoSeccion.create({ tipo, contenido, archivos: nuevosArchivos });
      setSeccion(created);
    }
    setSubiendo(false);
    e.target.value = "";
  };

  const handleDeleteArchivo = async (idx) => {
    const nuevos = (seccion.archivos || []).filter((_, i) => i !== idx);
    const updated = await base44.entities.ConcursoSeccion.update(seccion.id, { archivos: nuevos });
    setSeccion(updated);
  };

  const archivos = (seccion?.archivos || []).map((a) => {
    try {return JSON.parse(a);} catch {return { nombre: a, url: a };}
  });

  const conf = TITULOS[tipo];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{conf.emoji}</span>
        <h3 className="font-black text-gray-800 text-lg">{conf.label}</h3>
      </div>

      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        placeholder={`Escribe aquí las ${conf.label.toLowerCase()}...`}
        disabled={!puedeEditar}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#630027]/20 min-h-[140px] disabled:bg-gray-50" />

      {puedeEditar && (
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl cursor-pointer transition-colors border border-gray-200">
            {subiendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Adjuntar archivo
            <input type="file" multiple className="hidden" onChange={handleUpload} disabled={subiendo} />
          </label>
          <Button onClick={handleGuardar} disabled={guardando} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl h-9 text-xs px-4">
            {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            {guardadoOk ? "¡Guardado!" : "Guardar"}
          </Button>
        </div>
      )}

      {archivos.length > 0 &&
      <div className="mt-4 space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Archivos adjuntos</p>
          {archivos.map((a, i) =>
        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 group">
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <button onClick={() => window.open(a.url, "_blank")} className="flex-1 text-sm text-gray-700 hover:text-[#630027] truncate text-left">{a.nombre}</button>
              <a href={a.url} download onClick={e => e.stopPropagation()} className="text-gray-300 hover:text-[#630027] opacity-0 group-hover:opacity-100 transition-all">
                <Download className="w-3.5 h-3.5" />
              </a>
              {puedeEditar && (
                <button onClick={() => handleDeleteArchivo(i)} className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
        )}
        </div>
      }
    </div>);

}