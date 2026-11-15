import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewFolderDialog({ open, onOpenChange, onCreate }) {
  const [nombre, setNombre] = useState("");
  const [anio, setAnio] = useState(new Date().getFullYear().toString());

  const handleCreate = () => {
    if (!nombre.trim()) return;
    onCreate({ nombre: nombre.trim(), anio: anio ? parseInt(anio) : null });
    setNombre("");
    setAnio(new Date().getFullYear().toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#630027]">Nueva carpeta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Nombre</Label>
            <Input
              autoFocus
              className="mt-1 rounded-xl border-gray-200 focus-visible:ring-[#630027]/30"
              placeholder="Ej: Feria 2025"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Año</Label>
            <Input
              type="number"
              className="mt-1 rounded-xl border-gray-200 focus-visible:ring-[#630027]/30"
              placeholder="2025"
              value={anio}
              onChange={e => setAnio(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={!nombre.trim()}
            className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl"
          >
            Crear carpeta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}