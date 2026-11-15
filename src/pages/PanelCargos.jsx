import React, { useState } from "react";
import { useAuth } from "../components/auth/AuthContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Lock, ChevronDown } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import PanelPresidente from "../components/cargos/PanelPresidente";
import PanelTesorero from "../components/cargos/PanelTesorero";
import PanelSecretario from "../components/cargos/PanelSecretario";
import PanelVocal from "../components/cargos/PanelVocal";
import DashboardJunta from "../components/cargos/DashboardJunta";
import PanelPresupuesto from "../components/cargos/PanelPresupuesto";
import GestionSocios from "../components/socios/GestionSocios";

const CARGOS_PERMITIDOS = ["presidente", "vicepresidente", "secretario", "tesorero", "vocal"];

const INFO_CARGO = {
  presidente:     { titulo: "Área de Presidente",     sub: "Acceso completo",          emoji: "👑" },
  vicepresidente: { titulo: "Área de Vicepresidente", sub: "Apoyo a presidencia",       emoji: "🤝" },
  secretario:     { titulo: "Área de Secretario",     sub: "Actas, censo y registro",   emoji: "📋" },
  tesorero:       { titulo: "Área de Tesorero",        sub: "Finanzas y pagos",          emoji: "💰" },
  vocal:          { titulo: "Área de Vocal",           sub: "Tareas y organización",     emoji: "📣" },
};

export default function PanelCargos() {
  const { sesion } = useAuth();
  const cargo = sesion?.cargo;

  // Admin puede cambiar de cargo con el selector
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#630027]/10 flex items-center justify-center text-2xl flex-shrink-0">
          {info.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">
              {`Mi área de ${cargoEfectivo.charAt(0).toUpperCase() + cargoEfectivo.slice(1)}`}
            </h1>
            <HelpIcon section="cargos" />
          </div>
          <p className="text-gray-400 text-sm">{sesion?.nombre} · <span className="capitalize">{info.sub}</span></p>
        </div>
      </div>

      {/* Selector de cargo — solo para Admin */}
      {sesion?.esAdmin && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wider">Vista Admin — cambiar cargo</p>
          <div className="relative">
            <select
              value={cargoAdmin}
              onChange={e => setCargoAdmin(e.target.value)}
              className="w-full appearance-none bg-white border border-amber-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-300 pr-10"
            >
              {CARGOS_PERMITIDOS.map(c => (
                <option key={c} value={c}>
                  {INFO_CARGO[c].emoji} {INFO_CARGO[c].titulo}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-amber-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Tabs para presidente/vicepresidente */}
      {(cargoEfectivo === "presidente" || cargoEfectivo === "vicepresidente") && (
        <>
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
            {[
              { key: "dashboard",   label: "📊 Dashboard" },
              { key: "panel",       label: "📋 Panel" },
              { key: "presupuesto", label: "💰 Presupuesto" },
              { key: "socios",      label: "👥 Socios" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTabActiva(t.key)}
                className={`flex-shrink-0 flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  tabActiva === t.key
                    ? "bg-[#630027] text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-[#630027]/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tabActiva === "dashboard"   && <DashboardJunta />}
          {tabActiva === "panel"       && <PanelPresidente />}
          {tabActiva === "presupuesto" && <PanelPresupuesto />}
          {tabActiva === "socios"      && <GestionSocios />}
        </>
      )}
      {(cargoEfectivo === "tesorero" || cargoEfectivo === "secretario") && (
        <>
          <div className="flex gap-2 mb-5">
            {[
              { key: "panel",       label: cargoEfectivo === "tesorero" ? "💰 Panel" : "📋 Panel" },
              { key: "presupuesto", label: "💰 Presupuesto" },
              { key: "socios",      label: "👥 Socios" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTabActiva(t.key)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  tabActiva === t.key
                    ? "bg-[#630027] text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-[#630027]/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tabActiva === "panel" && cargoEfectivo === "tesorero" && <PanelTesorero soloLectura={false} />}
          {tabActiva === "panel" && cargoEfectivo === "secretario" && <PanelSecretario />}
          {tabActiva === "presupuesto" && <PanelPresupuesto />}
          {tabActiva === "socios"      && <GestionSocios />}
        </>
      )}
      {cargoEfectivo === "vocal" && <PanelVocal />}
    </div>
  );
}