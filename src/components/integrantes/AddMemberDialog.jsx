import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CARGOS = [
  { key: "presidente", label: "Presidente" },
  { key: "vicepresidente", label: "Vicepresidente" },
  { key: "secretario", label: "Secretario" },
  { key: "tesorero", label: "Tesorero" },
  { key: "vocal", label: "Vocal" },
];

const CATEGORIA_LABELS = {
  cargos: "Cargos",
  socios: "Socios",
  contribuyentes: "Contribuyentes",
  socios_honorificos: "Socios Honoríficos",
  patitas: "Patitas de la Peña",
};

export default function AddMemberDialog({ open, onOpenChange, categoria, onAdd }) {
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");

  const handleAdd = () => {
    if (!nombre.trim()) return;
    onAdd({ nombre: nombre.trim(), cargo: categoria === "cargos" ? cargo : undefined });
    setNombre("");
    setCargo("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#630027]">
            Añadir a {CATEGORIA_LABELS[categoria]}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-sm font-medium text-gray-700">Nombre</Label>
            <Input
              className="mt-1 rounded-xl border-gray-200 focus-visible:ring-[#630027]/30"
              placeholder="Nombre del integrante"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              autoFocus
            />
          </div>

          {categoria === "cargos" && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Cargo</Label>
              <Select value={cargo} onValueChange={setCargo}>
                <SelectTrigger className="mt-1 rounded-xl border-gray-200">
                  <SelectValue placeholder="Seleccionar cargo" />
                </SelectTrigger>
                <SelectContent>
                  {CARGOS.map(c => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleAdd}
            disabled={!nombre.trim() || (categoria === "cargos" && !cargo)}
            className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl"
          >
            Añadir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}