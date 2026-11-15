import React from "react";
import { api } from "@/api/client";
import { AlertTriangle, ShoppingCart } from "lucide-react";

export default function StockBajoPanel({ items, onAbrirDetalle, onCrearCompra }) {
  const bajoStock = items.filter(
    i => typeof i.stock_minimo === "number" && i.stock_minimo > 0 && (i.cantidad ?? 0) <= i.stock_minimo
  );

  const crearSugerenciaCompra = async (e, item) => {
    e.stopPropagation();
    // Verificar si ya existe un pedido pendiente para este artículo
    const pedidosExistentes = await api.entities.ItemCompra.filter({ nombre: item.nombre });
    const yaTiene = pedidosExistentes.some(p => !p.comprado);
    if (!yaTiene) {
      await api.entities.ItemCompra.create({
        nombre: item.nombre,
        descripcion: `Reposición automática por stock bajo (${item.cantidad ?? 0}/${item.stock_minimo} uds)`,
        thumbnail_url: item.miniatura_url || item.imagen_urls?.[0] || item.imagen_url || "",
        cantidad: Math.max(1, item.stock_minimo),
        precio: 0,
        tienda_sugerida: item.proveedor || "",
        comprado: false,
        pagado: false,
      });
    }
    onCrearCompra?.(item);
  };

  if (bajoStock.length === 0) return null;

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <h2 className="font-bold text-amber-700 text-sm">Stock bajo — {bajoStock.length} artículo{bajoStock.length !== 1 ? "s" : ""}</h2>
      </div>
      <div className="space-y-2">
        {bajoStock.map(item => {
          const imagenDisplay = item.miniatura_url || item.imagen_urls?.[0] || item.imagen_url || null;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-amber-100 cursor-pointer hover:bg-amber-50/50 transition-colors"
              onClick={() => onAbrirDetalle?.(item)}
            >
              {imagenDisplay ? (
                <img src={imagenDisplay} alt={item.nombre} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{item.nombre}</p>
                <p className="text-xs text-amber-600">
                  {item.cantidad ?? 0} / {item.stock_minimo} unidades mínimas
                </p>
              </div>
              <button
                onClick={(e) => crearSugerenciaCompra(e, item)}
                title="Añadir a pedidos"
                className="p-1.5 rounded-lg text-amber-400 hover:text-[#630027] hover:bg-[#630027]/5 transition-colors flex-shrink-0"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}