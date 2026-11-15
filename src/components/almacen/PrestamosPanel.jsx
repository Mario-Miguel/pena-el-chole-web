import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, CheckCircle, Package, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "../auth/AuthContext";
import ConfirmDialog from "../ConfirmDialog";

function NuevoPrestamoForm({ items, onGuardado, onCancelar }) {
  const { sesion } = useAuth();
  const [itemId, setItemId] = useState("");
  const [itemNombre, setItemNombre] = useState("");
  const [prestadoA, setPrestadoA] = useState("");
  const [fechaPrestamo, setFechaPrestamo] = useState(new Date().toISOString().split("T")[0]);
  const [fechaDevEst, setFechaDevEst] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const handleSelectItem = (e) => {
    const id = e.target.value;
    setItemId(id);
    const item = items.find(i => i.id === id);
    setItemNombre(item?.nombre || "");
  };

  const handleGuardar = async () => {
    if (!itemNombre.trim() || !prestadoA.trim() || !fechaPrestamo) return;
    setGuardando(true);
    await base44.entities.PrestamoAlmacen.create({
      item_id: itemId || null,
      item_nombre: itemNombre.trim(),
      prestado_a: prestadoA.trim(),
      fecha_prestamo: fechaPrestamo,
      fecha_devolucion_estimada: fechaDevEst || null,
      notas: notas.trim(),
      devuelto: false,
      registrado_por: sesion?.nombre || "",
    });
    setGuardando(false);
    onGuardado();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 mb-4"
    >
      <p className="font-bold text-gray-700 text-sm">Registrar préstamo</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Artículo</Label>
          <select
            value={itemId}
            onChange={handleSelectItem}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4B1924]/20 bg-white"
          >
            <option value="">Seleccionar del almacén…</option>
            {items.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
          </select>
          {!itemId && (
            <Input
              className="mt-2 rounded-xl border-gray-200 text-sm"
              placeholder="O escribe el nombre manualmente"
              value={itemNombre}
              onChange={e => setItemNombre(e.target.value)}
            />
          )}
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Prestado a *</Label>
          <Input value={prestadoA} onChange={e => setPrestadoA(e.target.value)} placeholder="Nombre de persona/entidad" className="rounded-xl border-gray-200 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Fecha préstamo *</Label>
          <Input type="date" value={fechaPrestamo} onChange={e => setFechaPrestamo(e.target.value)} className="rounded-xl border-gray-200 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Devolución estimada</Label>
          <Input type="date" value={fechaDevEst} onChange={e => setFechaDevEst(e.target.value)} className="rounded-xl border-gray-200 text-sm" />
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Notas</Label>
        <Input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Opcional" className="rounded-xl border-gray-200 text-sm" />
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" size="sm" onClick={onCancelar} className="rounded-xl text-xs h-8">Cancelar</Button>
        <Button size="sm" onClick={handleGuardar} disabled={(!itemNombre.trim()) || !prestadoA.trim() || guardando} className="bg-[#4B1924] hover:bg-[#3a1019] text-white rounded-xl text-xs h-8">
          {guardando ? "Guardando…" : "Registrar"}
        </Button>
      </div>
    </motion.div>
  );
}

export default function PrestamosPanel({ items, puedeGestionar }) {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filtro, setFiltro] = useState("activos"); // "activos" | "todos"
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const cargar = async () => {
    const data = await base44.entities.PrestamoAlmacen.list("-fecha_prestamo");
    setPrestamos(data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const handleDevuelto = async (prestamo) => {
    await base44.entities.PrestamoAlmacen.update(prestamo.id, {
      devuelto: true,
      fecha_devolucion_real: new Date().toISOString().split("T")[0],
    });
    cargar();
  };

  const handleDelete = async (id) => {
    await base44.entities.PrestamoAlmacen.delete(id);
    setConfirmDeleteId(null);
    cargar();
  };

  const filtrados = filtro === "activos"
    ? prestamos.filter(p => !p.devuelto)
    : prestamos;

  const activos = prestamos.filter(p => !p.devuelto).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-indigo-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="w-5 h-5 text-white" />
          <h2 className="text-white font-bold text-lg">Préstamos</h2>
          {activos > 0 && (
            <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {activos} activo{activos !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {puedeGestionar && (
          <Button
            size="icon"
            onClick={() => setShowForm(s => !s)}
            className="h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 text-white border-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="p-4">
        <AnimatePresence>
          {showForm && (
            <NuevoPrestamoForm
              items={items}
              onGuardado={() => { cargar(); setShowForm(false); }}
              onCancelar={() => setShowForm(false)}
            />
          )}
        </AnimatePresence>

        {/* Filtro tabs */}
        <div className="flex gap-2 mb-4">
          {["activos", "todos"].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filtro === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f === "activos" ? "Activos" : "Todos"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-gray-300 text-sm py-6">
            {filtro === "activos" ? "No hay préstamos activos" : "No hay préstamos registrados"}
          </p>
        ) : (
          <div className="space-y-2">
            {filtrados.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`rounded-xl border px-3 py-3 flex items-start gap-3 ${
                  p.devuelto ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-indigo-100"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${p.devuelto ? "bg-green-100" : "bg-indigo-100"}`}>
                  {p.devuelto
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : <Package className="w-4 h-4 text-indigo-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{p.item_nombre}</p>
                  <p className="text-xs text-gray-600">
                    Prestado a: <span className="font-medium text-indigo-600">{p.prestado_a}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {p.fecha_prestamo ? format(parseISO(p.fecha_prestamo), "d MMM yyyy", { locale: es }) : "—"}
                    {p.fecha_devolucion_estimada && !p.devuelto && (
                      <> · Devolver: {format(parseISO(p.fecha_devolucion_estimada), "d MMM yyyy", { locale: es })}</>
                    )}
                  </p>
                  {p.devuelto && p.fecha_devolucion_real && (
                    <p className="text-xs text-green-600 font-medium">
                      Devuelto: {format(parseISO(p.fecha_devolucion_real), "d MMM yyyy", { locale: es })}
                    </p>
                  )}
                  {p.notas && <p className="text-xs text-gray-400 mt-0.5 truncate">{p.notas}</p>}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {!p.devuelto && puedeGestionar && (
                    <button
                      onClick={() => handleDevuelto(p)}
                      title="Marcar como devuelto"
                      className="p-1.5 rounded-lg hover:bg-green-50 text-green-400 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {puedeGestionar && (
                    <button
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-200 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      <ConfirmDialog
        open={!!confirmDeleteId}
        mensaje="¿Eliminar este registro de préstamo? Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        onConfirm={() => handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
      </div>
    </div>
  );
}