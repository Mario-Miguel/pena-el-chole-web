import { useLocation } from "react-router-dom";
import {
  Users, CalendarDays, BookOpen, Beer, ListChecks,
  Theater, Archive, Trophy, Medal, FileText, StickyNote,
  Bell, MessageSquare, BarChart2, Settings, User, Shield,
  HelpCircle, Briefcase, PiggyBank, CreditCard, Truck,
  Link as LinkIcon, UsersRound, FolderOpen, Wallet,
  Wrench, ShieldCheck, MessagesSquare, Vote,
  Hammer, HeartPulse, Users2, ClipboardList
} from "lucide-react";

const PAGE_MAP = {
  Inicio:          { label: "Inicio",               icon: BookOpen },
  Integrantes:     { label: "Integrantes",           icon: Users },
  Calendario:      { label: "Calendario",            icon: CalendarDays },
  Memoria:         { label: "Galería",               icon: BookOpen },
  Cerveza:         { label: "Cerveza",               icon: Beer },
  Almacen:         { label: "Inventario y compras",  icon: Archive },
  Organizacion:    { label: "Organización",          icon: ClipboardList },
  Vehiculos:       { label: "Vehículos",             icon: Truck },
  Desfile:         { label: "Desfile",               icon: Trophy },
  Finanzas:        { label: "Finanzas",              icon: PiggyBank },
  Secretaria:      { label: "Secretaría",            icon: FolderOpen },
  Comunidad:       { label: "Comunidad",             icon: Users2 },
  Chat:            { label: "Chat",                  icon: MessageSquare },
  Notificaciones:  { label: "Notificaciones",        icon: Bell },
  NotasPersonales: { label: "Notas personales",      icon: StickyNote },
  Ajustes:         { label: "Ajustes",               icon: Settings },
  Perfil:          { label: "Mi perfil",             icon: User },
  Admin:           { label: "Administración",        icon: Shield },
  PanelCargos:     { label: "Panel de cargos",       icon: Briefcase },
  Ayuda:           { label: "Ayuda",                 icon: HelpCircle },
  Herramientas:    { label: "Herramientas",          icon: Hammer },
  Seguridad:       { label: "Seguridad",             icon: HeartPulse },
  Enlaces:         { label: "Enlaces útiles",        icon: LinkIcon },
  GruposTrabajo:   { label: "Grupos de trabajo",     icon: UsersRound },
  LibroCaja:       { label: "Libro de Cuentas",      icon: CreditCard },
  GestionDocumental:{ label: "Documentación",        icon: FileText },
  ActasReunion:    { label: "Actas de Reunión",      icon: FileText },
  Sugerencias:     { label: "Sugerencias",           icon: FileText },
  Votaciones:      { label: "Votaciones",           icon: BarChart2 },
  Logros:          { label: "Logros",               icon: Medal },
  };

export default function PageTitle() {
  const location = useLocation();
  const pathKey = location.pathname.replace("/", "");
  const page = PAGE_MAP[pathKey];

  if (!page || pathKey === "Inicio") return null;

  const Icon = page.icon;

  return (
    <span className="flex items-center gap-1.5 text-white/90 text-sm font-semibold">
      <Icon size={14} strokeWidth={2} className="text-white/70" />
      {page.label}
    </span>
  );
}