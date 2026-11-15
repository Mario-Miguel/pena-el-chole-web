import React from "react";
import { Trophy } from "lucide-react";
import ConcursoSeccionPanel from "../components/concurso/ConcursoSeccionPanel";
import HelpIcon from "../components/layout/HelpIcon";

export default function Concurso() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#630027]/10 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-[#630027]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">Concurso</h1>
            <HelpIcon section="concurso" />
          </div>
          <p className="text-gray-400 text-sm">Información del concurso</p>
        </div>
      </div>

      <div className="space-y-5">
        <ConcursoSeccionPanel tipo="bases" />
        <ConcursoSeccionPanel tipo="puntuaciones" />
        <ConcursoSeccionPanel tipo="penalizaciones" />
      </div>
    </div>
  );
}