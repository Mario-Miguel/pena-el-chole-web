import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { createPageUrl } from "@/utils";

const PAGE_LABELS = {
  Inicio: "Inicio",
  Integrantes: "Integrantes",
  Calendario: "Calendario",
  Memoria: "Galería",
  Cuentas: "Cuentas y compras",
  Cerveza: "Cerveza",
  ToDo: "Tareas",
  Obra: "Obra",
  Almacen: "Almacén",
  Concurso: "Concurso",
  Resultados: "Resultados",
  Sugerencias: "Sugerencias",
  NotasPersonales: "Notas personales",
  Notificaciones: "Notificaciones",
  Chat: "Chat",
  Votaciones: "Votaciones",
  Ajustes: "Ajustes",
  Perfil: "Mi perfil",
  Admin: "Panel Admin",
  PanelCargos: "Mi área",
  Ayuda: "Ayuda",
};

export default function Breadcrumbs() {
  const location = useLocation();
  const currentPage = location.pathname.replace("/", "");

  if (!currentPage || currentPage === "Inicio" || !PAGE_LABELS[currentPage]) return null;

  const label = PAGE_LABELS[currentPage];

  return (
    <nav className="hidden md:flex items-center gap-1 px-4 py-1.5 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
      <Link to={createPageUrl("Inicio")} className="flex items-center gap-1 hover:text-[#630027] transition-colors">
        <Home className="w-3 h-3" />
        <span>Inicio</span>
      </Link>
      <ChevronRight className="w-3 h-3 text-gray-300" />
      <span className="font-medium text-[#630027]">{label}</span>
    </nav>
  );
}