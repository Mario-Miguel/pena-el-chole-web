import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";

const CATEGORIAS = [
  { key: "estructural", label: "Estructural" },
  { key: "soldadura", label: "Soldadura" },
  { key: "pintura", label: "Pintura" },
  { key: "decoracion", label: "Decoración" },
  { key: "enramado", label: "Enramado" },
  { key: "acabados", label: "Acabados" },
  { key: "preparacion_materiales", label: "Preparación de materiales" },
  { key: "otros", label: "Otros" },
];

export default function TaskDialog({ open, onOpenChange, tarea, onSave, onDelete, isNew }) {
  const [form, setForm] = useState({ nombre: "", categoria: "", descripcion: "", materiales: "" });

  useEffect(() => {
    if (tarea) {
      setForm({
        nombre: tarea.nombre || "",
        categoria: tarea.categoria || "",
        descripcion: tarea.descripcion || "",
        materiales: tarea.materiales || "",
      });
    } else {
      setForm({ nombre: "", categoria: "", descripcion: "", materiales: "" });
    }
  }, [tarea, open]);

  const handleSave = () => {
    if (!form.nombre.trim()) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#630027] text-lg">
            {isNew ? "Nueva tarea" : "Editar tarea"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div>
            <Label className="text-sm font-medium text-gray-700">Nombre *</Label>
            <Input
              autoFocus
              className="mt-1 rounded-xl border-gray-200 focus-visible:ring-[#630027]/30"
              placeholder="¿Qué hay que hacer?"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Categoría</Label>
            <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
              <SelectTrigger className="mt-1 rounded-xl border-gray-200">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map(c => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Descripción</Label>
            <Textarea
              className="mt-1 rounded-xl border-gray-200 focus-visible:ring-[#630027]/30 resize-none"
              placeholder="Descripción detallada de la tarea..."
              rows={3}
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">Materiales necesarios</Label>
            <Textarea
              className="mt-1 rounded-xl border-gray-200 focus-visible:ring-[#630027]/30 resize-none"
              placeholder="Herramientas, consumibles, materiales..."
              rows={3}
              value={form.materiales}
              onChange={e => setForm(f => ({ ...f, materiales: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={!form.nombre.trim()}
              className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl"
            >
              {isNew ? "Crear tarea" : "Guardar cambios"}
            </Button>
            {!isNew && (
              <Button
                variant="outline"
                size="icon"
                onClick={onDelete}
                className="rounded-xl border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}