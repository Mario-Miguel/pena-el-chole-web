import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ open, mensaje, onConfirm, onCancel, textoConfirmar = "Eliminar", variante = "destructive" }) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-center text-gray-700 font-medium text-sm leading-relaxed">{mensaje || "¿Confirmar acción?"}</p>
          <div className="flex gap-3 w-full">
            <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancelar</Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 rounded-xl ${variante === "destructive" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-[#630027] hover:bg-[#4a001d] text-white"}`}
            >
              {textoConfirmar}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}