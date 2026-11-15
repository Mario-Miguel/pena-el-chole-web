import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { useAuth } from "../components/auth/AuthContext";
import { Plus, FileText, Trash2, ExternalLink, Search } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const TIPOS = {
  contrato: { label: "Contrato", emoji: "📋", color: "bg-blue-100 text-blue-700" },
  permiso: { label: "Permiso", emoji: "🔑", color: "bg-yellow-100 text-yellow-700" },
  acta: { label: "Acta", emoji: "📝", color: "bg-purple-100 text-purple-700" },
  presupuesto: { label: "Presupuesto", emoji: "💰", color: "bg-green-100 text-green-700" },
  seguro: { label: "Seguro", emoji: "🛡️", color: "bg-red-100 text-red-700" },
  otros: { label: "Otros", emoji: "📄", color: "bg-gray-100 text-gray-700" },
};

export default function GestionDocumental() {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente" || sesion?.cargo === "secretario";
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [form, setForm] = useState({ nombre: "", tipo: "otros", descripcion: "", responsable: "", fecha: new Date().toISOString().split("T")[0], url: "" });

  const cargar = async () => {
    const data = await api.entities.Documento.list("-fecha");
    setDocumentos(data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendo(true);
    const { file_url } = await api.uploadFile({ file });
    setForm(f => ({ ...f, url: file_url }));
    setSubiendo(false);
  };

  const guardar = async () => {
    if (!form.nombre) return;
    await api.entities.Documento.create(form);
    setForm({ nombre: "", tipo: "otros", descripcion: "", responsable: "", fecha: new Date().toISOString().split("T")[0], url: "" });
    setShowForm(false);
    cargar();
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este documento?")) return;
    await api.entities.Documento.delete(id);
    cargar();
  };

  const filtrados = documentos.filter(d => {
    const busq = busqueda.toLowerCase();
    const matchBusq = !busqueda || d.nombre?.toLowerCase().includes(busq) || d.descripcion?.toLowerCase().includes(busq) || d.responsable?.toLowerCase().includes(busq);
    const matchTipo = !filtroTipo || d.tipo === filtroTipo;
    return matchBusq && matchTipo;
  });

  const agrupados = Object.keys(TIPOS).map(tipo => ({
    tipo,
    docs: filtrados.filter(d => d.tipo === tipo),
  })).filter(g => g.docs.length > 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-[#630027] text-3xl font-black">Documentación</h1>
          <HelpIcon />
        </div>
        {puedeEditar && (
          <Button onClick={() => setShowForm(v => !v)} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Añadir
          </Button>
        )}
      </div>

      {/* Búsqueda y filtro */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar documento..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm" />
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <option value="">Todos los tipos</option>
          {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nombre del documento" value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                className="col-span-2 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              <input type="text" placeholder="Responsable" value={form.responsable}
                onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                className="col-span-2 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              <textarea placeholder="Descripción (opcional)" value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                className="col-span-2 rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none" rows={2} />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-200 rounded-xl px-3 py-2 text-center text-sm text-gray-400 hover:border-[#630027]/30 transition-colors">
                  {subiendo ? "Subiendo..." : form.url ? "✅ Archivo subido" : "📎 Adjuntar archivo"}
                </div>
                <input type="file" className="hidden" onChange={handleFile} disabled={subiendo} />
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={guardar} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Guardar</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="rounded-xl">Cancelar</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documentos agrupados */}
      {agrupados.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-400 text-sm">
          <FileText className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p>No hay documentos registrados</p>
        </div>
      )}

      <div className="space-y-6">
        {agrupados.map(({ tipo, docs }) => {
          const tipoInfo = TIPOS[tipo];
          return (
            <div key={tipo}>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>{tipoInfo.emoji}</span> {tipoInfo.label}s
              </h2>
              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-start gap-3 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{doc.nombre}</p>
                      {doc.descripcion && <p className="text-xs text-gray-500 mt-0.5">{doc.descripcion}</p>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {doc.responsable && <span>👤 {doc.responsable}</span>}
                        {doc.fecha && <span>📅 {doc.fecha}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noreferrer"
                          className="text-[#630027] hover:text-[#4a001d] transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {puedeEditar && (
                        <button onClick={() => eliminar(doc.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}