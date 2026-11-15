import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";

const OPCIONES = [
  { key: "cuentas",    label: "Cuentas",    emoji: "💰" },
  { key: "cerveza",    label: "Cerveza",    emoji: "🍺" },
  { key: "calendario", label: "Calendario", emoji: "📅" },
  { key: "almacen",    label: "Almacén",    emoji: "📦" },
  { key: "resultados", label: "Resultados", emoji: "🏆" },
];

export default function OpcionesPrivacidad() {
  const [privado, setPrivado] = useState({ cuentas: true, cerveza: false, calendario: true, almacen: false, resultados: false });
  const [guardado, setGuardado] = useState(false);

  const handleToggle = (key) => {
    setPrivado(prev => ({ ...prev, [key]: !prev[key] }));
    setGuardado(false);
  };

  const handleGuardar = () => {
    console.log("Configuración de Privacidad Guardada", privado);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-2">Marca las secciones que deben ser privadas (solo visibles para miembros con acceso).</p>
      {OPCIONES.map(({ key, label, emoji }) => (
        <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${privado[key] ? "bg-[#630027]/10" : "bg-gray-100"}`}>
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-400">{privado[key] ? "Privado — solo miembros" : "Público — todos pueden ver"}</p>
          </div>
          <button
            onClick={() => handleToggle(key)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privado[key] ? "bg-[#630027]" : "bg-gray-200"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${privado[key] ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleGuardar} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
          Guardar cambios
        </Button>
        {guardado && <span className="text-sm text-green-600 font-medium">✓ Guardado</span>}
      </div>
    </div>
  );
}