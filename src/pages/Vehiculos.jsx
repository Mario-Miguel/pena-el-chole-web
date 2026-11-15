import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Truck, CheckCircle, Circle, Trash2, AlertTriangle, ClipboardList, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/auth/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import HelpIcon from "../components/layout/HelpIcon";

const ESTADO_INFO = {
  ok:       { label: "OK",         color: "bg-green-100 text-green-700",  dot: "bg-green-400" },
  revisar:  { label: "Revisar",    color: "bg-amber-100 text-amber-700",  dot: "bg-amber-400" },
  sustituir:{ label: "Sustituir",  color: "bg-red-100 text-red-700",      dot: "bg-red-400" },
  pedido:   { label: "Pedido",     color: "bg-blue-100 text-blue-700",    dot: "bg-blue-400" },
};

const VEHICULO_COLORES = {
  camion:    "bg-orange-600",
  plataforma:"bg-indigo-700",
  otro:      "bg-gray-600",
};

const TABS = ["piezas", "revisiones", "tareas"];
const TAB_LABELS = { piezas: "Piezas", revisiones: "Revisiones", tareas: "Tareas" };

export default function Vehiculos() {
  const { sesion } = useAuth();
  const puedeGestionar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente" || sesion?.cargo === "secretario" || sesion?.cargo === "tesorero" || sesion?.cargo === "vocal";

  const [vehiculos, setVehiculos] = useState([]);
  const [piezas, setPiezas] = useState([]);
  const [revisiones, setRevisiones] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehiculoActivo, setVehiculoActivo] = useState(null);
  const [tab, setTab] = useState("piezas");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Formularios
  const [showFormPieza, setShowFormPieza] = useState(false);
  const [showFormRevision, setShowFormRevision] = useState(false);
  const [showFormTarea, setShowFormTarea] = useState(false);
  const [showFormVehiculo, setShowFormVehiculo] = useState(false);

  const [fNombreVehiculo, setFNombreVehiculo] = useState("");
  const [fTipoVehiculo, setFTipoVehiculo] = useState("camion");
  const [fNombrePieza, setFNombrePieza] = useState("");
  const [fRefPieza, setFRefPieza] = useState("");
  const [fEstadoPieza, setFEstadoPieza] = useState("ok");
  const [fNotasPieza, setFNotasPieza] = useState("");
  const [fTituloRevision, setFTituloRevision] = useState("");
  const [fFechaUltima, setFFechaUltima] = useState("");
  const [fFechaProxima, setFFechaProxima] = useState("");
  const [fNotasRevision, setFNotasRevision] = useState("");
  const [fNombreTarea, setFNombreTarea] = useState("");
  const [fDescTarea, setFDescTarea] = useState("");

  const cargar = async () => {
    const [v, p, r, t] = await Promise.all([
      base44.entities.Vehiculo.list(),
      base44.entities.VehiculoPieza.list(),
      base44.entities.VehiculoRevision.list(),
      base44.entities.VehiculoTarea.list(),
    ]);
    setVehiculos(v);
    setPiezas(p);
    setRevisiones(r);
    setTareas(t);
    if (v.length > 0 && !vehiculoActivo) setVehiculoActivo(v[0].id);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const crearVehiculo = async () => {
    if (!fNombreVehiculo.trim()) return;
    const v = await base44.entities.Vehiculo.create({ nombre: fNombreVehiculo.trim(), tipo: fTipoVehiculo });
    setVehiculoActivo(v.id);
    setFNombreVehiculo(""); setShowFormVehiculo(false);
    cargar();
  };

  const crearPieza = async () => {
    if (!fNombrePieza.trim()) return;
    await base44.entities.VehiculoPieza.create({
      vehiculo_id: vehiculoActivo,
      vehiculo_nombre: vehiculos.find(v => v.id === vehiculoActivo)?.nombre,
      nombre: fNombrePieza.trim(), referencia: fRefPieza, estado: fEstadoPieza, notas: fNotasPieza,
    });
    setFNombrePieza(""); setFRefPieza(""); setFEstadoPieza("ok"); setFNotasPieza(""); setShowFormPieza(false);
    cargar();
  };

  const crearRevision = async () => {
    if (!fTituloRevision.trim()) return;
    await base44.entities.VehiculoRevision.create({
      vehiculo_id: vehiculoActivo,
      vehiculo_nombre: vehiculos.find(v => v.id === vehiculoActivo)?.nombre,
      titulo: fTituloRevision.trim(), fecha_ultima: fFechaUltima, fecha_proxima: fFechaProxima, notas: fNotasRevision,
    });
    setFTituloRevision(""); setFFechaUltima(""); setFFechaProxima(""); setFNotasRevision(""); setShowFormRevision(false);
    cargar();
  };

  const crearTarea = async () => {
    if (!fNombreTarea.trim()) return;
    await base44.entities.VehiculoTarea.create({
      vehiculo_id: vehiculoActivo,
      vehiculo_nombre: vehiculos.find(v => v.id === vehiculoActivo)?.nombre,
      nombre: fNombreTarea.trim(), descripcion: fDescTarea,
    });
    setFNombreTarea(""); setFDescTarea(""); setShowFormTarea(false);
    cargar();
  };

  const toggleTarea = async (t) => {
    await base44.entities.VehiculoTarea.update(t.id, {
      completada: !t.completada,
      fecha_completada: !t.completada ? new Date().toISOString() : null,
    });
    cargar();
  };

  const toggleRevision = async (r) => {
    await base44.entities.VehiculoRevision.update(r.id, { completada: !r.completada });
    cargar();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await base44.entities[confirmDelete.entity].delete(confirmDelete.id);
    setConfirmDelete(null);
    cargar();
  };

  const esProxima = (fecha) => {
    if (!fecha) return false;
    const diff = (new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };
  const esPasada = (fecha) => fecha && new Date(fecha) < new Date();

  const vehiculoActual = vehiculos.find(v => v.id === vehiculoActivo);
  const piezasActivas = piezas.filter(p => p.vehiculo_id === vehiculoActivo);
  const revisionesActivas = revisiones.filter(r => r.vehiculo_id === vehiculoActivo);
  const tareasActivas = tareas.filter(t => t.vehiculo_id === vehiculoActivo);
  const tareasP = tareasActivas.filter(t => !t.completada);
  const tareasC = tareasActivas.filter(t => t.completada);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">🚛 Vehículos</h1>
            <HelpIcon section="vehiculos" />
          </div>
          <p className="text-gray-400 text-sm mt-1">Camión, plataforma y mantenimiento</p>
        </div>
        {puedeGestionar && (
          <Button onClick={() => setShowFormVehiculo(v => !v)} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-sm">
            <Plus className="w-4 h-4 mr-1" /> Vehículo
          </Button>
        )}
      </div>

      {/* Nuevo vehículo */}
      <AnimatePresence>
        {showFormVehiculo && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 overflow-hidden">
            <input value={fNombreVehiculo} onChange={e => setFNombreVehiculo(e.target.value)}
              placeholder="Nombre (ej: Camión, Plataforma...)" autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
            <select value={fTipoVehiculo} onChange={e => setFTipoVehiculo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
              <option value="camion">🚛 Camión</option>
              <option value="plataforma">🏗️ Plataforma</option>
              <option value="otro">🚗 Otro</option>
            </select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFormVehiculo(false)} className="flex-1 rounded-xl">Cancelar</Button>
              <Button onClick={crearVehiculo} className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Añadir</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sin vehículos */}
      {vehiculos.length === 0 && (
        <div className="text-center py-16 text-gray-300">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay vehículos registrados</p>
        </div>
      )}

      {/* Selector de vehículo */}
      {vehiculos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {vehiculos.map(v => (
            <button key={v.id} onClick={() => setVehiculoActivo(v.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                vehiculoActivo === v.id
                  ? `${VEHICULO_COLORES[v.tipo] || "bg-gray-600"} text-white border-transparent`
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}>
              {v.tipo === "camion" ? "🚛" : v.tipo === "plataforma" ? "🏗️" : "🚗"} {v.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Contenido del vehículo */}
      {vehiculoActual && (
        <>
          {/* Alertas */}
          {revisionesActivas.some(r => !r.completada && (esPasada(r.fecha_proxima) || esProxima(r.fecha_proxima))) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-bold text-sm">Revisiones pendientes</p>
                <ul className="mt-1 space-y-0.5">
                  {revisionesActivas.filter(r => !r.completada && (esPasada(r.fecha_proxima) || esProxima(r.fecha_proxima))).map(r => (
                    <li key={r.id} className="text-amber-700 text-xs">
                      • {r.titulo} {esPasada(r.fecha_proxima) ? "⚠️ VENCIDA" : "📅 próxima"}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex rounded-xl border border-gray-100 bg-gray-50 p-1 gap-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white shadow-sm text-[#630027]" : "text-gray-400 hover:text-gray-600"}`}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {/* --- PIEZAS --- */}
          {tab === "piezas" && (
            <div className="space-y-3">
              {puedeGestionar && (
                <Button onClick={() => setShowFormPieza(v => !v)} variant="outline" className="w-full rounded-xl border-dashed">
                  <Plus className="w-4 h-4 mr-1" /> Añadir pieza
                </Button>
              )}
              <AnimatePresence>
                {showFormPieza && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 overflow-hidden">
                    <input value={fNombrePieza} onChange={e => setFNombrePieza(e.target.value)} placeholder="Nombre de la pieza" autoFocus
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
                    <input value={fRefPieza} onChange={e => setFRefPieza(e.target.value)} placeholder="Referencia (opcional)"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
                    <select value={fEstadoPieza} onChange={e => setFEstadoPieza(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none">
                      {Object.entries(ESTADO_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <textarea value={fNotasPieza} onChange={e => setFNotasPieza(e.target.value)} placeholder="Notas (opcional)" rows={2}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none" />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowFormPieza(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button onClick={crearPieza} className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Añadir</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {piezasActivas.length === 0 && <p className="text-center text-gray-300 text-sm py-8">No hay piezas registradas</p>}
              <div className="space-y-2">
                {piezasActivas.map(p => {
                  const est = ESTADO_INFO[p.estado] || ESTADO_INFO.ok;
                  return (
                    <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${est.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{p.nombre}</p>
                        {p.referencia && <p className="text-xs text-gray-400 font-mono">{p.referencia}</p>}
                        {p.notas && <p className="text-xs text-gray-400 truncate">{p.notas}</p>}
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${est.color}`}>{est.label}</span>
                      {puedeGestionar && (
                        <button onClick={() => setConfirmDelete({ id: p.id, entity: "VehiculoPieza" })}
                          className="p-1.5 rounded-lg text-gray-200 hover:text-red-400 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- REVISIONES --- */}
          {tab === "revisiones" && (
            <div className="space-y-3">
              {puedeGestionar && (
                <Button onClick={() => setShowFormRevision(v => !v)} variant="outline" className="w-full rounded-xl border-dashed">
                  <Plus className="w-4 h-4 mr-1" /> Programar revisión
                </Button>
              )}
              <AnimatePresence>
                {showFormRevision && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 overflow-hidden">
                    <input value={fTituloRevision} onChange={e => setFTituloRevision(e.target.value)} placeholder="Qué se revisa (ej: Ruedas, Frenos...)" autoFocus
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Última revisión</label>
                        <input type="date" value={fFechaUltima} onChange={e => setFFechaUltima(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Próxima revisión</label>
                        <input type="date" value={fFechaProxima} onChange={e => setFFechaProxima(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                      </div>
                    </div>
                    <textarea value={fNotasRevision} onChange={e => setFNotasRevision(e.target.value)} placeholder="Notas" rows={2}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none" />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowFormRevision(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button onClick={crearRevision} className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Añadir</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {revisionesActivas.length === 0 && <p className="text-center text-gray-300 text-sm py-8">No hay revisiones programadas</p>}
              <div className="space-y-2">
                {revisionesActivas.map(r => {
                  const vencida = esPasada(r.fecha_proxima) && !r.completada;
                  const proxima = esProxima(r.fecha_proxima) && !r.completada;
                  return (
                    <div key={r.id} className={`bg-white rounded-2xl border shadow-sm px-4 py-3 flex items-center gap-3 ${vencida ? "border-red-200" : proxima ? "border-amber-200" : "border-gray-100"}`}>
                      <button onClick={() => puedeGestionar && toggleRevision(r)} disabled={!puedeGestionar}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${r.completada ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-green-400"}`}>
                        {r.completada && <CheckCircle className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${r.completada ? "line-through text-gray-400" : "text-gray-800"}`}>{r.titulo}</p>
                        <div className="flex gap-3 mt-0.5">
                          {r.fecha_ultima && <span className="text-xs text-gray-400">Última: {new Date(r.fecha_ultima).toLocaleDateString("es-ES")}</span>}
                          {r.fecha_proxima && (
                            <span className={`text-xs font-semibold ${vencida ? "text-red-500" : proxima ? "text-amber-500" : "text-gray-400"}`}>
                              Próxima: {new Date(r.fecha_proxima).toLocaleDateString("es-ES")}
                            </span>
                          )}
                        </div>
                        {r.notas && <p className="text-xs text-gray-400 truncate">{r.notas}</p>}
                      </div>
                      {puedeGestionar && (
                        <button onClick={() => setConfirmDelete({ id: r.id, entity: "VehiculoRevision" })}
                          className="p-1.5 rounded-lg text-gray-200 hover:text-red-400 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- TAREAS --- */}
          {tab === "tareas" && (
            <div className="space-y-3">
              {puedeGestionar && (
                <Button onClick={() => setShowFormTarea(v => !v)} variant="outline" className="w-full rounded-xl border-dashed">
                  <Plus className="w-4 h-4 mr-1" /> Añadir tarea
                </Button>
              )}
              <AnimatePresence>
                {showFormTarea && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 overflow-hidden">
                    <input value={fNombreTarea} onChange={e => setFNombreTarea(e.target.value)} placeholder="Nombre de la tarea" autoFocus
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
                    <textarea value={fDescTarea} onChange={e => setFDescTarea(e.target.value)} placeholder="Descripción (opcional)" rows={2}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none" />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowFormTarea(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button onClick={crearTarea} className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">Añadir</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {tareasP.length === 0 && tareasC.length === 0 && <p className="text-center text-gray-300 text-sm py-8">No hay tareas registradas</p>}
              <div className="space-y-2">
                {[...tareasP, ...tareasC].map(t => (
                  <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                    <button onClick={() => toggleTarea(t)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${t.completada ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-green-400"}`}>
                      {t.completada && <CheckCircle className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${t.completada ? "line-through text-gray-400" : "text-gray-800"}`}>{t.nombre}</p>
                      {t.descripcion && <p className="text-xs text-gray-400 truncate">{t.descripcion}</p>}
                    </div>
                    {puedeGestionar && (
                      <button onClick={() => setConfirmDelete({ id: t.id, entity: "VehiculoTarea" })}
                        className="p-1.5 rounded-lg text-gray-200 hover:text-red-400 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        mensaje="¿Eliminar este elemento? Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </motion.div>
  );
}