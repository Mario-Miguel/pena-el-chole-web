import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CATEGORIAS = [
  { value: "obra", label: "🔨 Obra", color: "#b45309" },
  { value: "compras", label: "🛒 Compras", color: "#0891b2" },
  { value: "eventos", label: "🎉 Eventos", color: "#7c3aed" },
  { value: "reunion", label: "🤝 Reunión", color: "#059669" },
  { value: "limpieza", label: "🧹 Limpieza", color: "#db2777" },
  { value: "mantenimiento", label: "🔧 Mantenimiento", color: "#d97706" },
  { value: "otro", label: "📌 Otro", color: "#6b7280" },
];

export default function AnadirPlazoDialog({ open, onOpenChange, onCrear }) {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!titulo || !categoria || !fechaInicio || !fechaFin) return;
    setGuardando(true);
    await onCrear({
      titulo,
      categoria,
      fecha_inicio: format(fechaInicio, "yyyy-MM-dd"),
      fecha_fin: format(fechaFin, "yyyy-MM-dd"),
      color: CATEGORIAS.find(c => c.value === categoria)?.color || "#6b7280",
    });
    setTitulo("");
    setCategoria("");
    setFechaInicio(null);
    setFechaFin(null);
    setGuardando(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#630027] font-black text-xl">Añadir plazo orientativo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nombre</Label>
            <Input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Instalación de suelo"
              className="rounded-xl border-gray-200"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Categoría</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="rounded-xl border-gray-200">
                <SelectValue placeholder="Elige una categoría" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {CATEGORIAS.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start rounded-xl border-gray-200 text-sm font-normal h-10">
                    <CalendarDays className="w-4 h-4 mr-2 text-gray-400" />
                    {fechaInicio ? format(fechaInicio, "d MMM", { locale: es }) : "Fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                  <Calendar mode="single" selected={fechaInicio} onSelect={setFechaInicio} weekStartsOn={1} locale={es} className="rounded-2xl" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start rounded-xl border-gray-200 text-sm font-normal h-10">
                    <CalendarDays className="w-4 h-4 mr-2 text-gray-400" />
                    {fechaFin ? format(fechaFin, "d MMM", { locale: es }) : "Fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                  <Calendar mode="single" selected={fechaFin} onSelect={setFechaFin} weekStartsOn={1} locale={es} disabled={d => fechaInicio && d < fechaInicio} className="rounded-2xl" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button
            onClick={handleGuardar}
            disabled={!titulo || !categoria || !fechaInicio || !fechaFin || guardando}
            className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl mt-2"
          >
            {guardando ? "Guardando..." : "Añadir plazo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}