import React, { useState } from "react";
import { X, ShoppingCart, Package, ChevronLeft, ChevronRight, Pencil, AlertTriangle, History, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import ItemCompraDialog from "../compra/ItemCompraDialog";
import NuevoItemDialog from "./NuevoItemDialog";
import HistorialMovimientos from "./HistorialMovimientos";
import WhatsAppStockAlerta from "./WhatsAppStockAlerta";
import QrGenerador from "./QrGenerador";
import { api } from "@/api/client";

export default function ItemAlmacenDetalle({ item, categorias, onClose, integrantes, puedePagar, onActualizado }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [compraDialogOpen, setCompraDialogOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const stockBajo = typeof item.stock_minimo === "number" && item.stock_minimo > 0 && (item.cantidad ?? 0) < item.stock_minimo;

  const todasImagenes = item.imagen_urls?.length > 0
    ? item.imagen_urls
    : (item.imagen_url ? [item.imagen_url] : []);

  const imagenDisplay = item.miniatura_url || todasImagenes[0] || null;

  const categoria = categorias?.find(c => c.value === item.categoria);

  const prevImg = () => setImgIdx(i => (i - 1 + todasImagenes.length) % todasImagenes.length);
  const nextImg = () => setImgIdx(i => (i + 1) % todasImagenes.length);

  const itemParaCompra = {
    nombre: item.nombre,
    descripcion: item.descripcion || "",
    thumbnail_url: item.miniatura_url || todasImagenes[0] || "",
    cantidad: Math.max(1, item.cantidad || 1),
    precio: 0,
    comprador_nombre: "",
    tienda_sugerida: "",
    fotos: todasImagenes,
    fotos_ticket: [],
    comprado: false,
    pagado: false,
  };

  const handleCrearCompra = async (form) => {
    await api.entities.ItemCompra.create({
      nombre: form.nombre,
      descripcion: form.descripcion,
      thumbnail_url: form.thumbnail_url,
      cantidad: form.cantidad,
      precio: form.precio,
      comprador_nombre: form.comprador_nombre,
      tienda_sugerida: form.tienda_sugerida,
      fotos: form.fotos || [],
      fotos_ticket: form.fotos_ticket || [],
      comprado: form.comprado || false,
      pagado: form.pagado || false,
    });
    setCompraDialogOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
        <div
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="font-black text-[#4B1924] text-lg leading-tight flex-1 pr-2">{item.nombre}</h3>
            <button onClick={() => setQrOpen(true)} className="p-1.5 rounded-xl hover:bg-gray-100 flex-shrink-0 mr-1" title="Ver/descargar QR">
              <QrCode className="w-4 h-4 text-gray-400" />
            </button>
            <button onClick={() => setEditarOpen(true)} className="p-1.5 rounded-xl hover:bg-gray-100 flex-shrink-0 mr-1" title="Editar artículo">
              <Pencil className="w-4 h-4 text-gray-400" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 flex-shrink-0">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Imagen */}
          {imagenDisplay ? (
            <div className="relative mx-5 rounded-2xl overflow-hidden bg-gray-50 mb-4" style={{ height: 200 }}>
              <img src={todasImagenes.length > 0 ? todasImagenes[imgIdx] : imagenDisplay} alt={item.nombre} className="w-full h-full object-cover" />
              {todasImagenes.length > 1 && (
                <>
                  <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/50 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/50 transition-colors">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {todasImagenes.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/40"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="mx-5 rounded-2xl bg-gray-50 flex items-center justify-center mb-4" style={{ height: 120 }}>
              <Package className="w-14 h-14 text-gray-200" />
            </div>
          )}

          {/* Detalles */}
          <div className="px-5 pb-5 space-y-4">
            {/* Categoría */}
            {categoria && (
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">
                  {categoria.icono_url
                    ? <img src={categoria.icono_url} alt="" className="w-5 h-5 object-contain rounded inline" />
                    : categoria.emoji || "📦"
                  }
                </span>
                <span className="text-sm text-gray-500">{categoria.label}</span>
              </div>
            )}

            {/* Cantidad */}
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${typeof item.stock_minimo === "number" && item.stock_minimo > 0 && (item.cantidad ?? 0) < item.stock_minimo ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}>
              <span className="text-sm text-gray-500 flex-1">Cantidad en almacén</span>
              {typeof item.stock_minimo === "number" && item.stock_minimo > 0 && (item.cantidad ?? 0) < item.stock_minimo && (
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              )}
              <span className={`font-bold text-lg ${typeof item.stock_minimo === "number" && item.stock_minimo > 0 && (item.cantidad ?? 0) < item.stock_minimo ? "text-amber-600" : "text-[#4B1924]"}`}>
                {item.cantidad ?? 0}
              </span>
              {typeof item.stock_minimo === "number" && item.stock_minimo > 0 && (
                <span className="text-xs text-gray-400">/ mín. {item.stock_minimo}</span>
              )}
            </div>

            {/* Descripción */}
            {item.descripcion && (
              <p className="text-sm text-gray-600 leading-relaxed">{item.descripcion}</p>
            )}

            {/* Proveedor */}
            {item.proveedor && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
                <span className="text-sm text-gray-500 flex-1">Proveedor</span>
                <span className="font-semibold text-gray-700 text-sm">{item.proveedor}</span>
              </div>
            )}

            {/* WhatsApp si stock bajo */}
            {stockBajo && (
              <WhatsAppStockAlerta item={item} />
            )}

            {/* Botón crear compra */}
            <Button
              onClick={() => setCompraDialogOpen(true)}
              className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Crear entrada en Compras
            </Button>

            {/* Historial de movimientos */}
            <button
              onClick={() => setShowHistorial(v => !v)}
              className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-[#630027] transition-colors py-1"
            >
              <History className="w-4 h-4" />
              {showHistorial ? "Ocultar historial" : "Ver historial de movimientos"}
            </button>
            {showHistorial && (
              <div className="bg-gray-50 rounded-xl p-3">
                <HistorialMovimientos itemId={item.id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Generador */}
      {qrOpen && <QrGenerador item={item} onClose={() => setQrOpen(false)} />}

      {/* Dialog de edición */}
      <NuevoItemDialog
        open={editarOpen}
        onClose={() => setEditarOpen(false)}
        onCreado={() => { setEditarOpen(false); onActualizado?.(); onClose(); }}
        categorias={categorias}
        itemEditar={item}
      />

      {/* Dialog de compra pre-rellenado */}
      <ItemCompraDialog
        open={compraDialogOpen}
        onOpenChange={setCompraDialogOpen}
        item={itemParaCompra}
        integrantes={integrantes || []}
        onSave={handleCrearCompra}
        isNew={true}
        puedePagar={puedePagar}
      />
    </>
  );
}