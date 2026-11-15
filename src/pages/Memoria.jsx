import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import FolderCard from "../components/galeria/FolderCard";
import NewFolderDialog from "../components/galeria/NewFolderDialog";
import FolderView from "../components/galeria/FolderView";

export default function Memoria() {
  const [carpetas, setCarpetas] = useState([]);
  const [mediaCounts, setMediaCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCarpeta, setSelectedCarpeta] = useState(null);

  const loadData = useCallback(async () => {
    const [foldersData, allMedia] = await Promise.all([
      base44.entities.Carpeta.list("-created_date"),
      base44.entities.MediaItem.list(),
    ]);
    setCarpetas(foldersData);
    const counts = {};
    allMedia.forEach(m => {
      counts[m.carpeta_id] = (counts[m.carpeta_id] || 0) + 1;
    });
    setMediaCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async ({ nombre, anio }) => {
    const nueva = await base44.entities.Carpeta.create({ nombre, anio: anio || null });
    setCarpetas(prev => [nueva, ...prev]);
    setDialogOpen(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Carpeta.delete(id);
    setCarpetas(prev => prev.filter(c => c.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedCarpeta) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <FolderView
          carpeta={selectedCarpeta}
          onBack={() => { setSelectedCarpeta(null); loadData(); }}
          onRefresh={loadData}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">Galería</h1>
            <HelpIcon section="galeria" />
          </div>
          <p className="text-gray-400 text-sm mt-1">{carpetas.length} {carpetas.length === 1 ? "carpeta" : "carpetas"}</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl w-10 h-10 p-0 flex-shrink-0"
          title="Nueva carpeta"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {carpetas.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-gray-300">Aún no hay carpetas</p>
          <p className="text-gray-200 text-xs mt-1">Pulsa "Nueva carpeta" para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {carpetas.map(c => (
              <FolderCard
                key={c.id}
                carpeta={c}
                mediaCount={mediaCounts[c.id] || 0}
                onClick={() => setSelectedCarpeta(c)}
                onDelete={() => handleDelete(c.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <NewFolderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}