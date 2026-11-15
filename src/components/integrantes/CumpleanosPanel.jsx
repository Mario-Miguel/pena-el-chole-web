import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Cake, Edit2, Check, X } from "lucide-react";
import { format, parseISO, differenceInDays, setYear } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

function diasHastaCumple(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date();
  const cumpleEsteAnio = setYear(parseISO(fechaNac), hoy.getFullYear());
  let diff = differenceInDays(cumpleEsteAnio, hoy);
  if (diff < 0) {
    const cumpleProxAnio = setYear(parseISO(fechaNac), hoy.getFullYear() + 1);
    diff = differenceInDays(cumpleProxAnio, hoy);
  }
  return diff;
}

function edadActual(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = parseISO(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export default function CumpleanosPanel({ puedeEditar = false }) {
  const [integrantes, setIntegrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState("");

  useEffect(() => {
    base44.entities.Integrante.list().then(data => {
      setIntegrantes(data.filter(i => i.categoria !== "patitas"));
      setLoading(false);
    });
  }, []);

  const handleSave = async (id) => {
    await base44.entities.Integrante.update(id, { fecha_nacimiento: editVal || null });
    setIntegrantes(prev => prev.map(i => i.id === id ? { ...i, fecha_nacimiento: editVal || null } : i));
    setEditingId(null);
  };

  if (loading) return (
    <div className="py-8 flex justify-center">
      <div className="w-6 h-6 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  // Ordenar por días hasta el cumpleaños (primero los más próximos, sin fecha al final)
  const sorted = [...integrantes].sort((a, b) => {
    const da = diasHastaCumple(a.fecha_nacimiento);
    const db = diasHastaCumple(b.fecha_nacimiento);
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });

  const proximos = sorted.filter(i => {
    const d = diasHastaCumple(i.fecha_nacimiento);
    return d !== null && d <= 30;
  });
  const resto = sorted.filter(i => {
    const d = diasHastaCumple(i.fecha_nacimiento);
    return d === null || d > 30;
  });

  const renderRow = (integrante) => {
    const dias = diasHastaCumple(integrante.fecha_nacimiento);
    const edad = edadActual(integrante.fecha_nacimiento);
    const esHoy = dias === 0;
    const isEditing = editingId === integrante.id;

    return (
      <div
        key={integrante.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${esHoy ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${esHoy ? "bg-amber-400 text-white" : "bg-[#630027]/10 text-[#630027]"}`}>
          {esHoy ? "🎂" : integrante.nombre[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{integrante.nombre}</p>
          {isEditing ? (
            <input
              type="date"
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-0.5 mt-0.5"
              autoFocus
            />
          ) : integrante.fecha_nacimiento ? (
            <p className="text-xs text-gray-400">
              {format(parseISO(integrante.fecha_nacimiento), "d 'de' MMMM", { locale: es })}
              {edad !== null && <span className="ml-1 text-gray-300">· {edad} años</span>}
            </p>
          ) : (
            <p className="text-xs text-gray-300 italic">Sin fecha</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {dias !== null && !isEditing && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${esHoy ? "bg-amber-400 text-white" : dias <= 7 ? "bg-[#630027]/10 text-[#630027]" : "bg-gray-100 text-gray-500"}`}>
              {esHoy ? "¡Hoy! 🎉" : `${dias}d`}
            </span>
          )}
          {puedeEditar && (
            isEditing ? (
              <>
                <button onClick={() => handleSave(integrante.id)} className="text-green-500 hover:text-green-700 p-1">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-red-400 p-1">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => { setEditingId(integrante.id); setEditVal(integrante.fecha_nacimiento || ""); }}
                className="p-1 text-gray-300 hover:text-[#630027] transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {proximos.length > 0 && (
        <div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Cake className="w-3.5 h-3.5" /> Próximos 30 días
          </p>
          <div className="space-y-2">
            {proximos.map(renderRow)}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          {proximos.length > 0 ? "Resto del año" : "Todos los integrantes"}
        </p>
        <div className="space-y-2">
          {resto.map(renderRow)}
        </div>
      </div>

      {!puedeEditar && integrantes.every(i => !i.fecha_nacimiento) && (
        <p className="text-center text-xs text-gray-300 py-4">Aún no se han registrado fechas de nacimiento.</p>
      )}
    </div>
  );
}