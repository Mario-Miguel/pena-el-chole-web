import React, { useState, useEffect, useCallback } from "react";
import CervezaChart from "../components/cerveza/CervezaChart";
import { api } from "@/api/client";
import { Plus, Trash2, Archive, ChevronDown, ChevronUp, Search, Wallet, Package, Users } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import PriceConfig from "../components/cerveza/PriceConfig";
import BeerRow from "../components/cerveza/BeerRow";
import CuentasCerveza from "../components/cerveza/CuentasCerveza";
import InventarioCerveza from "../components/cerveza/InventarioCerveza";
import GuardarPendientes from "../components/cerveza/GuardarPendientes";
import { useAuth } from "../components/auth/AuthContext";

const PRICE_CONFIG_KEY = "cerveza_precio";

export default function Cerveza() {
  const { sesion } = useAuth();
  const puedeArchivar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";

  const [todasPersonas, setTodasPersonas] = useState([]);
  const [precio, setPrecio] = useState(0.5);
  const [loading, setLoading] = useState(true);
  const [cuentasOpen, setCuentasOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveAnio, setArchiveAnio] = useState(new Date().getFullYear().toString());
  const [archivoOpen, setArchivoOpen] = useState(false);
  const [archivados, setArchivados] = useState([]);
  const [archivosAbiertos, setArchivosAbiertos] = useState({});
  const [sesiones, setSesiones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cervezaEntradas, setCervezaEntradas] = useState([]);
  const [consumoPorTipo, setConsumoPorTipo] = useState({});
  const [tiposCerveza, setTiposCerveza] = useState([]);
  const [ultimoTipoPorIntegrante, setUltimoTipoPorIntegrante] = useState({}); // { integrante_id: tipo }
  const [tab, setTab] = useState("consumo"); // "consumo" | "inventario"
  const [pending, setPending] = useState({}); // { [entradaId]: [tipo1, ...] }
  const [savingPending, setSavingPending] = useState(false);

  const addPending = (entradaId, tipo) => {
    setPending(prev => ({ ...prev, [entradaId]: [...(prev[entradaId] || []), tipo] }));
  };
  const removePending = (entradaId) => {
    setPending(prev => {
      const arr = prev[entradaId] || [];
      if (!arr.length) return prev;
      return { ...prev, [entradaId]: arr.slice(0, -1) };
    });
  };
  const clearPending = (entradaId) => {
    setPending(prev => {
      const next = { ...prev };
      delete next[entradaId];
      return next;
    });
  };
  const totalPending = Object.values(pending).reduce((s, a) => s + a.length, 0);

  const handleGuardarPendientes = async () => {
    if (totalPending === 0) return;
    setSavingPending(true);
    try {
      for (const [entradaId, tipos] of Object.entries(pending)) {
        const entrada = cervezaEntradas.find(e => e.id === entradaId);
        if (!entrada) continue;
        const newCount = (entrada.cervezas || 0) + tipos.length;
        await api.entities.CervezaEntrada.update(entradaId, { cervezas: newCount });
        const consumos = tipos.filter(Boolean).map(tipo => ({
          tipo, cantidad: 1, integrante_id: entradaId, integrante_nombre: entrada.nombre || "",
        }));
        if (consumos.length) await api.entities.ConsumoCerveza.bulkCreate(consumos);
        setConsumoPorTipo(prev => {
          const next = { ...prev };
          for (const t of tipos.filter(Boolean)) next[t] = (next[t] || 0) + 1;
          return next;
        });
      }
      setPending({});
      loadData();
    } catch (e) {
      console.error("Error guardando pendientes:", e);
    } finally {
      setSavingPending(false);
    }
  };

  const loadData = useCallback(async () => {
    const [members, configs, entradas, sesionesData, consumos, lotes] = await Promise.all([
      api.entities.Integrante.list(),
      api.entities.AppConfig.filter({ clave: PRICE_CONFIG_KEY }),
      api.entities.CervezaEntrada.list("-created_date"),
      api.entities.SesionUsuario.list(),
      api.entities.ConsumoCerveza.list(),
      api.entities.LoteCerveza.list(),
    ]);
    setSesiones(sesionesData);
    const membersSorted = members.sort((a, b) => a.nombre.localeCompare(b.nombre));
    setTodasPersonas(membersSorted);
    if (configs.length > 0) setPrecio(parseFloat(configs[0].valor));

    // Auto-añadir integrantes (no patitas) que no estén ya en la lista
    const integrantesActivos = membersSorted.filter(m => m.categoria !== "patitas");
    const enLista = new Set(entradas.map(e => e.nombre));
    const faltantes = integrantesActivos.filter(m => !enLista.has(m.nombre));
    let entradasFinal = [...entradas];
    if (faltantes.length > 0) {
      const nuevas = await Promise.all(
        faltantes.map(m => api.entities.CervezaEntrada.create({ nombre: m.nombre, cervezas: 0 }))
      );
      entradasFinal = [...entradas, ...nuevas];
    }
    if (!entradasFinal.find(e => e.nombre.toLowerCase() === "invitados")) {
      const nuevaInv = await api.entities.CervezaEntrada.create({ nombre: "Invitados", cervezas: 0, pagado: 0 });
      entradasFinal = [...entradasFinal, nuevaInv];
    }
    setCervezaEntradas(entradasFinal);

    // Cargar tipos de cerveza del inventario
    const tipos = [...new Set(lotes.map(l => l.tipo).filter(Boolean))];
    setTiposCerveza(tipos);

    // Calcular consumo por tipo
    const porTipo = {};
    for (const c of consumos) {
      if (!c.tipo) continue;
      porTipo[c.tipo] = (porTipo[c.tipo] || 0) + (c.cantidad || 1);
    }
    setConsumoPorTipo(porTipo);

    // Calcular último tipo por integrante (el consumo más reciente)
    const ultimoPorInt = {};
    const consumosOrdenados = [...consumos].sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));
    for (const c of consumosOrdenados) {
      if (c.integrante_id && c.tipo && !ultimoPorInt[c.integrante_id]) {
        ultimoPorInt[c.integrante_id] = c.tipo;
      }
    }
    setUltimoTipoPorIntegrante(ultimoPorInt);

    // Cargar archivos de cerveza
    const allConfigs = await api.entities.AppConfig.list();
    const archivoCerveza = allConfigs
      .filter(c => c.clave.startsWith("cerveza_archivo_"))
      .sort((a, b) => b.created_date.localeCompare(a.created_date));
    setArchivados(archivoCerveza);

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSavePrecio = async (val) => {
    if (!puedeArchivar) return;
    setPrecio(val);
    const existing = await api.entities.AppConfig.filter({ clave: PRICE_CONFIG_KEY });
    if (existing.length > 0) {
      await api.entities.AppConfig.update(existing[0].id, { valor: val.toString() });
    } else {
      await api.entities.AppConfig.create({ clave: PRICE_CONFIG_KEY, valor: val.toString() });
    }
  };

  // onUpdate recibe tipo y accion ("add" | "remove" | null)
  const handleUpdateCervezas = async (id, newCount, tipoCerveza, accion) => {
    const entrada = cervezaEntradas.find(e => e.id === id);
    setCervezaEntradas(prev => prev.map(e => e.id === id ? { ...e, cervezas: newCount } : e));
    await api.entities.CervezaEntrada.update(id, { cervezas: newCount });

    if (tipoCerveza && accion === "add") {
      // Registrar consumo
      await api.entities.ConsumoCerveza.create({
        tipo: tipoCerveza,
        cantidad: 1,
        integrante_id: id,
        integrante_nombre: entrada?.nombre || "",
      });
      setConsumoPorTipo(prev => ({ ...prev, [tipoCerveza]: (prev[tipoCerveza] || 0) + 1 }));
      setUltimoTipoPorIntegrante(prev => ({ ...prev, [id]: tipoCerveza }));
    } else if (tipoCerveza && accion === "remove") {
      // Revertir consumo: buscar y borrar un registro de consumo de ese tipo para ese integrante
      const consumos = await api.entities.ConsumoCerveza.filter({ integrante_id: id, tipo: tipoCerveza });
      if (consumos.length > 0) {
        // Borrar el más reciente
        const masReciente = consumos.sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""))[0];
        if (masReciente.cantidad > 1) {
          await api.entities.ConsumoCerveza.update(masReciente.id, { cantidad: masReciente.cantidad - 1 });
        } else {
          await api.entities.ConsumoCerveza.delete(masReciente.id);
        }
      }
      setConsumoPorTipo(prev => ({ ...prev, [tipoCerveza]: Math.max(0, (prev[tipoCerveza] || 0) - 1) }));
    }
  };

  const handleUpdateCampo = (id, campos) => {
    setCervezaEntradas(prev => prev.map(e => e.id === id ? { ...e, ...campos } : e));
  };

  const handleDelete = async (id) => {
    const entrada = cervezaEntradas.find(e => e.id === id);
    if (entrada) {
      await api.entities.Papelera.create({
        entidad: "CervezaEntrada",
        descripcion: `${entrada.nombre} (${entrada.cervezas || 0} cervezas)`,
        datos_json: JSON.stringify(entrada),
        eliminado_por: sesion?.nombre || "Desconocido",
      });
    }
    await api.entities.CervezaEntrada.delete(id);
    setCervezaEntradas(prev => prev.filter(e => e.id !== id));
  };

  const handleEliminarArchivo = async (id) => {
    if (!confirm("¿Eliminar este archivo? No se puede deshacer.")) return;
    await api.entities.AppConfig.delete(id);
    loadData();
  };

  const handleArchivar = async () => {
    if (!puedeArchivar) return;
    const anio = archiveAnio.trim() || new Date().getFullYear().toString();
    const totalCerv = cervezaEntradas.reduce((sum, e) => sum + (e.cervezas || 0), 0);
    const pagosActuales = await api.entities.CervezaPago.filter({ archivado: false });

    const claveArchivo = `cerveza_archivo_${anio}_${Date.now()}`;
    const valorArchivo = JSON.stringify({
      anio,
      total: totalCerv,
      precio,
      entradas: cervezaEntradas.map(e => ({
        nombre: e.nombre,
        cervezas: e.cervezas || 0,
        pagado: e.pagado || 0,
      })),
      pagos: pagosActuales.map(p => ({
        nombre: p.integrante_nombre,
        importe: p.importe,
        fecha: p.fecha,
        notas: p.notas,
      })),
    });

    await api.entities.AppConfig.create({ clave: claveArchivo, valor: valorArchivo });
    await Promise.all(cervezaEntradas.map(e =>
      api.entities.CervezaEntrada.update(e.id, { cervezas: 0, pagado: 0 })
    ));
    await Promise.all(pagosActuales.map(p =>
      api.entities.CervezaPago.update(p.id, { archivado: true, anio_archivo: anio })
    ));

    // También borrar consumos registrados
    const todosConsumos = await api.entities.ConsumoCerveza.list();
    await Promise.all(todosConsumos.map(c => api.entities.ConsumoCerveza.delete(c.id)));
    setConsumoPorTipo({});

    setCervezaEntradas(prev => prev.map(e => ({ ...e, cervezas: 0, pagado: 0 })));
    setArchiveOpen(false);
    loadData();
  };

  const totalCervezas = cervezaEntradas.reduce((sum, e) => sum + (e.cervezas || 0), 0);
  const sociosEntradas = cervezaEntradas.filter(e => e.nombre.toLowerCase() !== "invitados");
  const invitadosEntry = cervezaEntradas.find(e => e.nombre.toLowerCase() === "invitados");
  const sorted = [...sociosEntradas].sort((a, b) => (b.cervezas || 0) - (a.cervezas || 0));
  const q = busqueda.trim().toLowerCase();
  const sortedFiltrado = q ? sorted.filter(e => e.nombre.toLowerCase().includes(q)) : sorted;

  const getAvatarUrl = (nombre) => {
    const integrante = todasPersonas.find(i => i.nombre?.toLowerCase() === nombre.toLowerCase());
    if (!integrante) return null;
    const sesionUsuario = sesiones.find(s => s.integrante_id === integrante.id);
    return sesionUsuario?.avatar_url || null;
  };

  const getPodio = (idx) => {
    if ((sorted[idx]?.cervezas || 0) === 0) return null;
    const misCervs = sorted[idx].cervezas;
    const masAltos = sorted.filter(e => (e.cervezas || 0) > misCervs).length;
    const posicion = masAltos + 1;
    if (posicion === 1) return { label: "1º", emoji: "🥇" };
    if (posicion === 2) return { label: "2º", emoji: "🥈" };
    if (posicion === 3) return { label: "3º", emoji: "🥉" };
    return null;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.03 } } }}
      className="max-w-2xl mx-auto px-4 py-10 space-y-6"
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.42 } } }}
        className="mb-2"
      >
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-black text-[#630027]">La despensa de Simón 🍺</h1>
          <HelpIcon section="cerveza" />
        </div>
        <p className="text-gray-400 text-sm mt-1">Control de consumo de la peña</p>
      </motion.div>

      <PriceConfig precio={precio} onSave={puedeArchivar ? handleSavePrecio : null} soloLectura={!puedeArchivar} />

      {/* Tabs */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="flex gap-2"
      >
        <button
          onClick={() => setTab("consumo")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${tab === "consumo" ? "bg-[#630027] text-white border-[#630027]" : "bg-white text-gray-600 border-gray-200 hover:border-[#630027]/30"}`}
        >
          <Users className="w-4 h-4" /> Consumo
        </button>
        <button
          onClick={() => setTab("inventario")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${tab === "inventario" ? "bg-[#630027] text-white border-[#630027]" : "bg-white text-gray-600 border-gray-200 hover:border-[#630027]/30"}`}
        >
          <Package className="w-4 h-4" /> Inventario
        </button>
      </motion.div>

      {tab === "consumo" && (
        <>
          <CervezaChart entradas={cervezaEntradas} />

          {/* Total cervezas */}
          <motion.div
            variants={{ hidden: { opacity: 0, scale: 0.96 }, show: { opacity: 1, scale: 1, transition: { duration: 0.38, ease: [0.34, 1.56, 0.64, 1] } } }}
            whileHover={{ boxShadow: "0 6px 20px rgba(99,0,39,0.08)" }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 relative"
          >
            <div className="flex divide-x divide-gray-100">
              <div className="flex-1 text-center pr-4">
                <p className="text-2xl font-black text-gray-800">{totalCervezas}</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Cervezas total</p>
              </div>
              <div className="flex-1 text-center pl-4">
                <p className="text-2xl font-black text-[#630027]">{(totalCervezas * precio).toFixed(2).replace(".", ",")}€</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Recaudación total</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
              {(puedeArchivar || sesion?.cargo) && (
                <button
                  onClick={() => setCuentasOpen(true)}
                  className="flex items-center gap-1.5 bg-[#630027]/10 hover:bg-[#630027]/20 text-[#630027] text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5" /> Cuentas
                </button>
              )}
              {puedeArchivar && (
                <button
                  onClick={() => setArchiveOpen(true)}
                  className="flex items-center gap-1.5 bg-gray-100 hover:bg-amber-100 text-gray-400 hover:text-amber-600 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" /> Archivar
                </button>
              )}
            </div>
          </motion.div>

          {/* Lista */}
          <div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar persona..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20 bg-white"
              />
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {sortedFiltrado.map((entrada, idx) => {
                  const podio = getPodio(sorted.indexOf(entrada));
                  return (
                    <motion.div
                      key={entrada.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 14, transition: { duration: 0.16 } }}
                      transition={{ duration: 0.26, delay: idx * 0.03 }}
                      whileHover={{ x: 2 }}
                      className="group relative"
                    >
                      {podio && (
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-0.5 bg-white rounded-full px-1.5 py-0.5 shadow-sm border border-gray-100 text-xs font-bold">
                          <span>{podio.emoji}</span>
                          <span className="text-gray-600">{podio.label}</span>
                        </div>
                      )}
                      <div className={podio ? "ml-10" : ""}>
                        <BeerRow
                          integrante={entrada}
                          precioCerveza={precio}
                          onUpdate={handleUpdateCervezas}
                          avatarUrl={getAvatarUrl(entrada.nombre)}
                          tiposCerveza={tiposCerveza}
                          ultimoTipo={ultimoTipoPorIntegrante[entrada.id] || null}
                          pendingTipos={pending[entrada.id] || []}
                          onAddPending={(tipo) => addPending(entrada.id, tipo)}
                          onRemovePending={() => removePending(entrada.id)}
                          onClearPending={() => clearPending(entrada.id)}
                        />
                      </div>
                      <button
                        onClick={() => handleDelete(entrada.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-100 text-red-400 hover:bg-red-200 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {cervezaEntradas.length === 0 && (
                <div className="text-center py-12 text-gray-300">
                  <p className="text-4xl mb-3">🍺</p>
                  <p className="text-sm">Aún no hay nadie en la lista.</p>
                </div>
              )}
            </div>
          </div>

          {/* Invitados (fijo abajo) */}
          {invitadosEntry && (
            <div className="mt-2 pt-3 border-t-2 border-dashed border-gray-200">
              <BeerRow
                integrante={invitadosEntry}
                precioCerveza={precio}
                onUpdate={handleUpdateCervezas}
                avatarUrl={null}
                tiposCerveza={tiposCerveza}
                ultimoTipo={ultimoTipoPorIntegrante[invitadosEntry.id] || null}
                pendingTipos={pending[invitadosEntry.id] || []}
                onAddPending={(tipo) => addPending(invitadosEntry.id, tipo)}
                onRemovePending={() => removePending(invitadosEntry.id)}
                onClearPending={() => clearPending(invitadosEntry.id)}
                destacada
              />
            </div>
          )}

          {/* Archivo */}
          {archivados.length > 0 && (
            <div>
              <motion.button
                onClick={() => setArchivoOpen(v => !v)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#630027] mb-3 transition-colors"
              >
                <Archive className="w-4 h-4" />
                Archivo ({archivados.length} temporada{archivados.length !== 1 ? "s" : ""})
                <motion.span animate={{ rotate: archivoOpen ? 180 : 0 }} transition={{ duration: 0.22 }}>
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
              </motion.button>
              <AnimatePresence>
                {archivoOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2">
                    {archivados.map(a => {
                      let datos = null;
                      try { datos = JSON.parse(a.valor); } catch { datos = { resumen: a.valor }; }
                      const anioLabel = datos?.anio || a.clave.replace("cerveza_archivo_", "").split("_")[0];
                      const isOpen = archivosAbiertos[a.id];
                      return (
                        <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          <button
                            onClick={() => setArchivosAbiertos(prev => ({ ...prev, [a.id]: !prev[a.id] }))}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                                <span className="text-amber-600 font-black text-xs">{anioLabel}</span>
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-gray-800 text-sm">Archivo cerveza {anioLabel}</p>
                                {datos?.total !== undefined && <p className="text-xs text-gray-400">{datos.total} cervezas en total</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {puedeArchivar && (
                                <button
                                  onClick={e => { e.stopPropagation(); handleEliminarArchivo(a.id); }}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-200 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </div>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-2 border-t border-gray-50 space-y-1">
                                  {datos?.precio && <p className="text-xs text-gray-400 mb-2">Precio: <b>{datos.precio.toFixed(2).replace(".", ",")}€/cerveza</b></p>}
                                  {datos?.entradas && [...datos.entradas].sort((a, b) => b.cervezas - a.cervezas).map((e, i) => {
                                    const medallas = ["🥇", "🥈", "🥉"];
                                    return (
                                      <div key={i} className="flex justify-between items-center text-sm text-gray-600 border-b border-gray-50 pb-1 last:border-0">
                                        <span className="flex items-center gap-1.5">
                                          {e.cervezas > 0 && i < 3 && <span>{medallas[i]}</span>}
                                          {e.nombre}
                                        </span>
                                        <span className="font-semibold">{e.cervezas} 🍺 · {((e.cervezas || 0) * (datos.precio || 0)).toFixed(2)}€</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {tab === "inventario" && (
        <motion.div
          key="inventario"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <InventarioCerveza
            puedeGestionar={puedeArchivar}
            consumoPorTipo={consumoPorTipo}
            onTiposChange={setTiposCerveza}
          />
        </motion.div>
      )}

      {/* Dialog cuentas */}
      <Dialog open={cuentasOpen} onOpenChange={setCuentasOpen}>
        <DialogContent className="rounded-2xl max-w-lg w-full">
          <DialogHeader>
            <DialogTitle className="text-[#630027] flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Cuentas de cerveza
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 max-h-[70vh] overflow-y-auto">
            <CuentasCerveza entradas={cervezaEntradas} precio={precio} puedeGestionar={puedeArchivar} onUpdate={handleUpdateCampo} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog archivar */}
      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#630027]">Archivar cervezas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-gray-500">Se guardará un resumen del año y se reiniciarán los contadores a 0 (incluido el inventario de consumo).</p>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Año</label>
              <Input value={archiveAnio} onChange={e => setArchiveAnio(e.target.value)} placeholder="Ej: 2025" className="rounded-xl border-gray-200" />
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
              <p className="font-semibold text-gray-700 mb-1">Resumen a archivar:</p>
              <p>{totalCervezas} cervezas en total</p>
            </div>
            <Button onClick={handleArchivar} className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
              <Archive className="w-4 h-4 mr-2" /> Archivar "Archivo cerveza {archiveAnio}"
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GuardarPendientes
        totalPendientes={tab === "consumo" ? totalPending : 0}
        precio={precio}
        saving={savingPending}
        onGuardar={handleGuardarPendientes}
      />
    </motion.div>
  );
}