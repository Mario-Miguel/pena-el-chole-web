import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Plus, Trash2, ExternalLink, FolderOpen, Link as LinkIcon, Edit2, Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/auth/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import HelpIcon from "../components/layout/HelpIcon";

const EMOJIS = ["🔗", "📄", "🌐", "📋", "🎨", "🛠️", "📦", "🏛️", "📸", "🎵", "🗺️", "📞"];

export default function Enlaces() {
  const { sesion } = useAuth();
  const puedeGestionar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente" || sesion?.cargo === "secretario" || sesion?.cargo === "tesorero" || sesion?.cargo === "vocal";

  const [enlaces, setEnlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showFormCarpeta, setShowFormCarpeta] = useState(false);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteCarpeta, setConfirmDeleteCarpeta] = useState(null);

  // Form nuevo enlace
  const [fTitulo, setFTitulo] = useState("");
  const [fUrl, setFUrl] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fCarpeta, setFCarpeta] = useState("");
  const [fIcono, setFIcono] = useState("🔗");
  const [fNombreCarpeta, setFNombreCarpeta] = useState("");

  // Edición enlace
  const [editEnlace, setEditEnlace] = useState(null); // enlace completo
  const [eTitulo, setETitulo] = useState("");
  const [eUrl, setEUrl] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eCarpeta, setECarpeta] = useState("");
  const [eIcono, setEIcono] = useState("🔗");

  // Edición carpeta
  const [editCarpeta, setEditCarpeta] = useState(null); // nombre actual
  const [editCarpetaNombre, setEditCarpetaNombre] = useState("");

  const cargar = async () => {
    const data = await api.entities.EnlaceUtil.list("-created_date");
    setEnlaces(data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const carpetas = [...new Set(enlaces.map(e => e.carpeta || "General").filter(Boolean))];

  const crearEnlace = async () => {
    if (!fTitulo.trim() || !fUrl.trim()) return;
    let url = fUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    await api.entities.EnlaceUtil.create({
      titulo: fTitulo.trim(), url, descripcion: fDesc.trim(),
      carpeta: fCarpeta || "General", icono: fIcono,
    });
    setFTitulo(""); setFUrl(""); setFDesc(""); setFIcono("🔗"); setFCarpeta("");
    setShowForm(false);
    cargar();
  };

  const crearCarpeta = () => {
    if (!fNombreCarpeta.trim()) return;
    setFCarpeta(fNombreCarpeta.trim());
    setFNombreCarpeta("");
    setShowFormCarpeta(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await api.entities.EnlaceUtil.delete(confirmDelete);
    setConfirmDelete(null);
    cargar();
  };

  const abrirEditar = (enlace) => {
    setEditEnlace(enlace);
    setETitulo(enlace.titulo);
    setEUrl(enlace.url);
    setEDesc(enlace.descripcion || "");
    setECarpeta(enlace.carpeta || "General");
    setEIcono(enlace.icono || "🔗");
  };

  const guardarEditar = async () => {
    if (!eTitulo.trim() || !eUrl.trim()) return;
    let url = eUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    await api.entities.EnlaceUtil.update(editEnlace.id, {
      titulo: eTitulo.trim(), url, descripcion: eDesc.trim(),
      carpeta: eCarpeta || "General", icono: eIcono,
    });
    setEditEnlace(null);
    cargar();
  };

  const renombrarCarpeta = async () => {
    if (!editCarpetaNombre.trim() || editCarpetaNombre.trim() === editCarpeta) {
      setEditCarpeta(null);
      return;
    }
    const afectados = enlaces.filter(e => (e.carpeta || "General") === editCarpeta);
    await Promise.all(afectados.map(e => api.entities.EnlaceUtil.update(e.id, { carpeta: editCarpetaNombre.trim() })));
    if (carpetaSeleccionada === editCarpeta) setCarpetaSeleccionada(editCarpetaNombre.trim());
    setEditCarpeta(null);
    setEditCarpetaNombre("");
    cargar();
  };

  const eliminarCarpeta = async () => {
    const afectados = enlaces.filter(e => (e.carpeta || "General") === confirmDeleteCarpeta);
    await Promise.all(afectados.map(e => api.entities.EnlaceUtil.delete(e.id)));
    if (carpetaSeleccionada === confirmDeleteCarpeta) setCarpetaSeleccionada(null);
    setConfirmDeleteCarpeta(null);
    cargar();
  };

  const enlacesFiltrados = carpetaSeleccionada
    ? enlaces.filter(e => (e.carpeta || "General") === carpetaSeleccionada)
    : enlaces;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">🔗 Enlaces</h1>
            <HelpIcon section="enlaces" />
          </div>
          <p className="text-gray-400 text-sm mt-1">Links útiles organizados por carpetas</p>
        </div>
        {puedeGestionar && (
          <Button onClick={() => setShowForm(v => !v)} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-sm">
            <Plus className="w-4 h-4 mr-1" /> Añadir
          </Button>
        )}
      </div>

      {/* Formulario nuevo enlace */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 overflow-hidden">
            <p className="text-sm font-bold text-gray-700">Nuevo enlace</p>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setFIcono(e)}
                  className={`w-9 h-9 rounded-xl text-lg transition-all border-2 ${fIcono === e ? "border-[#630027] bg-[#630027]/5" : "border-gray-100 hover:border-gray-200"}`}>{e}</button>
              ))}
            </div>
            <input value={fTitulo} onChange={e => setFTitulo(e.target.value)} placeholder="Título del enlace" autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
            <input value={fUrl} onChange={e => setFUrl(e.target.value)} placeholder="URL (ej: https://...)"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
            <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Descripción (opcional)"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none" />
            <div className="flex gap-2 items-center">
              <select value={fCarpeta} onChange={e => setFCarpeta(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
                <option value="">General</option>
                {carpetas.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={() => setShowFormCarpeta(v => !v)} className="px-3 py-2.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-200 whitespace-nowrap">
                + Carpeta
              </button>
            </div>
            <AnimatePresence>
              {showFormCarpeta && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="flex gap-2">
                    <input value={fNombreCarpeta} onChange={e => setFNombreCarpeta(e.target.value)} placeholder="Nombre de la carpeta"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none" />
                    <button onClick={crearCarpeta} className="px-4 py-2 bg-[#630027]/10 text-[#630027] rounded-xl text-sm font-bold">✓</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={crearEnlace} disabled={!fTitulo.trim() || !fUrl.trim()} className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Guardar</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtro carpetas */}
      {carpetas.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setCarpetaSeleccionada(null)}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${!carpetaSeleccionada ? "bg-[#630027] text-white border-[#630027]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
            Todos
          </button>
          {carpetas.map(c => (
            <div key={c} className="relative group/cat flex items-center">
              <button onClick={() => setCarpetaSeleccionada(carpetaSeleccionada === c ? null : c)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center gap-1.5 pr-8 ${carpetaSeleccionada === c ? "bg-[#630027] text-white border-[#630027]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
                <FolderOpen className="w-3.5 h-3.5" /> {c}
              </button>
              {puedeGestionar && (
                <div className="absolute right-1.5 flex gap-0.5 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setEditCarpeta(c); setEditCarpetaNombre(c); }}
                    className={`p-0.5 rounded transition-colors ${carpetaSeleccionada === c ? "text-white/70 hover:text-white" : "text-gray-400 hover:text-[#630027]"}`}>
                    <Pencil className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteCarpeta(c); }}
                    className={`p-0.5 rounded transition-colors ${carpetaSeleccionada === c ? "text-white/70 hover:text-white" : "text-gray-400 hover:text-red-400"}`}>
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal editar carpeta */}
      <AnimatePresence>
        {editCarpeta && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50" onClick={() => setEditCarpeta(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4 pointer-events-auto">
                <p className="font-bold text-gray-800">Renombrar carpeta</p>
                <input value={editCarpetaNombre} onChange={e => setEditCarpetaNombre(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && renombrarCarpeta()}
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditCarpeta(null)} className="flex-1 rounded-xl">Cancelar</Button>
                  <Button onClick={renombrarCarpeta} className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Guardar</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lista de enlaces */}
      {enlacesFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-300">
          <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay enlaces guardados</p>
          {puedeGestionar && <p className="text-xs mt-1">Pulsa "Añadir" para crear el primero</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {enlacesFiltrados.map(e => (
            <motion.div key={e.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 group hover:border-[#630027]/20 transition-colors">
              <span className="text-2xl flex-shrink-0">{e.icono || "🔗"}</span>
              <div className="flex-1 min-w-0">
                <a href={e.url} target="_blank" rel="noopener noreferrer"
                  className="font-semibold text-sm text-gray-800 hover:text-[#630027] transition-colors flex items-center gap-1 group/link">
                  {e.titulo}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </a>
                {e.descripcion && <p className="text-xs text-gray-400 truncate">{e.descripcion}</p>}
                {e.carpeta && <p className="text-xs text-[#630027]/50 font-medium mt-0.5">{e.carpeta}</p>}
              </div>
              {puedeGestionar && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => abrirEditar(e)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-[#630027] hover:bg-[#630027]/5 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setConfirmDelete(e.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal editar enlace */}
      <AnimatePresence>
        {editEnlace && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50" onClick={() => setEditEnlace(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-3 pointer-events-auto">
                <p className="font-bold text-gray-800">Editar enlace</p>
                <div className="flex gap-2 flex-wrap">
                  {EMOJIS.map(em => (
                    <button key={em} onClick={() => setEIcono(em)}
                      className={`w-9 h-9 rounded-xl text-lg transition-all border-2 ${eIcono === em ? "border-[#630027] bg-[#630027]/5" : "border-gray-100 hover:border-gray-200"}`}>{em}</button>
                  ))}
                </div>
                <input value={eTitulo} onChange={e => setETitulo(e.target.value)} placeholder="Título"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
                <input value={eUrl} onChange={e => setEUrl(e.target.value)} placeholder="URL"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
                <input value={eDesc} onChange={e => setEDesc(e.target.value)} placeholder="Descripción (opcional)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none" />
                <select value={eCarpeta} onChange={e => setECarpeta(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
                  <option value="General">General</option>
                  {carpetas.filter(c => c !== "General").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditEnlace(null)} className="flex-1 rounded-xl">Cancelar</Button>
                  <Button onClick={guardarEditar} disabled={!eTitulo.trim() || !eUrl.trim()} className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Guardar</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirmDelete}
        mensaje="¿Eliminar este enlace?"
        textoConfirmar="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        open={!!confirmDeleteCarpeta}
        mensaje={`¿Eliminar la carpeta "${confirmDeleteCarpeta}" y todos sus enlaces?`}
        textoConfirmar="Eliminar"
        onConfirm={eliminarCarpeta}
        onCancel={() => setConfirmDeleteCarpeta(null)}
      />
    </motion.div>
  );
}