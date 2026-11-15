import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Users, CalendarDays, ClipboardList } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";

const TareasContent = React.lazy(() => import("../components/organizacion/TareasContent"));
const GruposContent = React.lazy(() => import("../components/organizacion/GruposContent"));
const PlazosContent = React.lazy(() => import("../components/organizacion/PlazosContent"));
const KanbanTareas = React.lazy(() => import("../components/tareas/KanbanTareas"));

const Loader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
  </div>
);

export default function Organizacion() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#630027]/10 flex items-center justify-center">
          <CheckSquare className="w-6 h-6 text-[#630027]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">Organización</h1>
            <HelpIcon section="organizacion" />
          </div>
          <p className="text-gray-400 text-sm">Tareas, grupos, plazos y reuniones</p>
        </div>
      </div>

      <Tabs defaultValue="tareas">
        <TabsList className="mb-6 bg-gray-100 rounded-xl p-1 w-full grid grid-cols-4">
          <TabsTrigger value="tareas" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#630027] data-[state=active]:shadow-sm flex items-center gap-1.5 text-xs sm:text-sm">
            <CheckSquare className="w-4 h-4" /> Tareas
          </TabsTrigger>
          <TabsTrigger value="grupos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#630027] data-[state=active]:shadow-sm flex items-center gap-1.5 text-xs sm:text-sm">
            <Users className="w-4 h-4" /> Grupos
          </TabsTrigger>
          <TabsTrigger value="plazos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#630027] data-[state=active]:shadow-sm flex items-center gap-1.5 text-xs sm:text-sm">
            <CalendarDays className="w-4 h-4" /> Plazos
          </TabsTrigger>
          <TabsTrigger value="reuniones" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#630027] data-[state=active]:shadow-sm flex items-center gap-1.5 text-xs sm:text-sm">
            <ClipboardList className="w-4 h-4" /> Reuniones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tareas">
          <React.Suspense fallback={<Loader />}>
            <TareasContent />
          </React.Suspense>
        </TabsContent>
        <TabsContent value="grupos">
          <React.Suspense fallback={<Loader />}>
            <GruposContent />
          </React.Suspense>
        </TabsContent>
        <TabsContent value="plazos">
          <React.Suspense fallback={<Loader />}>
            <PlazosContent />
          </React.Suspense>
        </TabsContent>
        <TabsContent value="reuniones">
          <React.Suspense fallback={<Loader />}>
            <KanbanTareas />
          </React.Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}