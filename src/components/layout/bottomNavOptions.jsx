import {
  Home, Users, MessageCircle,
  BookOpen, Beer, Package, PartyPopper,
  StickyNote, Bell, Truck, Link as LinkIcon,
  FolderOpen, Settings, HelpCircle,
  Coins, Hammer, HeartPulse, Users2, ClipboardList,
  BarChart2, FileText, User, BookOpen as BookIcon, Compass
} from "lucide-react";
import { ALL_PAGES, getSavedMenuOrder } from "../../lib/menuConfig";

export const BOTTOM_NAV_KEY = "pena_bottom_nav";

// Mapa de iconos por page key (mismo que HamburgerMenu)
const ICON_MAP = {
  Inicio: Home,
  Integrantes: Users,
  Cerveza: Beer,
  Organizacion: ClipboardList,
  Almacen: Package,
  Vehiculos: Truck,
  Desfile: PartyPopper,
  Finanzas: Coins,
  Secretaria: FolderOpen,
  Comunidad: Users2,
  Herramientas: Hammer,
  Seguridad: HeartPulse,
  Enlaces: LinkIcon,
  Notificaciones: Bell,
  NotasPersonales: StickyNote,
  Chat: MessageCircle,
  Memoria: BookOpen,
  Votaciones: BarChart2,
  Ajustes: Settings,
  Ayuda: HelpCircle,
  Perfil: User,
  Contabilidad: BookIcon,
  TourGuia: Compass,
};

// Genera la lista de opciones a partir de ALL_PAGES (fuente de verdad)
// Recibe opcionalmente las páginas desactivadas para filtrarlas
export function buildNavOptions(disabledPages = []) {
  const order = getSavedMenuOrder();
  return order
    .filter(p => !disabledPages.includes(p))
    .map(p => {
      const info = ALL_PAGES.find(x => x.page === p);
      if (!info) return null;
      return {
        key: p,
        label: info.label,
        icon: ICON_MAP[p] || FileText,
        path: `/${p}`,
      };
    })
    .filter(Boolean);
}

// Compatibilidad: lista estática usada como fallback
export const ALL_NAV_OPTIONS = buildNavOptions([]);

export const DEFAULT_NAV = ["Inicio", "Integrantes", "Almacen", "Comunidad", "Chat"];

export function getNavItems() {
  try {
    const saved = localStorage.getItem(BOTTOM_NAV_KEY);
    if (saved) {
      const keys = JSON.parse(saved);
      const allOpts = buildNavOptions([]);
      const items = keys.map(k => allOpts.find(o => o.key === k)).filter(Boolean);
      if (items.length >= 2) return items;
    }
  } catch {}
  return DEFAULT_NAV.map(k => buildNavOptions([]).find(o => o.key === k)).filter(Boolean);
}