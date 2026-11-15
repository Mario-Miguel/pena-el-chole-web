import React, { useState, useMemo } from "react";
import { Search, User, ChevronDown, ChevronUp } from "lucide-react";
import { fmt, toNum } from "@/lib/finanzas";

export default function BalanceUsuarios({ balances }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("balance");
  const [sortDir, setSortDir] = useState("desc");

  const filtrados = useMemo(() => {
    let list = balances.filter(b => {
      if (!search) return true;
      return b.nombre.toLowerCase().includes(search.toLowerCase());
    });
    list = [...list].sort((a, b) => {
      const va = parseFloat(a[sortKey]) || 0;
      const vb = parseFloat(b[sortKey]) || 0;
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return list;
  }, [balances, search, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ col }) => sortKey === col ? (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : null;

  const totalDebe = balances.reduce((s, b) => s + toNum(b.debe), 0);
  const totalHaber = balances.reduce((s, b) => s + toNum(b.haber), 0);
  const totalBalance = totalDebe - totalHaber;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Resumen */}
      <div className="p-4 border-b border-gray-50">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <p className="text-xs text-gray-400">Total debe</p>
            <p className="text-sm font-bold text-red-600">{fmt(totalDebe)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Total haber</p>
            <p className="text-sm font-bold text-emerald-600">{fmt(totalHaber)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Balance</p>
            <p className={`text-sm font-bold ${totalBalance >= 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(totalBalance)}</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar usuario..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#630027]"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400">
              <th className="text-left px-4 py-2 font-medium">Usuario</th>
              <th className="text-right px-2 py-2 font-medium cursor-pointer hover:text-[#630027]" onClick={() => toggleSort("debe")}>
                <span className="flex items-center justify-end gap-1">Debe <SortIcon col="debe" /></span>
              </th>
              <th className="text-right px-2 py-2 font-medium cursor-pointer hover:text-[#630027]" onClick={() => toggleSort("haber")}>
                <span className="flex items-center justify-end gap-1">Haber <SortIcon col="haber" /></span>
              </th>
              <th className="text-right px-4 py-2 font-medium cursor-pointer hover:text-[#630027]" onClick={() => toggleSort("balance")}>
                <span className="flex items-center justify-end gap-1">Balance <SortIcon col="balance" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-6 text-gray-300 text-xs">Sin usuarios que mostrar.</td></tr>
            ) : (
              filtrados.map((b, i) => {
                const balance = toNum(b.debe) - toNum(b.haber);
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#630027]/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-[#630027]" />
                        </div>
                        <span className="font-medium text-gray-700 text-sm">{b.nombre}</span>
                      </div>
                    </td>
                    <td className="text-right px-2 py-2.5 text-red-600 font-medium">{fmt(b.debe)}</td>
                    <td className="text-right px-2 py-2.5 text-emerald-600 font-medium">{fmt(b.haber)}</td>
                    <td className={`text-right px-4 py-2.5 font-bold ${balance > 0 ? "text-red-600" : balance < 0 ? "text-emerald-600" : "text-gray-400"}`}>
                      {fmt(balance)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}