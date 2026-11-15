import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "../auth/AuthContext";
import { Plus, Trash2, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getPref } from "@/lib/uiPrefs";

export default function NotasBubble() {
  const { sesion } = useAuth();
  const [open, setOpen] = useState(false);
  const [notas, setNotas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(false);

  const [bottomNavVisible, setBottomNavVisible] = useState(
    () => localStorage.getItem("pena_bottom_nav_hidden") !== "true"
  );
  const [chatBubbleVisible, setChatBubbleVisible] = useState(
    () => getPref("pena_burbuja_chat", false)
  );

  useEffect(() => {
    const handler = () => setBottomNavVisible(localStorage.getItem("pena_bottom_nav_hidden") !== "true");
    window.addEventListener("bottomNavVisibilityChanged", handler);
    return () => window.removeEventListener("bottomNavVisibilityChanged", handler);
  }, []);

  useEffect(() => {
    const handler = () => setChatBubbleVisible(getPref("pena_burbuja_chat", false));
    window.addEventListener("uiPrefChanged", handler);
    return () => window.removeEventListener("uiPrefChanged", handler);
  }, []);

  const loadNotas = useCallback(async () => {
    if (!sesion?.integranteId || sesion?.esAdmin) return;
    setLoading(true);
    const ns = await base44.entities.NotaPersonal.filter({ integrante_id: sesion.integranteId });
    setNotas(ns.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)));
    setLoading(false);
  }, [sesion]);

  useEffect(() => {
    if (open) loadNotas();
  }, [open, loadNotas]);

  const handleGuardar = async () => {
    if (!editando?.titulo?.trim()) return;
    if (editando.id) {
      await base44.entities.NotaPersonal.update(editando.id, { titulo: editando.titulo, contenido: editando.contenido });
    } else {
      await base44.entities.NotaPersonal.create({ integrante_id: sesion.integranteId, titulo: editando.titulo, contenido: editando.contenido || "" });
    }
    setEditando(null);
    loadNotas();
  };

  const handleEliminar = async (id) => {
    await base44.entities.NotaPersonal.delete(id);
    loadNotas();
  };

  if (!sesion || sesion.esAdmin) return null;

  // Posición base (encima de la barra de navegación inferior si está visible)
  const baseBottom = bottomNavVisible ? 80 : 24;
  // Si chat está activo, notas va encima (chat en base, notas +56px)
  const bubbleBottom = chatBubbleVisible ? baseBottom + 56 : baseBottom;
  // El panel aparece encima de la burbuja
  const panelBottom = bubbleBottom + 56;

  return (
    <>
      {/* Panel de notas */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
            style={{ bottom: panelBottom, right: 16, maxHeight: "60vh" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-[#630027] flex-shrink-0">
              <span className="text-white font-bold text-sm flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4h16v12l-4 4H4V4zm12 12v3.17L18.83 16H16z"/>
                </svg>
                Notas personales
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditando({ titulo: "", contenido: "" })} className="text-white/80 hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <AnimatePresence>
                {editando && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
                    <Input placeholder="Título" className="rounded-lg border-gray-200 text-sm font-semibold"
                      value={editando.titulo} onChange={e => setEditando(v => ({ ...v, titulo: e.target.value }))} autoFocus />
                    <Textarea placeholder="Contenido..." className="rounded-lg border-gray-200 resize-none text-sm"
                      rows={3} value={editando.contenido} onChange={e => setEditando(v => ({ ...v, contenido: e.target.value }))} />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setEditando(null)} className="rounded-lg text-xs h-7 px-2">
                        <X className="w-3 h-3 mr-1" /> Cancelar
                      </Button>
                      <Button size="sm" onClick={handleGuardar} disabled={!editando.titulo?.trim()}
                        className="bg-[#4B1924] hover:bg-[#3a1019] text-white rounded-lg text-xs h-7 px-2">
                        <Save className="w-3 h-3 mr-1" /> Guardar
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
                </div>
              ) : notas.length === 0 && !editando ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🗒️</p>
                  <p className="text-xs text-gray-300">Aún no tienes notas. Pulsa + para añadir</p>
                </div>
              ) : (
                <AnimatePresence>
                  {notas.map(nota => (
                    <motion.div key={nota.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 20 }}
                      className="bg-gray-50 rounded-xl p-3 cursor-pointer hover:bg-[#630027]/5 transition-colors border border-gray-100"
                      onClick={() => setEditando({ id: nota.id, titulo: nota.titulo, contenido: nota.contenido || "" })}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{nota.titulo}</p>
                          {nota.contenido && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{nota.contenido}</p>}
                        </div>
                        <button onClick={e => { e.stopPropagation(); handleEliminar(nota.id); }}
                          className="text-gray-200 hover:text-red-400 transition-colors flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Burbuja flotante de notas */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(v => !v)}
        animate={{ bottom: bubbleBottom }}
        transition={{ duration: 0.3 }}
        style={{ right: 16, backgroundColor: "#4B1924" }}
        className="fixed z-40 w-11 h-11 rounded-full shadow-2xl flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4h16v12l-4 4H4V4zm12 12v3.17L18.83 16H16z"/>
        </svg>
      </motion.button>
    </>
  );
}