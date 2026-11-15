import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, Pencil, Gavel, ScrollText } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import MediaGaleria from "../shared/MediaGaleria";

export default function GuionJurado({ obraAnioId, obraAnio, titulo, descripcion, campoTexto, seccion, placeholder, icon: Icon }) {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";
  const [texto, setTexto] = useState(obraAnio?.[campoTexto] || "");
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);

  const DefaultIcon = Icon || Gavel;

  useEffect(() => {
    setTexto(obraAnio?.[campoTexto] || "");
    setEditando(false);
  }, [obraAnioId, obraAnio?.[campoTexto], campoTexto]);

  const handleSave = async () => {
    setGuardando(true);
    await base44.entities.ObraAnio.update(obraAnioId, { [campoTexto]: texto });
    setGuardando(false);
    setEditando(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DefaultIcon className="w-4 h-4 text-[#630027]" />
          <div>
            <h4 className="font-bold text-gray-700 text-sm">{titulo}</h4>
            <p className="text-xs text-gray-400">{descripcion}</p>
          </div>
        </div>
        {puedeEditar && !editando && (
          <button onClick={() => setEditando(true)} className="flex items-center gap-1 text-xs font-semibold text-[#630027] bg-[#630027]/5 hover:bg-[#630027]/10 px-3 py-1.5 rounded-xl transition-colors">
            <Pencil className="w-3 h-3" /> Editar
          </button>
        )}
      </div>

      {/* Text content */}
      {puedeEditar && editando ? (
        <div className="space-y-2 mb-3">
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none bg-white focus:outline-none focus:border-[#630027]"
            rows={8}
            placeholder={placeholder}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={guardando} className="flex items-center gap-1.5 bg-[#630027] text-white px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60">
              {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Guardar
            </button>
            <button onClick={() => { setEditando(false); setTexto(obraAnio?.[campoTexto] || ""); }} className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        texto ? (
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{texto}</div>
        ) : (
          <p className="text-xs text-gray-300 italic mb-3">Sin guión definido{puedeEditar ? ". Pulsa Editar para añadirlo." : ""}</p>
        )
      )}

      {/* Media: fotos, vídeos, enlaces y YouTube */}
      <MediaGaleria parentId={obraAnioId} seccion={seccion} />
    </div>
  );
}