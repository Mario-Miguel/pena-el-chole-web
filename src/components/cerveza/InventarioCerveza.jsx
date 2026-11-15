import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus, Trash2, AlertTriangle, Package, Edit2, Check, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Calcula stock actual por tipo: suma lotes - consumo registrado por tipo - ajustes manuales
function calcularStockPorTipo(lotes, consumoPorTipo) {
  const tipos = {};
  for (const lote of lotes) {
    if (!tipos[lote.tipo]) tipos[lote.tipo] = { total: 0, consumido: 0, consumido_ajuste: 0, stock_minimo: 0 };
    tipos[lote.tipo].total += lote.cantidad || 0;
    tipos[lote.tipo].consumido_ajuste += lote.consumido_ajuste || 0;
    if (lote.stock_minimo > 0) tipos[lote.tipo].stock_minimo = lote.stock_minimo;
  }
  for (const [tipo, consumo] of Object.entries(consumoPorTipo)) {
    if (!tipos[tipo]) tipos[tipo] = { total: 0, consumido: 0, consumido_ajuste: 0, stock_minimo: 0 };
    tipos[tipo].consumido = consumo;
  }
  return tipos;
}

const EMPTY_FORM = { tipo: "", cantidad: "", coste: "", fecha: format(new Date(), "yyyy-MM-dd"), notas: "" };

export default function InventarioCerveza({ puedeGestionar, consumoPorTipo = {}, onTiposChange, onConsumoChange }) {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null = cerrado, objeto = abierto
  const [editingMinimo, setEditingMinimo] = useState(null); // { tipo, valor }
  const [editingLote, setEditingLote] = useState(null); // { id, cantidad, consumido_manual }
  // consumido_manual: ajuste manual del consumido (independiente del consumo por tipo real)

  const cargar = useCallback(async () => {
    const data = await api.entities.LoteCerveza.list("-fecha");
    setLotes(data);
    setLoading(false);
    // Notificar tipos disponibles al padre
    const tipos = [...new Set(data.map(l => l.tipo))];
    onTiposChange?.(tipos);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleAñadirLote = async () => {
    if (!form?.tipo?.trim() || !form.cantidad || !form.fecha) return;
    const nuevo = await api.entities.LoteCerveza.create({
      tipo: form.tipo.trim(),
      cantidad: parseFloat(form.cantidad),
      coste: parseFloat(form.coste) || 0,
      fecha: form.fecha,
      notas: form.notas || "",
      stock_minimo: 0,
    });
    const nuevosLotes = [nuevo, ...lotes];
    setLotes(nuevosLotes);
    setForm(null);
    const tipos = [...new Set(nuevosLotes.map(l => l.tipo))];
    onTiposChange?.(tipos);
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este lote?")) return;
    await api.entities.LoteCerveza.delete(id);
    const nuevosLotes = lotes.filter(l => l.id !== id);
    setLotes(nuevosLotes);
    const tipos = [...new Set(nuevosLotes.map(l => l.tipo))];
    onTiposChange?.(tipos);
  };

  const handleGuardarMinimo = async (tipo) => {
    if (!editingMinimo) return;
    const valor = parseFloat(editingMinimo.valor) || 0;
    // Actualizar el stock_minimo en todos los lotes de este tipo
    const lotesDelTipo = lotes.filter(l => l.tipo === tipo);
    await Promise.all(lotesDelTipo.map(l => api.entities.LoteCerveza.update(l.id, { stock_minimo: valor })));
    setLotes(prev => prev.map(l => l.tipo === tipo ? { ...l, stock_minimo: valor } : l));
    setEditingMinimo(null);
  };

  const handleEditarLote = (lote) => {
    setEditingLote({
      id: lote.id,
      tipo: lote.tipo || "",
      cantidad: lote.cantidad.toString(),
      coste: (lote.coste || 0).toString(),
      consumido_ajuste: (lote.consumido_ajuste || 0).toString(),
      notas: lote.notas || "",
    });
  };

  const handleGuardarLote = async () => {
    if (!editingLote) return;
    const nuevaCantidad = parseFloat(editingLote.cantidad) || 0;
    const nuevoAjuste = parseFloat(editingLote.consumido_ajuste) || 0;
    const nuevoCoste = parseFloat(editingLote.coste) || 0;
    await api.entities.LoteCerveza.update(editingLote.id, {
      tipo: editingLote.tipo.trim(),
      cantidad: nuevaCantidad,
      coste: nuevoCoste,
      consumido_ajuste: nuevoAjuste,
      notas: editingLote.notas,
    });
    setLotes(prev => prev.map(l => l.id === editingLote.id
      ? { ...l, tipo: editingLote.tipo.trim(), cantidad: nuevaCantidad, coste: nuevoCoste, consumido_ajuste: nuevoAjuste, notas: editingLote.notas }
      : l
    ));
    setEditingLote(null);
  };

  const stockPorTipo = calcularStockPorTipo(lotes, consumoPorTipo);
  const tipos = Object.keys(stockPorTipo).sort();

  if (loading) return <div className="py-6 flex justify-center"><div className="w-6 h-6 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Alertas de stock bajo */}
      {tipos.filter(t => {
        const s = stockPorTipo[t];
        const restante = s.total - s.consumido - s.consumido_ajuste;
        return s.stock_minimo > 0 && restante <= s.stock_minimo;
      }).map(tipo => {
        const s = stockPorTipo[tipo];
        const restante = s.total - s.consumido - s.consumido_ajuste;
        return (
          <motion.div
            key={`alerta_${tipo}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-700 text-sm">⚠️ Stock bajo: {tipo}</p>
              <p className="text-xs text-amber-600">Quedan <b>{restante}</b> unidades (mínimo: {s.stock_minimo})</p>
            </div>
          </motion.div>
        );
      })}

      {/* Resumen por tipo */}
      {tipos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock actual por tipo</p>
          {tipos.map(tipo => {
            const s = stockPorTipo[tipo];
            const restante = s.total - s.consumido - s.consumido_ajuste;
            const porcentaje = s.total > 0 ? Math.max(0, (restante / s.total) * 100) : 0;
            const bajo = s.stock_minimo > 0 && restante <= s.stock_minimo;
            const isEditingMin = editingMinimo?.tipo === tipo;

            return (
              <div key={tipo} className={`bg-white rounded-2xl border shadow-sm p-4 ${bajo ? "border-amber-200" : "border-gray-100"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🍺</span>
                    <span className="font-bold text-gray-800 text-sm">{tipo}</span>
                    {bajo && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-black ${bajo ? "text-amber-600" : "text-[#630027]"}`}>{restante}</span>
                    <span className="text-xs text-gray-400 ml-1">/ {s.total} uds.</span>
                  </div>
                </div>
                {/* Barra de progreso */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${bajo ? "bg-amber-400" : "bg-[#630027]"}`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                   <span>{s.consumido + s.consumido_ajuste} consumidas{s.consumido_ajuste > 0 && <span className="text-gray-300"> (+{s.consumido_ajuste} ajuste)</span>}</span>
                  {/* Stock mínimo editable solo para admins */}
                  {puedeGestionar ? (
                    isEditingMin ? (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Mín:</span>
                        <input
                          type="number"
                          min="0"
                          value={editingMinimo.valor}
                          onChange={e => setEditingMinimo({ tipo, valor: e.target.value })}
                          className="w-14 text-xs border border-gray-200 rounded-lg px-1.5 py-0.5 text-center"
                          autoFocus
                        />
                        <button onClick={() => handleGuardarMinimo(tipo)} className="text-green-500 hover:text-green-700"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingMinimo(null)} className="text-gray-400 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingMinimo({ tipo, valor: s.stock_minimo.toString() })}
                        className="flex items-center gap-1 hover:text-[#630027] transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Alerta en: <b className="ml-0.5">{s.stock_minimo || "—"}</b>
                      </button>
                    )
                  ) : (
                    s.stock_minimo > 0 && <span>Alerta en: <b>{s.stock_minimo}</b></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botón añadir lote */}
      {puedeGestionar && (
        <div>
          {!form ? (
            <Button
              onClick={() => setForm({ ...EMPTY_FORM })}
              className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Añadir lote
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3"
            >
              <p className="font-bold text-sm text-gray-700">Nuevo lote de cerveza</p>
              <Input
                placeholder="Tipo de cerveza (ej: Estrella, Voll-Damm) *"
                value={form.tipo}
                onChange={e => setForm(v => ({ ...v, tipo: e.target.value }))}
                className="rounded-xl border-gray-200"
                list="tipos-sugeridos"
              />
              {/* Datalist con tipos ya existentes */}
              <datalist id="tipos-sugeridos">
                {tipos.map(t => <option key={t} value={t} />)}
              </datalist>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Cantidad (uds) *</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Ej: 24"
                    value={form.cantidad}
                    onChange={e => setForm(v => ({ ...v, cantidad: e.target.value }))}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Coste total (€)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej: 18.50"
                    value={form.coste}
                    onChange={e => setForm(v => ({ ...v, coste: e.target.value }))}
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Fecha *</label>
                <Input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm(v => ({ ...v, fecha: e.target.value }))}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <Input
                placeholder="Notas (opcional)"
                value={form.notas}
                onChange={e => setForm(v => ({ ...v, notas: e.target.value }))}
                className="rounded-xl border-gray-200"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setForm(null)} className="rounded-xl">Cancelar</Button>
                <Button
                  onClick={handleAñadirLote}
                  disabled={!form.tipo?.trim() || !form.cantidad || !form.fecha}
                  className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl"
                >
                  Añadir
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Historial de lotes */}
      {lotes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Historial de lotes</p>
          <div className="space-y-2">
            {lotes.map(lote => {
              const fechaStr = lote.fecha ? format(new Date(lote.fecha), "d MMM yyyy", { locale: es }) : "—";
              const precioUnit = lote.cantidad > 0 && lote.coste > 0 ? (lote.coste / lote.cantidad).toFixed(2) : null;
              const isEditing = editingLote?.id === lote.id;
              return (
                <div key={lote.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#630027]/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-[#630027]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm">{lote.tipo}</p>
                      <p className="text-xs text-gray-400">
                        {fechaStr} · <b>{lote.cantidad} uds.</b>
                        {(lote.consumido_ajuste || 0) > 0 && <span className="text-amber-500"> · {lote.consumido_ajuste} consumidas (ajuste)</span>}
                        {lote.coste > 0 && <> · {lote.coste.toFixed(2).replace(".", ",")}€{precioUnit && <span className="text-gray-300"> ({precioUnit}€/ud)</span>}</>}
                      </p>
                      {lote.notas && <p className="text-xs text-gray-400 italic truncate">{lote.notas}</p>}
                    </div>
                    {puedeGestionar && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => isEditing ? setEditingLote(null) : handleEditarLote(lote)}
                          className={`p-1.5 rounded-lg transition-colors ${isEditing ? "text-gray-400 hover:text-red-400" : "text-gray-300 hover:text-[#630027]"}`}
                          title={isEditing ? "Cancelar" : "Editar lote"}
                        >
                          {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleEliminar(lote.id)} className="p-1.5 rounded-lg text-gray-200 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Panel de edición inline */}
                  <AnimatePresence initial={false}>
                    {isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Nombre / tipo</label>
                            <Input
                              value={editingLote.tipo}
                              onChange={e => setEditingLote(v => ({ ...v, tipo: e.target.value }))}
                              className="rounded-xl border-gray-200 text-sm h-8"
                              placeholder="Ej: Estrella, Voll-Damm..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Cantidad total (uds)</label>
                              <Input
                                type="number"
                                min="0"
                                value={editingLote.cantidad}
                                onChange={e => setEditingLote(v => ({ ...v, cantidad: e.target.value }))}
                                className="rounded-xl border-gray-200 text-sm h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">Coste total (€)</label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editingLote.coste}
                                onChange={e => setEditingLote(v => ({ ...v, coste: e.target.value }))}
                                className="rounded-xl border-gray-200 text-sm h-8"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Consumidas (ajuste manual)</label>
                            <Input
                              type="number"
                              min="0"
                              value={editingLote.consumido_ajuste}
                              onChange={e => setEditingLote(v => ({ ...v, consumido_ajuste: e.target.value }))}
                              className="rounded-xl border-gray-200 text-sm h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Notas</label>
                            <Input
                              value={editingLote.notas}
                              onChange={e => setEditingLote(v => ({ ...v, notas: e.target.value }))}
                              className="rounded-xl border-gray-200 text-sm h-8"
                              placeholder="Notas opcionales..."
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">El consumo automático se calcula aparte. Usa el ajuste para correcciones manuales.</p>
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            onClick={handleGuardarLote}
                            className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-xs"
                          >
                            <Save className="w-3.5 h-3.5 mr-1" /> Guardar cambios
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lotes.length === 0 && (
        <div className="text-center py-8 text-gray-300 text-sm">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>No hay lotes registrados aún</p>
        </div>
      )}
    </div>
  );
}