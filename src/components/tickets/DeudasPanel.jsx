import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Plus, Trash2, Check, X, Euro, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const fmt = (v) => (parseFloat(v) || 0).toFixed(2);

export default function DeudasPanel({ puedeGestionar }) {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ proveedor: "", concepto: "", importe: "", fecha_vencimiento: "", notas: "" });

  const { data: deudas = [] } = useQuery({
    queryKey: ["deudas_proveedor"],
    queryFn: () => api.entities.DeudaProveedor.list("-created_date"),
  });

  const createMut = useMutation({
    mutationFn: (d) => api.entities.DeudaProveedor.create(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deudas_proveedor"] }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => api.entities.DeudaProveedor.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deudas_proveedor"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => api.entities.DeudaProveedor.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deudas_proveedor"] }),
  });

  const pendientes = deudas.filter(d => !d.pagado);
  const pagadas = deudas.filter(d => d.pagado);
  const totalPendiente = pendientes.reduce((s, d) => s + (d.importe || 0), 0);
  const totalPagado = pagadas.reduce((s, d) => s + (d.importe || 0), 0);

  const togglePagado = (deuda) => {
    updateMut.mutate({ id: deuda.id, pagado: !deuda.pagado });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await createMut.mutateAsync({
      ...form,
      importe: parseFloat(form.importe) || 0,
    });
    setForm({ proveedor: "", concepto: "", importe: "", fecha_vencimiento: "", notas: "" });
    setShowNew(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Euro className="w-5 h-5 text-[#630027]" />
          <h3 className="font-bold text-gray-800 text-sm">Deudas con proveedores</h3>
        </div>
        {puedeGestionar && (
          <button onClick={() => setShowNew(v => !v)} className="text-xs text-[#630027] font-medium flex items-center gap-0.5 hover:underline">
            <Plus size={13} />Nueva deuda
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 p-3">
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 mb-0.5">Pendiente</p>
          <p className="text-lg font-bold text-red-500">{fmt(totalPendiente)}€</p>
          <p className="text-[10px] text-gray-400">{pendientes.length} deuda(s)</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 mb-0.5">Pagado</p>
          <p className="text-lg font-bold text-green-500">{fmt(totalPagado)}€</p>
          <p className="text-[10px] text-gray-400">{pagadas.length} deuda(s)</p>
        </div>
      </div>

      {/* New debt form */}
      {showNew && puedeGestionar && (
        <form onSubmit={handleCreate} className="px-3 pb-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Proveedor *" value={form.proveedor} onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))} required />
            <input type="number" step="0.01" min="0" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Importe (€) *" value={form.importe} onChange={e => setForm(f => ({ ...f, importe: e.target.value }))} required />
          </div>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Concepto" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400">Fecha vencimiento</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.fecha_vencimiento} onChange={e => setForm(f => ({ ...f, fecha_vencimiento: e.target.value }))} />
            </div>
            <div className="flex items-end gap-1">
              <button type="submit" className="flex-1 bg-[#630027] text-white rounded-lg py-2 text-sm font-medium">Crear</button>
              <button type="button" onClick={() => setShowNew(false)} className="p-2 border border-gray-200 rounded-lg text-gray-400"><X size={16} /></button>
            </div>
          </div>
          <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2} placeholder="Notas" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
        </form>
      )}

      {/* List */}
      <div className="px-3 pb-3 space-y-2">
        {deudas.length === 0 ? (
          <p className="text-center py-6 text-gray-300 text-sm">Sin deudas registradas</p>
        ) : (
          deudas.map(d => (
            <div key={d.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${d.pagado ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{d.proveedor}</p>
                {d.concepto && <p className="text-xs text-gray-400 truncate">{d.concepto}</p>}
                <div className="flex items-center gap-2 mt-0.5">
                  {d.fecha_vencimiento && <span className="text-[10px] text-gray-400">Vence: {format(new Date(d.fecha_vencimiento), "d MMM yy", { locale: es })}</span>}
                  {d.pagado ? (
                    <span className="text-[10px] text-green-600 flex items-center gap-0.5"><CheckCircle2 size={10} />Pagada</span>
                  ) : (
                    <span className="text-[10px] text-red-500 flex items-center gap-0.5"><AlertCircle size={10} />Pendiente</span>
                  )}
                </div>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${d.pagado ? "text-green-600" : "text-red-500"}`}>{fmt(d.importe)}€</span>
              {puedeGestionar && (
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => togglePagado(d)} className={`p-1.5 rounded-lg ${d.pagado ? "text-gray-300 hover:text-amber-500" : "text-gray-300 hover:text-green-500"}`}>
                    <Check size={14} />
                  </button>
                  <button onClick={() => deleteMut.mutate(d.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}