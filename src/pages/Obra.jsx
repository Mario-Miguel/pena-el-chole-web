import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Theater } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import ObraAnioCard from "../components/obra/ObraAnioCard";
import NuevoAnioDialog from "../components/obra/NuevoAnioDialog";
import { useAuth } from "../components/auth/AuthContext";

export default function Obra() {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";
  const [anios, setAnios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const cargar = useCallback(async () => {
    const data = await base44.entities.ObraAnio.list("-anio");
    setAnios(data);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCreate = async (datos) => {
    await base44.entities.ObraAnio.create(datos);
    cargar();
  };

  const handleDelete = async (id) => {
    await base44.entities.ObraAnio.delete(id);
    cargar();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#630027]/10 flex items-center justify-center">
            <Theater className="w-6 h-6 text-[#630027]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-[#630027]">Obra</h1>
              <HelpIcon section="obra" />
            </div>
            <p className="text-gray-400 text-sm">Archivos por temporada</p>
          </div>
        </div>
        {puedeEditar && (
          <Button onClick={() => setDialogOpen(true)} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Nuevo año
          </Button>
        )}
      </div>

      {anios.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">🎭</p>
          <p className="text-gray-300 text-sm">Crea la primera carpeta de temporada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {anios.map(a => (
            <ObraAnioCard key={a.id} obraAnio={a} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <NuevoAnioDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={handleCreate} />
    </div>
  );
}