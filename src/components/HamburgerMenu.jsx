import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Menu, X, Home, Users, CalendarDays, BookOpen, Wallet, Beer,
  ListChecks, Theater, Trophy, BarChart2, Archive, Medal, Settings,
  FileText, StickyNote, Bell, MessageSquare, Shield, User, Briefcase,
  HelpCircle, PiggyBank, CreditCard, Truck, Link as LinkIcon, UsersRound,
  ScrollText, NotepadText, Lightbulb, ClipboardList, PartyPopper, Coins, FolderOpen,
  Hammer, HeartPulse, Users2, Ticket, BookOpen as BookOpenIcon, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./auth/AuthContext";
import { api } from "@/api/client";
import { getSavedMenuOrder, ALL_PAGES, getDisabledPages } from "../lib/menuConfig";
import { getStoredLabels } from "../lib/appConfig";

const ICON_MAP = {
  Inicio: Home, Integrantes: Users, Calendario: CalendarDays, Memoria: BookOpen,
  Cuentas: Wallet, Cerveza: Beer, ToDo: ListChecks, Obra: Theater,
  Almacen: Archive, Concurso: Trophy, Resultados: Medal, Sugerencias: Lightbulb,
  NotasPersonales: StickyNote, Notificaciones: Bell, Chat: MessageSquare,
  Votaciones: BarChart2, Ajustes: Settings, Perfil: User, Ayuda: HelpCircle,
  Presupuesto: PiggyBank, Cuotas: CreditCard, Vehiculos: Truck, Enlaces: LinkIcon,
  GruposTrabajo: UsersRound, LibroCaja: NotepadText, GestionDocumental: FileText,
  ActasReunion: ScrollText,
  Organizacion: ClipboardList, Desfile: PartyPopper, Finanzas: Coins, Secretaria: FolderOpen,
  Herramientas: Hammer, Seguridad: HeartPulse, Comunidad: Users2, Loteria: Ticket,
  Actividades: PartyPopper, Contabilidad: BookOpenIcon, TourGuia: Compass,
};

const ADMIN_ITEM  = { label: "Panel Admin", page: "Admin", icon: Shield };
const CARGOS_CON_PANEL = ["presidente", "vicepresidente", "secretario", "tesorero", "vocal"];
const CARGO_LABELS = {
  presidente: "Mi área de Presidente", vicepresidente: "Mi área de Vicepresidente",
  secretario: "Mi área de Secretario", tesorero: "Mi área de Tesorero", vocal: "Mi área de Vocal",
};

function buildItems(disabledPages = [], customLabels = {}) {
  const order = getSavedMenuOrder();
  return order
    .filter(p => !disabledPages.includes(p))
    .map(p => {
      const info = ALL_PAGES.find(x => x.page === p);
      if (!info) return null;
      return { label: customLabels[p] || info.label, page: p, icon: ICON_MAP[p] || FileText };
    })
    .filter(Boolean);
}

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [menuItems, setMenuItems] = useState(() => buildItems([], getStoredLabels()));
  const { sesion } = useAuth();
  const location = useLocation();

  const cargarMenu = async () => {
    try {
      const configs = await api.entities.AppConfig.filter({ clave: "menu_desactivado" });
      const disabled = configs[0]?.valor ? JSON.parse(configs[0].valor) : [];
      setMenuItems(buildItems(disabled, getStoredLabels()));
    } catch {
      setMenuItems(buildItems([], getStoredLabels()));
    }
  };

  useEffect(() => { cargarMenu(); }, []);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const handler = () => cargarMenu();
    window.addEventListener("menuConfigChanged", handler);
    window.addEventListener("appLabelsChanged", handler);
    return () => {
      window.removeEventListener("menuConfigChanged", handler);
      window.removeEventListener("appLabelsChanged", handler);
    };
  }, []);

  const itemsToShow = useMemo(() => {
    const tieneCargo = sesion?.cargo && CARGOS_CON_PANEL.includes(sesion.cargo);
    const CARGO_ITEM = {
      label: sesion?.esAdmin ? "Mi área de Presidente" : (CARGO_LABELS[sesion?.cargo] || "Mi área"),
      page: "PanelCargos",
      icon: Briefcase,
    };
    return sesion?.esAdmin
      ? [...menuItems, CARGO_ITEM, ADMIN_ITEM]
      : tieneCargo
        ? [...menuItems, CARGO_ITEM]
        : menuItems;
  }, [menuItems, sesion]);

  return (
    <>
      <button onClick={() => setOpen(prev => !prev)}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors relative z-[60]" aria-label="Menú">
        <AnimatePresence mode="wait" initial={false}>
          {open
            ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-7 h-7 text-white" />
              </motion.span>
            : <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Menu className="w-7 h-7 text-white" />
              </motion.span>
          }
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
            <motion.div key="menu" initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.18 }}
              className="fixed right-3 top-[68px] z-[60] w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <motion.div
                className="py-2 max-h-[80vh] overflow-y-auto"
                variants={{ show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
                initial="hidden"
                animate="show"
              >
                {itemsToShow.map((item) => {
                  const Icon = item.icon;
                  const isAdmin = item.page === "Admin";
                  const isCargo = item.page === "PanelCargos";
                  return (
                    <motion.div
                      key={item.page}
                      variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { duration: 0.18 } } }}
                    >
                      <Link to={createPageUrl(item.page)}
                        className={`flex items-center gap-3 px-5 py-3 transition-all group ${
                          isAdmin  ? "text-amber-600 hover:bg-amber-50" :
                          isCargo  ? "text-[#630027] hover:bg-[#630027]/10" :
                                     "text-gray-700 hover:bg-[#630027]/5 hover:text-[#630027]"
                        }`}>
                        <Icon className={`w-5 h-5 transition-colors ${
                          isAdmin ? "text-amber-500" : isCargo ? "text-[#630027]" : "text-gray-400 group-hover:text-[#630027]"
                        }`} />
                        <span className="font-medium text-sm tracking-wide">{item.label}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}