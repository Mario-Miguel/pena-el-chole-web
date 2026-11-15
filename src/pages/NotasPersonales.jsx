import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus, Trash2, Save, X } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/auth/AuthContext";

export default function NotasPersonales() {
  const { sesion } = useAuth();
  const usuarioId = sesion?.integranteId || "";
  const [notas, setNotas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!usuarioId || sesion?.esAdmin) {setLoading(false);return;}
    const ns = await api.entities.NotaPersonal.filter({ integrante_id: usuarioId });
    setNotas(ns.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date)));
    setLoading(false);
  }, [usuarioId, sesion]);

  useEffect(() => {loadData();}, [loadData]);

  const handleGuardar = async () => {
    if (!editando?.titulo?.trim() || !usuarioId) return;
    if (editando.id) {
      await api.entities.NotaPersonal.update(editando.id, { titulo: editando.titulo, contenido: editando.contenido });
    } else {
      await api.entities.NotaPersonal.create({ integrante_id: usuarioId, titulo: editando.titulo, contenido: editando.contenido || "" });
    }
    setEditando(null);
    loadData();
  };

  const handleEliminar = async (id) => {
    await api.entities.NotaPersonal.delete(id);
    loadData();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#4B1924]/20 border-t-[#4B1924] rounded-full animate-spin" />
    </div>);


  if (sesion?.esAdmin) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <p className="text-gray-400 text-sm">El administrador no tiene notas personales</p>
    </div>);


  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } } }}
      className="max-w-2xl mx-auto px-4 py-10"
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.42 } } }}
        className="mb-6"
      >
        <div className="flex items-center gap-2">
          <h1 className="text-[#630027] text-3xl font-black">Notas personales</h1>
          <HelpIcon section="notas" />
        </div>
        <p className="text-gray-400 text-sm mt-1">Solo tú puedes ver tus notas</p>
      </motion.div>

      <AnimatePresence>
      {!editando &&
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
        exit={{ opacity: 0, y: -8 }}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
      >
        <Button onClick={() => setEditando({ titulo: "", contenido: "" })} className="bg-[#4B1924] hover:bg-[#3a1019] text-white rounded-xl mb-6 w-full">
          <Plus className="w-4 h-4 mr-2" /> Nueva nota
        </Button>
      </motion.div>
      }
      </AnimatePresence>

      <AnimatePresence>
        {editando &&
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
            <Input
            placeholder="Título de la nota"
            className="rounded-xl border-gray-200 mb-3 font-semibold"
            value={editando.titulo}
            onChange={(e) => setEditando((v) => ({ ...v, titulo: e.target.value }))}
            autoFocus />

            <Textarea
            placeholder="Escribe aquí..."
            className="rounded-xl border-gray-200 resize-none mb-3"
            rows={6}
            value={editando.contenido}
            onChange={(e) => setEditando((v) => ({ ...v, contenido: e.target.value }))} />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditando(null)} className="rounded-xl">
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={!editando.titulo?.trim()} className="bg-[#4B1924] hover:bg-[#3a1019] text-white rounded-xl">
                <Save className="w-4 h-4 mr-1" /> Guardar
              </Button>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {notas.length === 0 ?
      <motion.div
        variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1, transition: { duration: 0.35 } } }}
        className="text-center py-16"
      >
          <motion.p animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="text-5xl mb-3">📝</motion.p>
          <p className="text-gray-300 text-sm">Aún no tienes notas</p>
        </motion.div> :

      <div className="space-y-3">
          <AnimatePresence>
          {notas.map((nota, i) =>
        <motion.div
          key={nota.id}
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.28, delay: i * 0.04 }}
          whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(99,0,39,0.09)" }}
          whileTap={{ scale: 0.99 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer"
          onClick={() => setEditando({ id: nota.id, titulo: nota.titulo, contenido: nota.contenido || "" })}
        >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{nota.titulo}</p>
                  {nota.contenido && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{nota.contenido}</p>}
                </div>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {e.stopPropagation();handleEliminar(nota.id);}}
                  className="text-gray-200 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
        )}
          </AnimatePresence>
        </div>
      }
    </motion.div>);

}