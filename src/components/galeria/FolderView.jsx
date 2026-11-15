import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, Trash2, Video, Camera, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { motion, AnimatePresence } from "framer-motion";
import MediaViewer from "./MediaViewer";
import { useAuth } from "../auth/AuthContext";
import { useQuery } from "@tanstack/react-query";

export default function FolderView({ carpeta, onBack, onRefresh }) {
  const { sesion } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  // Mapa integrante_id → nombre
  const { data: integrantes = [] } = useQuery({
    queryKey: ["integrantes-galeria"],
    queryFn: () => api.entities.Integrante.list(),
    staleTime: 5 * 60 * 1000,
  });
  const nombrePorSesion = (sesionId) => {
    const found = integrantes.find(i => i.id === sesionId);
    return found?.nombre || sesionId?.split("@")[0] || "Desconocido";
  };

  React.useEffect(() => {
    loadItems();
  }, [carpeta.id]);

  const loadItems = async () => {
    const data = await api.entities.MediaItem.filter({ carpeta_id: carpeta.id }, "-created_date");
    setItems(data);
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);

    for (const file of files) {
      const tipo = file.type.startsWith("video") ? "video" : "foto";
      const { file_url } = await api.uploadFile({ file });
      const nuevo = await api.entities.MediaItem.create({
        carpeta_id: carpeta.id,
        tipo,
        url: file_url,
        nombre: file.name,
        subido_por: sesion?.integranteId || null,
      });
      if (tipo === "foto" && !carpeta.miniatura_url) {
        await api.entities.Carpeta.update(carpeta.id, { miniatura_url: file_url });
        carpeta.miniatura_url = file_url;
        onRefresh();
      }
      setItems(prev => [nuevo, ...prev]);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleChangeThumbnail = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await api.uploadFile({ file });
    await api.entities.Carpeta.update(carpeta.id, { miniatura_url: file_url });
    carpeta.miniatura_url = file_url;
    onRefresh();
    e.target.value = "";
  };

  const handleRemoveThumbnail = async () => {
    await api.entities.Carpeta.update(carpeta.id, { miniatura_url: null });
    carpeta.miniatura_url = null;
    onRefresh();
  };

  const handleDelete = async (item) => {
    await api.entities.Papelera.create({
      entidad: "MediaItem",
      descripcion: `${item.nombre} (${item.tipo}) en carpeta "${carpeta.nombre}"`,
      datos_json: JSON.stringify(item),
      eliminado_por: sesion?.nombre || "Desconocido",
    });
    await api.entities.MediaItem.delete(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full text-[#630027] hover:bg-[#630027]/5">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{carpeta.nombre}</h2>
            {carpeta.anio && <p className="text-xs text-[#630027]/50">{carpeta.anio}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleChangeThumbnail} />
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => thumbnailInputRef.current?.click()}
              className="rounded-xl border-[#630027]/20 text-[#630027] text-xs"
              title="Cambiar miniatura de la carpeta"
            >
              <Camera className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Miniatura</span>
            </Button>
            {carpeta.miniatura_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveThumbnail}
                className="rounded-xl border-red-200 text-red-400 hover:bg-red-50 text-xs"
                title="Eliminar miniatura"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleUpload} />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl w-10 h-10 p-0 flex-shrink-0"
            title="Añadir fotos o vídeos"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📂</div>
          <p className="text-gray-300 text-sm">Carpeta vacía</p>
          <p className="text-gray-200 text-xs mt-1">Pulsa "Añadir" para subir fotos o vídeos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer shadow-sm hover:shadow-md transition-shadow flex flex-col"
                onClick={() => setViewerIndex(idx)}
              >
                {item.tipo === "video" ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                    <Video className="w-8 h-8 text-white/60" />
                    <p className="text-white/40 text-xs mt-1 px-2 truncate w-full text-center">{item.nombre}</p>
                  </div>
                ) : (
                  <img src={item.url} alt={item.nombre} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                )}
                {/* Delete overlay */}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(item); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                {/* Download overlay */}
                {item.tipo !== "video" && (
                  <button
                    onClick={async e => {
                      e.stopPropagation();
                      const res = await fetch(item.url);
                      const blob = await res.blob();
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = item.nombre || "foto";
                      a.click();
                      URL.revokeObjectURL(a.href);
                    }}
                    className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white hover:bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Descargar"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                )}

                {/* Fecha de subida + usuario */}
                {item.created_date && (
                  <div className="absolute bottom-1.5 left-1.5 flex flex-col gap-0.5">
                    {(item.subido_por || item.created_by) && (
                      <span className="bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-md leading-tight">
                        {item.subido_por
                          ? nombrePorSesion(item.subido_por)
                          : integrantes.find(i => i.id === item.created_by || i.nombre === item.created_by)?.nombre
                            || item.created_by?.split("@")[0]
                            || "Desconocido"}
                      </span>
                    )}
                    <span className="bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-md leading-tight">
                      {new Date(item.created_date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" })}
                    </span>
                  </div>
                )}
                {item.tipo === "video" && (
                  <div className="absolute bottom-6 left-1.5">
                    <span className="bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <Video className="w-2.5 h-2.5" /> Vídeo
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Viewer */}
      <AnimatePresence>
        {viewerIndex !== null && (
          <MediaViewer
            items={items}
            currentIndex={viewerIndex}
            onClose={() => setViewerIndex(null)}
            onPrev={() => setViewerIndex(i => Math.max(0, i - 1))}
            onNext={() => setViewerIndex(i => Math.min(items.length - 1, i + 1))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}