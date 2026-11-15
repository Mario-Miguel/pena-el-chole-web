import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NuevoAnioDialog({ open, onClose, onCreate }) {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [titulo, setTitulo] = useState("");

  if (!open) return null;

  const handleCreate = () => {
    if (!anio) return;
    onCreate({ anio: Number(anio), titulo: titulo.trim() });
    setAnio(new Date().getFullYear());
    setTitulo("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-[#630027] text-lg">Nueva carpeta de año</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Año *</Label>
          <Input type="number" value={anio} onChange={e => setAnio(e.target.value)} className="rounded-xl border-gray-200" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Título de la obra</Label>
          <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Don Juan Tenorio" className="rounded-xl border-gray-200" />
        </div>
        <Button onClick={handleCreate} disabled={!anio} className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
          Crear carpeta
        </Button>
      </div>
    </div>
  );
}