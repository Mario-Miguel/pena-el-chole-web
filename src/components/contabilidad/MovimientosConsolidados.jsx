import React, { useState, useMemo } from "react";
import { Search, TrendingUp, TrendingDown, Filter } from "lucide-react";

function fmt(v) {
  const n = parseFloat(v) || 0;
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

const CATEGORIAS = ["todas", "cuota", "compra", "subvencion", "evento", "deuda", "cerveza", "loteria", "ticket", "otros"];
const FUENTES = ["todas", "manual", "ticket", "cuota", "cerveza", "loteria", "pago", "deuda", "compra"];

const FUENTE_LABEL = {
  manual: "Manual", ticket: "Ticket", cuota: "Cuota", cerveza: "Cerveza",
  loteria: "Lotería", pago: "Pago", deuda: "Deuda", compra: "Compra",
};

export default function MovimientosConsolidados({ movimientos }) {
  const [search, setSearch] = useState("");
  const [catFiltro, setCatFiltro] = useState("todas");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [fuenteFiltro, setFuenteFiltro] = useState("todas");

  const filtrados = useMemo(() => {
    return movimientos
      .filter(m => {
        if (catFiltro !== "todas" && m.categoria !== catFiltro) return false;
        if (tipoFiltro !== "todos" && m.tipo !== tipoFiltro) return false;
        if (fuenteFiltro !== "todas" && m.fuente !== fuenteFiltro) return false;
        if (search) {
          const q = search.toLowerCase();
          const txt = `${m.concepto || ""} ${m.usuario || ""} ${m.notas || ""}`.toLowerCase();
          if (!txt.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [movimientos, search, catFiltro, tipoFiltro, fuenteFiltro]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Filtros */}
      <div className="p-4 border-b border-gray-50 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por concepto, usuario, notas..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#630027]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5">
            <option value="todos">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>
          <select value={catFiltro} onChange={e => setCatFiltro(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5">
            {CATEGORIAS.map(c => <option key={c} value={c}>{c === "todas" ? "Todas categorías" : c}</option>)}
          </select>
          <select value={fuenteFiltro} onChange={e => setFuenteFiltro(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5">
            {FUENTES.map(f => <option key={f} value={f}>{f === "todas" ? "Todas fuentes" : FUENTE_LABEL[f] || f}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-400">{filtrados.length} movimientos</p>
      </div>

      {/* Lista */}
      <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-50">
        {filtrados.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-8">Sin movimientos con los filtros actuales.</p>
        ) : (
          filtrados.map((m, i) => {
            const esIngreso = m.tipo === "ingreso";
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${esIngreso ? "bg-emerald-50" : "bg-red-50"}`}>
                  {esIngreso ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{m.concepto}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{m.fecha ? new Date(m.fecha).toLocaleDateString("es-ES") : "—"}</span>
                    {m.usuario && <span>· {m.usuario}</span>}
                    <span>· {FUENTE_LABEL[m.fuente] || m.fuente}</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">{m.categoria}</span>
                  </div>
                </div>
                <p className={`text-sm font-bold flex-shrink-0 ${esIngreso ? "text-emerald-600" : "text-red-600"}`}>
                  {esIngreso ? "+" : "−"}{fmt(m.cantidad)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}