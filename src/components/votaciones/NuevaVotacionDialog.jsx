import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";

export default function NuevaVotacionDialog({ open, onOpenChange, onCreate }) {
  const [tema, setTema] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [opciones, setOpciones] = useState(["", ""]);

  const addOpcion = () => setOpciones(prev => [...prev, ""]);
  const removeOpcion = (i) => setOpciones(prev => prev.filter((_, idx) => idx !== i));
  const updateOpcion = (i, val) => setOpciones(prev => prev.map((o, idx) => idx === i ? val : o));

  const handleCreate = () => {
    const valid = opciones.map(o => o.trim()).filter(Boolean);
    if (!tema.trim() || valid.length < 2) return;
    onCreate({ tema: tema.trim(), descripcion: descripcion.trim(), opciones: valid });
    setTema(""); setDescripcion(""); setOpciones(["", ""]);
  };

  const canCreate = tema.trim() && opciones.filter(o => o.trim()).length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#630027]">Nueva votación</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Tema *</Label>
            <Input autoFocus className="mt-1 rounded-xl border-gray-200" placeholder="¿Sobre qué se vota?" value={tema} onChange={e => setTema(e.target.value)} />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Descripción</Label>
            <Textarea className="mt-1 rounded-xl border-gray-200 resize-none" rows={2} placeholder="Contexto o detalle..." value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Opciones * (mín. 2)</Label>
            <div className="space-y-2">
              {opciones.map((op, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    className="rounded-xl border-gray-200 text-sm"
                    placeholder={`Opción ${i + 1}`}
                    value={op}
                    onChange={e => updateOpcion(i, e.target.value)}
                  />
                  {opciones.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeOpcion(i)} className="h-9 w-9 text-gray-300 hover:text-red-400 rounded-xl flex-shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addOpcion} className="mt-2 text-xs text-[#630027] hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Añadir opción
            </button>
          </div>
          <Button onClick={handleCreate} disabled={!canCreate} className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
            Crear votación
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}