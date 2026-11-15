import React, { useState } from "react";
import { api } from "@/api/client";
import { Plus, Minus, Trash2, Package, ShoppingCart, AlertTriangle, Wrench } from "lucide-react";
import { getEstadoMantenimiento } from "./MantenimientoPanel";
import { useAuth } from "../auth/AuthContext";

export default function ItemAlmacenCard({ item, onUpdate, onDelete, onAbrirDetalle, onCrearCompra }) {
  const { sesion } = useAuth();
  const [cantidad, setCantidad] = useState(item.cantidad ?? 0);
  const [editando, setEditando] = useState(false);
  const [inputVal, setInputVal] = useState("");

  const imagenDisplay = item.miniatura_url || item.imagen_urls?.[0] || item.imagen_url || null;

  const save = async (newVal) => {
    const anterior = cantidad;
    const v = Math.max(0, newVal);
    setCantidad(v);
    await api.entities.ItemAlmacen.update(item.id, { cantidad: v });
    if (v !== anterior) {
      const diff = Math.abs(v - anterior);
      const tipo = v > anterior ? "entrada" : "salida";
      await api.entities.MovimientoAlmacen.create({
        item_id: item.id,
        item_nombre: item.nombre,
        tipo,
        cantidad: diff,
        cantidad_anterior: anterior,
        cantidad_nueva: v,
        integrante_nombre: sesion?.nombre || "",
      });
      // Notificar admins si movimiento grande (≥10) o si es un artículo nuevo con entrada
      if (diff >= 10) {
        await api.entities.Notificacion.create({
          titulo: `⚠️ Movimiento alto en almacén`,
          mensaje: `${sesion?.nombre || "Alguien"} ${tipo === "entrada" ? "añadió" : "retiró"} ${diff} unidades de "${item.nombre}". Stock: ${anterior} → ${v}.`,
          tipo: "otro",
          leida_por: [],
        });
      }
    }
    onUpdate?.();
  };

  const handleInputBlur = () => {
    const parsed = parseInt(inputVal, 10);
    save(isNaN(parsed) ? 0 : parsed);
    setEditando(false);
  };

  const bajoBajo = typeof item.stock_minimo === "number" && item.stock_minimo > 0 && cantidad <= item.stock_minimo;
  const estadoMant = getEstadoMantenimiento(item);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col ${bajoBajo ? "border-amber-300" : "border-gray-100"}`}>
      {/* Imagen — click abre detalle */}
      <div
        className="h-28 bg-gray-50 flex items-center justify-center cursor-pointer relative overflow-hidden"
        onClick={() => onAbrirDetalle?.(item)}>

        {imagenDisplay ?
        <img src={imagenDisplay} alt={item.nombre} className="w-full h-full object-cover" /> :

        <Package className="w-10 h-10 text-gray-200" />
        }
        {item.imagen_urls?.length > 1 &&
        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">
            {item.imagen_urls.length}
          </div>
        }
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <p
          className="font-semibold text-gray-800 text-sm leading-tight cursor-pointer hover:text-[#630027] transition-colors"
          onClick={() => onAbrirDetalle?.(item)}>

          {item.nombre}
        </p>
        {item.descripcion && <p className="text-xs text-gray-400 line-clamp-2">{item.descripcion}</p>}
        {bajoBajo && (
          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span>Mín. {item.stock_minimo}</span>
          </div>
        )}
        {estadoMant && (estadoMant.estado === "vencido" || estadoMant.estado === "proximo") && (
          <div className={`flex items-center gap-1 text-xs rounded-lg px-2 py-1 ${estadoMant.estado === "vencido" ? "text-red-600 bg-red-50" : "text-orange-500 bg-orange-50"}`}>
            <Wrench className="w-3 h-3 flex-shrink-0" />
            <span>{estadoMant.estado === "vencido" ? "Mant. vencido" : `Mant. en ${estadoMant.diasRestantes}d`}</span>
          </div>
        )}

        {/* Contador + acciones */}
        <div className="flex items-center gap-1 mt-auto">
          <button
            onClick={() => save(cantidad - 1)}
            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">

            <Minus className="w-3.5 h-3.5 text-gray-600" />
          </button>

          {editando ?
          <input
            autoFocus
            className="w-10 text-center font-bold text-gray-800 text-sm border border-[#4B1924]/30 rounded-lg h-7 focus:outline-none"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value.replace(/\D/g, ""))}
            onBlur={handleInputBlur}
            onKeyDown={(e) => {if (e.key === "Enter") handleInputBlur();}} /> :


          <button
            className="w-10 text-center font-bold text-gray-800 text-sm h-7 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => {setInputVal(cantidad === 0 ? "" : String(cantidad));setEditando(true);}}>

              {cantidad}
            </button>
          }

          <button
            onClick={() => save(cantidad + 1)}
            className="w-7 h-7 rounded-lg bg-[#4B1924]/10 hover:bg-[#4B1924]/20 flex items-center justify-center transition-colors flex-shrink-0">

            <Plus className="w-3.5 h-3.5 text-[#4B1924]" />
          </button>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => onCrearCompra?.(item)}
              title="Añadir a Compras" className="text-gray-300 mx-3 hover:text-[#630027] transition-colors">


              <ShoppingCart className="mx-1 lucide lucide-shopping-cart w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.(item.id)}
              className="text-gray-200 hover:text-red-400 transition-colors">

              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>);

}