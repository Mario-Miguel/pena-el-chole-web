import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, ChevronDown, Search, ArrowRightLeft } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import AddMemberDialog from "../components/integrantes/AddMemberDialog";
import MascotasPanel from "../components/integrantes/MascotasPanel";
import ConfirmDialog from "../components/ConfirmDialog";
import PerfilIntegrante from "../components/integrantes/PerfilIntegrante";
import { useAuth } from "../components/auth/AuthContext";

const CATEGORIAS = [
{ key: "cargos", label: "Cargos", color: "bg-[#4B1924]", emoji: "⚜️" },
{ key: "socios", label: "Socios", color: "bg-amber-600", emoji: "🤝" },
{ key: "contribuyentes", label: "Contribuyentes", color: "bg-emerald-700", emoji: "💚" },
{ key: "socios_honorificos", label: "Socios Honoríficos", color: "bg-indigo-700", emoji: "🏅" },
{ key: "patitas", label: "Patitas de la Peña", color: "bg-pink-600", emoji: "🐾" }];


const CARGO_LABELS = {
  presidente: "Presidente",
  vicepresidente: "Vicepresidente",
  secretario: "Secretario",
  tesorero: "Tesorero",
  vocal: "Vocal"
};

const CARGO_ORDER = ["presidente", "vicepresidente", "secretario", "tesorero", "vocal"];

export default function Integrantes() {
  const { sesion } = useAuth();
  const puedeGestionar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";
  const [integrantes, setIntegrantes] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCategoria, setDialogCategoria] = useState(null);
  const [expanded, setExpanded] = useState({ cargos: false, socios: false, contribuyentes: false, socios_honorificos: false, patitas: false });
  const [busqueda, setBusqueda] = useState("");
  const [confirmEliminar, setConfirmEliminar] = useState(null); // { id, nombre }
  const [perfilIntegrante, setPerfilIntegrante] = useState(null);
  const [moverDialog, setMoverDialog] = useState(null); // { integrante }
  const [categoriaNueva, setCategoriaNueva] = useState("");

  const loadIntegrantes = async () => {
    const data = await base44.entities.Integrante.list();
    setIntegrantes(data);
    setLoading(false);
  };

  useEffect(() => {
    loadIntegrantes();
    base44.entities.SesionUsuario.list().then(setSesiones);
    const interval = setInterval(() => {
      loadIntegrantes();
      base44.entities.SesionUsuario.list().then(setSesiones);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = async ({ nombre, cargo }) => {
    await base44.entities.Integrante.create({
      nombre,
      categoria: dialogCategoria,
      cargo: cargo || null,
      cervezas: 0
    });
    setDialogOpen(false);
    loadIntegrantes();
  };

  const handleDelete = async (id) => {
    await base44.entities.Integrante.delete(id);
    setConfirmEliminar(null);
    loadIntegrantes();
  };

  const handleMoverCategoria = async () => {
    if (!moverDialog || !categoriaNueva) return;
    await base44.entities.Integrante.update(moverDialog.id, {
      categoria: categoriaNueva,
      cargo: ["socios", "contribuyentes", "socios_honorificos", "patitas"].includes(categoriaNueva) ? null : moverDialog.cargo,
    });
    setMoverDialog(null);
    setCategoriaNueva("");
    loadIntegrantes();
  };

  const openDialog = (cat) => {
    setDialogCategoria(cat);
    setDialogOpen(true);
  };

  const toggleExpanded = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sortedForCat = (cat) => {
    let members = integrantes.filter((i) => i.categoria === cat);
    if (busqueda.trim()) {
      members = members.filter(m => m.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()));
    }
    if (cat === "cargos") {
      return [...members].sort((a, b) => CARGO_ORDER.indexOf(a.cargo) - CARGO_ORDER.indexOf(b.cargo));
    }
    return [...members].sort((a, b) => a.nombre.localeCompare(b.nombre));
  };

  // Auto-expandir todas las categorías cuando se busca
  const expandedEffective = busqueda.trim()
    ? { cargos: true, socios: true, contribuyentes: true, socios_honorificos: true, patitas: true }
    : expanded;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-8 h-8 border-4 border-[#4B1924]/20 border-t-[#4B1924] rounded-full animate-spin" />
      </div>);

  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } }}
      className="max-w-2xl mx-auto px-4 py-10"
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.42 } } }}
        className="mb-6"
      >
        <div className="flex items-center gap-2">
          <h1 className="text-[#630027] text-3xl font-black">Integrantes</h1>
          <HelpIcon section="integrantes" />
        </div>
        <p className="text-gray-400 text-sm mt-1">
          {integrantes.length} miembros en total
          {" · "}
          <span className="text-[#630027] font-semibold">
            {integrantes.filter(i => i.categoria === "socios" || i.categoria === "cargos").length} socios
          </span>
        </p>
      </motion.div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }}
        className="relative mb-6"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar integrante..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20 bg-white"
        />
      </motion.div>

      <div className="space-y-5">
        {CATEGORIAS.map((cat, catIdx) => {
          const members = sortedForCat(cat.key);
          const isOpen = expandedEffective[cat.key];
          return (
            <motion.div
              key={cat.key}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.38, delay: catIdx * 0.07 } } }}
              className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white"
            >
              {/* Header */}
              <motion.div
                className={`${cat.color} px-5 py-4 flex items-center justify-between cursor-pointer select-none`}
                onClick={() => toggleExpanded(cat.key)}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    animate={isOpen ? { rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="text-xl"
                  >{cat.emoji}</motion.span>
                  <h2 className="text-white font-bold text-lg">{cat.label}</h2>
                  <Badge className="bg-white/20 text-white border-0 text-xs">{members.length}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {puedeGestionar && (
                    <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); openDialog(cat.key); }}
                        className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 text-white border-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  )}
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Members list */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    {members.length === 0 ? (
                      <div className="px-5 py-6 text-center text-gray-300 text-sm">
                        Aún no hay integrantes. Pulsa <strong>+</strong> para añadir.
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-50">
                        {members.map((m, mIdx) => {
                          const avatarUrl = sesiones.find(s => s.integrante_id === m.id)?.avatar_url;
                          return (
                            <motion.li
                              key={m.id}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.22, delay: mIdx * 0.04 }}
                              className={`flex items-center px-5 py-3 group hover:bg-gray-50/70 transition-colors ${puedeGestionar ? "cursor-pointer" : ""}`}
                              onClick={() => puedeGestionar && setPerfilIntegrante(m)}
                            >
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm flex-shrink-0 mr-3 overflow-hidden"
                              >
                                {avatarUrl ? (
                                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  m.nombre[0].toUpperCase()
                                )}
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 truncate">{m.nombre}</p>
                                {m.cargo && (
                                  <p className="text-xs text-[#4B1924]/60 font-medium mt-0.5">{CARGO_LABELS[m.cargo]}</p>
                                )}
                              </div>
                              {puedeGestionar && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); setMoverDialog(m); setCategoriaNueva(m.categoria); }}
                                    title="Cambiar categoría"
                                    className="h-7 w-7 rounded-full text-gray-200 hover:text-indigo-400 hover:bg-indigo-50"
                                  >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { e.stopPropagation(); setConfirmEliminar({ id: m.id, nombre: m.nombre }); }}
                                    className="h-7 w-7 rounded-full text-gray-200 hover:text-red-400 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </motion.li>
                          );
                        })}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {dialogCategoria &&
      <AddMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categoria={dialogCategoria}
        onAdd={handleAdd} />
      }

      {/* Confirm eliminar */}
      <ConfirmDialog
        open={!!confirmEliminar}
        mensaje={`¿Eliminar a "${confirmEliminar?.nombre}" de los integrantes? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        onConfirm={() => handleDelete(confirmEliminar.id)}
        onCancel={() => setConfirmEliminar(null)}
      />

      {/* Perfil del integrante */}
      <PerfilIntegrante
        integrante={perfilIntegrante}
        sesion={perfilIntegrante ? sesiones.find(s => s.integrante_id === perfilIntegrante.id) : null}
        onClose={() => setPerfilIntegrante(null)}
      />

      {/* Mover categoría */}
      <AnimatePresence>
        {moverDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setMoverDialog(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 pointer-events-auto">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Cambiar categoría</p>
                    <p className="text-sm text-gray-500">{moverDialog.nombre}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {CATEGORIAS.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setCategoriaNueva(cat.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        categoriaNueva === cat.key
                          ? "border-[#630027] bg-[#630027]/5"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className={`font-semibold text-sm ${categoriaNueva === cat.key ? "text-[#630027]" : "text-gray-700"}`}>{cat.label}</span>
                      {moverDialog.categoria === cat.key && (
                        <span className="ml-auto text-xs text-gray-400 font-medium">Actual</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" onClick={() => setMoverDialog(null)} className="flex-1 rounded-xl">Cancelar</Button>
                  <Button
                    onClick={handleMoverCategoria}
                    disabled={categoriaNueva === moverDialog.categoria}
                    className="flex-1 rounded-xl bg-[#630027] hover:bg-[#4a001d] text-white"
                  >
                    Mover
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}