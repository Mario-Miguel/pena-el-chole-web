import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  Home, Users, CalendarDays, BookOpen, Wallet, Beer, ListChecks,
  Theater, Archive, Trophy, Medal, FileText, StickyNote, Bell, MessageSquare,
  BarChart2, Settings, User, Shield, Briefcase, HelpCircle, ChevronLeft, ChevronRight,
  PiggyBank, CreditCard, Truck, Link as LinkIcon, UsersRound, ScrollText, NotepadText, Lightbulb,
  Coins, FolderOpen, PartyPopper, ClipboardList, Hammer, HeartPulse, Users2,
  Ticket, Receipt, Calculator, Compass
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { api } from "@/api/client";
import { getSavedMenuOrder, ALL_PAGES, getDisabledPages } from "../../lib/menuConfig";
import { getStoredLabels } from "../../lib/appConfig";
import ThemeToggle from "./ThemeToggle";

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
  Herramientas: Hammer, Seguridad: HeartPulse, Comunidad: Users2,
  Tesoreria: Wallet, Loteria: Ticket, Tickets: Receipt, DatosPena: FileText,
  Contabilidad: Calculator, TourGuia: Compass, Actividades: PartyPopper,
  GestionCargos: Briefcase,
};

const CARGOS_CON_PANEL = ["presidente", "vicepresidente", "secretario", "tesorero", "vocal"];
const CARGO_LABELS = {
  presidente: "Área Presidente", vicepresidente: "Área Vicepresidente",
  secretario: "Área Secretario", tesorero: "Área Tesorero", vocal: "Área Vocal",
};

/** Agrupación visual de páginas en secciones para el sidebar en PC. */
const SECCIONES = [
  { titulo: "Principal", paginas: new Set(["Inicio", "Calendario", "Notificaciones", "Chat", "Comunidad", "NotasPersonales"]) },
  { titulo: "Gestión", paginas: new Set(["Integrantes", "Almacen", "Organizacion", "Finanzas", "Tesoreria", "Cerveza", "Vehiculos", "Loteria", "Tickets", "Contabilidad", "DatosPena"]) },
  { titulo: "Cultura", paginas: new Set(["Desfile", "Memoria", "Actividades"]) },
  { titulo: "Utilidades", paginas: new Set(["Herramientas", "Seguridad", "Enlaces", "Ayuda", "Ajustes", "Perfil", "TourGuia"]) },
];

function buildMenuItems(disabledPages = [], customLabels = {}) {
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

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { sesion } = useAuth();
  const [menuItems, setMenuItems] = useState(() => buildMenuItems([], getStoredLabels()));
  const [disabledPages, setDisabledPages] = useState([]);
  const [sidebarVisible, setSidebarVisible] = useState(() => localStorage.getItem("pena_sidebar_hidden") !== "true");

  useEffect(() => {
    const handler = () => setSidebarVisible(localStorage.getItem("pena_sidebar_hidden") !== "true");
    window.addEventListener("sidebarVisibilityChanged", handler);
    return () => window.removeEventListener("sidebarVisibilityChanged", handler);
  }, []);

  const cargarDesactivadas = async () => {
    try {
      const configs = await api.entities.AppConfig.filter({ clave: "menu_desactivado" });
      const disabled = configs[0]?.valor ? JSON.parse(configs[0].valor) : [];
      setDisabledPages(disabled);
      setMenuItems(buildMenuItems(disabled, getStoredLabels()));
    } catch {
      setMenuItems(buildMenuItems([], getStoredLabels()));
    }
  };

  useEffect(() => { cargarDesactivadas(); }, []);

  // Escuchar cambios de menú y labels
  useEffect(() => {
    const handler = () => cargarDesactivadas();
    const labelsHandler = () => setMenuItems(prev => buildMenuItems(disabledPages, getStoredLabels()));
    window.addEventListener("menuConfigChanged", handler);
    window.addEventListener("appLabelsChanged", labelsHandler);
    return () => {
      window.removeEventListener("menuConfigChanged", handler);
      window.removeEventListener("appLabelsChanged", labelsHandler);
    };
  }, [disabledPages]);

  const items = useMemo(() => {
    const tieneCargo = sesion?.cargo && CARGOS_CON_PANEL.includes(sesion.cargo);
    const cargoItem = { label: sesion?.esAdmin ? "Área Presidente" : (CARGO_LABELS[sesion?.cargo] || "Mi área"), page: "PanelCargos", icon: Briefcase };
    const adminItem = { label: "Panel Admin", page: "Admin", icon: Shield };
    return sesion?.esAdmin
      ? [...menuItems, cargoItem, adminItem]
      : tieneCargo
        ? [...menuItems, cargoItem]
        : menuItems;
  }, [menuItems, sesion]);

  const currentPage = location.pathname.replace("/", "");

  // Agrupar items en secciones visuales
  const { sections, extraItems } = useMemo(() => {
    const allSectionPages = new Set();
    SECCIONES.forEach(s => s.paginas.forEach(p => allSectionPages.add(p)));
    const secs = SECCIONES.map(s => ({
      titulo: s.titulo,
      items: items.filter(item => s.paginas.has(item.page)),
    })).filter(s => s.items.length > 0);
    const extra = items.filter(item => !allSectionPages.has(item.page));
    return { sections: secs, extraItems: extra };
  }, [items]);

  if (!sidebarVisible) return null;

  const renderItem = (item) => {
    const Icon = item.icon;
    const isActive = currentPage === item.page;
    const isAdmin = item.page === "Admin";
    const isCargo = item.page === "PanelCargos";
    return (
      <motion.div
        key={item.page}
        variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.2 } } }}
      >
        <Link to={createPageUrl(item.page)}
          title={collapsed ? item.label : undefined}
          className={`flex items-center gap-3 px-2 py-2 rounded-xl transition-all group text-sm font-medium ${
            isActive ? "bg-[#630027] text-white shadow-sm"
              : isAdmin ? "text-amber-600 hover:bg-amber-50"
              : isCargo ? "text-[#630027] hover:bg-[#630027]/5"
              : "text-gray-600 hover:bg-gray-50 hover:text-[#630027]"
          }`}>
          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : isAdmin ? "text-amber-500" : isCargo ? "text-[#630027]" : "text-gray-400 group-hover:text-[#630027]"}`} />
          {!collapsed && <span className="truncate leading-tight">{item.label}</span>}
        </Link>
      </motion.div>
    );
  };

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-gray-100 shadow-sm flex-shrink-0 transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}
      style={{ height: "calc(100vh - 4rem)", position: "sticky", top: "4rem" }}
    >
      {/* Toggle colapsar/expander */}
      <div className="flex justify-end px-2 pt-3 pb-1 flex-shrink-0">
        <button onClick={onToggle}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#630027] hover:bg-[#630027]/5 transition-colors"
          title={collapsed ? "Expandir menú" : "Colapsar menú"}>
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navegación con secciones */}
      <nav className="flex-1 px-2 pb-4 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={section.titulo} className={si > 0 ? "mt-3" : ""}>
            {!collapsed ? (
              <p className="px-2 py-1.5 text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                {section.titulo}
              </p>
            ) : (
              si > 0 && <div className="my-2 mx-2 border-t border-gray-100" />
            )}
            <div className="space-y-0.5">
              {section.items.map(renderItem)}
            </div>
          </div>
        ))}

        {/* Items extra (admin, cargos) que no encajan en secciones */}
        {extraItems.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-100 space-y-0.5">
            {extraItems.map(renderItem)}
          </div>
        )}
      </nav>

      {/* Footer con toggle de tema */}
      <div className={`border-t border-gray-100 p-2 flex ${collapsed ? "justify-center" : "justify-end"} flex-shrink-0`}>
        <ThemeToggle variant="sidebar" />
      </div>
    </aside>
  );
}