import React, { useState, useRef } from "react";
import { Plus, Trash2, X, Settings2, GripVertical, Loader2, Upload, Sparkles, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function GestorCategoriasAlmacen({ categorias, onCambiadas }) {
  const [open, setOpen] = useState(false);
  const [nueva, setNueva] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [generandoIA, setGenerandoIA] = useState(false);
  const [iconoUrl, setIconoUrl] = useState(null);
  const [iconoPreview, setIconoPreview] = useState(null);
  // Edición inline
  const [editando, setEditando] = useState(null); // { value, label, emoji, icono_url, iconoPreview }
  const [subiendoEdit, setSubiendoEdit] = useState(false);
  const [generandoIAEdit, setGenerandoIAEdit] = useState(false);
  const fileRef = useRef();
  const fileEditRef = useRef();

  const guardar = async (lista) => {
    setGuardando(true);
    const configs = await base44.entities.AppConfig.filter({ clave: "almacen_categorias" });
    const valor = JSON.stringify(lista);
    if (configs.length > 0) {
      await base44.entities.AppConfig.update(configs[0].id, { valor });
    } else {
      await base44.entities.AppConfig.create({ clave: "almacen_categorias", valor });
    }
    setGuardando(false);
    onCambiadas(lista);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIconoPreview(URL.createObjectURL(file));
    setSubiendo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setIconoUrl(file_url);
    setSubiendo(false);
  };

  const handleGenerarIconoIA = async () => {
    if (!nueva.trim()) return;
    setGenerandoIA(true);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `Simple flat icon for a warehouse category called "${nueva.trim()}". Minimalist, colorful, clean design on white background, suitable as a small category icon.`,
      });
      setIconoPreview(url);
      setIconoUrl(url);
    } finally {
      setGenerandoIA(false);
    }
  };

  const handleAnadir = async () => {
    const trimmed = nueva.trim();
    if (!trimmed) return;
    const valor = trimmed.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (categorias.find(c => c.value === valor)) return;

    let emoji = "📦";
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Elige UN SOLO emoji que represente mejor la categoría de almacén llamada "${trimmed}". Responde ÚNICAMENTE con el emoji, sin texto adicional.`,
        response_json_schema: { type: "object", properties: { emoji: { type: "string" } } },
      });
      if (res?.emoji) emoji = res.emoji;
    } catch {}

    const nuevaLista = [...categorias, { value: valor, label: trimmed, emoji, icono_url: iconoUrl || null }];
    await guardar(nuevaLista);
    setNueva("");
    setIconoUrl(null);
    setIconoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleEliminar = async (value) => {
    const nuevaLista = categorias.filter(c => c.value !== value);
    await guardar(nuevaLista);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordenadas = Array.from(categorias);
    const [moved] = reordenadas.splice(result.source.index, 1);
    reordenadas.splice(result.destination.index, 0, moved);
    guardar(reordenadas);
  };

  // Edición inline
  const abrirEdicion = (c) => {
    setEditando({ ...c, iconoPreview: c.icono_url || null });
  };

  const handleEditFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditando(prev => ({ ...prev, iconoPreview: URL.createObjectURL(file) }));
    setSubiendoEdit(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setEditando(prev => ({ ...prev, icono_url: file_url, iconoPreview: file_url, emoji: null }));
    setSubiendoEdit(false);
    e.target.value = "";
  };

  const handleGenerarIAEdit = async () => {
    if (!editando?.label?.trim()) return;
    setGenerandoIAEdit(true);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `Simple flat icon for a warehouse category called "${editando.label.trim()}". Minimalist, colorful, clean design on white background, suitable as a small category icon.`,
      });
      setEditando(prev => ({ ...prev, icono_url: url, iconoPreview: url, emoji: null }));
    } finally {
      setGenerandoIAEdit(false);
    }
  };

  const handleGuardarEdicion = async () => {
    if (!editando?.label?.trim()) return;
    const nuevaLista = categorias.map(c =>
      c.value === editando.value
        ? { ...c, label: editando.label.trim(), emoji: editando.emoji, icono_url: editando.icono_url || null }
        : c
    );
    await guardar(nuevaLista);
    setEditando(null);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Gestionar categorías"
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-[#630027]/5 hover:border-[#630027]/30 transition-colors shadow-sm"
      >
        <Settings2 className="w-4 h-4 text-gray-500" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-[#4B1924] text-lg">Gestionar categorías</h3>
          <button onClick={() => { setOpen(false); setEditando(null); }} className="p-1.5 rounded-xl hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <p className="text-xs text-gray-400 -mt-2">Arrastra para reordenar · Pulsa ✏️ para editar</p>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categorias">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {categorias.map((c, index) => (
                  <Draggable key={c.value} draggableId={c.value} index={index}>
                    {(prov, snapshot) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        className={`rounded-xl transition-colors ${snapshot.isDragging ? "bg-[#630027]/5 shadow-lg" : "bg-gray-50"}`}
                      >
                        {/* Fila principal */}
                        <div className="flex items-center gap-2 px-3 py-2">
                          <div {...prov.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          {c.icono_url
                            ? <img src={c.icono_url} alt="" className="w-5 h-5 object-contain rounded flex-shrink-0" />
                            : c.emoji
                              ? <span className="text-base leading-none flex-shrink-0">{c.emoji}</span>
                              : <span className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400 flex-shrink-0">?</span>
                          }
                          <span className="text-sm text-gray-700 font-medium flex-1 truncate">{c.label}</span>
                          <button
                            onClick={() => editando?.value === c.value ? setEditando(null) : abrirEdicion(c)}
                            className="p-1 rounded-lg text-gray-300 hover:text-[#630027] hover:bg-[#630027]/5 transition-colors flex-shrink-0"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminar(c.value)}
                            disabled={guardando}
                            className="p-1 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Panel de edición inline */}
                        {editando?.value === c.value && (
                          <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
                            {/* Preview icono */}
                            {editando.iconoPreview && (
                              <div className="flex items-center gap-2">
                                <img src={editando.iconoPreview} alt="" className="w-10 h-10 rounded-xl object-contain border border-gray-200 bg-white" />
                                <button
                                  onClick={() => setEditando(prev => ({ ...prev, icono_url: null, iconoPreview: null, emoji: c.emoji }))}
                                  className="text-xs text-red-400 hover:text-red-600 underline"
                                >Quitar icono</button>
                              </div>
                            )}
                            <Input
                              value={editando.label}
                              onChange={e => setEditando(prev => ({ ...prev, label: e.target.value }))}
                              placeholder="Nombre..."
                              className="rounded-xl border-gray-200 h-8 text-sm"
                              disabled={guardando || subiendoEdit}
                            />
                            <div className="flex gap-2">
                              <label className="flex-1 flex items-center gap-1.5 border border-dashed border-gray-200 rounded-xl px-2 py-1.5 cursor-pointer hover:border-[#630027]/40 hover:bg-[#630027]/5 transition-colors">
                                {subiendoEdit
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                                  : <Upload className="w-3.5 h-3.5 text-gray-400" />
                                }
                                <span className="text-xs text-gray-500">{subiendoEdit ? "Subiendo..." : "Subir icono"}</span>
                                <input ref={fileEditRef} type="file" accept="image/*" className="hidden" onChange={handleEditFileChange} disabled={subiendoEdit || generandoIAEdit} />
                              </label>
                              <button
                                onClick={handleGenerarIAEdit}
                                disabled={!editando.label.trim() || generandoIAEdit || subiendoEdit}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#630027]/30 bg-[#630027]/5 text-[#630027] hover:bg-[#630027]/10 transition-colors disabled:opacity-40 text-xs font-semibold flex-shrink-0"
                              >
                                {generandoIAEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                IA
                              </button>
                              <button
                                onClick={handleGuardarEdicion}
                                disabled={!editando.label.trim() || guardando || subiendoEdit || generandoIAEdit}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#630027] text-white hover:bg-[#4a001d] transition-colors disabled:opacity-40 text-xs font-semibold flex-shrink-0"
                              >
                                {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Guardar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Formulario nueva categoría */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nueva categoría</p>
          <Input
            value={nueva}
            onChange={e => setNueva(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !guardando && !subiendo && handleAnadir()}
            placeholder="Nombre..."
            className="rounded-xl border-gray-200"
            disabled={guardando || subiendo}
          />

          {iconoPreview && (
            <div className="flex items-center gap-3">
              <img src={iconoPreview} alt="" className="w-12 h-12 rounded-xl object-contain border border-gray-200 bg-gray-50" />
              <button onClick={() => { setIconoUrl(null); setIconoPreview(null); if (fileRef.current) fileRef.current.value = ""; }} className="text-xs text-red-400 hover:text-red-600 underline">Quitar icono</button>
            </div>
          )}

          <div className="flex gap-2">
            <label className="flex-1 flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:border-[#630027]/40 hover:bg-[#630027]/5 transition-colors">
              <div className="flex-shrink-0">
                {subiendo
                  ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  : <Upload className="w-4 h-4 text-gray-400" />
                }
              </div>
              <span className="text-xs text-gray-500">{subiendo ? "Subiendo..." : "Subir icono"}</span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={subiendo || generandoIA} />
            </label>

            <button
              type="button"
              onClick={handleGenerarIconoIA}
              disabled={!nueva.trim() || generandoIA || subiendo}
              title="Generar icono con IA"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-[#630027]/30 bg-[#630027]/5 text-[#630027] hover:bg-[#630027]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex-shrink-0"
            >
              {generandoIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generandoIA ? "Generando..." : "IA"}
            </button>
          </div>

          <Button
            onClick={handleAnadir}
            disabled={!nueva.trim() || guardando || subiendo}
            className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Añadir categoría</>}
          </Button>
        </div>

        <p className="text-xs text-gray-400">Los artículos existentes en categorías eliminadas no se borran.</p>
      </div>
    </div>
  );
}