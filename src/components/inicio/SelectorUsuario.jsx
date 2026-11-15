import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

export default function SelectorUsuario({ integrantes, usuarioActual, onCambiar }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
      <User className="w-4 h-4 text-[#630027]/50 flex-shrink-0" />
      <Select value={usuarioActual || ""} onValueChange={onCambiar}>
        <SelectTrigger className="border-0 shadow-none p-0 h-auto text-sm font-medium text-gray-700 focus:ring-0 min-w-[140px]">
          <SelectValue placeholder="¿Quién eres?" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl shadow-xl">
          {integrantes.map(i => (
            <SelectItem key={i.id} value={i.id}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#630027]/10 flex items-center justify-center text-xs font-bold text-[#630027]">
                  {i.nombre[0].toUpperCase()}
                </div>
                <span>{i.nombre}</span>
                {i.cargo === "presidente" && <span className="text-xs text-[#630027]/60">⚜️</span>}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}