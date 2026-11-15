import React from "react";
import MediaGaleria from "../shared/MediaGaleria";

const TIPOS = {
  planos: { label: "Planos", desc: "Imágenes, PDFs, vídeos y enlaces de la estructura" },
  memoria: { label: "Obra / Memoria", desc: "Documentos, fotos, vídeos y enlaces" },
  maqueta: { label: "Maqueta", desc: "Fotos, vídeos, archivos y enlaces de la maqueta" },
};

export default function ObraSeccion({ obraAnioId, seccion }) {
  const conf = TIPOS[seccion] || { label: seccion, desc: "" };
  return (
    <div className="mb-6">
      <div className="mb-3">
        <h4 className="font-bold text-gray-700 text-sm">{conf.label}</h4>
        <p className="text-xs text-gray-400">{conf.desc}</p>
      </div>
      <MediaGaleria parentId={obraAnioId} seccion={seccion} />
    </div>
  );
}