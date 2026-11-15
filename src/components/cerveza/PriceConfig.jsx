import React, { useState } from "react";
import { Beer, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function PriceConfig({ precio, onSave, soloLectura = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const handleEdit = () => {
    setDraft(precio.toString().replace(".", ","));
    setEditing(true);
  };

  const handleSave = () => {
    const val = parseFloat(draft.replace(",", "."));
    if (!isNaN(val) && val > 0) {
      onSave(val);
    }
    setEditing(false);
  };

  return (
    <div className="bg-[#630027] rounded-2xl px-6 py-5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Beer className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Precio por cerveza</p>
          {editing ? (
            <div className="flex items-center gap-2 mt-0.5">
              <Input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
                className="w-24 h-7 text-sm bg-white/20 border-white/30 text-white placeholder-white/40 rounded-lg px-2"
              />
              <span className="text-white/70 text-sm">€</span>
            </div>
          ) : (
            <motion.p key={precio} initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-2xl font-black text-white">
              {precio.toFixed(2).replace(".", ",")}€
            </motion.p>
          )}
        </div>
      </div>

      {!soloLectura && (
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button size="icon" onClick={handleSave} className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white border-0">
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" onClick={() => setEditing(false)} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-0">
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button size="icon" onClick={handleEdit} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white border-0">
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}