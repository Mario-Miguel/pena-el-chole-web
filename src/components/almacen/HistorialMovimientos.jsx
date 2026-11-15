import React, { useEffect, useState } from "react";
import { api } from "@/api/client";
import { ArrowDown, ArrowUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function HistorialMovimientos({ itemId }) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!itemId) return;
    api.entities.MovimientoAlmacen.filter({ item_id: itemId }, "-created_date", 20)
      .then(data => { setMovimientos(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [itemId]);

  if (loading) return (
    <div className="flex justify-center py-4">
      <div className="w-5 h-5 border-2 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  if (movimientos.length === 0) return (
    <div className="text-center py-4 text-gray-400 text-xs">Sin movimientos registrados</div>
  );

  return (
    <div className="space-y-2">
      {movimientos.map(m => (
        <div key={m.id} className="flex items-center gap-3 text-sm">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.tipo === "entrada" ? "bg-green-100" : "bg-red-100"}`}>
            {m.tipo === "entrada"
              ? <ArrowDown className="w-3.5 h-3.5 text-green-600" />
              : <ArrowUp className="w-3.5 h-3.5 text-red-500" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`font-semibold ${m.tipo === "entrada" ? "text-green-600" : "text-red-500"}`}>
                {m.tipo === "entrada" ? "+" : "-"}{m.cantidad}
              </span>
              <span className="text-gray-500 text-xs truncate">
                {m.cantidad_anterior ?? "?"} → {m.cantidad_nueva ?? "?"}
              </span>
            </div>
            <div className="text-xs text-gray-400 truncate">
              {m.integrante_nombre && <span>{m.integrante_nombre} · </span>}
              {m.notas && <span className="italic">{m.notas} · </span>}
              <span className="flex items-center gap-0.5 inline-flex">
                <Clock className="w-2.5 h-2.5" />
                {format(new Date(m.created_date), "d MMM HH:mm", { locale: es })}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}