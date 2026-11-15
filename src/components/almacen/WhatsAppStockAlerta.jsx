import React from "react";
import { MessageCircle } from "lucide-react";

export default function WhatsAppStockAlerta({ item }) {
  const handleEnviar = () => {
    const telefono = item.proveedor_telefono ? item.proveedor_telefono.replace(/\D/g, "") : "";
    const mensaje = `🔔 *Alerta de stock bajo - Peña El Chole*\n\n📦 *Artículo:* ${item.nombre}\n📉 *Stock actual:* ${item.cantidad ?? 0} unidades\n⚠️ *Stock mínimo:* ${item.stock_minimo} unidades\n${item.proveedor ? `🏪 *Proveedor:* ${item.proveedor}\n` : ""}${item.proveedor_telefono ? `📞 *Contacto:* ${item.proveedor_telefono}\n` : ""}\nSe necesita reponer existencias. Por favor gestiona el pedido.`;
    const url = telefono
      ? `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={handleEnviar}
      className="flex items-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
    >
      <MessageCircle className="w-4 h-4" />
      Avisar por WhatsApp
      {item.proveedor && <span className="text-green-100 font-normal ml-auto text-xs truncate max-w-[120px]">{item.proveedor}</span>}
    </button>
  );
}