import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, Pencil, Check, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSavedMenuOrder, ALL_PAGES, EXTRA_HELP_PAGES } from "../../lib/menuConfig";
import { useAuth } from "../auth/AuthContext";

export const LS_KEY = "pena_drawer_apps_v1";

export function getSelectedApps() {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (s) {
      let arr = JSON.parse(s);
      // Auto-añadir cualquier página nueva que aún no esté en la lista guardada
      const allPageNames = ALL_PAGES.map(p => p.page);
      let changed = false;
      allPageNames.forEach(p => {
        if (!arr.includes(p)) { arr = [...arr, p]; changed = true; }
      });
      if (changed) localStorage.setItem(LS_KEY, JSON.stringify(arr));
      return arr;
    }
  } catch {}
  // Primera vez: todas las páginas activadas
  return ALL_PAGES.map(p => p.page);
}

export function saveSelectedApps(ids) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("drawerAppsChanged"));
}

const SIZE_MAP = { sm: 26, md: 34, lg: 44, xl: 54 };

export default function AppDrawer({ openUp = false }) {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(() => getSelectedApps());

  // Recargar cuando Ajustes cambie la selección
  useEffect(() => {
    const onUpdate = () => setSelected(getSelectedApps());
    window.addEventListener("drawerAppsChanged", onUpdate);
    return () => window.removeEventListener("drawerAppsChanged", onUpdate);
  }, []);
  const [iconSize, setIconSize] = useState(() => {
    const s = localStorage.getItem("pena_drawer_icon_size") || "xl";
    return SIZE_MAP[s] || 54;
  });
  const { sesion, integrantes: integrantesCtx } = useAuth();
  const esAdmin = sesion?.esAdmin === true;
  const CARGOS_LIST = ["presidente", "vicepresidente", "secretario", "tesorero", "vocal"];
  const miIntegrante = (integrantesCtx || []).find(i => i.nombre === sesion?.nombre);
  const esCargo = miIntegrante && CARGOS_LIST.includes(miIntegrante.cargo);

  useEffect(() => {
    const update = () => {
      const s = localStorage.getItem("pena_drawer_icon_size") || "xl";
      setIconSize(SIZE_MAP[s] || 54);
    };
    window.addEventListener("drawerIconSizeChanged", update);
    return () => window.removeEventListener("drawerIconSizeChanged", update);
  }, []);

  const close = () => { setOpen(false); setEditMode(false); };

  // Emoji de fallback por nombre de página en caso de que no esté en ALL_PAGES
  const EMOJI_FALLBACK = {
    "chat": "💬", "memoria": "📚", "calendario": "📅", "loteria": "🎫",
    "tickets": "🧾", "finanzas": "💰", "tesoreria": "💼", "cerveza": "🍺",
    "almacen": "📦", "vehiculos": "🚛", "desfile": "🎪", "integrantes": "👥",
    "organizacion": "🗓️", "actividades": "🎯", "comunidad": "💬",
    "seguridad": "🚑", "herramientas": "🛠️", "enlaces": "🔗",
    "datospena": "🏛️", "perfil": "👤", "ajustes": "⚙️", "ayuda": "❓",
    "inicio": "🏠", "admin": "🛡️", "gestioncargos": "💼",
    "notaspersonales": "📝", "notificaciones": "🔔",
  };

  const getPageEntry = (name) => {
    const found = ALL_PAGES.find(p => p.page === name);
    if (found) return found;
    // Página no registrada en ALL_PAGES: construir entrada mínima con emoji por nombre
    const key = name.toLowerCase().replace(/[^a-z]/g, "");
    const emoji = EMOJI_FALLBACK[key] || "📌";
    return { page: name, label: name, emoji };
  };

  const orderedPageNames = getSavedMenuOrder();
  const allPages = orderedPageNames
    .map(name => ALL_PAGES.find(p => p.page === name))
    .filter(Boolean);

  const visiblePages = allPages.filter(p => selected.includes(p.page));

  const togglePage = (pageName) => {
    const current = [...selected];
    const next = current.includes(pageName)
      ? current.filter(p => p !== pageName)
      : [...current, pageName];
    setSelected(next);
    saveSelectedApps(next);
  };

  const resetToAll = () => {
    const all = ALL_PAGES.map(p => p.page);
    setSelected(all);
    saveSelectedApps(all);
  };

  const isSelected = (pageName) => selected.includes(pageName);

  const toggleOpen = (e) => { e.stopPropagation(); setOpen(v => !v); };

  // Páginas extra que deben aparecer según el rol
  const extraPages = [];
  if (esAdmin) extraPages.push(EXTRA_HELP_PAGES.find(p => p.page === "Admin"));
  if (esAdmin || esCargo) extraPages.push(EXTRA_HELP_PAGES.find(p => p.page === "GestionCargos"));
  const extraPagesFiltered = extraPages.filter(Boolean);

  // Todas las páginas para modo edición (sin extras)
  const allPagesForEdit = allPages;
  // Páginas visibles en el cajón = visiblePages normales + extras de rol
  const drawerPages = [...visiblePages, ...extraPagesFiltered.filter(ep => !visiblePages.some(p => p.page === ep.page))];

  return (
    <div>
      {/* Botón del cajón */}
      <button
        onClick={toggleOpen}
        style={{ width: iconSize + 16, height: "48px" }}
        className={`flex items-center justify-center rounded-xl transition-colors text-gray-400 ${open ? "bg-[#630027]/10" : "hover:bg-[#630027]/5"}`}
        title="Cajón de apps"
        aria-label="Cajón de apps"
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
          <rect x="2"  y="2"  width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.7"/>
          <rect x="11" y="2"  width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.7"/>
          <rect x="2"  y="11" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.7"/>
          <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.7"/>
        </svg>
      </button>

      {open && createPortal(
        /* Backdrop full-screen con flex centering */
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 9998, background: "rgba(0,0,0,0.4)" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
          onTouchStart={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              style={{ zIndex: 9999 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-4 max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {editMode ? "Editar cajón de apps" : "Todas las secciones"}
                </p>
                <div className="flex items-center gap-1">
                  {editMode ? (
                    <>
                      <button onClick={resetToAll} title="Mostrar todas" className="p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditMode(false)} className="p-1 rounded-lg bg-[#630027]/10 text-[#630027] hover:bg-[#630027]/20 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setEditMode(true)} title="Editar" className="p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={close} className="p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editMode ? (
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {allPages.map(page => {
                    const on = isSelected(page.page);
                    return (
                      <button
                        key={page.page}
                        onClick={() => togglePage(page.page)}
                        className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-colors text-left ${on ? "bg-[#630027]/5" : "hover:bg-gray-50"}`}
                      >
                        <span className="text-lg leading-none w-6 text-center">{page.emoji}</span>
                        <span className={`flex-1 text-xs font-medium ${on ? "text-gray-700" : "text-gray-300"}`}>{page.label}</span>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${on ? "bg-[#630027] border-[#630027]" : "border-gray-200"}`}>
                          {on && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                visiblePages.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center py-6">
                    Sin apps seleccionadas.<br />
                    <button onClick={() => setEditMode(true)} className="text-[#630027] underline mt-1">Editar</button>
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {drawerPages.map(page => (
                      <Link
                        key={page.page}
                        to={createPageUrl(page.page)}
                        onClick={close}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#630027]/5 transition-colors group"
                      >
                        <span className="text-2xl leading-none">{page.emoji}</span>
                        <span className="text-[10px] font-medium text-gray-500 group-hover:text-[#630027] text-center leading-tight line-clamp-2">
                          {page.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                )
              )}

              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-[10px] text-gray-300 hover:text-[#630027] text-center mt-3 w-full block transition-colors"
                >
                  ✏️ Editar contenido del cajón
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}
    </div>
  );
}