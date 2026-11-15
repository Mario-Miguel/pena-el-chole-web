import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Trash2, Link as LinkIcon, Youtube, Video, X, Download, Plus, ExternalLink, FileText, Play } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

function getYoutubeId(url) {
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function detectTipo(file) {
  if (file.type.startsWith("image/")) return "imagen";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "documento";
}

function getFileExt(url) {
  try { return decodeURIComponent(url.split("/").pop().split("?")[0]).split(".").pop().toLowerCase(); } catch { return ""; }
}

export default function MediaGaleria({ parentId, seccion, puedeEditar: puedeEditarProp }) {
  const { sesion } = useAuth();
  const puedeEditar = puedeEditarProp ?? (sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente");
  const [docs, setDocs] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showLink, setShowLink] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const cargar = useCallback(async () => {
    const data = await base44.entities.ObraDocumento.filter({ obra_anio_id: parentId, seccion });
    setDocs(data);
  }, [parentId, seccion]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleUpload = async (e, acceptType) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSubiendo(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const tipo = detectTipo(file);
      await base44.entities.ObraDocumento.create({ obra_anio_id: parentId, seccion, nombre: file.name, url: file_url, tipo });
    }
    await cargar();
    setSubiendo(false);
    e.target.value = "";
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    await base44.entities.ObraDocumento.create({ obra_anio_id: parentId, seccion, nombre: linkTitle.trim() || url, url, tipo: "link" });
    setLinkUrl(""); setLinkTitle(""); setShowLink(false);
    await cargar();
  };

  const handleAddYoutube = async () => {
    const videoId = getYoutubeId(youtubeUrl.trim());
    if (!videoId) { alert("URL de YouTube no válida. Ejemplo: https://www.youtube.com/watch?v=..."); return; }
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    await base44.entities.ObraDocumento.create({ obra_anio_id: parentId, seccion, nombre: youtubeUrl.trim(), url: embedUrl, tipo: "youtube" });
    setYoutubeUrl(""); setShowYoutube(false);
    await cargar();
  };

  const handleDelete = async (id) => {
    await base44.entities.ObraDocumento.delete(id);
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  const imagenes = docs.filter(d => d.tipo === "imagen");
  const videos = docs.filter(d => d.tipo === "video");
  const youtubes = docs.filter(d => d.tipo === "youtube");
  const links = docs.filter(d => d.tipo === "link");
  const archivos = docs.filter(d => d.tipo === "pdf" || d.tipo === "documento" || d.tipo === "otro");

  return (
    <div>
      {/* === BOTONES DE SUBIDA === */}
      {puedeEditar && (
        <div className="flex flex-wrap gap-2 mb-3">
          <label className={`flex items-center gap-1.5 text-xs font-semibold text-[#630027] bg-[#630027]/5 hover:bg-[#630027]/10 px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${subiendo ? "opacity-50 pointer-events-none" : ""}`}>
            {subiendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Fotos
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e, "imagen")} />
          </label>
          <label className={`flex items-center gap-1.5 text-xs font-semibold text-[#630027] bg-[#630027]/5 hover:bg-[#630027]/10 px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${subiendo ? "opacity-50 pointer-events-none" : ""}`}>
            <Video className="w-3.5 h-3.5" />
            Vídeos
            <input type="file" accept="video/*" multiple className="hidden" onChange={e => handleUpload(e, "video")} />
          </label>
          <button onClick={() => setShowYoutube(true)} className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors">
            <Youtube className="w-3.5 h-3.5" /> YouTube
          </button>
          <button onClick={() => setShowLink(true)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors">
            <LinkIcon className="w-3.5 h-3.5" /> Enlace
          </button>
          <label className={`flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl cursor-pointer transition-colors ${subiendo ? "opacity-50 pointer-events-none" : ""}`}>
            <FileText className="w-3.5 h-3.5" /> Docs
            <input type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.ods" multiple className="hidden" onChange={e => handleUpload(e, "doc")} />
          </label>
        </div>
      )}

      {/* === IMÁGENES === */}
      {imagenes.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Fotos</p>
          <div className="grid grid-cols-3 gap-2">
            {imagenes.map(doc => (
              <div key={doc.id} className="relative group">
                <img src={doc.url} alt={doc.nombre} loading="lazy" className="w-full aspect-square object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreview({ type: "imagen", ...doc })} />
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={doc.url} download onClick={e => e.stopPropagation()} className="w-6 h-6 bg-white/90 text-gray-600 rounded-full flex items-center justify-center shadow hover:text-[#630027]">
                    <Download className="w-3 h-3" />
                  </a>
                  {puedeEditar && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(doc.id); }} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === VÍDEOS === */}
      {videos.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Vídeos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {videos.map(doc => (
              <div key={doc.id} className="relative group bg-gray-50 rounded-xl overflow-hidden">
                <video src={doc.url} controls className="w-full aspect-video object-contain bg-black" />
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-xs text-gray-500 truncate flex-1">{doc.nombre}</span>
                  <div className="flex gap-1">
                    <a href={doc.url} download className="text-gray-300 hover:text-[#630027] transition-colors p-1">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    {puedeEditar && (
                      <button onClick={() => handleDelete(doc.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === YOUTUBE === */}
      {youtubes.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1"><Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {youtubes.map(doc => {
              const videoId = getYoutubeId(doc.nombre) || getYoutubeId(doc.url);
              const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
              return (
                <div key={doc.id} className="relative group bg-gray-50 rounded-xl overflow-hidden">
                  <div className="relative aspect-video cursor-pointer" onClick={() => setPreview({ type: "youtube", ...doc })}>
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={doc.nombre} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200"><Youtube className="w-8 h-8 text-red-400" /></div>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs text-gray-500 truncate flex-1">{videoId ? "YouTube" : doc.nombre}</span>
                    {puedeEditar && (
                      <button onClick={() => handleDelete(doc.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === LINKS === */}
      {links.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Enlaces</p>
          <div className="space-y-1.5">
            {links.map(doc => (
              <div key={doc.id} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2 group">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <LinkIcon className="w-4 h-4 text-blue-500" />
                </div>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-gray-700 hover:text-[#630027] truncate font-medium">{doc.nombre}</a>
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                {puedeEditar && (
                  <button onClick={() => handleDelete(doc.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === ARCHIVOS (PDF/Docs) === */}
      {archivos.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Documentos</p>
          <div className="space-y-1.5">
            {archivos.map(doc => {
              const ext = getFileExt(doc.url);
              const isPdf = doc.tipo === "pdf" || ext === "pdf";
              return (
                <div key={doc.id} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3 py-2 group">
                  <FileText className={`w-5 h-5 flex-shrink-0 ${isPdf ? "text-red-400" : "text-gray-400"}`} />
                  <button onClick={() => window.open(doc.url, "_blank")} className="flex-1 text-sm text-gray-700 hover:text-[#630027] truncate text-left">{doc.nombre}</button>
                  <a href={doc.url} download className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-[#630027] transition-all p-1">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  {puedeEditar && (
                    <button onClick={() => handleDelete(doc.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === EMPTY STATE === */}
      {docs.length === 0 && !subiendo && (
        <p className="text-xs text-gray-300 italic px-1">Sin contenido. {puedeEditar ? "Sube fotos, vídeos, enlaces o YouTube." : ""}</p>
      )}

      {/* === DIALOG: AÑADIR LINK === */}
      {showLink && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLink(false)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-800 flex items-center gap-2"><LinkIcon className="w-4 h-4 text-blue-500" /> Añadir enlace</h4>
              <button onClick={() => setShowLink(false)} className="text-gray-300 hover:text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium">Título (opcional)</label>
              <input value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Nombre del enlace" className="w-full mt-0.5 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#630027]/30" autoFocus onKeyDown={e => e.key === "Enter" && handleAddLink()} />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium">URL</label>
              <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full mt-0.5 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#630027]/30" onKeyDown={e => e.key === "Enter" && handleAddLink()} />
            </div>
            <button onClick={handleAddLink} disabled={!linkUrl.trim()} className="w-full bg-[#630027] hover:bg-[#4a001d] text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">Añadir enlace</button>
          </div>
        </div>
      )}

      {/* === DIALOG: AÑADIR YOUTUBE === */}
      {showYoutube && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowYoutube(false)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-800 flex items-center gap-2"><Youtube className="w-4 h-4 text-red-500" /> Añadir vídeo de YouTube</h4>
              <button onClick={() => setShowYoutube(false)} className="text-gray-300 hover:text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium">URL de YouTube</label>
              <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full mt-0.5 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#630027]/30" autoFocus onKeyDown={e => e.key === "Enter" && handleAddYoutube()} />
            </div>
            <button onClick={handleAddYoutube} disabled={!youtubeUrl.trim()} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">Añadir vídeo</button>
          </div>
        </div>
      )}

      {/* === LIGHTBOX / REPRODUCTOR === */}
      {preview && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white z-10" onClick={() => setPreview(null)}>
            <X className="w-7 h-7" />
          </button>
          {preview.type === "imagen" && (
            <img src={preview.url} alt={preview.nombre} className="max-w-full max-h-full rounded-2xl object-contain" onClick={e => e.stopPropagation()} />
          )}
          {preview.type === "youtube" && (
            <div className="w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
              <iframe src={preview.url + "?autoplay=1"} className="w-full h-full rounded-2xl" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen frameBorder="0" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}