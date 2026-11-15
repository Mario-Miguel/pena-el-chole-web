import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Archive, ChevronDown, ChevronUp, Trash2, ShoppingBag, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ArchivoCompras({ items, onArchivar, onRefresh }) {
  const { sesion } = useAuth();
  const puedeArchivar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";
  const [archivos, setArchivos] = useState([]);
  const [abiertos, setAbiertos] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [archivando, setArchivando] = useState(false);

  const loadArchivos = useCallback(async () => {
    const data = await base44.entities.CompraArchivo.list("-created_date");
    setArchivos(data);
  }, []);

  useEffect(() => { loadArchivos(); }, [loadArchivos]);

  const handleArchivar = async () => {
    if (!anio.trim()) return;
    setArchivando(true);
    const pagos = await base44.entities.PagoRegistrado.list();
    const totalGasto = items.reduce((sum, i) => sum + (i.precio || 0) * (i.cantidad || 1), 0);

    // Calcular resumen de cuentas
    const cuentasMap = {};
    items.forEach(item => {
      if (!item.comprador_nombre) return;
      if (!cuentasMap[item.comprador_nombre]) cuentasMap[item.comprador_nombre] = { deuda: 0, pagado: 0 };
      cuentasMap[item.comprador_nombre].deuda += (item.precio || 0) * (item.cantidad || 1);
    });
    pagos.forEach(p => {
      if (!cuentasMap[p.persona]) cuentasMap[p.persona] = { deuda: 0, pagado: 0 };
      cuentasMap[p.persona].pagado += p.importe || 0;
    });

    await base44.entities.CompraArchivo.create({
      anio,
      titulo: `Archivo compras ${anio}`,
      items_json: JSON.stringify(items.map(i => ({
        nombre: i.nombre,
        precio: i.precio,
        cantidad: i.cantidad,
        comprador_nombre: i.comprador_nombre,
        comprado: i.comprado,
        pagado: i.pagado,
      }))),
      cuentas_json: JSON.stringify(cuentasMap),
      total_items: items.length,
      total_gasto: totalGasto,
      archivado_por: sesion?.nombre || "Admin",
    });

    // Eliminar todos los items y pagos registrados
    await Promise.all([
      ...items.map(i => base44.entities.ItemCompra.delete(i.id)),
      ...pagos.map(p => base44.entities.PagoRegistrado.delete(p.id)),
    ]);

    // Limpiar log de pagos en Admin también
    if (onArchivar) onArchivar();

    setDialogOpen(false);
    setArchivando(false);
    loadArchivos();
    if (onRefresh) onRefresh();
  };

  const handleEliminarArchivo = async (id) => {
    if (!confirm("¿Eliminar este archivo? No se puede deshacer.")) return;
    await base44.entities.CompraArchivo.delete(id);
    loadArchivos();
  };

  const toggleAbierto = (id) => setAbiertos(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="mt-6">
      {puedeArchivar && (
        <div className="flex justify-end mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="text-[#630027] border-[#630027]/20 hover:bg-[#630027]/5 rounded-xl text-xs"
          >
            <Archive className="w-3.5 h-3.5 mr-1.5" /> Archivar año
          </Button>
        </div>
      )}

      {archivos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5" /> Archivo ({archivos.length})
          </p>
          <div className="space-y-2">
            {archivos.map(archivo => {
              let itemsData = [];
              let cuentasData = {};
              try { itemsData = JSON.parse(archivo.items_json || "[]"); } catch {}
              try { cuentasData = JSON.parse(archivo.cuentas_json || "{}"); } catch {}
              const abierto = abiertos[archivo.id];

              return (
                <div key={archivo.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleAbierto(archivo.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#630027]/10 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-[#630027]" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-800 text-sm">{archivo.titulo || `Archivo ${archivo.anio}`}</p>
                        <p className="text-xs text-gray-400">{archivo.total_items} items · {(archivo.total_gasto || 0).toFixed(2)}€</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {puedeArchivar && (
                        <button
                          onClick={e => { e.stopPropagation(); handleEliminarArchivo(archivo.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-200 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {abierto ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {abierto && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 border-t border-gray-50 space-y-4">
                          {/* Cuentas resumen */}
                          {Object.keys(cuentasData).length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <CreditCard className="w-3 h-3" /> Resumen de cuentas
                              </p>
                              <div className="space-y-1.5">
                                {Object.entries(cuentasData).map(([nombre, c]) => (
                                  <div key={nombre} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                                    <span className="font-medium text-gray-700">{nombre}</span>
                                    <div className="flex gap-3 text-xs text-gray-500">
                                      <span>Deuda: <b className="text-gray-700">{(c.deuda || 0).toFixed(2)}€</b></span>
                                      <span>Pagado: <b className="text-green-600">{(c.pagado || 0).toFixed(2)}€</b></span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Items */}
                          {itemsData.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <ShoppingBag className="w-3 h-3" /> Items ({itemsData.length})
                              </p>
                              <div className="space-y-1 max-h-48 overflow-y-auto">
                                {itemsData.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs text-gray-600 border-b border-gray-50 pb-1 last:border-0">
                                    <span className="truncate flex-1 mr-2">{item.nombre}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {item.comprador_nombre && <span className="text-gray-400">{item.comprador_nombre}</span>}
                                      <span className="font-semibold">{((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}€</span>
                                      {item.pagado && <span className="text-green-500">✓</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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

      {/* Dialog archivar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#630027]">Archivar compras</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-gray-500">Se archivará un resumen de todos los items, cuentas y pagos de este año.</p>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Año</label>
              <Input value={anio} onChange={e => setAnio(e.target.value)} placeholder="Ej: 2025" className="rounded-xl border-gray-200" />
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700">Resumen a archivar:</p>
              <p>{items.length} items en total</p>
              <p>{items.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0).toFixed(2)}€ de gasto</p>
            </div>
            <Button onClick={handleArchivar} disabled={archivando || !anio.trim()} className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
              <Archive className="w-4 h-4 mr-2" /> {archivando ? "Archivando..." : `Archivar "Compras ${anio}"`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}