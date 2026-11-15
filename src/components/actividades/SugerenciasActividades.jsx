import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ThumbsUp, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

export default function SugerenciasActividades({ sesion, puedeGestionar }) {
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);

  const load = async () => {
    const data = await base44.entities.SugerenciaActividad.list("-created_date");
    setSugerencias(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleEnviar = async () => {
    if (!form?.titulo?.trim()) return;
    await base44.entities.SugerenciaActividad.create({
      titulo: form.titulo,
      descripcion: form.descripcion || "",
      autor_id: sesion.integranteId,
      autor_nombre: sesion.nombre,
      votos_ids: [],
      estado: "pendiente",
    });
    setForm(null);
    load();
  };

  const handleVoto = async (s) => {
    const uid = sesion.integranteId;
    const votos = s.votos_ids || [];
    const nuevos = votos.includes(uid) ? votos.filter(v => v !== uid) : [...votos, uid];
    await base44.entities.SugerenciaActividad.update(s.id, { votos_ids: nuevos });
    load();
  };

  const handleEstado = async (s, estado) => {
    await base44.entities.SugerenciaActividad.update(s.id, { estado });
    load();
  };

  const handleEliminar = async (s) => {
    await base44.entities.SugerenciaActividad.delete(s.id);
    load();
  };

  const pendientes = sugerencias.filter(s => s.estado === "pendiente");
  const gestionadas = sugerencias.filter(s => s.estado !== "pendiente");

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>;

  return (
    <div>
      {/* Botón nueva sugerencia */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{pendientes.length} sugerencia{pendientes.length !== 1 ? "s" : ""} pendiente{pendientes.length !== 1 ? "s" : ""}</p>
        {!form && (
          <Button onClick={() => setForm({ titulo: "", descripcion: "" })} className="bg-[#630027] text-white rounded-xl text-sm h-9">
            <Plus className="w-4 h-4 mr-1" /> Sugerir actividad
          </Button>
        )}
      </div>

      {/* Formulario nueva sugerencia */}
      <AnimatePresence>
        {form && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 space-y-3"
          >
            <Input placeholder="Título de la actividad sugerida *" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className="rounded-xl" autoFocus />
            <Textarea placeholder="Descríbela brevemente (opcional)" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className="rounded-xl resize-none" rows={2} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setForm(null)} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleEnviar} disabled={!form.titulo.trim()} className="bg-[#630027] text-white rounded-xl">Enviar sugerencia</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista pendientes */}
      <div className="space-y-3 mb-6">
        {pendientes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">💡</p>
            <p className="text-gray-300 text-sm">No hay sugerencias pendientes</p>
            <p className="text-gray-200 text-xs mt-1">¡Sé el primero en sugerir una actividad!</p>
          </div>
        ) : (
          pendientes
            .sort((a, b) => (b.votos_ids?.length || 0) - (a.votos_ids?.length || 0))
            .map(s => {
              const votado = (s.votos_ids || []).includes(sesion.integranteId);
              const esMio = s.autor_id === sesion.integranteId;
              return (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3"
                >
                  {/* Votos */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleVoto(s)}
                      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${votado ? "bg-[#630027]/10 text-[#630027]" : "text-gray-300 hover:text-[#630027] hover:bg-[#630027]/5"}`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-xs font-bold">{s.votos_ids?.length || 0}</span>
                    </button>
                  </div>
                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{s.titulo}</p>
                    {s.descripcion && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{s.descripcion}</p>}
                    <p className="text-[10px] text-gray-300 mt-1">Sugerido por {s.autor_nombre}</p>
                  </div>
                  {/* Acciones gestión */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {puedeGestionar && (
                      <>
                        <button onClick={() => handleEstado(s, "aprobada")} title="Aprobar" className="p-1.5 rounded-lg text-gray-300 hover:text-green-500 hover:bg-green-50 transition-colors"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleEstado(s, "descartada")} title="Descartar" className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"><X className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                    {(puedeGestionar || esMio) && (
                      <button onClick={() => handleEliminar(s)} title="Eliminar" className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </motion.div>
              );
            })
        )}
      </div>

      {/* Gestionadas */}
      {gestionadas.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Gestionadas</p>
          <div className="space-y-2">
            {gestionadas.map(s => (
              <div key={s.id} className={`rounded-2xl border p-3 flex items-center gap-3 opacity-60 ${s.estado === "aprobada" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                <span className="text-lg">{s.estado === "aprobada" ? "✅" : "❌"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{s.titulo}</p>
                  <p className="text-[10px] text-gray-400">{s.estado === "aprobada" ? "Aprobada" : "Descartada"} · {s.autor_nombre}</p>
                </div>
                {puedeGestionar && (
                  <button onClick={() => handleEliminar(s)} className="text-gray-200 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}