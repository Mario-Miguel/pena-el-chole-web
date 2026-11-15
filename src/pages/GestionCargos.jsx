import React, { useState } from "react";
import { useAuth } from "../components/auth/AuthContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Lock, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import HelpIcon from "../components/layout/HelpIcon";

// Paneles de cargo existentes
import PanelPresidente from "../components/cargos/PanelPresidente";
import PanelTesorero from "../components/cargos/PanelTesorero";
import PanelSecretario from "../components/cargos/PanelSecretario";
import PanelVocal from "../components/cargos/PanelVocal";
import DashboardJunta from "../components/cargos/DashboardJunta";
import PanelPresupuesto from "../components/cargos/PanelPresupuesto";
import GestionSocios from "../components/socios/GestionSocios";
import CumpleanosPanel from "../components/integrantes/CumpleanosPanel";
import CuotasContent from "../components/finanzas/CuotasContent";

// Secretaría (documentos + actas)
import GestionDocumentalContent from "../components/secretaria/GestionDocumentalContent";
import ActasReunionContent from "../components/secretaria/ActasReunionContent";

// Nueva guía de obligaciones
import GuiaObligaciones from "../components/cargos/GuiaObligaciones";
import HerramientasCargo from "../components/cargos/HerramientasCargo";
import VotacionesContent from "../components/comunidad/VotacionesContent";

const CARGOS_PERMITIDOS = ["presidente", "vicepresidente", "secretario", "tesorero", "vocal"];

const INFO_CARGO = {
  presidente:     { titulo: "Presidente",     sub: "Acceso completo y representación legal", emoji: "👑" },
  vicepresidente: { titulo: "Vicepresidente",  sub: "Apoyo a presidencia y coordinación",     emoji: "🤝" },
  secretario:     { titulo: "Secretario",      sub: "Actas, censo, documentos y registro",    emoji: "📋" },
  tesorero:       { titulo: "Tesorero",         sub: "Finanzas, pagos y contabilidad",         emoji: "💰" },
  vocal:          { titulo: "Vocal",            sub: "Tareas, comisiones y organización",      emoji: "📣" },
};

// Tabs disponibles por cargo (simplificado, sin redundancias)
const TABS_POR_CARGO = {
  presidente: [
    { key: "panel",        label: "📊 Panel" },
    { key: "herramientas", label: "🛠️ Herramientas" },
    { key: "votaciones",   label: "🗳️ Votaciones" },
    { key: "cuotas",       label: "💳 Cuotas" },
    { key: "socios",       label: "👥 Socios" },
    { key: "documentos",   label: "📄 Documentos" },
    { key: "actas",        label: "📝 Actas" },
    { key: "obligaciones", label: "⚖️ Obligaciones" },
  ],
  vicepresidente: [
    { key: "panel",        label: "📊 Panel" },
    { key: "herramientas", label: "🛠️ Herramientas" },
    { key: "votaciones",   label: "🗳️ Votaciones" },
    { key: "cuotas",       label: "💳 Cuotas" },
    { key: "socios",       label: "👥 Socios" },
    { key: "documentos",   label: "📄 Documentos" },
    { key: "actas",        label: "📝 Actas" },
    { key: "obligaciones", label: "⚖️ Obligaciones" },
  ],
  secretario: [
    { key: "panel",        label: "📋 Panel" },
    { key: "herramientas", label: "🛠️ Herramientas" },
    { key: "votaciones",   label: "🗳️ Votaciones" },
    { key: "actas",        label: "📝 Actas" },
    { key: "documentos",   label: "📄 Documentos" },
    { key: "socios",       label: "👥 Socios" },
    { key: "obligaciones", label: "⚖️ Obligaciones" },
  ],
  tesorero: [
    { key: "panel",        label: "💰 Panel" },
    { key: "herramientas", label: "🛠️ Herramientas" },
    { key: "cuotas",       label: "💳 Cuotas" },
    { key: "documentos",   label: "📄 Documentos" },
    { key: "obligaciones", label: "⚖️ Obligaciones" },
  ],
  vocal: [
    { key: "panel",        label: "📣 Panel" },
    { key: "herramientas", label: "🛠️ Herramientas" },
    { key: "obligaciones", label: "⚖️ Obligaciones" },
  ],
};

export default function GestionCargos() {
  const { sesion } = useAuth();
  const cargo = sesion?.cargo;

  const [cargoAdmin, setCargoAdmin] = useState("presidente");
  const cargoEfectivo = sesion?.esAdmin ? cargoAdmin : cargo;
  const [tabActiva, setTabActiva] = useState("panel");

  if (!sesion?.esAdmin && (!cargoEfectivo || !CARGOS_PERMITIDOS.includes(cargoEfectivo))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4 px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Lock className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-500 font-semibold">Acceso restringido</p>
        <p className="text-gray-400 text-sm text-center">Este panel es exclusivo para los cargos de la peña</p>
        <Link to={createPageUrl("Inicio")} className="text-[#4B1924] underline text-sm">Volver al inicio</Link>
      </div>
    );
  }

  const info = INFO_CARGO[cargoEfectivo] || INFO_CARGO["presidente"];
  const tabs = TABS_POR_CARGO[cargoEfectivo] || TABS_POR_CARGO["presidente"];

  // Reset tab si no existe en el nuevo cargo
  const tabDisponible = tabs.find(t => t.key === tabActiva) ? tabActiva : tabs[0]?.key || "panel";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4 mb-6"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#630027]/10 flex items-center justify-center text-2xl flex-shrink-0">
          {info.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-[#630027]">
              Área de {info.titulo}
            </h1>
            <HelpIcon section="cargos" />
          </div>
          <p className="text-gray-400 text-sm">{sesion?.nombre} · {info.sub}</p>
        </div>
      </motion.div>

      {/* Selector Admin */}
      {sesion?.esAdmin && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wider">Vista Admin — cambiar cargo</p>
          <div className="relative">
            <select
              value={cargoAdmin}
              onChange={e => { setCargoAdmin(e.target.value); setTabActiva("panel"); }}
              className="w-full appearance-none bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300 pr-10"
            >
              {CARGOS_PERMITIDOS.map(c => (
                <option key={c} value={c}>{INFO_CARGO[c].emoji} {INFO_CARGO[c].titulo}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-amber-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Tabs del cargo */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-none">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTabActiva(t.key)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              tabDisponible === t.key
                ? "bg-[#630027] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-500 hover:border-[#630027]/30"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido por tab */}
      <motion.div
        key={`${cargoEfectivo}-${tabDisponible}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Tabs comunes a varios cargos */}
        {tabDisponible === "herramientas" && <HerramientasCargo cargo={cargoEfectivo} />}
        {tabDisponible === "presupuesto" && <PanelPresupuesto />}
        {tabDisponible === "socios" && <GestionSocios />}
        {tabDisponible === "documentos" && <GestionDocumentalContent puedeEditar={true} />}
        {tabDisponible === "actas" && <ActasReunionContent />}
        {tabDisponible === "obligaciones" && (
          <GuiaObligaciones cargoActivo={cargoEfectivo} />
        )}
        {tabDisponible === "cumpleanos" && (
          <CumpleanosPanel puedeEditar={sesion?.esAdmin || cargoEfectivo === "secretario" || cargoEfectivo === "presidente" || cargoEfectivo === "vicepresidente"} />
        )}
        {tabDisponible === "cuotas" && <CuotasContent />}
        {tabDisponible === "votaciones" && <VotacionesContent />}

        {/* Paneles propios de cada cargo */}
        {tabDisponible === "panel" && (cargoEfectivo === "presidente" || cargoEfectivo === "vicepresidente") && (
          <DashboardJunta />
        )}
        {tabDisponible === "panel" && cargoEfectivo === "secretario" && <PanelSecretario />}
        {tabDisponible === "panel" && cargoEfectivo === "tesorero" && <PanelTesorero soloLectura={false} />}
        {tabDisponible === "panel" && cargoEfectivo === "vocal" && <PanelVocal />}
      </motion.div>
    </div>
  );
}