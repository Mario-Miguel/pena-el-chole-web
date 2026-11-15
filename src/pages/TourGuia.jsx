import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Search, Play, Shield, Crown, Sparkles, ChevronRight, BookOpen } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { TOUR_GENERAL, TOUR_SECCIONES, TOUR_CARGOS, getToursForUser } from "@/lib/tourData";
// TourOverlay se renderiza en Layout via evento startTour

export default function TourGuia() {
  const { sesion } = useAuth();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("secciones");

  const esSocioRaso = sesion && !sesion.esAdmin && !sesion.cargo;
  const tours = useMemo(() => getToursForUser(sesion), [sesion]);

  const filtrados = tours.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.titulo.toLowerCase().includes(q) ||
      t.descripcion.toLowerCase().includes(q) ||
      t.steps.some(s => s.titulo.toLowerCase().includes(q) || s.descripcion.toLowerCase().includes(q)) ||
      (t.faqs || []).some(f => f.pregunta.toLowerCase().includes(q) || f.respuesta.toLowerCase().includes(q))
    );
  });

  const toursNormales = filtrados.filter(t => !TOUR_CARGOS.some(c => c.id === t.id));
  const toursCargos = filtrados.filter(t => TOUR_CARGOS.some(c => c.id === t.id));

  const startTour = (tour) => {
    window.dispatchEvent(new CustomEvent("startTour", { detail: tour }));
  };

  return (
    <div className="min-h-screen bg-[#faf8f6]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-[#630027]/10 flex items-center justify-center">
              <Compass className="w-6 h-6 text-[#630027]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Tours guiados</h1>
              <p className="text-xs text-gray-400">Aprende a usar cada sección de la app paso a paso</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
            <button
              onClick={() => setTab("secciones")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${tab === "secciones" ? "bg-white text-[#630027] shadow-sm" : "text-gray-400"}`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Por secciones
            </button>
            <button
              onClick={() => setTab("general")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${tab === "general" ? "bg-white text-[#630027] shadow-sm" : "text-gray-400"}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Tour general
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar en tours..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#630027] bg-white"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-5">
        {tab === "general" ? (
          /* Tour general */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TourCard tour={TOUR_GENERAL} onStart={() => startTour(TOUR_GENERAL)} highlight />
          </motion.div>
        ) : (
          /* Tours por secciones */
          <div className="space-y-6">
            {/* Secciones generales */}
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 px-1">Secciones de la app</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {toursNormales.map((tour, i) => (
                  <TourCard key={tour.id} tour={tour} onStart={() => startTour(tour)} index={i} />
                ))}
              </div>
            </div>

            {/* Secciones de cargos */}
            {!esSocioRaso && toursCargos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <Shield className="w-4 h-4 text-[#630027]" />
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Guías de Cargos y Admins</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {toursCargos.map((tour, i) => (
                    <TourCard key={tour.id} tour={tour} onStart={() => startTour(tour)} index={i} special />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* El tour se inicia desde Layout vía evento startTour */}
    </div>
  );
}

function TourCard({ tour, onStart, highlight, index, special }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: (index || 0) * 0.03 }}
      onClick={onStart}
      className={`text-left bg-white rounded-2xl border ${highlight ? "border-[#630027]/20" : "border-gray-100"} shadow-sm hover:shadow-md hover:border-[#630027]/30 transition-all overflow-hidden group`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${tour.bg} flex items-center justify-center flex-shrink-0`}>
            <span className="text-xl">{tour.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-gray-800 text-sm">{tour.titulo}</h3>
              {special && <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{tour.descripcion}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" /> {tour.steps.length} pasos
            </span>
            {tour.faqs?.length > 0 && (
              <span>❓ {tour.faqs.length} preguntas</span>
            )}
          </div>
          <span className={`flex items-center gap-1 text-xs font-bold ${tour.color} group-hover:gap-1.5 transition-all`}>
            Iniciar <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}