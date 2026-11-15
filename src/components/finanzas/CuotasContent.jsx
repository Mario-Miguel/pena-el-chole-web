import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";

const IMPORTES_PRESET = [10, 15, 20, 25, 30, 40, 50, 60, 80, 100];
const IMPORTE_CONFIG_KEY = "cuota_importe";

export default function CuotasContent() {
  const { sesion, puedeConfigurar } = useAuth();
  const esAdmin = sesion?.esAdmin || puedeConfigurar;

  const [integrantes, setIntegrantes] = useState([]);
  const [cuotas, setCuotas] = useState([]);
  const [importe, setImporte] = useState(20);
  const [importeInput, setImporteInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendientesOpen, setPendientesOpen] = useState(true);
  const [pagadasOpen, setPagadasOpen] = useState(false);
  const [fConcepto, setFConcepto] = useState("");
  const [fIntegrantes, setFIntegrantes] = useState([]);
  const [fImporte, setFImporte] = useState(0);
  const [fSeleccionarTodos, setFSeleccionarTodos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [fEnviarNotif, setFEnviarNotif] = useState(false);

  const loadData = useCallback(async () => {
    const [members, cuotasData, configs] = await Promise.all([
      base44.entities.Integrante.list(),
      base44.entities.Cuota.list("-created_date"),
      base44.entities.AppConfig.filter({ clave: IMPORTE_CONFIG_KEY }),
    ]);
    const miembrosConCuota = members.filter(m => m.categoria === "socios" || m.categoria === "cargos");
    setIntegrantes(miembrosConCuota.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setCuotas(cuotasData);
    if (configs.length > 0) setImporte(parseFloat(configs[0].valor));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveImporte = async (val) => {
    if (!esAdmin) return;
    setImporte(val);
    const existing = await base44.entities.AppConfig.filter({ clave: IMPORTE_CONFIG_KEY });
    if (existing.length > 0) {
      await base44.entities.AppConfig.update(existing[0].id, { valor: val.toString() });
    } else {
      await base44.entities.AppConfig.create({ clave: IMPORTE_CONFIG_KEY, valor: val.toString() });
    }
  };

  const handleCrearCuotas = async () => {
    if (!fConcepto.trim() || fIntegrantes.length === 0 || fImporte <= 0) return;
    setGuardando(true);
    const seleccionados = fSeleccionarTodos ? integrantes : integrantes.filter(i => fIntegrantes.includes(i.id));
    await Promise.all(seleccionados.map(i =>
      base44.entities.Cuota.create({ integrante_id: i.id, integrante_nombre: i.nombre, concepto: fConcepto.trim(), importe: fImporte, pagada: false })
    ));
    if (fEnviarNotif) {
      await base44.entities.Notificacion.create({
        titulo: `💰 Cuota pendiente: ${fConcepto.trim()}`,
        mensaje: `Importe a pagar: ${fImporte.toFixed(2)}€. Afecta a ${seleccionados.length} socio${seleccionados.length !== 1 ? "s" : ""}: ${seleccionados.map(i => i.nombre).join(", ")}.`,
        tipo: "otro",
        archivada: false,
      });
    }
    setGuardando(false);
    setDialogOpen(false);
    setFConcepto(""); setFIntegrantes([]); setFImporte(importe); setFSeleccionarTodos(false); setFEnviarNotif(false);
    loadData();
  };

  const handleTogglePagada = async (cuota) => {
    const update = { pagada: !cuota.pagada, fecha_pago: !cuota.pagada ? new Date().toISOString() : null };
    setCuotas(prev => prev.map(c => c.id === cuota.id ? { ...c, ...update } : c));
    await base44.entities.Cuota.update(cuota.id, update);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta cuota?")) return;
    setCuotas(prev => prev.filter(c => c.id !== id));
    await base44.entities.Cuota.delete(id);
  };

  const cuotasVista = esAdmin ? cuotas : cuotas.filter(c => {
    const integrante = integrantes.find(i => i.nombre?.toLowerCase() === sesion?.nombre?.toLowerCase());
    return integrante && c.integrante_id === integrante.id;
  });

  const pendientes = cuotasVista.filter(c => !c.pagada);
  const pagadas    = cuotasVista.filter(c => c.pagada);
  const totalPendiente = pendientes.reduce((s, c) => s + (c.importe || 0), 0);
  const totalPagado    = pagadas.reduce((s, c) => s + (c.importe || 0), 0);

  const agrupadoPendientes = {};
  pendientes.forEach(c => {
    if (!agrupadoPendientes[c.integrante_nombre]) agrupadoPendientes[c.integrante_nombre] = [];
    agrupadoPendientes[c.integrante_nombre].push(c);
  });

  const agrupadoPagadas = {};
  pagadas.forEach(c => {
    if (!agrupadoPagadas[c.integrante_nombre]) agrupadoPagadas[c.integrante_nombre] = [];
    agrupadoPagadas[c.integrante_nombre].push(c);
  });

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-7 h-7 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Resumen + config importe */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-3">
        {esAdmin && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Importe por defecto</p>
            <div className="flex flex-wrap gap-2">
              {IMPORTES_PRESET.map(v => (
                <button key={v} onClick={() => handleSaveImporte(v)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${importe === v ? "bg-[#630027] text-white border-[#630027] shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-[#630027]/40"}`}>
                  {v}€
                </button>
              ))}
              <div className="flex items-center gap-1">
                <input type="number" value={importeInput} onChange={e => setImporteInput(e.target.value)} placeholder="Otro"
                  className="w-20 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none" />
                <button onClick={() => { const v = parseFloat(importeInput); if (v > 0) { handleSaveImporte(v); setImporteInput(""); } }}
                  className="px-3 py-1.5 bg-[#630027]/10 text-[#630027] rounded-xl text-sm font-bold hover:bg-[#630027]/20 transition-colors">✓</button>
              </div>
            </div>
          </div>
        )}
        <div className="flex divide-x divide-gray-100">
          <div className="flex-1 text-center pr-4">
            <p className="text-2xl font-black text-red-500">{totalPendiente.toFixed(2).replace(".", ",")}€</p>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Pendiente</p>
          </div>
          <div className="flex-1 text-center pl-4">
            <p className="text-2xl font-black text-green-600">{totalPagado.toFixed(2).replace(".", ",")}€</p>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Pagado</p>
          </div>
        </div>
      </div>

      {/* Aviso personal */}
      {!esAdmin && pendientes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-amber-800 font-bold text-sm mb-1">⚠️ Tienes {pendientes.length} cuota{pendientes.length > 1 ? "s" : ""} pendiente{pendientes.length > 1 ? "s" : ""}</p>
          <ul className="space-y-1 mt-2">
            {pendientes.map(c => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-amber-700">{c.concepto}</span>
                <span className="font-bold text-amber-800">{(c.importe || 0).toFixed(2)}€</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!esAdmin && pendientes.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-center">
          <p className="text-green-700 font-bold">✅ Estás al día con todas tus cuotas</p>
        </div>
      )}

      {/* Botón crear */}
      {esAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => { setFImporte(importe); setDialogOpen(true); }} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Nueva cuota
          </Button>
        </div>
      )}

      {/* Pendientes */}
      <div>
        <button onClick={() => setPendientesOpen(v => !v)} className="flex items-center justify-between w-full mb-3">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Pendientes ({pendientes.length})
          </h2>
          {pendientesOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        <AnimatePresence>
          {pendientesOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              {esAdmin ? (
                <div className="space-y-2">
                  {Object.keys(agrupadoPendientes).length === 0 && (
                    <p className="text-gray-300 text-sm text-center py-6">No hay cuotas pendientes</p>
                  )}
                  {Object.entries(agrupadoPendientes).map(([nombre, cuotasMiembro]) => (
                    <div key={nombre} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-bold text-gray-700 text-sm">{nombre}</span>
                        <span className="text-xs font-bold text-red-500">{cuotasMiembro.reduce((s, c) => s + (c.importe || 0), 0).toFixed(2)}€</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {cuotasMiembro.map(c => <CuotaRow key={c.id} cuota={c} onToggle={handleTogglePagada} onDelete={handleDelete} esAdmin={esAdmin} />)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {pendientes.map(c => <CuotaRow key={c.id} cuota={c} onToggle={handleTogglePagada} onDelete={handleDelete} esAdmin={esAdmin} />)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagadas */}
      <div>
        <button onClick={() => setPagadasOpen(v => !v)} className="flex items-center justify-between w-full mb-3">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Pagadas ({pagadas.length})
          </h2>
          {pagadasOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        <AnimatePresence>
          {pagadasOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2">
              {pagadas.length === 0 && <p className="text-gray-300 text-sm text-center py-6">Sin pagos registrados</p>}
              {esAdmin ? (
                <div className="space-y-2">
                  {Object.entries(agrupadoPagadas).map(([nombre, cuotasMiembro]) => (
                    <div key={nombre} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
                        <span className="font-bold text-gray-700 text-sm">{nombre}</span>
                        <span className="text-xs font-bold text-green-600">{cuotasMiembro.reduce((s, c) => s + (c.importe || 0), 0).toFixed(2)}€</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {cuotasMiembro.map(c => <CuotaRow key={c.id} cuota={c} onToggle={handleTogglePagada} onDelete={handleDelete} esAdmin={esAdmin} />)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                pagadas.map(c => <CuotaRow key={c.id} cuota={c} onToggle={handleTogglePagada} onDelete={handleDelete} esAdmin={esAdmin} />)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialog nueva cuota */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle className="text-[#630027]">Nueva cuota</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Concepto</label>
              <input autoFocus value={fConcepto} onChange={e => setFConcepto(e.target.value)} placeholder="Ej: Cuota anual 2025"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Importe</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {IMPORTES_PRESET.map(v => (
                  <button key={v} onClick={() => setFImporte(v)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${fImporte === v ? "bg-[#630027] text-white border-[#630027]" : "bg-white text-gray-600 border-gray-200 hover:border-[#630027]/40"}`}>
                    {v}€
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={fImporte || ""} onChange={e => setFImporte(parseFloat(e.target.value) || 0)} placeholder="Otro importe"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none" />
                <span className="text-gray-500 font-bold">€</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Integrantes</label>
                <button onClick={() => { setFSeleccionarTodos(v => !v); setFIntegrantes(!fSeleccionarTodos ? integrantes.map(i => i.id) : []); }}
                  className="text-xs text-[#630027] font-semibold hover:underline">
                  {fSeleccionarTodos ? "Deseleccionar todos" : "Seleccionar todos"}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2">
                {integrantes.map(i => (
                  <label key={i.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={fSeleccionarTodos || fIntegrantes.includes(i.id)}
                      onChange={e => { setFSeleccionarTodos(false); setFIntegrantes(prev => e.target.checked ? [...prev, i.id] : prev.filter(id => id !== i.id)); }}
                      className="accent-[#630027] w-4 h-4" />
                    <span className="text-sm text-gray-700">{i.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={fEnviarNotif} onChange={e => setFEnviarNotif(e.target.checked)} className="accent-[#630027] w-4 h-4" />
              <span className="text-sm text-gray-600">Enviar notificación de aviso a la peña</span>
            </label>
            <Button onClick={handleCrearCuotas}
              disabled={!fConcepto.trim() || (fIntegrantes.length === 0 && !fSeleccionarTodos) || fImporte <= 0 || guardando}
              className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
              {guardando ? "Creando..." : `Crear cuota (${fSeleccionarTodos ? integrantes.length : fIntegrantes.length} persona${(fSeleccionarTodos ? integrantes.length : fIntegrantes.length) !== 1 ? "s" : ""})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CuotaRow({ cuota, onToggle, onDelete, esAdmin }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${cuota.pagada ? "opacity-60" : ""}`}>
      <button onClick={() => esAdmin && onToggle(cuota)} disabled={!esAdmin}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${cuota.pagada ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-green-400 text-transparent hover:text-green-400"}`}>
        <Check className="w-3.5 h-3.5" />
      </button>
      <div className="flex-1 min-w-0">
        {esAdmin && <p className="text-xs text-gray-400 font-medium truncate">{cuota.integrante_nombre}</p>}
        <p className={`text-sm font-semibold truncate ${cuota.pagada ? "line-through text-gray-400" : "text-gray-700"}`}>{cuota.concepto}</p>
        {cuota.pagada && cuota.fecha_pago && (
          <p className="text-xs text-gray-300">{new Date(cuota.fecha_pago).toLocaleDateString("es-ES")}</p>
        )}
      </div>
      <span className={`text-sm font-black flex-shrink-0 ${cuota.pagada ? "text-green-500" : "text-red-500"}`}>
        {(cuota.importe || 0).toFixed(2)}€
      </span>
      {esAdmin && (
        <button onClick={() => onDelete(cuota.id)} className="p-1 text-gray-200 hover:text-red-400 transition-colors flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}