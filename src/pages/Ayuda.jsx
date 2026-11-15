import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, HelpCircle, Home, Users, CalendarDays,
  BookOpen, Wallet, Beer, ListChecks, Theater, Archive, Truck, Trophy,
  Medal, PiggyBank, CreditCard, UsersRound, Link2, NotepadText, FileText,
  ScrollText, Lightbulb, StickyNote, Bell, MessageSquare, BarChart2,
  User, Settings, Shield, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/auth/AuthContext";
import { ALL_PAGES, EXTRA_HELP_PAGES, getSavedMenuOrder } from "../lib/menuConfig";

const ICON_MAP = {
  Inicio: Home, Integrantes: Users, Calendario: CalendarDays,
  Memoria: BookOpen, Cuentas: Wallet, Cerveza: Beer, ToDo: ListChecks,
  Obra: Theater, Almacen: Archive, Vehiculos: Truck, Concurso: Trophy,
  Resultados: Medal, Presupuesto: PiggyBank, Cuotas: CreditCard,
  GruposTrabajo: UsersRound, Enlaces: Link2, LibroCaja: NotepadText,
  GestionDocumental: FileText, ActasReunion: ScrollText,
  Sugerencias: Lightbulb, NotasPersonales: StickyNote,
  Notificaciones: Bell, Chat: MessageSquare, Votaciones: BarChart2,
  Perfil: User, Ayuda: HelpCircle, Ajustes: Settings,
  Admin: Shield, PanelCargos: Briefcase,
};

function buildSecciones(sesion) {
  const esSocioRaso = sesion && !sesion.esAdmin && !sesion.cargo;
  const menuOrder = getSavedMenuOrder();

  const seen = new Set();
  const secciones = [];

  [...menuOrder, ...EXTRA_HELP_PAGES.map(p => p.page)].forEach(pageKey => {
    if (seen.has(pageKey)) return;
    seen.add(pageKey);

    const cfg = ALL_PAGES.find(p => p.page === pageKey)
             || EXTRA_HELP_PAGES.find(p => p.page === pageKey);
    if (!cfg || !cfg.helpId || !cfg.helpItems?.length) return;

    if (esSocioRaso && (cfg.page === "Admin" || cfg.page === "PanelCargos")) return;

    secciones.push({
      id: cfg.helpId,
      page: cfg.page,
      titulo: cfg.label,
      descripcion: cfg.helpDesc || "",
      color: cfg.helpColor || "text-gray-600",
      bg: cfg.helpBg || "bg-gray-100",
      items: cfg.helpItems,
      Icon: ICON_MAP[cfg.page] || FileText,
    });
  });

  return secciones;
}

function SeccionAyuda({ seccion, autoAbrir }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const { Icon } = seccion;

  useEffect(() => {
    if (autoAbrir) {
      setAbierto(true);
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [autoAbrir]);

  return (
    <div id={seccion.id} ref={ref} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-4">
      <button
        onClick={() => setAbierto(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className={`w-9 h-9 rounded-xl ${seccion.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${seccion.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm">{seccion.titulo}</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{seccion.descripcion}</p>
        </div>
        {abierto
          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        }
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-50">
              <ul className="mt-3 space-y-2">
                {seccion.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${seccion.color.replace("text-", "bg-")}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Ayuda() {
  const { sesion } = useAuth();
  const [busqueda, setBusqueda] = useState("");
  const [seccionActiva, setSeccionActiva] = useState(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) setSeccionActiva(hash);
  }, []);

  const secciones = buildSecciones(sesion);

  const filtradas = secciones.filter(s =>
    !busqueda.trim() ||
    s.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.items.some(i => i.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex items-center gap-3 mb-2"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#630027]/10 flex items-center justify-center">
          <HelpCircle className="w-7 h-7 text-[#630027]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#630027]">Ayuda</h1>
          <p className="text-gray-400 text-sm">Guía de uso de la app Peña El Chole</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
        className="bg-[#630027]/5 border border-[#630027]/10 rounded-2xl px-4 py-3 mb-6 mt-4"
      >
        <p className="text-sm text-[#630027] font-medium">💡 Pulsa en cualquier sección para ver su explicación detallada.</p>
        <p className="text-xs text-gray-500 mt-1">Esta guía se actualiza automáticamente con cada nueva sección añadida a la app.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="relative mb-5"
      >
        <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar en la ayuda..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20 bg-white"
        />
      </motion.div>

      <div className="space-y-3">
        {filtradas.length === 0 ? (
          <div className="text-center py-16 text-gray-300 text-sm">No se encontraron resultados para "{busqueda}"</div>
        ) : (
          filtradas.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.18 + i * 0.03, ease: "easeOut" }}
            >
              <SeccionAyuda seccion={s} autoAbrir={s.id === seccionActiva} />
            </motion.div>
          ))
        )}
      </div>

      <p className="text-center text-xs text-gray-300 mt-8">Peña El Chole · App v2026 · {secciones.length} secciones</p>
    </div>
  );
}