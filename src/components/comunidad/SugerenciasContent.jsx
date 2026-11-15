import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Send, ThumbsUp, Trash2, Archive, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import ConfirmDialog from "../ConfirmDialog";

export default function SugerenciasContent() {
  const { sesion } = useAuth();
  const usuarioId = sesion?.integranteId || "";
  const esAdmin = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";

  const [sugerencias, setSugerencias] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [expandidas, setExpandidas] = useState(new Set());
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadData = useCallback(async () => {
    const sugs = await api.entities.Sugerencia.list("-created_date");
    setSugerencias(sugs);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleEnviar = async () => {
    if (!titulo.trim()) return;
    setEnviando(true);
    await api.entities.Sugerencia.create({
      titulo: titulo.trim(), texto: texto.trim(),
      autor_nombre: sesion?.nombre || "Anónimo", votos: 0, votos_ids: [], archivada: false
    });
    await api.entities.AdminLog.create({
      accion: "crear", entidad: "Sugerencia",
      descripcion: `Nueva sugerencia: "${titulo.trim()}"`, autor_nombre: sesion?.nombre || "Anónimo"
    });
    setTitulo(""); setTexto("");
    await loadData();
    setEnviando(false);
  };

  const handleVotar = async (sug) => {
    if (!usuarioId) return;
    const votosIds = sug.votos_ids || [];
    const yaVotado = votosIds.includes(usuarioId);
    const nuevosIds = yaVotado ? votosIds.filter(id => id !== usuarioId) : [...votosIds, usuarioId];
    await api.entities.Sugerencia.update(sug.id, { votos: nuevosIds.length, votos_ids: nuevosIds });
    loadData();
  };

  const handleEliminar = async (sug) => {
    await api.entities.Papelera.create({ entidad: "Sugerencia", descripcion: `"${sug.titulo}"`, datos_json: JSON.stringify(sug), eliminado_por: sesion?.nombre || "Desconocido" });
    await api.entities.AdminLog.create({ accion: "eliminar", entidad: "Sugerencia", descripcion: `Eliminada: "${sug.titulo}"`, autor_nombre: sesion?.nombre || "Desconocido" });
    await api.entities.Sugerencia.delete(sug.id);
    loadData();
  };

  const handleArchivar = async (sug) => {
    await api.entities.Sugerencia.update(sug.id, { archivada: true });
    await api.entities.AdminLog.create({ accion: "editar", entidad: "Sugerencia", descripcion: `Archivada: "${sug.titulo}"`, autor_nombre: sesion?.nombre || "Desconocido" });
    loadData();
  };

  const toggleExpandida = (id) => setExpandidas(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const activas = sugerencias.filter(s => !s.archivada).sort((a, b) => (b.votos || 0) - (a.votos || 0));
  const archivadas = sugerencias.filter(s => s.archivada).sort((a, b) => (b.votos || 0) - (a.votos || 0));

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>;

  return (
    <div>
      {/* Formulario */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-3">
        <Input placeholder="Título del tema *" className="rounded-xl border-gray-200 font-semibold" value={titulo} onChange={e => setTitulo(e.target.value)} />
        <Textarea placeholder="Descripción (opcional)..." className="rounded-xl border-gray-200 resize-none" rows={3} value={texto} onChange={e => setTexto(e.target.value)} />
        <div className="flex justify-end">
          <Button onClick={handleEnviar} disabled={!titulo.trim() || enviando} className="bg-[#630027] text-white px-4 py-2 text-sm rounded-xl hover:bg-[#3a1019]">
            <Send className="w-4 h-4 mr-2" />{enviando ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>

      {/* Lista activas */}
      {activas.length === 0 ? (
        <div className="text-center py-12"><p className="text-5xl mb-3">💡</p><p className="text-gray-300 text-sm">¡Sé el primero en enviar una sugerencia!</p></div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {activas.map((sug, idx) => {
              const yaVotado = (sug.votos_ids || []).includes(usuarioId);
              const abierta = expandidas.has(sug.id);
              return (
                <motion.div key={sug.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.28, delay: idx * 0.04 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <button onClick={() => handleVotar(sug)} disabled={!usuarioId}
                      className={`flex flex-col items-center gap-0.5 min-w-[40px] transition-colors ${yaVotado ? "text-[#4B1924]" : "text-gray-300 hover:text-[#4B1924]/50"}`}>
                      <ThumbsUp className={`w-5 h-5 ${yaVotado ? "fill-[#4B1924]" : ""}`} />
                      <span className="text-xs font-bold">{sug.votos || 0}</span>
                    </button>
                    <button className="flex-1 text-left" onClick={() => toggleExpandida(sug.id)}>
                      <p className="font-semibold text-gray-800 text-sm">{sug.titulo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{sug.autor_nombre}</p>
                    </button>
                    <div className="flex items-center gap-1">
                      {esAdmin && <>
                        <button onClick={() => setConfirmDialog({ accion: "archivar", sug, label: `¿Archivar "${sug.titulo}"?` })}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50 transition-colors"><Archive className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDialog({ accion: "eliminar", sug, label: `¿Eliminar "${sug.titulo}"?` })}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </>}
                      <button onClick={() => toggleExpandida(sug.id)} className="p-1 text-gray-300">
                        <ChevronDown className={`w-4 h-4 transition-transform ${abierta ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {abierta && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-4 border-t border-gray-50">
                          <p className="text-sm text-gray-600 leading-relaxed pt-3">{sug.texto || <span className="italic text-gray-400">Sin descripción adicional</span>}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Archivadas */}
      {archivadas.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setMostrarArchivadas(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 mb-3">
            <Archive className="w-4 h-4" /> Archivadas ({archivadas.length})
            <ChevronDown className={`w-4 h-4 transition-transform ${mostrarArchivadas ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {mostrarArchivadas && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {archivadas.map(sug => (
                  <div key={sug.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center gap-3 opacity-60">
                    <ThumbsUp className="w-4 h-4 text-gray-300" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-500">{sug.titulo}</p>
                      <p className="text-xs text-gray-400">{sug.votos || 0} votos · {sug.autor_nombre}</p>
                    </div>
                    {esAdmin && <button onClick={() => setConfirmDialog({ accion: "eliminar", sug, label: `¿Eliminar "${sug.titulo}"?` })} className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDialog}
        mensaje={confirmDialog?.label}
        textoConfirmar={confirmDialog?.accion === "archivar" ? "Archivar" : "Eliminar"}
        variante={confirmDialog?.accion === "archivar" ? "normal" : "destructive"}
        onConfirm={async () => {
          if (confirmDialog.accion === "eliminar") await handleEliminar(confirmDialog.sug);
          if (confirmDialog.accion === "archivar") await handleArchivar(confirmDialog.sug);
          setConfirmDialog(null);
        }}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}