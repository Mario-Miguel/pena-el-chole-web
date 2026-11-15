import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Check, X, ChevronDown, ChevronUp, Search } from "lucide-react";

const CATEGORIAS = ["cargos", "socios", "contribuyentes", "socios_honorificos", "patitas"];
const CAT_LABELS = {
  cargos: "Cargos", socios: "Socios", contribuyentes: "Contribuyentes",
  socios_honorificos: "Socios honoríficos", patitas: "Patitas",
};
const CARGOS = ["presidente", "vicepresidente", "secretario", "tesorero", "vocal"];

const FORM_INICIAL = { nombre: "", categoria: "socios", cargo: "", concepto: "Cuota anual 2025", importe: 50 };

function Badge({ pagada }) {
  return pagada
    ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1"><Check className="w-3 h-3" />Pagada</span>
    : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-500 flex items-center gap-1"><X className="w-3 h-3" />Pendiente</span>;
}

export default function GestionSocios() {
  const [integrantes, setIntegrantes] = useState([]);
  const [cuotas, setCuotas]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [busqueda, setBusqueda]       = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(FORM_INICIAL);
  const [errores, setErrores]         = useState({});
  const [guardando, setGuardando]     = useState(false);
  const [expandido, setExpandido]     = useState({});

  const cargar = useCallback(async () => {
    const [ints, cs] = await Promise.all([
      base44.entities.Integrante.list(),
      base44.entities.Cuota.list(),
    ]);
    setIntegrantes(ints.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setCuotas(cs);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const getCuotasSocio = (integranteId) => cuotas.filter(c => c.integrante_id === integranteId);

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!form.categoria)     e.categoria = "Selecciona una categoría";
    if (form.concepto && form.importe <= 0) e.importe = "El importe debe ser mayor que 0";
    return e;
  };

  const handleGuardar = async () => {
    const e = validar();
    if (Object.keys(e).length) { setErrores(e); return; }
    setGuardando(true);
    const intData = {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      ...(form.categoria === "cargos" && form.cargo ? { cargo: form.cargo } : {}),
    };
    const integrante = await base44.entities.Integrante.create(intData);
    // Crear cuota inicial si tiene concepto
    if (form.concepto.trim()) {
      await base44.entities.Cuota.create({
        integrante_id: integrante.id,
        integrante_nombre: integrante.nombre,
        concepto: form.concepto.trim(),
        importe: Number(form.importe),
        pagada: false,
      });
    }
    setForm(FORM_INICIAL);
    setShowForm(false);
    setErrores({});
    setGuardando(false);
    cargar();
  };

  const toggleCuota = async (cuota) => {
    await base44.entities.Cuota.update(cuota.id, {
      pagada: !cuota.pagada,
      fecha_pago: !cuota.pagada ? new Date().toISOString().split("T")[0] : "",
    });
    cargar();
  };

  const filtrados = integrantes.filter(i => {
    const matchBusq = i.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCat  = filtroCategoria === "todas" || i.categoria === filtroCategoria;
    return matchBusq && matchCat;
  });

  const resumen = {
    total: integrantes.length,
    conCuotaPagada: cuotas.filter(c => c.pagada).map(c => c.integrante_id),
    conCuotaPendiente: cuotas.filter(c => !c.pagada).map(c => c.integrante_id),
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-2xl font-black text-[#630027]">{resumen.total}</p>
          <p className="text-xs text-gray-400">Miembros</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-3 text-center">
          <p className="text-2xl font-black text-green-600">{new Set(resumen.conCuotaPagada).size}</p>
          <p className="text-xs text-gray-400">Cuotas al día</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-3 text-center">
          <p className="text-2xl font-black text-red-400">{new Set(resumen.conCuotaPendiente).size}</p>
          <p className="text-xs text-gray-400">Pendientes</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar socio…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
        >
          <option value="todas">Todas</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
        </select>
        <button
          onClick={() => { setShowForm(v => !v); setErrores({}); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#630027] text-white text-sm font-bold hover:bg-[#4a001d] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-[#630027]/20 shadow-sm p-4 space-y-3">
          <p className="text-sm font-bold text-gray-700">Nuevo miembro</p>
          <div>
            <input
              placeholder="Nombre completo *"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none ${errores.nombre ? "border-red-300" : "border-gray-200"}`}
            />
            {errores.nombre && <p className="text-xs text-red-400 mt-1">{errores.nombre}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <select
                value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value, cargo: "" }))}
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none ${errores.categoria ? "border-red-300" : "border-gray-200"}`}
              >
                {CATEGORIAS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
              {errores.categoria && <p className="text-xs text-red-400 mt-1">{errores.categoria}</p>}
            </div>
            {form.categoria === "cargos" && (
              <select
                value={form.cargo}
                onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">Sin cargo</option>
                {CARGOS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Concepto cuota (opcional)"
              value={form.concepto}
              onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
            />
            <div>
              <input
                type="number"
                placeholder="Importe €"
                value={form.importe}
                onChange={e => setForm(f => ({ ...f, importe: e.target.value }))}
                className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none ${errores.importe ? "border-red-300" : "border-gray-200"}`}
              />
              {errores.importe && <p className="text-xs text-red-400 mt-1">{errores.importe}</p>}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setErrores({}); setForm(FORM_INICIAL); }} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-500">Cancelar</button>
            <button onClick={handleGuardar} disabled={guardando} className="px-4 py-2 rounded-xl bg-[#630027] text-white text-sm font-bold disabled:opacity-60">
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2">
        {filtrados.length === 0 && <p className="text-gray-300 text-sm text-center py-8">Sin resultados</p>}
        {filtrados.map(int => {
          const cuotasSocio = getCuotasSocio(int.id);
          const isExpanded = expandido[int.id];
          const tienePendiente = cuotasSocio.some(c => !c.pagada);
          return (
            <div key={int.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${tienePendiente ? "border-red-100" : "border-gray-100"}`}>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                onClick={() => setExpandido(e => ({ ...e, [int.id]: !e[int.id] }))}
              >
                <div className="w-9 h-9 rounded-full bg-[#630027]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#630027] font-black text-sm">{int.nombre[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm leading-tight">{int.nombre}</p>
                  <p className="text-xs text-gray-400 capitalize">{CAT_LABELS[int.categoria] || int.categoria}{int.cargo ? ` · ${int.cargo}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {cuotasSocio.length > 0 && (
                    <Badge pagada={cuotasSocio.every(c => c.pagada)} />
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-gray-50 px-4 py-3 space-y-2 bg-gray-50">
                  {cuotasSocio.length === 0
                    ? <p className="text-xs text-gray-400 text-center py-2">Sin cuotas registradas</p>
                    : cuotasSocio.map(c => (
                      <div key={c.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700">{c.concepto}</p>
                          <p className="text-xs text-gray-400">{c.importe}€{c.pagada && c.fecha_pago ? ` · Pagado el ${c.fecha_pago}` : ""}</p>
                        </div>
                        <button
                          onClick={() => toggleCuota(c)}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${c.pagada ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-500" : "bg-red-100 text-red-500 hover:bg-green-100 hover:text-green-700"}`}
                        >
                          {c.pagada ? "Pagada ✓" : "Pendiente"}
                        </button>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}