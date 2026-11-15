import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus, Medal } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import ResultadoAnioCard from "../components/resultados/ResultadoAnioCard";

export default function Resultados() {
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
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#630027]/10 flex items-center justify-center">
          <Medal className="w-6 h-6 text-[#630027]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">Resultados</h1>
            <HelpIcon section="resultados" />
          </div>
          <p className="text-gray-400 text-sm">Clasificaciones por año</p>
        </div>
      </div>

      {/* Crear nuevo año */}
      <div className="flex gap-2 mb-8">
        <input
          type="number"
          value={nuevoAnio}
          onChange={e => setNuevoAnio(e.target.value)}
          placeholder={`Nuevo año (ej: ${new Date().getFullYear()})`}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20"
          onKeyDown={e => e.key === "Enter" && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={!nuevoAnio} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Crear
        </Button>
      </div>

      {resultados.length === 0 ? (
        <div className="text-center py-20">
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