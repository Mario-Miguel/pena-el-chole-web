import React from "react";
import ConcursoSeccionPanel from "../concurso/ConcursoSeccionPanel";

export default function ConcursoContent() {
  return (
    <div className="space-y-5">
      <ConcursoSeccionPanel tipo="bases" />
      <ConcursoSeccionPanel tipo="puntuaciones" />
      <ConcursoSeccionPanel tipo="penalizaciones" />
    </div>
  );
}