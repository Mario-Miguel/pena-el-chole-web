import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/api/client";
import { Upload, Trash2, X, Plus, Minus } from "lucide-react";

export default function ItemCompraDialog({ open, onOpenChange, item, integrantes, onSave, onDelete, isNew, puedePagar }) {
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [usandoOtro, setUsandoOtro] = useState(false);
  const fileRef = useRef(null);
  const fotoProductoRef = useRef(null);
  const fotoTicketRef = useRef(null);

  useEffect(() => {
    if (item) {
      setForm({ ...item });
      const esIntegrante = integrantes.some(i => i.nombre === item.comprador_nombre);
      setUsandoOtro(!!item.comprador_nombre && !esIntegrante);
    } else {
      setForm({ nombre: "", precio: 0, cantidad: 0, comprador_nombre: "", descripcion: "", tienda_sugerida: "", fotos: [], fotos_ticket: [], comprado: false, pagado: false });
      setUsandoOtro(false);
    }
  }, [item, open]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleThumbnail = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await api.uploadFile({ file });
    set("thumbnail_url", file_url);
    setUploading(false);
    e.target.value = "";
  };

  const handleFotoProducto = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await api.uploadFile({ file });
      setForm(f => ({ ...f, fotos: [...(f.fotos || []), file_url] }));
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleFotoTicket = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await api.uploadFile({ file });
      setForm(f => ({ ...f, fotos_ticket: [...(f.fotos_ticket || []), file_url] }));
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeFoto = (url) => setForm(f => ({ ...f, fotos: f.fotos.filter(u => u !== url) }));
  const removeFotoTicket = (url) => setForm(f => ({ ...f, fotos_ticket: f.fotos_ticket.filter(u => u !== url) }));

  const handleCompradoChange = (checked) => {
    set("comprado", checked);
    if (checked) set("fecha_comprado", new Date().toISOString());
    else { set("fecha_comprado", null); set("pagado", false); set("fecha_pagado", null); }
  };

  const handlePagadoChange = (checked) => {
    set("pagado", checked);
    if (checked) set("fecha_pagado", new Date().toISOString());
    else set("fecha_pagado", null);
  };

  const handleCompradorChange = (val) => {
    if (val === "__otro__") { setUsandoOtro(true); set("comprador_nombre", ""); }
    else { setUsandoOtro(false); set("comprador_nombre", val); }
  };

  const handleSave = async () => {
    if (!form.nombre?.trim()) return;
    
    // Si es "Otro" y está comprado → crear deuda externa
    if (usandoOtro && form.comprador_nombre?.trim() && form.comprado) {
      const importe = (form.precio || 0) * (form.cantidad || 1);
      if (importe > 0) {
        await api.entities.DeudaProveedor.create({
          proveedor: form.comprador_nombre.trim(),
          concepto: form.nombre,
          importe,
          pagado: !!form.pagado,
        });
      }
    }
    
    onSave(form);
  };

  const FotoSection = ({ label, fotos, onAdd, onRemove, inputRef, inputHandler }) => (
    <div>
      <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {(fotos || []).map((url, i) => (
          <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button onClick={() => onRemove(url)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}
        <button onClick={() => inputRef.current?.click()} className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 hover:border-[#4B1924]/30 flex items-center justify-center text-gray-300 hover:text-[#4B1924]/40 transition-colors">
          <Upload className="w-4 h-4" />
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={inputHandler} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#4B1924]">{isNew ? "Nuevo producto" : "Editar producto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-1">
          {/* Thumbnail + nombre */}
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden cursor-pointer border-2 border-dashed border-gray-200 hover:border-[#4B1924]/30 transition-colors flex items-center justify-center"
              onClick={() => fileRef.current?.click()}
            >
              {form.thumbnail_url ? (
                <img src={form.thumbnail_url} alt="miniatura" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🛒</span>
              )}
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700">Nombre *</Label>
              <Input className="mt-1 rounded-xl border-gray-200" placeholder="¿Qué hay que comprar?" value={form.nombre || ""} onChange={e => set("nombre", e.target.value)} autoFocus={isNew} />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Precio (€)</Label>
              <Input type="number" step="0.01" className="mt-1 rounded-xl border-gray-200" value={form.precio || ""} onChange={e => set("precio", parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Cantidad</Label>
              <div className="flex items-center gap-1 mt-1">
                <button type="button" onClick={() => set("cantidad", Math.max(0, (form.cantidad || 0) - 1))} className="w-8 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#4B1924]/30 hover:text-[#4B1924] transition-colors">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input type="number" min="0" value={form.cantidad ?? 0} onChange={e => set("cantidad", parseInt(e.target.value) || 0)} className="w-16 text-center border border-gray-200 rounded-xl h-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B1924]/20" />
                <button type="button" onClick={() => set("cantidad", (form.cantidad || 0) + 1)} className="w-8 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#4B1924]/30 hover:text-[#4B1924] transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Quién lo compra</Label>
            <Select value={usandoOtro ? "__otro__" : (form.comprador_nombre || "")} onValueChange={handleCompradorChange}>
              <SelectTrigger className="mt-1 rounded-xl border-gray-200 text-sm">
                <SelectValue placeholder="Seleccionar persona" />
              </SelectTrigger>
              <SelectContent>
                {[...integrantes].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).map(i => <SelectItem key={i.id} value={i.nombre}>{i.nombre}</SelectItem>)}
                <SelectItem value="__otro__">— Otro —</SelectItem>
              </SelectContent>
            </Select>
            {usandoOtro && (
              <Input className="mt-2 rounded-xl border-gray-200 text-sm" placeholder="Nombre del comprador" value={form.comprador_nombre || ""} onChange={e => set("comprador_nombre", e.target.value)} />
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Descripción</Label>
            <Textarea className="mt-1 rounded-xl border-gray-200 resize-none" rows={2} placeholder="Detalles del producto..." value={form.descripcion || ""} onChange={e => set("descripcion", e.target.value)} />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Tienda sugerida</Label>
            <Input className="mt-1 rounded-xl border-gray-200" placeholder="Ej: Leroy Merlin, Mercadona..." value={form.tienda_sugerida || ""} onChange={e => set("tienda_sugerida", e.target.value)} />
          </div>

          {/* Fotos en dos secciones */}
          <div className="space-y-4 border-t border-gray-100 pt-3">
            <FotoSection
              label="Foto producto"
              fotos={form.fotos}
              onRemove={removeFoto}
              inputRef={fotoProductoRef}
              inputHandler={handleFotoProducto}
            />
            <FotoSection
              label="Foto ticket"
              fotos={form.fotos_ticket}
              onRemove={removeFotoTicket}
              inputRef={fotoTicketRef}
              inputHandler={handleFotoTicket}
            />
            {uploading && <p className="text-xs text-gray-400 animate-pulse">Subiendo...</p>}
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2">
              <Checkbox id="comprado" checked={!!form.comprado} onCheckedChange={handleCompradoChange} />
              <Label htmlFor="comprado" className="text-sm text-gray-700 cursor-pointer">Comprado</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="pagado"
                checked={!!form.pagado}
                onCheckedChange={handlePagadoChange}
                disabled={!form.comprado || !puedePagar}
              />
              <Label htmlFor="pagado" className={`text-sm cursor-pointer ${form.comprado && puedePagar ? "text-gray-700" : "text-gray-300"}`}>
                Pagado {!puedePagar && <span className="text-xs text-gray-300">(restringido)</span>}
              </Label>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={!form.nombre?.trim()} className="flex-1 bg-[#4B1924] hover:bg-[#3a1019] text-white rounded-xl">
              {isNew ? "Añadir" : "Guardar"}
            </Button>
            {!isNew && (
              <Button variant="outline" size="icon" onClick={onDelete} className="rounded-xl border-red-200 text-red-400 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}