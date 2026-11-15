import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, Cake, Beer, Users, Key, ShieldCheck, ShieldOff } from "lucide-react";

const CATEGORIA_LABELS = {
  cargos: "Cargo", socios: "Socio", contribuyentes: "Contribuyente",
  socios_honorificos: "Socio Honorífico", patitas: "Patitas de la Peña",
};

const CARGO_LABELS = {
  presidente: "Presidente", vicepresidente: "Vicepresidente",
  secretario: "Secretario", tesorero: "Tesorero", vocal: "Vocal",
};

export default function PerfilIntegrante({ integrante, sesion, onClose }) {
  const getIniciales = (nombre) => nombre ? nombre.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "?";

  const fmtFecha = (fn) => {
    if (!fn) return null;
    const p = fn.split("-");
    if (p.length !== 3) return fn;
    const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
    const label = `${parseInt(p[2])} de ${meses[parseInt(p[1])-1]}`;
    return p[0] !== "0000" ? `${label} de ${p[0]}` : label;
  };

  return (
    <AnimatePresence>
      {integrante && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto pointer-events-auto">
              {/* Header */}
              <div className="relative bg-[#630027] px-5 py-6 rounded-t-2xl">
                <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center overflow-hidden mb-3">
                    {sesion?.avatar_url
                      ? <img src={sesion.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-white text-2xl font-black">{getIniciales(integrante.nombre)}</span>}
                  </div>
                  <h2 className="text-white text-xl font-black text-center">{integrante.nombre}</h2>
                  {integrante.cargo && (
                    <p className="text-white/80 text-sm capitalize mt-0.5">⚜️ {CARGO_LABELS[integrante.cargo]}</p>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-5 space-y-3">
                <InfoRow icon={Users} label="Categoría" value={CATEGORIA_LABELS[integrante.categoria] || integrante.categoria} />
                {integrante.cervezas !== undefined && (
                  <InfoRow icon={Beer} label="Cervezas consumidas" value={`${integrante.cervezas || 0}`} />
                )}
                {integrante.fecha_nacimiento && (
                  <InfoRow icon={Cake} label="Cumpleaños" value={fmtFecha(integrante.fecha_nacimiento)} />
                )}
                {integrante.telefono && (
                  <InfoRow icon={Phone} label="Teléfono" value={integrante.telefono} />
                )}
                {integrante.email && (
                  <InfoRow icon={Mail} label="Email" value={integrante.email} />
                )}

                {sesion ? (
                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" /> Acceso
                    </p>
                    <InfoRow icon={sesion.disabled ? ShieldOff : ShieldCheck} label="Usuario" value={`@${sesion.usuario || integrante.nombre}`} />
                    <InfoRow icon={sesion.disabled ? ShieldOff : ShieldCheck} label="Estado" value={sesion.disabled ? "Desactivado" : "Activo"}
                      valueClass={sesion.disabled ? "text-red-500" : "text-green-500"} />
                  </div>
                ) : (
                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-300 italic">Sin acceso configurado</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoRow({ icon: Icon, label, value, valueClass = "" }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className={`text-sm font-semibold text-gray-700 truncate ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}