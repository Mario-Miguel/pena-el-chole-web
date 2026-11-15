import React from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { createPageUrl } from "@/utils";

const PAGE_TO_SECTION = {
  Inicio: "inicio",
  Integrantes: "integrantes",
  Calendario: "calendario",
  Memoria: "galeria",
  Cuentas: "cuentas",
  Cerveza: "cerveza",
  ToDo: "tareas",
  Obra: "obra",
  Almacen: "almacen",
  Concurso: "concurso",
  Resultados: "resultados",
  Sugerencias: "sugerencias",
  NotasPersonales: "notas",
  Notificaciones: "notificaciones",
  Chat: "chat",
  Votaciones: "votaciones",
  Perfil: "perfil",
  Ajustes: "ajustes",
  Admin: "admin",
  PanelCargos: "cargos",
};

export default function HelpButton({ pageName }) {
  const navigate = useNavigate();
  const sectionId = PAGE_TO_SECTION[pageName];
  if (!sectionId) return null;

  const handleClick = () => {
    navigate(`${createPageUrl("Ayuda")}#${sectionId}`);
  };

  return (
    <button
      onClick={handleClick}
      title="Ver ayuda de esta sección"
      className="w-5 h-5 rounded-full flex items-center justify-center hover:opacity-100 transition-opacity flex-shrink-0 opacity-60"
      aria-label="Ayuda"
    >
      <Info className="w-4 h-4 text-white" />
    </button>
  );
}