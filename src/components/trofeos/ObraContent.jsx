import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ObraAnioCard from "../obra/ObraAnioCard";
import NuevoAnioDialog from "../obra/NuevoAnioDialog";
import { useAuth } from "../auth/AuthContext";

export default function ObraContent() {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";
  const [anios, setAnios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const cargar = useCallback(async () => {
    const data = await api.entities.ObraAnio.list("-anio");
    setAnios(data);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCreate = async (datos) => {
    await api.entities.ObraAnio.create(datos);
    cargar();
  };

  const handleDelete = async (id) => {
    await api.entities.ObraAnio.delete(id);
    cargar();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {puedeEditar && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setDialogOpen(true)} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Nuevo año
          </Button>
        </div>
      )}

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