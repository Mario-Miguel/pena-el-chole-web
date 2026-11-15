import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDialog from "../ConfirmDialog";

const ESPECIES = [
  { value: "perro", label: "Perro", emoji: "🐕" },
  { value: "gato", label: "Gato", emoji: "🐱" },
  { value: "conejo", label: "Conejo", emoji: "🐇" },
  { value: "pajaro", label: "Pájaro", emoji: "🐦" },
  { value: "reptil", label: "Reptil", emoji: "🦎" },
  { value: "otro", label: "Otro", emoji: "🐾" },
];

const getEmoji = (especie) => ESPECIES.find(e => e.value === especie)?.emoji || "🐾";

function NuevaMascotaForm({ integrantes, onGuardado, onCancelar }) {
  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState("perro");
  const [raza, setRaza] = useState("");
  const [duenioId, setDuenioId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const fotoRef = useRef(null);

  const handleGuardar = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    let foto_url = "";
    if (fotoFile) {
      const res = await base44.integrations.Core.UploadFile({ file: fotoFile });
      foto_url = res.file_url;
    }
    const duenio = integrantes.find(i => i.id === duenioId);
    await base44.entities.Mascota.create({
      nombre: nombre.trim(),
      especie,
      raza: raza.trim(),
      duenio_id: duenioId || null,
      duenio_nombre: duenio?.nombre || "",
      descripcion: descripcion.trim(),
      foto_url,
    });
    setGuardando(false);
    onGuardado();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Nombre *</Label>
          <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Rocky" className="rounded-xl border-gray-200 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Especie</Label>
          <select
            value={especie}
            onChange={e => setEspecie(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4B1924]/20 bg-white"
          >
            {ESPECIES.map(e => <option key={e.value} value={e.value}>{e.emoji} {e.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Raza</Label>
          <Input value={raza} onChange={e => setRaza(e.target.value)} placeholder="Opcional" className="rounded-xl border-gray-200 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Dueño</Label>
          <select
            value={duenioId}
            onChange={e => setDuenioId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4B1924]/20 bg-white"
          >
            <option value="">Sin asignar</option>
            {integrantes.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
          </select>
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Descripción / Curiosidades</Label>
        <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Opcional" className="rounded-xl border-gray-200 text-sm" />
      </div>
      <div>
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Foto</Label>
        <div
          onClick={() => fotoRef.current?.click()}
          className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-2.5 cursor-pointer hover:border-[#4B1924]/30 transition-colors"
        >
          <Upload className="w-4 h-4 text-gray-300" />
          <span className="text-xs text-gray-400">{fotoFile ? fotoFile.name.substring(0, 24) : "Subir foto"}</span>
        </div>
        <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) setFotoFile(e.target.files[0]); }} />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" size="sm" onClick={onCancelar} className="rounded-xl text-xs h-8">Cancelar</Button>
        <Button size="sm" onClick={handleGuardar} disabled={!nombre.trim() || guardando} className="bg-[#4B1924] hover:bg-[#3a1019] text-white rounded-xl text-xs h-8">
          {guardando ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Guardando…</> : "Añadir mascota"}
        </Button>
      </div>
    </motion.div>
  );
}

export default function MascotasPanel({ integrantes, puedeGestionar }) {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const cargar = async () => {
    const data = await base44.entities.Mascota.list();
    setMascotas(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const handleDelete = async (id) => {
    await base44.entities.Mascota.delete(id);
    setConfirmDeleteId(null);
    cargar();
  };

  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-rose-500 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🐾</span>
          <h2 className="text-white font-bold text-lg">Patitas de la Peña</h2>
          <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">{mascotas.length}</span>
        </div>
        {puedeGestionar && (
          <Button
            size="icon"
            onClick={() => setShowForm(s => !s)}
            className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 text-white border-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="p-4 space-y-3">
        <AnimatePresence>
          {showForm && (
            <NuevaMascotaForm
              integrantes={integrantes}
              onGuardado={() => { cargar(); setShowForm(false); }}
              onCancelar={() => setShowForm(false)}
            />
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          </div>
        ) : mascotas.length === 0 ? (
          <p className="text-center text-gray-300 text-sm py-6">
            Aún no hay mascotas registradas. Pulsa <strong>+</strong> para añadir.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mascotas.map((m, idx) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 group"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-rose-100 flex items-center justify-center text-xl">
                  {m.foto_url
                    ? <img src={m.foto_url} alt={m.nombre} className="w-full h-full object-cover" />
                    : getEmoji(m.especie)
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{m.nombre}</p>
                  <p className="text-xs text-gray-500">
                    {ESPECIES.find(e => e.value === m.especie)?.label || m.especie}
                    {m.raza ? ` · ${m.raza}` : ""}
                  </p>
                  {m.duenio_nombre && (
                    <p className="text-xs text-rose-500 font-medium">Dueño: {m.duenio_nombre}</p>
                  )}
                  {m.descripcion && <p className="text-xs text-gray-400 truncate mt-0.5">{m.descripcion}</p>}
                </div>
                {puedeGestionar && (
                  <button
                    onClick={() => setConfirmDeleteId(m.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-200 hover:text-red-400 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        mensaje="¿Eliminar esta mascota? Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        onConfirm={() => handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}