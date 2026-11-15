import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus } from "lucide-react";
import ResultadoAnioCard from "../resultados/ResultadoAnioCard";

export default function ResultadosContent() {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoAnio, setNuevoAnio] = useState("");

  const cargar = useCallback(async () => {
    const data = await api.entities.ResultadoAnio.list("-anio");
    setResultados(data);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCreate = async () => {
    const anio = parseInt(nuevoAnio, 10);
    if (!anio) return;
    await api.entities.ResultadoAnio.create({ anio, filas: [] });
    setNuevoAnio("");
    cargar();
  };

  const handleDelete = async (id) => {
    await api.entities.ResultadoAnio.delete(id);
    cargar();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <input
          type="number"
          value={nuevoAnio}
          onChange={e => setNuevoAnio(e.target.value)}
          placeholder={`Nuevo año (ej: ${new Date().getFullYear()})`}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"
          onKeyDown={e => e.key === "Enter" && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={!nuevoAnio}
          className="bg-[#630027] hover:bg-[#4a001d] text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Crear
        </button>
      </div>

      {resultados.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🏅</p>
          <p className="text-gray-300 text-sm">Crea el primer año de resultados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {resultados.map(r => (
            <ResultadoAnioCard key={r.id} resultado={r} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}