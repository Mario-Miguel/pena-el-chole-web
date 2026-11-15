import React, { useState, useEffect } from "react";
import { X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { notificarNuevaActividad } from "../../lib/notificaciones";
import { AnimatePresence, motion } from "framer-motion";

const EMPTY = {
  titulo: "", descripcion: "", categoria: "otro", fecha: "", lugar: "",
  aforo_maximo: 0, precio: 0, imagen_url: "", estado: "programada",
};

function localToISO(local) {
  if (!local) return "";
  return new Date(local).toISOString();
}
function isoToLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ActividadDialog({ open, onClose, actividad, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(actividad ? { ...EMPTY, ...actividad, fecha: isoToLocal(actividad.fecha) } : EMPTY);
  }, [open, actividad]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("imagen_url", file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.fecha) return;
    setSaving(true);
    const data = { ...form, fecha: localToISO(form.fecha), aforo_maximo: Number(form.aforo_maximo) || 0, precio: Number(form.precio) || 0 };
    if (actividad?.id) await base44.entities.Actividad.update(actividad.id, data);
    else {
      await base44.entities.Actividad.create({ ...data, inscritos_ids: [], notificacion_enviada: true });
      notificarNuevaActividad(form.titulo, data.fecha, form.lugar);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h2 className="font-bold text-gray-800">{actividad ? "Editar actividad" : "Nueva actividad"}</h2>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Título *</label>
              <Input value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Nombre de la actividad" className="rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Categoría</label>
                <Select value={form.categoria} onValueChange={v => set("categoria", v)}>
                  <SelectTrigger className="rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excursion">🥾 Excursión</SelectItem>
                    <SelectItem value="comida">🍽️ Comida</SelectItem>
                    <SelectItem value="deporte">⚽ Deporte</SelectItem>
                    <SelectItem value="cultural">🎭 Cultural</SelectItem>
                    <SelectItem value="reunion_social">🥂 Reunión social</SelectItem>
                    <SelectItem value="otro">📌 Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Estado</label>
                <Select value={form.estado} onValueChange={v => set("estado", v)}>
                  <SelectTrigger className="rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programada">Programada</SelectItem>
                    <SelectItem value="en_curso">En curso</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Fecha y hora *</label>
              <Input type="datetime-local" value={form.fecha} onChange={e => set("fecha", e.target.value)} className="rounded-xl" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Lugar</label>
              <Input value={form.lugar} onChange={e => set("lugar", e.target.value)} placeholder="¿Dónde se celebra?" className="rounded-xl" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Descripción</label>
              <Textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Describe la actividad..." className="rounded-xl resize-none" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Aforo máximo (0=sin límite)</label>
                <Input type="number" min="0" value={form.aforo_maximo} onChange={e => set("aforo_maximo", e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Precio (€, 0=gratis)</label>
                <Input type="number" min="0" step="0.5" value={form.precio} onChange={e => set("precio", e.target.value)} className="rounded-xl" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Imagen de portada</label>
              {form.imagen_url && (
                <div className="relative mb-2 rounded-xl overflow-hidden h-32">
                  <img src={form.imagen_url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => set("imagen_url", "")} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 rounded-xl px-4 py-3 hover:border-[#630027]/40 transition-colors">
                <ImageIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">{uploading ? "Subiendo..." : "Subir imagen"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImagen} disabled={uploading} />
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={handleSave} disabled={!form.titulo.trim() || !form.fecha || saving} className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
                {saving ? "Guardando..." : actividad ? "Guardar cambios" : "Crear actividad"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}