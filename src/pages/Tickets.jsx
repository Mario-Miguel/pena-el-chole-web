import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Plus, Receipt, Upload, X, Search, ChevronDown, ChevronRight,
  ShoppingCart, Image, Trash2, User, PackagePlus, Store,
  FolderOpen, Folder, FolderPlus, Pencil, ArrowLeft, ZoomIn, Tag,
  CheckCircle2, Clock, SlidersHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/components/auth/AuthContext";
import DeudasPanel from "@/components/tickets/DeudasPanel";

const TIPO_LABELS = { ticket: "Ticket", factura: "Factura", albaran: "Albarán", otro: "Otro" };
const TIPO_COLORS = {
  ticket: "bg-blue-50 text-blue-700",
  factura: "bg-purple-50 text-purple-700",
  albaran: "bg-orange-50 text-orange-700",
  otro: "bg-gray-50 text-gray-600",
};

const PROV_CATS = [
  { key: "supermercado", label: "Supermercado" },
  { key: "ferreteria", label: "Ferretería" },
  { key: "bodega", label: "Bodega" },
  { key: "material_obra", label: "Material obra" },
  { key: "imprenta", label: "Imprenta" },
  { key: "hosteleria", label: "Hostelería" },
  { key: "servicio", label: "Servicio" },
  { key: "otro", label: "Otro" },
];

const EMPTY_ITEM = { nombre: "", precio: "", cantidad: 1, iva: 21, precio_incluye_iva: false, descuento: 0 };
const EMPTY_FORM = {
  nombre: "", tipo: "ticket", proveedor: "", fecha: "", importe: "",
  integrante_id: "", integrante_nombre: "", carpeta: "",
  items: [], fotos: [], notas: "",
  pagado: false, fecha_pago: ""
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) => (parseFloat(v) || 0).toFixed(2);

// ─── Cálculo por línea ────────────────────────────────────────────────────────
function calcItem(it) {
  const cantidad   = parseFloat(it.cantidad) || 1;
  const ivaVal     = parseFloat(it.iva);
  const iva        = isNaN(ivaVal) ? 21 : ivaVal;
  const descuento  = parseFloat(it.descuento) || 0;
  const precioRaw  = parseFloat(it.precio) || 0;
  const incluyeIva = !!it.precio_incluye_iva;

  const baseUnit        = incluyeIva ? precioRaw / (1 + iva / 100) : precioRaw;
  const baseUnitConDesc = baseUnit * (1 - descuento / 100);
  const ivaUnit         = baseUnitConDesc * (iva / 100);
  const totalUnit       = baseUnitConDesc + ivaUnit;
  const baseLinea       = baseUnitConDesc * cantidad;
  const ivaLinea        = ivaUnit * cantidad;
  const totalLinea      = totalUnit * cantidad;

  return { baseUnit: baseUnitConDesc, ivaUnit, totalUnit, baseLinea, ivaLinea, totalLinea };
}

// ─── Carpetas (localStorage) ──────────────────────────────────────────────────
const LS_CARPETAS = "tickets_carpetas_v1";
const getCarpetas = () => { try { return JSON.parse(localStorage.getItem(LS_CARPETAS)) || []; } catch { return []; } };
const saveCarpetas = (arr) => localStorage.setItem(LS_CARPETAS, JSON.stringify(arr));

// ─── Modal edición / creación ─────────────────────────────────────────────────
function TicketModal({ ticket, integrantes, carpetas, proveedores = [], onCrearProveedor, puedeGestionar, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(ticket?.id ? { ...EMPTY_FORM, ...ticket } : { ...EMPTY_FORM });
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nuevoProv, setNuevoProv] = useState(false);
  const [nuevoProvNombre, setNuevoProvNombre] = useState("");
  const fileRef = useRef();

  const itemsBase  = (form.items || []).reduce((s, i) => s + calcItem(i).baseLinea, 0);
  const itemsIva   = (form.items || []).reduce((s, i) => s + calcItem(i).ivaLinea, 0);
  const itemsTotal = itemsBase + itemsIva;
  const hasItems   = (form.items || []).length > 0;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) { const { file_url } = await base44.integrations.Core.UploadFile({ file }); urls.push(file_url); }
    setForm(f => ({ ...f, fotos: [...(f.fotos || []), ...urls] }));
    setUploading(false);
  };

  const removePhoto = (idx) => setForm(f => ({ ...f, fotos: f.fotos.filter((_, i) => i !== idx) }));
  const addItem = () => setForm(f => ({ ...f, items: [...(f.items || []), { ...EMPTY_ITEM }] }));
  const updateItem = (idx, k, v) => setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, [k]: v } : it) }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const handleSocio = (id) => {
    const s = integrantes.find(i => i.id === id);
    setForm(f => ({ ...f, integrante_id: id, integrante_nombre: s?.nombre || "" }));
  };

  const handleAddProv = () => {
    const nombre = nuevoProvNombre.trim();
    if (!nombre) return;
    set("proveedor", nombre);
    onCrearProveedor?.(nombre);
    setNuevoProv(false);
    setNuevoProvNombre("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const importe = hasItems ? itemsTotal : (parseFloat(form.importe) || 0);
    const fecha_pago = form.pagado ? (form.fecha_pago || new Date().toISOString().split("T")[0]) : "";
    const cleanItems = form.items.map(it => ({
      nombre: it.nombre || "",
      precio: parseFloat(it.precio) || 0,
      cantidad: parseFloat(it.cantidad) || 1,
      iva: isNaN(parseFloat(it.iva)) ? 21 : parseFloat(it.iva),
      descuento: parseFloat(it.descuento) || 0,
      precio_incluye_iva: !!it.precio_incluye_iva,
    }));
    await onSave({ ...form, importe, items: cleanItems, pagado: !!form.pagado, fecha_pago });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col" style={{ maxHeight: "92dvh" }} onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">{ticket?.id ? "Editar ticket" : "Nuevo ticket"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="ticket-form" onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Nombre */}
            <div>
              <label className="text-xs text-gray-500 font-medium">Nombre / descripción *</label>
              <input className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.nombre} onChange={e => set("nombre", e.target.value)} required />
            </div>

            {/* Carpeta */}
            <div>
              <label className="text-xs text-gray-500 font-medium flex items-center gap-1"><Folder size={11} />Carpeta / año</label>
              <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.carpeta || ""} onChange={e => set("carpeta", e.target.value)}>
                <option value="">— Sin carpeta —</option>
                {carpetas.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Tipo + fecha */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Tipo</label>
                <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                  {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Fecha</label>
                <input type="date" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
              </div>
            </div>

            {/* Proveedor + socio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Proveedor / tienda</label>
                {nuevoProv ? (
                  <div className="flex gap-1 mt-1">
                    <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Nombre del proveedor" value={nuevoProvNombre} onChange={e => setNuevoProvNombre(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddProv())} />
                    <button type="button" onClick={handleAddProv} className="bg-[#630027] text-white px-3 rounded-lg text-sm font-medium">Añadir</button>
                    <button type="button" onClick={() => { setNuevoProv(false); setNuevoProvNombre(""); set("proveedor", ""); }} className="p-2 border border-gray-200 rounded-lg text-gray-400"><X size={16} /></button>
                  </div>
                ) : (
                  <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.proveedor} onChange={e => {
                    if (e.target.value === "__nuevo__") { setNuevoProv(true); set("proveedor", ""); }
                    else set("proveedor", e.target.value);
                  }}>
                    <option value="">— Sin proveedor —</option>
                    {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                    <option value="__nuevo__">➕ Nuevo proveedor…</option>
                  </select>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium flex items-center gap-1"><User size={11} />Socio comprador</label>
                <select className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.integrante_id} onChange={e => handleSocio(e.target.value)}>
                  <option value="">— Sin asignar —</option>
                  {integrantes.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                </select>
              </div>
            </div>

            {/* Líneas de productos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500 font-medium flex items-center gap-1"><PackagePlus size={11} />Productos (opcional)</label>
                <button type="button" onClick={addItem} className="text-xs text-[#630027] font-medium hover:underline flex items-center gap-0.5"><Plus size={12} />Añadir línea</button>
              </div>
              {hasItems && (
                <div className="space-y-3 mb-2">
                  {form.items.map((it, idx) => {
                    const c = calcItem(it);
                    return (
                      <div key={idx} className="bg-gray-50 rounded-xl p-2.5 space-y-2">
                        {/* Nombre + eliminar */}
                        <div className="flex gap-1 items-center">
                          <input className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white" placeholder="Nombre del producto" value={it.nombre} onChange={e => updateItem(idx, "nombre", e.target.value)} />
                          <button type="button" onClick={() => removeItem(idx)} className="p-1 text-gray-300 hover:text-red-400 flex-shrink-0"><X size={14} /></button>
                        </div>

                        {/* Toggle precio con/sin IVA */}
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" className="w-3.5 h-3.5 accent-[#630027]" checked={!!it.precio_incluye_iva} onChange={e => updateItem(idx, "precio_incluye_iva", e.target.checked)} />
                            <span className="text-[10px] text-gray-500">Precio ya incluye IVA</span>
                          </label>
                        </div>

                        {/* Precio / cantidad / IVA / descuento */}
                        <div className="grid grid-cols-4 gap-1.5">
                          <div className="col-span-2">
                            <p className="text-[9px] text-gray-400 mb-0.5 text-center">{it.precio_incluye_iva ? "Precio c/IVA (€)" : "Precio s/IVA (€)"}</p>
                            <input type="number" min="0" step="0.01" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-full text-right bg-white" placeholder="0.00" value={it.precio} onChange={e => updateItem(idx, "precio", e.target.value)} />
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 mb-0.5 text-center">Cant.</p>
                            <input type="number" min="1" step="1" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-full text-right bg-white" placeholder="1" value={it.cantidad} onChange={e => updateItem(idx, "cantidad", e.target.value)} />
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 mb-0.5 text-center">IVA %</p>
                            <input type="number" min="0" max="100" step="1" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-full text-right bg-white" placeholder="21" value={it.iva === "" || it.iva === undefined || it.iva === null ? "" : it.iva} onChange={e => updateItem(idx, "iva", e.target.value)} />
                          </div>
                        </div>

                        {/* Descuento */}
                        <div className="flex items-center gap-2">
                          <Tag size={10} className="text-gray-400 flex-shrink-0" />
                          <span className="text-[10px] text-gray-400">Descuento:</span>
                          <input type="number" min="0" max="100" step="0.1" className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs text-right bg-white" placeholder="0" value={it.descuento || ""} onChange={e => updateItem(idx, "descuento", e.target.value)} />
                          <span className="text-[10px] text-gray-400">%</span>
                        </div>

                        {/* Resumen línea */}
                        {parseFloat(it.precio) > 0 && (
                          <div className="grid grid-cols-3 gap-1.5 border-t border-gray-200 pt-1.5">
                            <div className="text-center">
                              <p className="text-[9px] text-gray-400">Base/u</p>
                              <p className="text-[10px] font-semibold text-gray-600">{fmt(c.baseUnit)}€</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] text-gray-400">IVA/u</p>
                              <p className="text-[10px] font-semibold text-amber-600">{fmt(c.ivaUnit)}€</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] text-gray-400">Total línea</p>
                              <p className="text-[10px] font-bold text-[#630027]">{fmt(c.totalLinea)}€</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Resumen total */}
                  <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-1 text-xs">
                    <div className="flex justify-between text-gray-500"><span>Base imponible</span><span>{fmt(itemsBase)}€</span></div>
                    <div className="flex justify-between text-amber-600"><span>Total IVA</span><span>{fmt(itemsIva)}€</span></div>
                    <div className="flex justify-between text-[#630027] font-bold border-t border-gray-100 pt-1 text-sm"><span>TOTAL</span><span>{fmt(itemsTotal)}€</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Importe manual (sin items) */}
            {!hasItems && (
              <div>
                <label className="text-xs text-gray-500 font-medium">Importe total (€)</label>
                <input type="number" step="0.01" min="0" className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.importe} onChange={e => set("importe", e.target.value)} />
              </div>
            )}

            {/* Estado de pago (solo cargos/admins) */}
            {puedeGestionar && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[#630027]" checked={!!form.pagado} onChange={e => set("pagado", e.target.checked)} />
                  <span className="text-sm font-medium text-gray-700">Ticket pagado</span>
                </label>
                {form.pagado && (
                  <input type="date" className="ml-auto border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white" value={form.fecha_pago || ""} onChange={e => set("fecha_pago", e.target.value)} />
                )}
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="text-xs text-gray-500 font-medium">Notas</label>
              <textarea className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2} value={form.notas} onChange={e => set("notas", e.target.value)} />
            </div>

            {/* Fotos */}
            <div>
              <label className="text-xs text-gray-500 font-medium">Fotos del ticket</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(form.fotos || []).map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X size={12} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#630027]/40 hover:text-[#630027] transition-colors">
                  {uploading ? <div className="w-5 h-5 border-2 border-[#630027]/30 border-t-[#630027] rounded-full animate-spin" /> : <><Upload size={18} /><span className="text-[10px] mt-1">Añadir</span></>}
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
            </div>
          </form>
        </div>

        {/* Footer siempre visible */}
        <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 flex gap-2 bg-white">
          {ticket?.id && (
            confirmDelete
              ? <button type="button" onClick={() => onDelete(ticket.id)} className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-semibold">¿Confirmar borrado?</button>
              : <button type="button" onClick={() => setConfirmDelete(true)} className="p-3 border border-red-200 text-red-400 rounded-xl hover:bg-red-50 flex-shrink-0"><Trash2 size={18} /></button>
          )}
          <button type="submit" form="ticket-form" disabled={saving}
            className="flex-1 bg-[#630027] text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {ticket?.id ? "Guardar cambios" : "Crear ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vista detalle (solo lectura + fotos lightbox) ────────────────────────────
function TicketDetalle({ ticket, onClose, onEdit, puedeGestionar, onTogglePagado }) {
  const [lightbox, setLightbox] = useState(null);
  const fotos = ticket.fotos || [];
  const items = ticket.items || [];
  const totalBase = items.reduce((s, i) => s + calcItem(i).baseLinea, 0);
  const totalIva  = items.reduce((s, i) => s + calcItem(i).ivaLinea, 0);
  const totalCalc = items.length > 0 ? totalBase + totalIva : parseFloat(ticket.importe) || 0;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      {lightbox !== null && (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center" onClick={() => setLightbox(null)}>
          <img src={fotos[lightbox]} alt="" className="max-w-full max-h-full object-contain" />
          <button className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2" onClick={() => setLightbox(null)}><X size={22} /></button>
          {lightbox > 0 && <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2" onClick={e => { e.stopPropagation(); setLightbox(l => l - 1); }}>‹</button>}
          {lightbox < fotos.length - 1 && <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2" onClick={e => { e.stopPropagation(); setLightbox(l => l + 1); }}>›</button>}
        </div>
      )}
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col" style={{ maxHeight: "92dvh" }} onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 flex-shrink-0"><ArrowLeft size={20} /></button>
            <h2 className="font-bold text-gray-800 truncate">{ticket.nombre}</h2>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {puedeGestionar && (
              <button onClick={() => onTogglePagado(ticket)} className={`p-2 rounded-xl border border-gray-200 hover:bg-gray-50 ${ticket.pagado ? "text-green-500" : "text-gray-400 hover:text-green-500"}`} title={ticket.pagado ? "Marcar pendiente" : "Marcar pagado"}>
                {ticket.pagado ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              </button>
            )}
            <button onClick={onEdit} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"><Pencil size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${TIPO_COLORS[ticket.tipo] || TIPO_COLORS.otro}`}>{TIPO_LABELS[ticket.tipo] || ticket.tipo}</span>
            {ticket.carpeta && <span className="text-xs font-medium px-2 py-1 rounded-lg bg-amber-50 text-amber-700 flex items-center gap-1"><Folder size={11} />{ticket.carpeta}</span>}
            {ticket.pagado
              ? <span className="text-xs font-medium px-2 py-1 rounded-lg bg-green-50 text-green-600 flex items-center gap-1"><CheckCircle2 size={11} />Pagado{ticket.fecha_pago ? ` · ${format(new Date(ticket.fecha_pago), "d MMM yy", { locale: es })}` : ""}</span>
              : <span className="text-xs font-medium px-2 py-1 rounded-lg bg-red-50 text-red-500 flex items-center gap-1"><Clock size={11} />Pendiente de pago</span>}
          </div>

          {/* Datos principales */}
          <div className="grid grid-cols-2 gap-3">
            {ticket.fecha && <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-400 mb-0.5">Fecha</p><p className="text-sm font-semibold text-gray-800">{format(new Date(ticket.fecha), "d MMM yyyy", { locale: es })}</p></div>}
            {totalCalc > 0 && <div className="bg-[#630027]/5 rounded-xl p-3"><p className="text-[10px] text-gray-400 mb-0.5">Importe total</p><p className="text-sm font-bold text-[#630027]">{fmt(totalCalc)}€</p></div>}
            {ticket.proveedor && <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-400 mb-0.5">Proveedor</p><p className="text-sm font-semibold text-gray-800">{ticket.proveedor}</p></div>}
            {ticket.integrante_nombre && <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-400 mb-0.5">Comprador</p><p className="text-sm font-semibold text-gray-800 flex items-center gap-1"><User size={12} />{ticket.integrante_nombre}</p></div>}
          </div>

          {/* Productos */}
          {items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Productos</p>
              <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                {items.map((it, idx) => {
                  const c = calcItem(it);
                  return (
                    <div key={idx} className="flex justify-between items-start p-3">
                      <div>
                        <p className="text-sm text-gray-800">{it.nombre || "Producto"}</p>
                        <p className="text-[10px] text-gray-400">
                          {parseFloat(it.cantidad) || 1}u × {fmt(it.precio)}€
                          {it.precio_incluye_iva ? " (c/IVA)" : " (s/IVA)"}
                          {parseFloat(it.iva) > 0 ? ` + ${it.iva}% IVA` : ""}
                          {parseFloat(it.descuento) > 0 ? ` · ${it.descuento}% dto` : ""}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[#630027] flex-shrink-0 ml-2">{fmt(c.totalLinea)}€</p>
                    </div>
                  );
                })}
                <div className="p-3 space-y-1 text-xs bg-gray-50 rounded-b-xl">
                  <div className="flex justify-between text-gray-500"><span>Base imponible</span><span>{fmt(totalBase)}€</span></div>
                  <div className="flex justify-between text-amber-600"><span>Total IVA</span><span>{fmt(totalIva)}€</span></div>
                  <div className="flex justify-between text-[#630027] font-bold pt-1 border-t border-gray-200"><span>TOTAL</span><span>{fmt(totalCalc)}€</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          {ticket.notas && <div className="bg-gray-50 rounded-xl p-3"><p className="text-[10px] text-gray-400 mb-1">Notas</p><p className="text-sm text-gray-700">{ticket.notas}</p></div>}

          {/* Fotos con lightbox */}
          {fotos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Fotos ({fotos.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((url, idx) => (
                  <button key={idx} onClick={() => setLightbox(idx)} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta ticket ───────────────────────────────────────────────────────────
function TicketCard({ ticket, onVerDetalle, onEdit, puedeGestionar, onTogglePagado }) {
  const items = ticket.items || [];
  const importeCalculado = items.length > 0
    ? items.reduce((s, i) => s + calcItem(i).totalLinea, 0)
    : parseFloat(ticket.importe) || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex gap-3 hover:border-[#630027]/20 hover:shadow-md transition-all">
      <button className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden" onClick={onVerDetalle}>
        {(ticket.fotos || [])[0]
          ? <img src={ticket.fotos[0]} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Receipt size={22} className="text-gray-300" /></div>}
      </button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onVerDetalle}>
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-gray-800 text-sm truncate">{ticket.nombre}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {importeCalculado > 0 && <span className="text-sm font-bold text-[#630027]">{fmt(importeCalculado)}€</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${TIPO_COLORS[ticket.tipo] || TIPO_COLORS.otro}`}>{TIPO_LABELS[ticket.tipo] || ticket.tipo}</span>
          {ticket.pagado
            ? <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-600 flex items-center gap-0.5"><CheckCircle2 size={10} />Pagado</span>
            : <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-500 flex items-center gap-0.5"><Clock size={10} />Pendiente</span>}
          {ticket.proveedor && <span className="text-xs text-gray-400 truncate">· {ticket.proveedor}</span>}
          {ticket.fecha && <span className="text-xs text-gray-300">· {format(new Date(ticket.fecha), "d MMM yy", { locale: es })}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {ticket.integrante_nombre && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><User size={10} />{ticket.integrante_nombre}</span>}
          {(ticket.items || []).length > 0 && <span className="text-[10px] text-gray-300">{ticket.items.length} prod.</span>}
          {(ticket.fotos || []).length > 0 && <span className="text-[10px] text-gray-300 flex items-center gap-0.5"><Image size={10} />{ticket.fotos.length}</span>}
          {ticket.carpeta && <span className="text-[10px] text-amber-600 flex items-center gap-0.5"><Folder size={10} />{ticket.carpeta}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0 mt-0.5">
        {puedeGestionar && (
          <button onClick={() => onTogglePagado(ticket)} className={`p-2 rounded-xl hover:bg-gray-100 ${ticket.pagado ? "text-green-500" : "text-gray-300 hover:text-green-500"}`} title={ticket.pagado ? "Marcar pendiente" : "Marcar pagado"}>
            {ticket.pagado ? <CheckCircle2 size={15} /> : <Clock size={15} />}
          </button>
        )}
        <button onClick={onEdit} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-[#630027]">
          <Pencil size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Tarjeta compra con ticket ────────────────────────────────────────────────
function CompraTicketCard({ item, onClick }) {
  const fotos = item.fotos_ticket || [];
  const total = (item.precio || 0) * (item.cantidad || 1);
  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex gap-3 cursor-pointer hover:border-[#630027]/20 hover:shadow-md transition-all">
      <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden">
        {fotos[0] ? <img src={fotos[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingCart size={22} className="text-gray-300" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-800 text-sm truncate">{item.nombre}</p>
          {total > 0 && <span className="text-sm font-bold text-[#630027] flex-shrink-0">{total.toFixed(2)}€</span>}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-700">Compra</span>
          {item.tienda_sugerida && <span className="text-xs text-gray-400 truncate">· {item.tienda_sugerida}</span>}
          {item.fecha_comprado && <span className="text-xs text-gray-300">· {format(new Date(item.fecha_comprado), "d MMM yy", { locale: es })}</span>}
        </div>
        <span className="text-[10px] text-gray-300">{fotos.length} foto{fotos.length !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

// ─── Modal fotos compra ───────────────────────────────────────────────────────
function CompraTicketModal({ item, onClose }) {
  const [fotos, setFotos] = useState(item.fotos_ticket || []);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();
  const qc = useQueryClient();
  const updateMut = useMutation({
    mutationFn: (data) => base44.entities.ItemCompra.update(item.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras_con_ticket"] }),
  });
  const handleFile = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) { const { file_url } = await base44.integrations.Core.UploadFile({ file }); urls.push(file_url); }
    const next = [...fotos, ...urls];
    setFotos(next); updateMut.mutate({ fotos_ticket: next });
    setUploading(false);
  };
  const removePhoto = (idx) => { const next = fotos.filter((_, i) => i !== idx); setFotos(next); updateMut.mutate({ fotos_ticket: next }); };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      {lightbox !== null && (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center" onClick={() => setLightbox(null)}>
          <img src={fotos[lightbox]} alt="" className="max-w-full max-h-full object-contain" />
          <button className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"><X size={22} /></button>
        </div>
      )}
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div><h2 className="font-bold text-gray-800 truncate">{item.nombre}</h2><p className="text-xs text-gray-400">Fotos de ticket de esta compra</p></div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {fotos.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img src={url} alt="" className="w-full h-full object-cover cursor-pointer" onClick={() => setLightbox(idx)} />
                <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X size={12} /></button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#630027]/40 hover:text-[#630027] transition-colors">
              {uploading ? <div className="w-5 h-5 border-2 border-[#630027]/30 border-t-[#630027] rounded-full animate-spin" /> : <><Upload size={18} /><span className="text-[10px] mt-1">Añadir</span></>}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
          {fotos.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin fotos. Añade una pulsando el botón.</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Tickets() {
  const qc = useQueryClient();
  const { sesion } = useAuth();
  const puedeGestionar = sesion?.esAdmin || !!sesion?.cargo;
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterPagado, setFilterPagado] = useState("todos");
  const [filterProveedor, setFilterProveedor] = useState("todos");
  const [filterSocio, setFilterSocio] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);
  const [detalleTicket, setDetalleTicket] = useState(null);
  const [editTicket, setEditTicket]       = useState(null);
  const [showNew, setShowNew]             = useState(false);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [showCompras, setShowCompras]     = useState(true);
  const [carpetaActiva, setCarpetaActiva] = useState(null);
  const [carpetas, setCarpetas]           = useState(getCarpetas);
  const [nuevaCarpeta, setNuevaCarpeta]   = useState("");
  const [showNuevaCarpeta, setShowNuevaCarpeta] = useState(false);
  const [showGestProv, setShowGestProv] = useState(false);
  const [nuevoProvPage, setNuevoProvPage] = useState("");
  const [nuevaProvCat, setNuevaProvCat] = useState("otro");

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.TicketFactura.list("-created_date"),
  });
  const { data: compras = [] } = useQuery({
    queryKey: ["compras_con_ticket"],
    queryFn: () => base44.entities.ItemCompra.list("-created_date"),
    select: (data) => data.filter(c => Array.isArray(c.fotos_ticket) && c.fotos_ticket.length > 0),
  });
  const { data: integrantes = [] } = useQuery({
    queryKey: ["integrantes_tickets"],
    queryFn: () => base44.entities.Integrante.list("nombre"),
  });
  const { data: proveedoresCatalogo = [] } = useQuery({
    queryKey: ["proveedores_catalogo"],
    queryFn: () => base44.entities.Proveedor.list("nombre"),
  });
  const crearProvMut = useMutation({
    mutationFn: (data) => base44.entities.Proveedor.create(typeof data === "string" ? { nombre: data } : data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proveedores_catalogo"] }),
  });
  const deleteProvMut = useMutation({
    mutationFn: (id) => base44.entities.Proveedor.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proveedores_catalogo"] }),
  });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.TicketFactura.create(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => base44.entities.TicketFactura.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.TicketFactura.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tickets"] }); setEditTicket(null); },
  });

  const handleSave = async (data) => {
    if (editTicket?.id) {
      await updateMut.mutateAsync({ id: editTicket.id, ...data });
    } else {
      await createMut.mutateAsync(data);
    }
    setEditTicket(null);
    setShowNew(false);
  };

  const addCarpeta = () => {
    const nombre = nuevaCarpeta.trim();
    if (!nombre || carpetas.includes(nombre)) return;
    const next = [...carpetas, nombre].sort((a, b) => b.localeCompare(a));
    setCarpetas(next); saveCarpetas(next);
    setNuevaCarpeta(""); setShowNuevaCarpeta(false);
  };

  const deleteCarpeta = (c) => {
    const next = carpetas.filter(x => x !== c);
    setCarpetas(next); saveCarpetas(next);
    if (carpetaActiva === c) setCarpetaActiva(null);
  };

  const q = search.toLowerCase();
  const proveedoresLista = [...new Set([
    ...proveedoresCatalogo.map(p => p.nombre),
    ...tickets.map(t => t.proveedor).filter(Boolean),
  ])].sort();

  const addProvPage = () => {
    const nombre = nuevoProvPage.trim();
    if (!nombre) return;
    crearProvMut.mutate({ nombre, categoria: nuevaProvCat });
    setNuevoProvPage("");
    setNuevaProvCat("otro");
  };
  const allTickets = tickets.filter(t =>
    !q || t.nombre?.toLowerCase().includes(q) ||
    t.proveedor?.toLowerCase().includes(q) ||
    t.integrante_nombre?.toLowerCase().includes(q)
  );
  const filteredTickets = allTickets.filter(t => {
    if (carpetaActiva && t.carpeta !== carpetaActiva) return false;
    if (filterTipo !== "todos" && t.tipo !== filterTipo) return false;
    if (filterPagado === "pagado" && !t.pagado) return false;
    if (filterPagado === "pendiente" && t.pagado) return false;
    if (filterProveedor !== "todos" && t.proveedor !== filterProveedor) return false;
    if (filterSocio !== "todos" && t.integrante_id !== filterSocio) return false;
    return true;
  });
  const filteredCompras = compras.filter(c =>
    !q || c.nombre?.toLowerCase().includes(q) || c.tienda_sugerida?.toLowerCase().includes(q)
  );
  const totalImporte = filteredTickets.reduce((s, t) => s + (t.importe || 0), 0);
  const totalPendiente = filteredTickets.filter(t => !t.pagado).reduce((s, t) => s + (t.importe || 0), 0);
  const totalPagado = filteredTickets.filter(t => t.pagado).reduce((s, t) => s + (t.importe || 0), 0);

  const togglePagado = async (ticket) => {
    const pagado = !ticket.pagado;
    const fecha_pago = pagado ? new Date().toISOString().split("T")[0] : "";
    await updateMut.mutateAsync({ id: ticket.id, pagado, fecha_pago });
    if (detalleTicket?.id === ticket.id) {
      setDetalleTicket({ ...detalleTicket, pagado, fecha_pago });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Receipt size={22} className="text-[#630027]" />Tickets y facturas</h1>
              {totalImporte > 0 && <p className="text-xs text-gray-400 mt-0.5">Total{carpetaActiva ? ` (${carpetaActiva})` : ""}: <span className="font-semibold text-[#630027]">{fmt(totalImporte)}€</span></p>}
            </div>
            <button onClick={() => { setEditTicket(null); setShowNew(true); }} className="flex items-center gap-1.5 bg-[#630027] text-white px-3 py-2 rounded-xl text-sm font-medium shadow-sm">
              <Plus size={16} />Añadir
            </button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm" placeholder="Buscar tickets..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => setShowFilters(v => !v)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${showFilters ? "bg-[#630027] text-white border-[#630027]" : "bg-white text-gray-600 border-gray-200 hover:border-[#630027]/30"}`}>
              <SlidersHorizontal size={15} /> Filtros
            </button>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className="mt-3 grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3">
              <div>
                <label className="text-[10px] text-gray-400 font-medium">Tipo</label>
                <select className="w-full mt-0.5 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
                  <option value="todos">Todos</option>
                  {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-medium">Estado de pago</label>
                <select className="w-full mt-0.5 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white" value={filterPagado} onChange={e => setFilterPagado(e.target.value)}>
                  <option value="todos">Todos</option>
                  <option value="pagado">Pagados</option>
                  <option value="pendiente">Pendientes</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-medium">Proveedor</label>
                <select className="w-full mt-0.5 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white" value={filterProveedor} onChange={e => setFilterProveedor(e.target.value)}>
                  <option value="todos">Todos</option>
                  {proveedoresLista.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-medium">Socio comprador</label>
                <select className="w-full mt-0.5 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white" value={filterSocio} onChange={e => setFilterSocio(e.target.value)}>
                  <option value="todos">Todos</option>
                  {integrantes.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Resumen pagado/pendiente */}
          {puedeGestionar && filteredTickets.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-red-50 rounded-xl px-3 py-2">
                <p className="text-[10px] text-gray-400">Pendiente de pago</p>
                <p className="text-base font-bold text-red-500">{fmt(totalPendiente)}€</p>
              </div>
              <div className="bg-green-50 rounded-xl px-3 py-2">
                <p className="text-[10px] text-gray-400">Pagado</p>
                <p className="text-base font-bold text-green-500">{fmt(totalPagado)}€</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Carpetas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"><FolderOpen size={14} />Carpetas</span>
            <button onClick={() => setShowNuevaCarpeta(v => !v)} className="text-xs text-[#630027] font-medium flex items-center gap-0.5 hover:underline"><FolderPlus size={13} />Nueva</button>
          </div>
          {showNuevaCarpeta && (
            <div className="flex gap-2 mb-2">
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Ej: 2025, Verano 2024…" value={nuevaCarpeta} onChange={e => setNuevaCarpeta(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCarpeta())} autoFocus />
              <button onClick={addCarpeta} className="bg-[#630027] text-white px-3 py-2 rounded-lg text-sm font-medium">Crear</button>
              <button onClick={() => setShowNuevaCarpeta(false)} className="p-2 border border-gray-200 rounded-lg text-gray-400"><X size={16} /></button>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCarpetaActiva(null)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${carpetaActiva === null ? "bg-[#630027] text-white border-[#630027]" : "bg-white text-gray-600 border-gray-200 hover:border-[#630027]/30"}`}>
              <Folder size={12} />Todas
            </button>
            {carpetas.map(c => (
              <div key={c} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${carpetaActiva === c ? "bg-[#630027] text-white border-[#630027]" : "bg-white text-gray-600 border-gray-200 hover:border-[#630027]/30"}`}>
                <button onClick={() => setCarpetaActiva(carpetaActiva === c ? null : c)} className="flex items-center gap-1">
                  <Folder size={12} />{c}
                  <span className={`ml-1 text-[10px] px-1 rounded-full ${carpetaActiva === c ? "bg-white/20" : "bg-gray-100"}`}>{tickets.filter(t => t.carpeta === c).length}</span>
                </button>
                <button onClick={() => deleteCarpeta(c)} className={`ml-0.5 opacity-50 hover:opacity-100 ${carpetaActiva === c ? "text-white" : "text-gray-400"}`}><X size={10} /></button>
              </div>
            ))}
            {carpetas.length === 0 && !showNuevaCarpeta && <p className="text-xs text-gray-400">Sin carpetas. Crea una para organizar por año.</p>}
          </div>
        </div>

        {/* Gestión de tiendas / proveedores */}
        {puedeGestionar && (
          <div>
            <button onClick={() => setShowGestProv(v => !v)} className="flex items-center gap-2 w-full mb-2">
              {showGestProv ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Store size={14} />Tiendas / Proveedores ({proveedoresCatalogo.length})</span>
            </button>
            {showGestProv && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex gap-1.5">
                  <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Nombre de la tienda o proveedor" value={nuevoProvPage} onChange={e => setNuevoProvPage(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addProvPage())} />
                  <select className="border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white" value={nuevaProvCat} onChange={e => setNuevaProvCat(e.target.value)}>
                    {PROV_CATS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  <button onClick={addProvPage} className="bg-[#630027] text-white px-3 py-2 rounded-lg text-sm font-medium">Añadir</button>
                </div>
                {proveedoresCatalogo.length === 0
                  ? <p className="text-xs text-gray-400">Sin proveedores. Añade uno para usarlo en los tickets.</p>
                  : (
                    <div className="space-y-1">
                      {proveedoresCatalogo.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{p.nombre}</p>
                            {p.categoria && p.categoria !== "otro" && <span className="text-[10px] text-gray-400">{PROV_CATS.find(c => c.key === p.categoria)?.label || p.categoria}</span>}
                          </div>
                          <button onClick={() => deleteProvMut.mutate(p.id)} className="p-1 text-gray-300 hover:text-red-400"><Trash2 size={15} /></button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Deudas con proveedores */}
        {puedeGestionar && (
          <DeudasPanel puedeGestionar={puedeGestionar} />
        )}

        {/* Compras con ticket */}
        {!carpetaActiva && filteredCompras.length > 0 && (
          <div>
            <button onClick={() => setShowCompras(v => !v)} className="flex items-center gap-2 w-full mb-2">
              {showCompras ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">De compras con foto de ticket ({filteredCompras.length})</span>
            </button>
            {showCompras && <div className="space-y-2">{filteredCompras.map(c => <CompraTicketCard key={c.id} item={c} onClick={() => setSelectedCompra(c)} />)}</div>}
          </div>
        )}

        {/* Lista tickets */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {carpetaActiva ? `📁 ${carpetaActiva}` : "Tickets y facturas"} ({filteredTickets.length})
          </p>
          <div className="space-y-2">
            {filteredTickets.length === 0
              ? <div className="text-center py-10 text-gray-400"><Receipt size={36} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Sin tickets{carpetaActiva ? ` en "${carpetaActiva}"` : ""}</p></div>
              : filteredTickets.map(t => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    puedeGestionar={puedeGestionar}
                    onTogglePagado={togglePagado}
                    onVerDetalle={() => setDetalleTicket(t)}
                    onEdit={() => setEditTicket(t)}
                  />
                ))
            }
          </div>
        </div>
      </div>

      {/* Vista detalle */}
      {detalleTicket && (
        <TicketDetalle
          ticket={detalleTicket}
          puedeGestionar={puedeGestionar}
          onTogglePagado={togglePagado}
          onClose={() => setDetalleTicket(null)}
          onEdit={() => { setEditTicket(detalleTicket); setDetalleTicket(null); }}
        />
      )}

      {/* Modal edición / creación */}
      {(showNew || editTicket) && (
        <TicketModal
          ticket={editTicket}
          integrantes={integrantes}
          carpetas={carpetas}
          proveedores={proveedoresCatalogo}
          onCrearProveedor={(nombre) => crearProvMut.mutate(nombre)}
          puedeGestionar={puedeGestionar}
          onClose={() => { setEditTicket(null); setShowNew(false); }}
          onSave={handleSave}
          onDelete={(id) => deleteMut.mutate(id)}
        />
      )}

      {selectedCompra && <CompraTicketModal item={selectedCompra} onClose={() => setSelectedCompra(null)} />}
    </div>
  );
}