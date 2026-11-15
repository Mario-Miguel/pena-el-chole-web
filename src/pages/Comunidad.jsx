import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, BarChart2, Bell, MessageCircle, ArrowRight, BookOpen, Cake } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";
import CumpleanosModal from "../components/comunidad/CumpleanosModal";

const SugerenciasContent = React.lazy(() => import("../components/comunidad/SugerenciasContent"));
const VotacionesContent = React.lazy(() => import("../components/comunidad/VotacionesContent"));

const Loader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
  </div>
);

function AccesoDirecto({ icon: Icon, titulo, desc, color, bg, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 hover:border-[#630027]/20 transition-colors text-left group"
    >
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm ${color} leading-tight`}>{titulo}</p>
        <p className="text-xs text-gray-400 truncate">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-200 group-hover:text-[#630027] transition-colors flex-shrink-0" />
    </motion.button>
  );
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } }
};
const itemVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
};

export default function Comunidad() {
  const navigate = useNavigate();
  const { sesion } = useAuth();
  const puedeEditar = sesion?.esAdmin || ["presidente", "vicepresidente", "secretario"].includes(sesion?.cargo);
  const [cumpleanosOpen, setCumpleanosOpen] = useState(false);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-2xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <motion.div variants={itemVariant} className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#630027]/10 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-[#630027]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">Comunidad</h1>
            <HelpIcon section="comunidad" />
          </div>
          <p className="text-gray-400 text-sm">Chat, avisos, sugerencias y votaciones</p>
        </div>
      </motion.div>

      {/* Accesos directos */}
      <motion.div variants={itemVariant} className="flex flex-col gap-2 mb-6">
        <AccesoDirecto
          icon={MessageCircle}
          titulo="Chat"
          desc="Mensajes en tiempo real"
          color="text-green-700"
          bg="bg-green-50"
          onClick={() => navigate("/Chat")}
        />
        <AccesoDirecto
          icon={Bell}
          titulo="Notificaciones"
          desc="Avisos y anuncios"
          color="text-amber-700"
          bg="bg-amber-50"
          onClick={() => navigate("/Notificaciones")}
        />
        <AccesoDirecto
          icon={BookOpen}
          titulo="Galería"
          desc="Fotos y vídeos"
          color="text-purple-700"
          bg="bg-purple-50"
          onClick={() => navigate("/Memoria")}
        />
        <AccesoDirecto
          icon={Cake}
          titulo="Cumpleaños"
          desc="Próximos y calendario"
          color="text-pink-700"
          bg="bg-pink-50"
          onClick={() => setCumpleanosOpen(true)}
        />
      </motion.div>

      {/* Tabs: Votaciones y Sugerencias — DEBAJO de los accesos directos */}
      <motion.div variants={itemVariant} className="mb-6">
        <Tabs defaultValue="votaciones">
          <TabsList className="mb-4 bg-gray-100 rounded-xl p-1 w-full grid grid-cols-2">
            <TabsTrigger value="votaciones" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#630027] data-[state=active]:shadow-sm flex items-center gap-1.5 text-xs">
              <BarChart2 className="w-3.5 h-3.5" /> Votaciones
            </TabsTrigger>
            <TabsTrigger value="sugerencias" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#630027] data-[state=active]:shadow-sm flex items-center gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5" /> Sugerencias
            </TabsTrigger>
          </TabsList>
          <TabsContent value="votaciones">
            <React.Suspense fallback={<Loader />}>
              <VotacionesContent />
            </React.Suspense>
          </TabsContent>
          <TabsContent value="sugerencias">
            <React.Suspense fallback={<Loader />}>
              <SugerenciasContent />
            </React.Suspense>
          </TabsContent>
        </Tabs>
      </motion.div>

      <CumpleanosModal open={cumpleanosOpen} onClose={() => setCumpleanosOpen(false)} />
    </motion.div>
  );
}