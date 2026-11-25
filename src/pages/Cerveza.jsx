import React, { useState, useEffect, useCallback, useMemo } from "react";
import CervezaChart from "../components/cerveza/CervezaChart";
import { api } from "@/api/client";
import { Trash2, Archive, ChevronDown, ChevronUp, Search, Wallet, Package, Users } from "lucide-react";
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
import {
  PRECIO_CERVEZA_KEY, INVITADOS_ID, calcularCuentas, claveCuenta, integranteIdDeClave,
} from "@/lib/cerveza";

const masRecienteAntes = (a, b) => (b.created_date || "").localeCompare(a.created_date || "");

export default function Cerveza() {
  const { sesion } = useAuth();
  const puedeArchivar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";

  const [integrantes, setIntegrantes] = useState([]);
  const [consumos, setConsumos] = useState([]); // ConsumoCerveza sin archivar
  const [pagos, setPagos] = useState([]);       // CervezaPago sin archivar
  const [precio, setPrecio] = useState(0.5);
  const [loading, setLoading] = useState(true);
  const [cuentasOpen, setCuentasOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveAnio, setArchiveAnio] = useState(new Date().getFullYear().toString());
  const [archivando, setArchivando] = useState(false);
  const [archivoOpen, setArchivoOpen] = useState(false);
  const [archivados, setArchivados] = useState([]);
  const [archivosAbiertos, setArchivosAbiertos] = useState({});
  const [sesiones, setSesiones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [tiposCerveza, setTiposCerveza] = useState([]);
  const [tab, setTab] = useState("consumo"); // "consumo" | "inventario"
  const [pending, setPending] = useState({}); // { [claveCuenta]: [tipo1, ...] }
  const [savingPending, setSavingPending] = useState(false);

  // Una cuenta por integrante (más invitados), calculada a partir de consumos y pagos
  const cuentas = useMemo(() => calcularCuentas(integrantes, consumos, pagos), [integrantes, consumos, pagos]);

  const consumoPorTipo = useMemo(() => {
    const porTipo = {};
    for (const c of consumos) {
      if (!c.tipo) continue;
      porTipo[c.tipo] = (porTipo[c.tipo] || 0) + (c.cantidad || 1);
    }
    return porTipo;
  }, [consumos]);

  // Último tipo que ha tomado cada cuenta (el consumo más reciente)
  const ultimoTipoPorCuenta = useMemo(() => {
    const ultimo = {};
    for (const c of [...consumos].sort(masRecienteAntes)) {
      const clave = claveCuenta(c.integrante_id);
      if (c.tipo && !ultimo[clave]) ultimo[clave] = c.tipo;
    }
    return ultimo;
  }, [consumos]);

  const addPending = (clave, tipo) => {
    setPending(prev => ({ ...prev, [clave]: [...(prev[clave] || []), tipo] }));
  };
  const removePending = (clave) => {
    setPending(prev => {
      const arr = prev[clave] || [];
      if (!arr.length) return prev;
      return { ...prev, [clave]: arr.slice(0, -1) };
    });
  };
  const clearPending = (clave) => {
    setPending(prev => {
      const next = { ...prev };
      delete next[clave];
      return next;
    });
  };
  const totalPending = Object.values(pending).reduce((s, a) => s + a.length, 0);

  // Recarga solo lo que cambia al apuntar cervezas o pagos
  const recargarMovimientos = useCallback(async () => {
    const [consumosData, pagosData] = await Promise.all([
      api.entities.ConsumoCerveza.filter({ archivado: false }),
      api.entities.CervezaPago.filter({ archivado: false }),
    ]);
    setConsumos(consumosData);
    setPagos(pagosData);
  }, []);

  const handleGuardarPendientes = async () => {
    if (totalPending === 0) return;
    setSavingPending(true);
    try {
      // Cada cerveza pendiente es un consumo (tipo null si no hay inventario)
      const nuevos = Object.entries(pending).flatMap(([clave, tipos]) =>
        tipos.map(tipo => ({ tipo: tipo || null, cantidad: 1, integrante_id: integranteIdDeClave(clave) }))
      );
      if (nuevos.length) await api.entities.ConsumoCerveza.bulkCreate(nuevos);
      setPending({});
      await recargarMovimientos();
    } catch (e) {
      console.error("Error guardando pendientes:", e);
    } finally {
      setSavingPending(false);
    }
  };

  const loadData = useCallback(async () => {
    const [members, configs, sesionesData, consumosData, pagosData, lotes, allConfigs] = await Promise.all([
      api.entities.Integrante.list(),
      api.entities.AppConfig.filter({ clave: PRECIO_CERVEZA_KEY }),
      api.entities.SesionUsuario.list(),
      api.entities.ConsumoCerveza.filter({ archivado: false }),
      api.entities.CervezaPago.filter({ archivado: false }),
      api.entities.LoteCerveza.list(),
      api.entities.AppConfig.list(),
    ]);
    setSesiones(sesionesData);
    setIntegrantes(members);
    setConsumos(consumosData);
    setPagos(pagosData);
    if (configs.length > 0) setPrecio(parseFloat(configs[0].valor));

    // Tipos de cerveza del inventario
    setTiposCerveza([...new Set(lotes.map(l => l.tipo).filter(Boolean))]);

    // Archivos de cerveza (resúmenes de años anteriores)
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
    const existing = await api.entities.AppConfig.filter({ clave: PRECIO_CERVEZA_KEY });
    if (existing.length > 0) {
      await api.entities.AppConfig.update(existing[0].id, { valor: val.toString() });
    } else {
      await api.entities.AppConfig.create({ clave: PRECIO_CERVEZA_KEY, valor: val.toString() });
    }
  };

  // Quita una cerveza: el consumo más reciente de ese tipo (o el más reciente si no hay tipo)
  const handleQuitarCerveza = async (clave, tipo) => {
    const mios = consumos.filter(c => claveCuenta(c.integrante_id) === clave).sort(masRecienteAntes);
    const consumo = (tipo && mios.find(c => c.tipo === tipo)) || mios[0];
    if (!consumo) return;
    if (consumo.cantidad > 1) {
      await api.entities.ConsumoCerveza.update(consumo.id, { cantidad: consumo.cantidad - 1 });
    } else {
      await api.entities.ConsumoCerveza.delete(consumo.id);
    }
    await recargarMovimientos();
  };

  // Borra todas las cervezas (sin archivar) de una cuenta
  const handleLimpiarCervezas = async (clave) => {
    const cuenta = cuentas.find(c => c.id === clave);
    if (!cuenta || cuenta.cervezas === 0) return;
    if (!confirm(`¿Borrar las ${cuenta.cervezas} cervezas de ${cuenta.nombre}?`)) return;
    const mios = consumos.filter(c => claveCuenta(c.integrante_id) === clave);
    await Promise.all(mios.map(c => api.entities.ConsumoCerveza.delete(c.id)));
    await recargarMovimientos();
  };

  const handleEliminarArchivo = async (id) => {
    if (!confirm("¿Eliminar este archivo? No se puede deshacer.")) return;
    await api.entities.AppConfig.delete(id);
    loadData();
  };

  const handleArchivar = async () => {
    if (!puedeArchivar) return;
    const anio = parseInt(archiveAnio.trim(), 10) || new Date().getFullYear();
    setArchivando(true);
    try {
      const nombrePorClave = Object.fromEntries(cuentas.map(c => [c.id, c.nombre]));

      // Resumen del año (se sigue guardando para la sección "Archivo")
      const claveArchivo = `cerveza_archivo_${anio}_${Date.now()}`;
      const valorArchivo = JSON.stringify({
        anio,
        total: totalCervezas,
        precio,
        entradas: cuentas
          .filter(c => c.cervezas > 0 || c.pagado !== 0)
          .map(c => ({ nombre: c.nombre, integrante_id: c.integranteId, cervezas: c.cervezas, pagado: c.pagado })),
        pagos: pagos.map(p => ({
          nombre: nombrePorClave[claveCuenta(p.integrante_id)],
          integrante_id: p.integrante_id,
          importe: p.importe,
          fecha: p.fecha,
          notas: p.notas,
        })),
      });
      await api.entities.AppConfig.create({ clave: claveArchivo, valor: valorArchivo });

      // Consumos y pagos no se borran: se archivan y dejan de contar
      const cambios = { archivado: true, anio_archivo: anio };
      await Promise.all([
        ...consumos.map(c => api.entities.ConsumoCerveza.update(c.id, cambios)),
        ...pagos.map(p => api.entities.CervezaPago.update(p.id, cambios)),
      ]);
      setArchiveOpen(false);
    } finally {
      setArchivando(false);
      loadData();
    }
  };

  const totalCervezas = cuentas.reduce((sum, c) => sum + c.cervezas, 0);
  const sociosCuentas = cuentas.filter(c => c.id !== INVITADOS_ID);
  const invitadosCuenta = cuentas.find(c => c.id === INVITADOS_ID);
  const sorted = [...sociosCuentas].sort((a, b) => b.cervezas - a.cervezas || a.nombre.localeCompare(b.nombre));
  const q = busqueda.trim().toLowerCase();
  const sortedFiltrado = q ? sorted.filter(c => c.nombre.toLowerCase().includes(q)) : sorted;

  const getAvatarUrl = (cuenta) => {
    if (!cuenta.integranteId) return null;
    const sesionUsuario = sesiones.find(s => s.integrante_id === cuenta.integranteId);
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
          <CervezaChart entradas={cuentas} />

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
                {sortedFiltrado.map((cuenta, idx) => {
                  const podio = getPodio(sorted.indexOf(cuenta));
                  return (
                    <motion.div
                      key={cuenta.id}
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
                          integrante={cuenta}
                          precioCerveza={precio}
                          onRemove={(tipo) => handleQuitarCerveza(cuenta.id, tipo)}
                          onClear={() => handleLimpiarCervezas(cuenta.id)}
                          avatarUrl={getAvatarUrl(cuenta)}
                          tiposCerveza={tiposCerveza}
                          ultimoTipo={ultimoTipoPorCuenta[cuenta.id] || null}
                          pendingTipos={pending[cuenta.id] || []}
                          onAddPending={(tipo) => addPending(cuenta.id, tipo)}
                          onRemovePending={() => removePending(cuenta.id)}
                          onClearPending={() => clearPending(cuenta.id)}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {sociosCuentas.length === 0 && (
                <div className="text-center py-12 text-gray-300">
                  <p className="text-4xl mb-3">🍺</p>
                  <p className="text-sm">Aún no hay nadie en la lista.</p>
                </div>
              )}
            </div>
          </div>

          {/* Invitados (fijo abajo) */}
          {invitadosCuenta && (
            <div className="mt-2 pt-3 border-t-2 border-dashed border-gray-200">
              <BeerRow
                integrante={invitadosCuenta}
                precioCerveza={precio}
                onRemove={(tipo) => handleQuitarCerveza(INVITADOS_ID, tipo)}
                onClear={() => handleLimpiarCervezas(INVITADOS_ID)}
                avatarUrl={null}
                tiposCerveza={tiposCerveza}
                ultimoTipo={ultimoTipoPorCuenta[INVITADOS_ID] || null}
                pendingTipos={pending[INVITADOS_ID] || []}
                onAddPending={(tipo) => addPending(INVITADOS_ID, tipo)}
                onRemovePending={() => removePending(INVITADOS_ID)}
                onClearPending={() => clearPending(INVITADOS_ID)}
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
            <CuentasCerveza entradas={cuentas} precio={precio} puedeGestionar={puedeArchivar} onChange={recargarMovimientos} />
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
            <p className="text-sm text-gray-500">Se guardará un resumen del año y las cervezas y pagos actuales se archivarán: los contadores vuelven a 0 (incluido el inventario de consumo).</p>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Año</label>
              <Input value={archiveAnio} onChange={e => setArchiveAnio(e.target.value)} placeholder="Ej: 2025" className="rounded-xl border-gray-200" />
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
              <p className="font-semibold text-gray-700 mb-1">Resumen a archivar:</p>
              <p>{totalCervezas} cervezas en total</p>
            </div>
            <Button onClick={handleArchivar} disabled={archivando} className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
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