import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, Loader2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIAS_DEFAULT = [
  { value: "metal", label: "Metal" },
  { value: "madera", label: "Madera" },
  { value: "tornilleria", label: "Tornillería" },
  { value: "silicona_espuma", label: "Silicona y Espuma" },
  { value: "otros", label: "Otros" },
];

// itemEditar: si se pasa, el dialog funciona en modo edición
export default function NuevoItemDialog({ open, onClose, onCreado, categorias, itemEditar }) {
  const cats = categorias || CATEGORIAS_DEFAULT;
  const modoEdicion = !!itemEditar;

  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(categorias?.[0]?.value || "metal");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(0);
  const [proveedor, setProveedor] = useState("");
  const [proveedorTelefono, setProveedorTelefono] = useState("");
  const [ultimoMantenimiento, setUltimoMantenimiento] = useState("");
  const [frecuenciaRevision, setFrecuenciaRevision] = useState(0);
  const [miniaturaFile, setMiniaturaFile] = useState(null);
  const [imagenes, setImagenes] = useState([]); // array de {file, preview} o {url} para las ya subidas
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const miniaturaRef = useRef(null);

  // Inicializar con datos del item al abrir en modo edición
  useEffect(() => {
    if (open && itemEditar) {
      setNombre(itemEditar.nombre || "");
      setCategoria(itemEditar.categoria || cats[0]?.value || "metal");
      setDescripcion(itemEditar.descripcion || "");
      setCantidad(itemEditar.cantidad || 0);
      setStockMinimo(itemEditar.stock_minimo || 0);
      setProveedor(itemEditar.proveedor || "");
      setProveedorTelefono(itemEditar.proveedor_telefono || "");
      setUltimoMantenimiento(itemEditar.ultimo_mantenimiento ? itemEditar.ultimo_mantenimiento.split("T")[0] : "");
      setFrecuenciaRevision(itemEditar.frecuencia_revision || 0);
      setMiniaturaFile(null);
      // Cargar imágenes existentes como URLs (sin file)
      const urlsExistentes = itemEditar.imagen_urls?.length > 0
        ? itemEditar.imagen_urls
        : (itemEditar.imagen_url ? [itemEditar.imagen_url] : []);
      setImagenes(urlsExistentes.map(url => ({ url, preview: url })));
    } else if (open && !itemEditar) {
      setNombre(""); setCategoria(cats[0]?.value || "metal"); setDescripcion("");
      setCantidad(0); setStockMinimo(0); setProveedor(""); setProveedorTelefono("");
      setUltimoMantenimiento(""); setFrecuenciaRevision(0);
      setMiniaturaFile(null); setImagenes([]);
    }
  }, [open, itemEditar]);

  if (!open) return null;

  const handleAddImagenes = (e) => {
    const files = Array.from(e.target.files);
    const nuevas = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setImagenes(prev => [...prev, ...nuevas]);
    e.target.value = "";
  };

  const handleRemoveImagen = (idx) => {
    setImagenes(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);

    let miniatura_url = itemEditar?.miniatura_url || "";
    if (miniaturaFile) {
      const res = await base44.integrations.Core.UploadFile({ file: miniaturaFile });
      miniatura_url = res.file_url;
    }

    // Separar imágenes ya subidas (tienen .url) de las nuevas (tienen .file)
    const urlsExistentes = imagenes.filter(i => i.url && !i.file).map(i => i.url);
    const nuevasImagenes = imagenes.filter(i => i.file);

    let imagen_urls_nuevas = [];
    if (nuevasImagenes.length > 0) {
      setSubiendoImg(true);
      imagen_urls_nuevas = await Promise.all(nuevasImagenes.map(img =>
        base44.integrations.Core.UploadFile({ file: img.file }).then(r => r.file_url)
      ));
      setSubiendoImg(false);
    }

    const imagen_urls = [...urlsExistentes, ...imagen_urls_nuevas];
    const imagen_url = imagen_urls[0] || "";
    if (!miniatura_url && imagen_url) miniatura_url = imagen_url;

    const datos = {
      nombre: nombre.trim(), categoria, descripcion, miniatura_url, imagen_url, imagen_urls,
      cantidad, stock_minimo: stockMinimo,
      proveedor: proveedor.trim(), proveedor_telefono: proveedorTelefono.trim(),
      ultimo_mantenimiento: ultimoMantenimiento || null,
      frecuencia_revision: frecuenciaRevision || 0,
    };

    if (modoEdicion) {
      await base44.entities.ItemAlmacen.update(itemEditar.id, datos);
    } else {
      await base44.entities.ItemAlmacen.create(datos);
    }

    setGuardando(false);
    onCreado?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 pb-10 space-y-4 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-[#4B1924] text-lg">{modoEdicion ? "Editar artículo" : "Nuevo artículo"}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nombre *</Label>
          <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Tornillos M6" className="rounded-xl border-gray-200" />
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Categoría</Label>
          <select
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4B1924]/20 bg-white"
          >
            {cats.map(c => (
              <option key={c.value} value={c.value}>
                {c.emoji ? `${c.emoji} ` : ""}{c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Descripción</Label>
          <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Opcional" className="rounded-xl border-gray-200" />
        </div>

        {/* Cantidad con +/- */}
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Cantidad inicial</Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCantidad(c => Math.max(0, c - 1))}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <input
              type="number"
              min="0"
              className="w-16 text-center font-bold text-gray-800 border border-gray-200 rounded-xl h-9 focus:outline-none focus:ring-2 focus:ring-[#4B1924]/20"
              value={cantidad}
              onChange={e => setCantidad(Math.max(0, parseInt(e.target.value) || 0))}
            />
            <button
              type="button"
              onClick={() => setCantidad(c => c + 1)}
              className="w-9 h-9 rounded-xl bg-[#4B1924]/10 hover:bg-[#4B1924]/20 flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4 text-[#4B1924]" />
            </button>
          </div>
        </div>

        {/* Proveedor */}
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Proveedor</Label>
          <Input value={proveedor} onChange={e => setProveedor(e.target.value)} placeholder="Ej: Ferretería García" className="rounded-xl border-gray-200" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Teléfono proveedor <span className="text-gray-300 font-normal normal-case">(con prefijo, ej: 34612345678)</span></Label>
          <Input value={proveedorTelefono} onChange={e => setProveedorTelefono(e.target.value)} placeholder="34612345678" className="rounded-xl border-gray-200" />
        </div>

        {/* Mantenimiento */}
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">🔧 Mantenimiento (opcional)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Último mantenimiento</Label>
              <Input
                type="date"
                value={ultimoMantenimiento}
                onChange={e => setUltimoMantenimiento(e.target.value)}
                className="rounded-xl border-gray-200"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Frecuencia revisión <span className="text-gray-300 font-normal normal-case">(días)</span></Label>
              <input
                type="number"
                min="0"
                placeholder="0 = sin revisión"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-center font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4B1924]/20"
                value={frecuenciaRevision || ""}
                onChange={e => setFrecuenciaRevision(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
          </div>
        </div>

        {/* Stock mínimo */}
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Stock mínimo <span className="text-gray-300 font-normal normal-case">(alerta si baja de este número)</span></Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStockMinimo(c => Math.max(0, c - 1))}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <input
              type="number"
              min="0"
              className="w-16 text-center font-bold text-gray-800 border border-gray-200 rounded-xl h-9 focus:outline-none focus:ring-2 focus:ring-[#4B1924]/20"
              value={stockMinimo}
              onChange={e => setStockMinimo(Math.max(0, parseInt(e.target.value) || 0))}
            />
            <button
              type="button"
              onClick={() => setStockMinimo(c => c + 1)}
              className="w-9 h-9 rounded-xl bg-amber-50 hover:bg-amber-100 flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4 text-amber-600" />
            </button>
          </div>
        </div>

        {/* Miniatura */}
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Miniatura (opcional)</Label>
          <div
            onClick={() => miniaturaRef.current?.click()}
            className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-[#4B1924]/30 transition-colors"
          >
            <Upload className="w-4 h-4 text-gray-300" />
            <span className="text-xs text-gray-400">{miniaturaFile ? miniaturaFile.name.substring(0, 25) + (miniaturaFile.name.length > 25 ? "…" : "") : "Subir miniatura"}</span>
          </div>
          <input ref={miniaturaRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) setMiniaturaFile(e.target.files[0]); }} />
        </div>

        {/* Múltiples imágenes */}
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Imágenes del artículo</Label>
          {imagenes.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {imagenes.map((img, idx) => (
                <div key={idx} className="relative">
                  <img src={img.preview} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImagen(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                  {idx === 0 && <span className="absolute bottom-0 left-0 text-xs bg-[#4B1924] text-white px-1 rounded-bl-xl rounded-tr-xl">Principal</span>}
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-[#4B1924]/30 transition-colors">
            <Upload className="w-4 h-4 text-gray-300" />
            <span className="text-xs text-gray-400">Añadir imágenes (múltiples)</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddImagenes} />
          </label>
        </div>

        <Button
          onClick={handleGuardar}
          disabled={!nombre.trim() || guardando}
          className="w-full bg-[#4B1924] hover:bg-[#3a1019] text-white rounded-xl"
        >
          {guardando ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{subiendoImg ? "Subiendo imágenes…" : "Guardando…"}</> : modoEdicion ? "Guardar cambios" : "Añadir artículo"}
        </Button>
      </div>
    </div>
  );
}