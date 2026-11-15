import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, ChevronDown, QrCode, BarChart2, Trash2, ArrowLeftRight, ShoppingCart, CheckCircle2, CreditCard, Package } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import HelpIcon from "../components/layout/HelpIcon";
import { Button } from "@/components/ui/button";
import ItemAlmacenCard from "../components/almacen/ItemAlmacenCard";
import NuevoItemDialog from "../components/almacen/NuevoItemDialog";
import GestorCategoriasAlmacen from "../components/almacen/GestorCategoriasAlmacen";
import ItemAlmacenDetalle from "../components/almacen/ItemAlmacenDetalle";
import ItemCompraDialog from "../components/compra/ItemCompraDialog";
import StockBajoPanel from "../components/almacen/StockBajoPanel";
import MantenimientoPanel from "../components/almacen/MantenimientoPanel";
import PrestamosPanel from "../components/almacen/PrestamosPanel";
import QrScannerDialog from "../components/almacen/QrScannerDialog";
import ExportarAlmacen from "../components/almacen/ExportarAlmacen";
import EstadisticasAlmacen from "../components/almacen/EstadisticasAlmacen";
import ItemCompraCard from "../components/compra/ItemCompraCard";
import CuentasPanelFixed from "../components/compra/CuentasPanelFixed";
import ArchivoCompras from "../components/compra/ArchivoCompras";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../components/auth/AuthContext";

function CategoriasDropdown({ categorias, items, categoriaActiva, setCategoriaActiva }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const todas = [{ value: "todos", label: "Todos", emoji: "🗂️" }, ...categorias];
  const activa = todas.find(c => c.value === categoriaActiva) || todas[0];
  const count = categoriaActiva === "todos" ? items.length : items.filter(i => i.categoria === categoriaActiva).length;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg leading-none w-6 text-center flex-shrink-0">
          {activa.icono_url
            ? <img src={activa.icono_url} alt="" className="w-5 h-5 object-contain rounded inline" />
            : activa.emoji
          }
        </span>
        <span className="flex-1 text-sm font-semibold text-[#630027] text-left">{activa.label}</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#630027] text-white mr-1">{count}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-gray-100 shadow-lg z-20 overflow-hidden">
          {todas.map((c, idx) => {
            const cnt = c.value === "todos" ? items.length : items.filter(i => i.categoria === c.value).length;
            return (
              <button
                key={c.value}
                onClick={() => { setCategoriaActiva(c.value); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  idx < todas.length - 1 ? "border-b border-gray-50" : ""
                } ${categoriaActiva === c.value ? "bg-[#630027]/5" : "hover:bg-gray-50"}`}
              >
                <span className="text-lg leading-none w-6 text-center flex-shrink-0">
                  {c.icono_url
                    ? <img src={c.icono_url} alt="" className="w-5 h-5 object-contain rounded inline" />
                    : c.emoji
                  }
                </span>
                <span className={`flex-1 text-sm font-medium ${categoriaActiva === c.value ? "text-[#630027] font-semibold" : "text-gray-700"}`}>{c.label}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoriaActiva === c.value ? "bg-[#630027] text-white" : "bg-gray-100 text-gray-400"}`}>{cnt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CATEGORIAS_DEFAULT = [
  { value: "metal", label: "🔩 Metal" },
  { value: "madera", label: "🪵 Madera" },
  { value: "tornilleria", label: "🔧 Tornillería" },
  { value: "silicona_espuma", label: "🧴 Silicona y Espuma" },
  { value: "otros", label: "📦 Otros" },
];

// ─── Tab Inventario ───────────────────────────────────────────────────────────
function TabInventario({ items, cargar, categorias, setCategorias, puedeGestionar, puedePagar, integrantes }) {
  const [categoriaActiva, setCategoriaActiva] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemDetalle, setItemDetalle] = useState(null);
  const [itemCompraRapida, setItemCompraRapida] = useState(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [estadisticasOpen, setEstadisticasOpen] = useState(false);
  const [prestamosOpen, setPrestamosOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleCrearCompraRapida = async (form) => {
    await base44.entities.ItemCompra.create({
      nombre: form.nombre,
      descripcion: form.descripcion,
      thumbnail_url: form.thumbnail_url,
      cantidad: form.cantidad,
      precio: form.precio,
      comprador_nombre: form.comprador_nombre,
      tienda_sugerida: form.tienda_sugerida,
      fotos: form.fotos || [],
      fotos_ticket: form.fotos_ticket || [],
      comprado: form.comprado || false,
      pagado: form.pagado || false,
    });
    setItemCompraRapida(null);
  };

  const abrirCompraDesdeItem = (item) => {
    setItemCompraRapida({
      nombre: item.nombre,
      descripcion: item.descripcion || "",
      thumbnail_url: item.miniatura_url || item.imagen_urls?.[0] || item.imagen_url || "",
      cantidad: Math.max(1, item.stock_minimo || 1),
      precio: 0,
      comprador_nombre: "",
      tienda_sugerida: item.proveedor || "",
      fotos: item.imagen_urls?.length > 0 ? item.imagen_urls : (item.imagen_url ? [item.imagen_url] : []),
      fotos_ticket: [],
      comprado: false,
      pagado: false,
      item_almacen_id: item.id, // referencia para actualizar stock al marcar comprado
    });
  };

  const handleDelete = async (id) => {
    await base44.entities.ItemAlmacen.delete(id);
    setConfirmDeleteId(null);
    cargar();
  };

  const filtrados = items
    .filter(i => categoriaActiva === "todos" || i.categoria === categoriaActiva)
    .filter(i => !busqueda.trim() || i.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()));

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => setEstadisticasOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-300 transition-colors shadow-sm"
          title="Estadísticas"
        >
          <BarChart2 className="w-4 h-4 text-purple-600" />
        </button>
        <button
          onClick={() => setPrestamosOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm"
          title="Préstamos"
        >
          <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
        </button>
        {puedeGestionar && (
          <GestorCategoriasAlmacen
            categorias={categorias}
            onCambiadas={(nuevas) => {
              setCategorias(nuevas);
              if (!nuevas.find(c => c.value === categoriaActiva)) setCategoriaActiva("todos");
            }}
          />
        )}
        <button
          onClick={() => setQrScannerOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          title="Escanear QR"
        >
          <QrCode className="w-4 h-4 text-[#630027]" />
        </button>
        <ExportarAlmacen items={items} />
      </div>

      {/* Botón Añadir */}
      <div className="md:hidden fixed bottom-[72px] right-4 z-30">
        <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
          <Button onClick={() => setDialogOpen(true)} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-full shadow-lg h-14 w-14 p-0">
            <Plus className="w-6 h-6" />
          </Button>
        </motion.div>
      </div>
      <div className="hidden md:block mb-4">
        <Button onClick={() => setDialogOpen(true)} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Añadir artículo
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar artículo..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#630027]/20 bg-white"
        />
      </div>

      {/* Alertas */}
      <StockBajoPanel items={items} onAbrirDetalle={setItemDetalle} onCrearCompra={abrirCompraDesdeItem} />
      <MantenimientoPanel items={items} onAbrirDetalle={setItemDetalle} />

      {/* Filtro categoría */}
      <div className="mb-6">
        <CategoriasDropdown categorias={categorias} items={items} categoriaActiva={categoriaActiva} setCategoriaActiva={setCategoriaActiva} />
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {filtrados.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
            <motion.p animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="text-5xl mb-3">📦</motion.p>
            <p className="text-gray-300 text-sm">No hay artículos en esta categoría</p>
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtrados.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, delay: i * 0.04 }} whileHover={{ y: -3, scale: 1.02, boxShadow: "0 8px 24px rgba(99,0,39,0.1)" }}>
                <ItemAlmacenCard item={item} onUpdate={cargar} onDelete={(id) => setConfirmDeleteId(id)} onAbrirDetalle={setItemDetalle} onCrearCompra={abrirCompraDesdeItem} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal préstamos */}
      {prestamosOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setPrestamosOpen(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-800">Préstamos</span>
              <button onClick={() => setPrestamosOpen(false)} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xl leading-none font-light">×</button>
            </div>
            <div className="p-4">
              <PrestamosPanel items={items} puedeGestionar={puedeGestionar} />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        mensaje="¿Eliminar este artículo del almacén? Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        onConfirm={() => handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <NuevoItemDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreado={cargar} categorias={categorias} />

      {estadisticasOpen && (
        <EstadisticasAlmacen
          items={items}
          onClose={() => setEstadisticasOpen(false)}
          onArchivar={() => cargar()}
        />
      )}

      <QrScannerDialog open={qrScannerOpen} onClose={() => setQrScannerOpen(false)} items={items} onItemEncontrado={(item) => { setQrScannerOpen(false); setItemDetalle(item); }} />

      {itemDetalle && (
        <ItemAlmacenDetalle item={itemDetalle} categorias={categorias} onClose={() => setItemDetalle(null)} onActualizado={cargar} integrantes={integrantes} puedePagar={puedePagar} />
      )}

      <ItemCompraDialog
        open={!!itemCompraRapida}
        onOpenChange={(o) => { if (!o) setItemCompraRapida(null); }}
        item={itemCompraRapida}
        integrantes={integrantes}
        onSave={async (form) => {
          await handleCrearCompraRapida(form);
          // Si está marcado como comprado y tiene referencia al item de almacén → sumar stock
          if (form.comprado && form.item_almacen_id) {
            const almacenItems = await base44.entities.ItemAlmacen.filter({ id: form.item_almacen_id });
            if (almacenItems.length > 0) {
              const ai = almacenItems[0];
              await base44.entities.ItemAlmacen.update(ai.id, { cantidad: (ai.cantidad || 0) + (form.cantidad || 1) });
            }
          }
          cargar();
        }}
        isNew={true}
        puedePagar={puedePagar}
      />
    </div>
  );
}

// ─── Tab Compras ──────────────────────────────────────────────────────────────
function TabPedidos({ items: itemsAlmacen, cargarAlmacen, integrantes, puedePagar }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cuentasOpen, setCuentasOpen] = useState(false);
  const [compradosOpen, setCompradosOpen] = useState(false);
  const [pagadosOpen, setPagadosOpen] = useState(false);

  const loadData = useCallback(async () => {
    const its = await base44.entities.ItemCompra.list("-created_date");
    setItems(its);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (form) => {
    const esNuevo = !selectedItem;
    const eraComprado = selectedItem?.comprado;
    const ahoraComprado = form.comprado;

    if (selectedItem) await base44.entities.ItemCompra.update(selectedItem.id, form);
    else await base44.entities.ItemCompra.create(form);

    // Integración almacén: si pasa de "no comprado" a "comprado" → sumar/crear en inventario
    if (ahoraComprado && (!eraComprado || esNuevo)) {
      const nombreBuscar = form.nombre?.trim().toLowerCase();
      if (nombreBuscar) {
        const todosAlmacen = await base44.entities.ItemAlmacen.list();
        const encontrado = todosAlmacen.find(a => a.nombre.trim().toLowerCase() === nombreBuscar);
        if (encontrado) {
          await base44.entities.ItemAlmacen.update(encontrado.id, {
            cantidad: (encontrado.cantidad || 0) + (form.cantidad || 1),
          });
        } else {
          // Crear nuevo artículo en almacén
          await base44.entities.ItemAlmacen.create({
            nombre: form.nombre,
            categoria: "otros",
            cantidad: form.cantidad || 1,
            descripcion: form.descripcion || "",
            miniatura_url: form.thumbnail_url || "",
          });
        }
        cargarAlmacen();
      }
    }

    setDialogOpen(false);
    setSelectedItem(null);
    loadData();
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    const itemEliminar = selectedItem;
    await base44.entities.ItemCompra.delete(itemEliminar.id);
    if (itemEliminar.comprador_nombre && itemEliminar.comprado) {
      const [todosItems, pagos] = await Promise.all([
        base44.entities.ItemCompra.list(),
        base44.entities.PagoRegistrado.list(),
      ]);
      const restantes = todosItems.filter(i => i.id !== itemEliminar.id && i.comprador_nombre === itemEliminar.comprador_nombre && i.comprado);
      const deudaRestante = restantes.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
      if (deudaRestante === 0) {
        const pagosPersona = pagos.filter(p => p.persona === itemEliminar.comprador_nombre);
        await Promise.all(pagosPersona.map(p => base44.entities.PagoRegistrado.delete(p.id)));
      }
    }
    setDialogOpen(false);
    setSelectedItem(null);
    loadData();
  };

  const openEdit = (item) => { setSelectedItem(item); setDialogOpen(true); };
  const openNew = () => { setSelectedItem(null); setDialogOpen(true); };

  const nombresIntegrantes = integrantes.map(i => i.nombre);
  const porComprar = items.filter(i => !i.comprado && !i.pagado);
  const compradosInternos = items.filter(i => i.comprado && !i.pagado && i.comprador_nombre && nombresIntegrantes.includes(i.comprador_nombre));
  const compradosExternos = items.filter(i => i.comprado && !i.pagado && i.comprador_nombre && !nombresIntegrantes.includes(i.comprador_nombre));
  const pagadosInternos = items.filter(i => i.pagado && i.comprador_nombre && nombresIntegrantes.includes(i.comprador_nombre));
  const pagadosExternos = items.filter(i => i.pagado && i.comprador_nombre && !nombresIntegrantes.includes(i.comprador_nombre));

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>;

  return (
    <div>
      {/* Header acciones */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">{porComprar.length} pendiente{porComprar.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-2">
          <Button onClick={() => setCuentasOpen(v => !v)} variant="outline" className="text-[#630027] border-[#4B1924]/20 hover:bg-[#4B1924]/5 h-9 rounded-xl text-sm">
            <CreditCard className="w-4 h-4 mr-1.5" /> Cuentas
          </Button>
          <Button onClick={openNew} className="bg-[#630027] text-white h-9 rounded-xl">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {cuentasOpen && <CuentasPanelFixed items={items} onClose={() => setCuentasOpen(false)} onPagosActualizados={loadData} />}
      </AnimatePresence>

      {/* Por comprar */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-4 h-4 text-[#4B1924]/60" />
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Por comprar</h2>
          <span className="text-xs text-gray-400">({porComprar.length})</span>
        </div>
        <div className="space-y-2">
          {porComprar.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-2">🛒</p>
              <p className="text-gray-300 text-sm">La lista está vacía</p>
            </div>
          ) : (
            <AnimatePresence>
              {porComprar.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
                  <ItemCompraCard item={item} onClick={() => openEdit(item)} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* Comprados internos */}
      {compradosInternos.length > 0 && (
        <section className="mb-4">
          <button onClick={() => setCompradosOpen(v => !v)} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-3">
            <CheckCircle2 className="w-4 h-4 text-red-400" />
            <span className="text-red-400">Comprados (internos)</span>
            <span className="text-gray-300">({compradosInternos.length})</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${compradosOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {compradosOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                {compradosInternos.map(item => <ItemCompraCard key={item.id} item={item} onClick={() => openEdit(item)} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Comprados externos */}
      {compradosExternos.length > 0 && (
        <section className="mb-6">
          <button onClick={() => setCompradosOpen(v => !v)} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-3">
            <CheckCircle2 className="w-4 h-4 text-orange-400" />
            <span className="text-orange-500">Comprados (externos)</span>
            <span className="text-gray-300">({compradosExternos.length})</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${compradosOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {compradosOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                {compradosExternos.map(item => <ItemCompraCard key={item.id} item={item} onClick={() => openEdit(item)} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Pagados internos */}
      {pagadosInternos.length > 0 && (
        <section className="mb-4">
          <button onClick={() => setPagadosOpen(v => !v)} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-green-600">Pagados (internos)</span>
            <span className="text-gray-300">({pagadosInternos.length})</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${pagadosOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {pagadosOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                {pagadosInternos.map(item => <ItemCompraCard key={item.id} item={item} onClick={() => openEdit(item)} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Pagados externos */}
      {pagadosExternos.length > 0 && (
        <section>
          <button onClick={() => setPagadosOpen(v => !v)} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-3">
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
            <span className="text-teal-600">Pagados (externos)</span>
            <span className="text-gray-300">({pagadosExternos.length})</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${pagadosOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {pagadosOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                {pagadosExternos.map(item => <ItemCompraCard key={item.id} item={item} onClick={() => openEdit(item)} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      <ArchivoCompras items={items} onRefresh={loadData} />

      <ItemCompraDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        integrantes={integrantes}
        isNew={!selectedItem}
        onSave={handleSave}
        onDelete={handleDelete}
        puedePagar={puedePagar}
      />
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function Almacen() {
  const { sesion } = useAuth();
  const [tab, setTab] = useState("inventario");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState(CATEGORIAS_DEFAULT);
  const [integrantes, setIntegrantes] = useState([]);

  const puedeGestionar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";
  const puedePagar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "tesorero";

  const cargarCategorias = useCallback(async () => {
    const configs = await base44.entities.AppConfig.filter({ clave: "almacen_categorias" });
    if (configs.length > 0) {
      try {
        const parsed = JSON.parse(configs[0].valor);
        if (Array.isArray(parsed) && parsed.length > 0) setCategorias(parsed);
      } catch {}
    }
  }, []);

  const cargar = useCallback(async () => {
    const data = await base44.entities.ItemAlmacen.list("-created_date");
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargarCategorias();
    cargar();
    base44.entities.Integrante.list().then(setIntegrantes).catch(() => {});
  }, [cargar, cargarCategorias]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } } }}
      className="max-w-4xl mx-auto px-4 py-10"
    >
      {/* Header */}
      <motion.div variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.42 } } }} className="flex items-center gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#630027]">Inventario y compras</h1>
            <HelpIcon section="almacen" />
          </div>
          <p className="text-gray-400 text-sm mt-1">{items.length} artículos en inventario</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
        <button
          onClick={() => setTab("inventario")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "inventario" ? "bg-white shadow text-[#630027]" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Package className="w-4 h-4" /> Inventario
        </button>
        <button
          onClick={() => setTab("pedidos")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "pedidos" ? "bg-white shadow text-[#630027]" : "text-gray-500 hover:text-gray-700"}`}
        >
          <ShoppingCart className="w-4 h-4" /> Compras
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === "inventario" ? (
          <motion.div key="inventario" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
            <TabInventario
              items={items}
              cargar={cargar}
              categorias={categorias}
              setCategorias={setCategorias}
              puedeGestionar={puedeGestionar}
              puedePagar={puedePagar}
              integrantes={integrantes}
            />
          </motion.div>
        ) : (
          <motion.div key="pedidos" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <TabPedidos
              items={items}
              cargarAlmacen={cargar}
              integrantes={integrantes}
              puedePagar={puedePagar}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}