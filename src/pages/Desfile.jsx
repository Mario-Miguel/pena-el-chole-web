import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Theater, Trophy, Medal } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";

const ObraContent = React.lazy(() => import("../components/trofeos/ObraContent"));
const ResultadosContent = React.lazy(() => import("../components/trofeos/ResultadosContent"));
const ConcursoContent = React.lazy(() => import("../components/trofeos/ConcursoContent"));

const Loader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
  </div>
);

export default function Desfile() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#630027]/10 flex items-center justify-center">
          <span className="text-2xl">🎪</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">Desfile</h1>
            <HelpIcon section="desfile" />
          </div>
          <p className="text-gray-400 text-sm">Obra, concurso y resultados históricos</p>
        </div>
      </div>

      <Tabs defaultValue="obra">
        <TabsList className="mb-6 bg-gray-100 rounded-xl p-1 w-full grid grid-cols-3">
          <TabsTrigger value="obra" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#630027] data-[state=active]:shadow-sm flex items-center gap-2">
            <Theater className="w-4 h-4" /> Obra
          </TabsTrigger>
          <TabsTrigger value="resultados" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#630027] data-[state=active]:shadow-sm flex items-center gap-2">
            <Medal className="w-4 h-4" /> Resultados
          </TabsTrigger>
          <TabsTrigger value="concurso" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#630027] data-[state=active]:shadow-sm flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Concurso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="obra">
          <React.Suspense fallback={<Loader />}>
            <ObraContent />
          </React.Suspense>
        </TabsContent>
        <TabsContent value="resultados">
          <React.Suspense fallback={<Loader />}>
            <ResultadosContent />
          </React.Suspense>
        </TabsContent>
        <TabsContent value="concurso">
          <React.Suspense fallback={<Loader />}>
            <ConcursoContent />
          </React.Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}