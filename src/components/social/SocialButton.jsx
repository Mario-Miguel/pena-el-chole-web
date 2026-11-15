import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "../auth/AuthContext";
import { ExternalLink, Pencil, Check, X, Copy, CheckCheck } from "lucide-react";

const DEFAULT_URLS = {
  instagram: "https://www.instagram.com",
  tiktok: "https://www.tiktok.com",
};

const LOGOS = {
  instagram: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.16 8.16 0 004.77 1.52V7.12a4.85 4.85 0 01-1-.43z" />
    </svg>
  ),
};

const GRADIENTS = {
  instagram: "from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]",
  tiktok: "from-[#010101] to-[#69C9D0]",
};

const CONFIG_KEYS = {
  instagram: "social_instagram_url",
  tiktok: "social_tiktok_url",
};

// Logo para el centro del QR
function QRLogo({ red }) {
  const bg = red === "instagram"
    ? "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)"
    : "linear-gradient(135deg, #010101, #69C9D0)";
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 36,
        height: 36,
        borderRadius: 8,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid white",
      }}
    >
      {LOGOS[red]}
    </div>
  );
}

export default function SocialButton({ red }) {
  const { sesion, puedeConfigurar } = useAuth();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(DEFAULT_URLS[red]);
  const [copiado, setCopiado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [urlEdit, setUrlEdit] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [configId, setConfigId] = useState(null);
  const ref = useRef(null);

  const cargarConfig = async () => {
    const configs = await base44.entities.AppConfig.filter({ clave: CONFIG_KEYS[red] });
    if (configs.length > 0) {
      setUrl(configs[0].valor || DEFAULT_URLS[red]);
      setConfigId(configs[0].id);
    }
  };

  useEffect(() => {
    if (open) cargarConfig();
  }, [open]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setEditando(false); } };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleGuardar = async () => {
    if (!urlEdit.trim()) return;
    setGuardando(true);
    if (configId) {
      await base44.entities.AppConfig.update(configId, { valor: urlEdit.trim() });
    } else {
      const nueva = await base44.entities.AppConfig.create({ clave: CONFIG_KEYS[red], valor: urlEdit.trim() });
      setConfigId(nueva.id);
    }
    setUrl(urlEdit.trim());
    setEditando(false);
    setGuardando(false);
  };

  const gradientClass = GRADIENTS[red];
  const label = red === "instagram" ? "Instagram" : "TikTok";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br ${gradientClass} hover:opacity-90 transition-opacity shadow-sm`}
        title={label}
      >
        {LOGOS[red]}
      </button>

      {open && (
        <div className="fixed left-1/2 -translate-x-1/2 top-16 w-72 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#363636] z-50 overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${gradientClass} px-4 py-3 flex items-center gap-2`}>
            {LOGOS[red]}
            <span className="font-bold text-white text-sm">{label}</span>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center px-4 pt-5 pb-3">
            <a href={url} target="_blank" rel="noopener noreferrer" className="relative inline-block hover:opacity-90 transition-opacity cursor-pointer" title={`Abrir ${label}`}>
              <QRCodeSVG
                value={url}
                size={180}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                level="H"
                includeMargin={true}
              />
              <QRLogo red={red} />
            </a>
            {/* Copiar enlace */}
            <button
              onClick={() => { navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}
              className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1 rounded-lg hover:bg-gray-50"
            >
              {copiado ? <><CheckCheck className="w-3.5 h-3.5 text-green-500" /><span className="text-green-500">¡Copiado!</span></> : <><Copy className="w-3.5 h-3.5" /> Copiar dirección</>}
            </button>

            {/* Enlace / Edición (solo admin) */}
            {puedeConfigurar && (
              <div className="w-full mt-3">
                {editando ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      className="flex-1 text-xs border border-gray-200 dark:border-[#363636] rounded-lg px-2 py-1.5 bg-white dark:bg-[#252525] text-gray-700 dark:text-gray-200 outline-none focus:border-[#630027]"
                      value={urlEdit}
                      onChange={e => setUrlEdit(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleGuardar(); if (e.key === "Escape") setEditando(false); }}
                      placeholder="https://..."
                    />
                    <button onClick={handleGuardar} disabled={guardando} className="p-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditando(false)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#333] text-gray-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setUrlEdit(url); setEditando(true); }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border border-dashed border-gray-200 dark:border-[#444] rounded-lg py-1.5 transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Editar enlace
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}