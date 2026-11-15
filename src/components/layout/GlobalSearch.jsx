import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Eraser, Users, FileText, LayoutGrid } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ALL_PAGES } from "../../lib/menuConfig";
import { motion, AnimatePresence } from "framer-motion";

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [integrantes, setIntegrantes] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Cargar datos en background al abrir
  const loadData = useCallback(async () => {
    if (integrantes.length > 0) return;
    setLoading(true);
    const [ints, docs] = await Promise.all([
      base44.entities.Integrante.list(),
      base44.entities.Documento.list(),
    ]);
    setIntegrantes(ints);
    setDocumentos(docs);
    setLoading(false);
  }, [integrantes.length]);

  useEffect(() => {
    if (open) {
      loadData();
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  // Atajos de teclado
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const q = query.trim().toLowerCase();

  // Subapartados: secciones dentro de páginas contenedor
  const SUB_SECTIONS = [
    { label: "Votaciones", emoji: "🗳️", parent: "Comunidad", parentLabel: "Comunidad" },
    { label: "Sugerencias", emoji: "💡", parent: "Comunidad", parentLabel: "Comunidad" },
    { label: "Libro de Caja", emoji: "📒", parent: "Finanzas", parentLabel: "Finanzas" },
    { label: "Cuotas", emoji: "💳", parent: "Finanzas", parentLabel: "Finanzas" },
    { label: "Presupuesto", emoji: "📊", parent: "Finanzas", parentLabel: "Finanzas" },
    { label: "Tareas", emoji: "✅", parent: "Organizacion", parentLabel: "Organización" },
    { label: "Grupos de trabajo", emoji: "👷", parent: "Organizacion", parentLabel: "Organización" },
    { label: "Plazos", emoji: "📅", parent: "Organizacion", parentLabel: "Organización" },
    { label: "Actas de reunión", emoji: "📋", parent: "Secretaria", parentLabel: "Secretaría" },
    { label: "Documentación", emoji: "🗂️", parent: "Secretaria", parentLabel: "Secretaría" },
    { label: "Obra", emoji: "🎪", parent: "Desfile", parentLabel: "Desfile" },
    { label: "Concurso", emoji: "🏆", parent: "Desfile", parentLabel: "Desfile" },
    { label: "Resultados", emoji: "🥇", parent: "Desfile", parentLabel: "Desfile" },
    { label: "Notas personales", emoji: "📝", parent: "Perfil", parentLabel: "Mi perfil" },
  ];

  const subResults = q.length >= 2
    ? SUB_SECTIONS.filter(s => s.label.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const menuResults = q.length >= 1
    ? ALL_PAGES.filter(p => p.label.toLowerCase().includes(q) || p.page.toLowerCase().includes(q)).slice(0, 5)
    : [];

  const integrantesResults = q.length >= 2
    ? integrantes.filter(i => i.nombre?.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const documentosResults = q.length >= 2
    ? documentos.filter(d => d.nombre?.toLowerCase().includes(q) || d.descripcion?.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const hasResults = menuResults.length > 0 || subResults.length > 0 || integrantesResults.length > 0 || documentosResults.length > 0;
  const showPanel = open && query.length >= 1;

  const goTo = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* Botón de búsqueda en el header */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl px-3 py-1.5 text-sm transition-colors"
        title="Buscar (Ctrl+K)"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline text-white/70 text-xs">Buscar…</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[70] backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="fixed top-4 left-4 right-4 w-auto max-w-lg z-[80] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden mx-auto"
              style={{ maxWidth: "min(32rem, calc(100vw - 2rem))" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar integrantes, documentos, secciones…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent"
                />
                {query && (
                  <button
                    type="button"
                    onPointerDown={e => { e.stopPropagation(); e.preventDefault(); setQuery(""); }}
                    className="text-gray-400 hover:text-gray-600"
                    title="Borrar texto"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onPointerDown={e => { e.stopPropagation(); e.preventDefault(); setOpen(false); }}
                  className="text-gray-300 hover:text-gray-500 ml-1"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Resultados */}
              {showPanel && (
                <div className="max-h-[60vh] overflow-y-auto">
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
                    </div>
                  )}

                  {!loading && !hasResults && (
                    <p className="text-center text-gray-400 text-sm py-8">Sin resultados para "{query}"</p>
                  )}

                  {/* Subapartados */}
                  {subResults.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <LayoutGrid className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Apartados</span>
                      </div>
                      {subResults.map(s => (
                        <button
                          key={s.label}
                          onClick={() => goTo(createPageUrl(s.parent))}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#630027]/5 transition-colors text-left"
                        >
                          <span className="text-xl w-7 text-center">{s.emoji}</span>
                          <div>
                            <span className="text-sm font-medium text-gray-700">{highlight(s.label, query)}</span>
                            <span className="text-xs text-gray-400 ml-2">en {s.parentLabel}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Secciones del menú */}
                  {menuResults.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <LayoutGrid className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Secciones</span>
                      </div>
                      {menuResults.map(p => (
                        <button
                          key={p.page}
                          onClick={() => goTo(createPageUrl(p.page))}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#630027]/5 transition-colors text-left"
                        >
                          <span className="text-xl w-7 text-center">{p.emoji}</span>
                          <span className="text-sm font-medium text-gray-700">{highlight(p.label, query)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Integrantes */}
                  {integrantesResults.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Integrantes</span>
                      </div>
                      {integrantesResults.map(i => (
                        <button
                          key={i.id}
                          onClick={() => goTo(createPageUrl("Integrantes"))}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#630027]/5 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#630027]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#630027] font-bold text-xs">{i.nombre?.[0]?.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">{highlight(i.nombre, query)}</p>
                            {i.cargo && <p className="text-xs text-gray-400 capitalize">{i.cargo}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Documentos */}
                  {documentosResults.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documentos</span>
                      </div>
                      {documentosResults.map(d => (
                        <button
                          key={d.id}
                          onClick={() => goTo(createPageUrl("GestionDocumental"))}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#630027]/5 transition-colors text-left"
                        >
                          <FileText className="w-5 h-5 text-gray-300 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{highlight(d.nombre, query)}</p>
                            {d.tipo && <p className="text-xs text-gray-400 capitalize">{d.tipo}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="px-4 py-2 border-t border-gray-50">
                    <p className="text-xs text-gray-300 text-center">Ctrl+K para abrir · Esc para cerrar</p>
                  </div>
                </div>
              )}

              {/* Estado inicial */}
              {open && query.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Escribe para buscar integrantes, documentos o secciones</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}