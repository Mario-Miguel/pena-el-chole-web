import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Info } from "lucide-react";
import { createPageUrl } from "@/utils";
import { getPageConfig } from "../../lib/menuConfig";

/**
 * Icono de información que lleva a la sección de Ayuda correspondiente.
 *
 * Uso con sección explícita:  <HelpIcon section="almacen" />
 * Uso automático (detecta página actual): <HelpIcon />
 */
export default function HelpIcon({ section }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Si no se pasa section, intentar detectar la página actual
  let helpId = section;
  if (!helpId) {
    const pageName = location.pathname.replace("/", "");
    const cfg = getPageConfig(pageName);
    helpId = cfg?.helpId || null;
  }

  if (!helpId) return null;

  return (
    <button
      onClick={() => navigate(`${createPageUrl("Ayuda")}#${helpId}`)}
      title="Ver ayuda de esta sección"
      className="text-gray-300 hover:text-[#630027] transition-colors flex-shrink-0"
      aria-label="Ayuda"
    >
      <Info className="w-5 h-5" />
    </button>
  );
}