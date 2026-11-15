import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function ItemCompraCard({ item, onClick }) {
  const precioTotal = (item.precio || 0) * (item.cantidad || 1);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex gap-3 cursor-pointer hover:border-[#630027]/20 hover:shadow-md transition-all"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-800 text-sm truncate">{item.nombre}</p>
          <div className="flex flex-col items-end flex-shrink-0">
            {item.pagado && (
              <>
                <span className="text-green-600 font-bold text-xs">Pagado</span>
                {item.fecha_pagado && <span className="text-gray-300 text-[10px]">{format(new Date(item.fecha_pagado), "d MMM yy", { locale: es })}</span>}
              </>
            )}
            {item.comprado && !item.pagado && (
              <>
                <span className="text-red-500 font-bold text-xs">Comprado</span>
                {item.fecha_comprado && <span className="text-gray-300 text-[10px]">{format(new Date(item.fecha_comprado), "d MMM yy", { locale: es })}</span>}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.cantidad > 1 && <span className="text-xs text-gray-400">x{item.cantidad}</span>}
          {item.precio > 0 && <span className="text-xs font-semibold text-[#630027]">{precioTotal.toFixed(2)}€</span>}
          {item.comprador_nombre && <span className="text-xs text-gray-400 truncate">· {item.comprador_nombre}</span>}
        </div>
        {item.tienda_sugerida && <p className="text-xs text-gray-300 mt-0.5 truncate">📍 {item.tienda_sugerida}</p>}
      </div>
    </div>
  );
}