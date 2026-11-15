import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { X, TrendingUp, Package, BarChart2, Archive, ChevronDown, ChevronUp, Trash2, CheckCircle2 } from "lucide-react";

const COLORS = ["#630027", "#b91c1c", "#d97706", "#15803d", "#1d4ed8", "#7c3aed", "#be185d", "#0891b2"];

export default function EstadisticasAlmacen({ items, onClose, onArchivar }) {
  const [movimientos, setMovimientos] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("mensual");
  const [archivoExpandido, setArchivoExpandido] = useState(null);
  const [archivando, setArchivando] = useState(false);
  const [archivoOk, setArchivoOk] = useState(false);
  const [confirmArchivar, setConfirmArchivar] = useState(false);

  const cargarDatos = () => {
    return Promise.all([
      base44.entities.MovimientoAlmacen.list("-created_date", 500),
      base44.entities.AppConfig.list(),
    ]).then(([movs, configs]) => {
      setMovimientos(movs);
      const archivados = configs
        .filter(c => c.clave?.startsWith("almacen_archivo_"))
        .map(c => { try { return { id: c.id, clave: c.clave, ...JSON.parse(c.valor) }; } catch { return null; } })
        .filter(Boolean)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setArchivos(archivados);
      setLoading(false);
    });
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleArchivar = async () => {
    setArchivando(true);
    setConfirmArchivar(false);
    const año = new Date().getFullYear();
    const resumen = items.map(i => ({ nombre: i.nombre, categoria: i.categoria, cantidad: i.cantidad ?? 0 }));
    await base44.entities.AppConfig.create({
      clave: `almacen_archivo_${año}_${Date.now()}`,
      valor: JSON.stringify({ año, fecha: new Date().toISOString(), items: resumen, total: items.length }),
    });
    // Borrar todos los movimientos para resetear estadísticas
    const movs = await base44.entities.MovimientoAlmacen.list("-created_date", 1000);
    await Promise.all(movs.map(m => base44.entities.MovimientoAlmacen.delete(m.id)));

    setArchivando(false);
    setArchivoOk(true);
    setMovimientos([]);
    await cargarDatos();
    if (onArchivar) onArchivar();
    setTimeout(() => setArchivoOk(false), 3000);
  };

  const handleBorrarArchivo = async (e, archivo) => {
    e.stopPropagation();
    await base44.entities.AppConfig.delete(archivo.id);
    setArchivos(prev => prev.filter(a => a.id !== archivo.id));
    if (archivoExpandido === archivo.id) setArchivoExpandido(null);
  };

  // --- Movimiento mensual (últimos 6 meses) ---
  const movimientoMensual = Array.from({ length: 6 }, (_, i) => {
    const mes = subMonths(new Date(), 5 - i);
    const inicio = startOfMonth(mes).getTime();
    const fin = endOfMonth(mes).getTime();
    const del_mes = movimientos.filter(m => {
      const t = new Date(m.created_date).getTime();
      return t >= inicio && t <= fin;
    });
    return {
      mes: format(mes, "MMM", { locale: es }),
      entradas: del_mes.filter(m => m.tipo === "entrada").reduce((s, m) => s + (m.cantidad || 0), 0),
      salidas: del_mes.filter(m => m.tipo === "salida").reduce((s, m) => s + (m.cantidad || 0), 0),
    };
  });

  // --- Top artículos más utilizados (por salidas) ---
  const usosPorItem = {};
  movimientos.filter(m => m.tipo === "salida").forEach(m => {
    usosPorItem[m.item_nombre] = (usosPorItem[m.item_nombre] || 0) + (m.cantidad || 0);
  });
  const topItems = Object.entries(usosPorItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([nombre, total]) => ({ nombre: nombre.length > 16 ? nombre.slice(0, 14) + "…" : nombre, total }));

  // --- Consumo por categoría (stock actual) ---
  const porCategoria = {};
  items.forEach(i => {
    const cat = i.categoria || "otros";
    porCategoria[cat] = (porCategoria[cat] || 0) + (i.cantidad || 0);
  });
  const dataPie = Object.entries(porCategoria).map(([name, value]) => ({ name, value }));

  const tabs = [
    { id: "mensual", label: "Mensual", icon: TrendingUp },
    { id: "top", label: "Más usados", icon: Package },
    { id: "categoria", label: "Por categoría", icon: BarChart2 },
    { id: "archivo", label: `Archivo${archivos.length > 0 ? ` (${archivos.length})` : ""}`, icon: Archive },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-0 sm:p-4 pt-16 sm:pt-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[80vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-[#630027]">Estadísticas de Inventario</h2>
            <p className="text-xs text-gray-400 mt-0.5">{items.length} artículos · {movimientos.length} movimientos registrados</p>
          </div>
          <div className="flex items-center gap-2">
            {onArchivar && (
              <button
                onClick={() => setConfirmArchivar(true)}
                disabled={archivando}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-amber-50 hover:text-amber-700 text-gray-600 text-xs font-semibold transition-colors disabled:opacity-50"
                title="Archivar inventario actual y resetear estadísticas"
              >
                {archivando ? (
                  <div className="w-3.5 h-3.5 border-2 border-gray-400/30 border-t-gray-500 rounded-full animate-spin" />
                ) : (
                  <Archive className="w-3.5 h-3.5" />
                )}
                {archivando ? "Archivando..." : "Archivar"}
              </button>
            )}
            {archivoOk && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" /> Archivado
              </span>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 flex-wrap">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === t.id ? "bg-[#630027] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {tab === "mensual" && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">Movimientos de los últimos 6 meses</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={movimientoMensual} barSize={18}>
                      <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="entradas" name="Entradas" fill="#15803d" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="salidas" name="Salidas" fill="#630027" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-green-600 font-semibold">Total entradas</p>
                      <p className="text-xl font-black text-green-700">{movimientos.filter(m => m.tipo === "entrada").reduce((s, m) => s + (m.cantidad || 0), 0)}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-red-600 font-semibold">Total salidas</p>
                      <p className="text-xl font-black text-red-700">{movimientos.filter(m => m.tipo === "salida").reduce((s, m) => s + (m.cantidad || 0), 0)}</p>
                    </div>
                    <div className="bg-[#630027]/5 rounded-xl p-3 text-center">
                      <p className="text-xs text-[#630027] font-semibold">Movimientos</p>
                      <p className="text-xl font-black text-[#630027]">{movimientos.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {tab === "top" && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">Artículos con mayor consumo (salidas acumuladas)</p>
                  {topItems.length === 0 ? (
                    <p className="text-center text-gray-300 text-sm py-12">Sin datos de salidas aún</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topItems} layout="vertical" barSize={14}>
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={100} />
                        <Tooltip />
                        <Bar dataKey="total" name="Unidades usadas" fill="#630027" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {tab === "categoria" && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">Stock actual distribuido por categoría</p>
                  {dataPie.length === 0 ? (
                    <p className="text-center text-gray-300 text-sm py-12">Sin artículos</p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={dataPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {dataPie.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {dataPie.map((d, idx) => (
                          <div key={d.name} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[idx % COLORS.length] }} />
                            <span className="text-xs text-gray-600 flex-1">{d.name}</span>
                            <span className="text-xs font-bold text-gray-800">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {tab === "archivo" && (
                <div>
                  <p className="text-xs text-gray-500 mb-4">Snapshots del inventario archivados</p>
                  {archivos.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-2">🗄️</p>
                      <p className="text-gray-300 text-sm">No hay archivos guardados</p>
                      <p className="text-gray-200 text-xs mt-1">Usa el botón "Archivar" para guardar un snapshot</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {archivos.map(a => (
                        <div key={a.id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                          <button
                            onClick={() => setArchivoExpandido(archivoExpandido === a.id ? null : a.id)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
                          >
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-800">
                                Archivo {a.año} — {a.total} artículos
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(a.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <button
                                onClick={(e) => handleBorrarArchivo(e, a)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors"
                                title="Borrar archivo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              {archivoExpandido === a.id
                                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                : <ChevronDown className="w-4 h-4 text-gray-400" />
                              }
                            </div>
                          </button>
                          {archivoExpandido === a.id && a.items?.length > 0 && (
                            <div className="px-4 pb-3 border-t border-gray-100 max-h-48 overflow-y-auto">
                              <table className="w-full text-xs mt-2">
                                <thead>
                                  <tr className="text-gray-400 uppercase">
                                    <th className="text-left py-1">Artículo</th>
                                    <th className="text-left py-1">Categoría</th>
                                    <th className="text-right py-1">Cantidad</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {a.items.map((item, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : ""}>
                                      <td className="py-1 text-gray-700 font-medium">{item.nombre}</td>
                                      <td className="py-1 text-gray-400">{item.categoria}</td>
                                      <td className="py-1 text-right font-bold text-gray-800">{item.cantidad}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialog confirmación archivar */}
      {confirmArchivar && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Archive className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Archivar inventario</h3>
                <p className="text-xs text-gray-400">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Se guardará un snapshot con <span className="font-bold text-gray-800">{items.length} artículos</span> y se resetearán todas las estadísticas de movimientos.
            </p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 mb-4 text-xs text-amber-700">
              ⚠️ El historial de movimientos se borrará para empezar desde cero.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmArchivar(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleArchivar}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
              >
                Sí, archivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}