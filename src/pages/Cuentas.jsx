import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronDown, ChevronUp, ShoppingCart, CheckCircle2, CreditCard } from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { useAuth } from "../components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import ItemCompraCard from "../components/compra/ItemCompraCard";
import ItemCompraDialog from "../components/compra/ItemCompraDialog";
import CuentasPanelFixed from "../components/compra/CuentasPanelFixed";
import ArchivoCompras from "../components/compra/ArchivoCompras";

export default function Cuentas() {
  const { sesion } = useAuth();
  const puedePagar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente" || sesion?.cargo === "tesorero";
  const [items, setItems] = useState([]);
  const [integrantes, setIntegrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cuentasOpen, setCuentasOpen] = useState(false);
  const [compradosOpen, setCompradosOpen] = useState(false);
  const [pagadosOpen, setPagadosOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [its, ints] = await Promise.all([
    base44.entities.ItemCompra.list("-created_date"),
    base44.entities.Integrante.list()]
    );
    setItems(its);
    setIntegrantes(ints);
    setLoading(false);
  }, []);

  useEffect(() => {loadData();}, [loadData]);

  const handleSave = async (form) => {
    if (selectedItem) await base44.entities.ItemCompra.update(selectedItem.id, form);else
    await base44.entities.ItemCompra.create(form);
    setDialogOpen(false);
    setSelectedItem(null);
    loadData();
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    const itemEliminar = selectedItem;
    await base44.entities.ItemCompra.delete(itemEliminar.id);

    // Si el item tenía comprador y estaba comprado, recalcular si quedan deudas
    if (itemEliminar.comprador_nombre && itemEliminar.comprado) {
      const [todosItems, pagos] = await Promise.all([
        base44.entities.ItemCompra.list(),
        base44.entities.PagoRegistrado.list(),
      ]);
      const restantes = todosItems.filter(i => i.id !== itemEliminar.id && i.comprador_nombre === itemEliminar.comprador_nombre && i.comprado);
      const deudaRestante = restantes.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
      if (deudaRestante === 0) {
        // Sin deuda → borrar pagos registrados de esa persona
        const pagosPersona = pagos.filter(p => p.persona === itemEliminar.comprador_nombre);
        await Promise.all(pagosPersona.map(p => base44.entities.PagoRegistrado.delete(p.id)));
      }
    }

    setDialogOpen(false);
    setSelectedItem(null);
    loadData();
  };

  const openEdit = (item) => {setSelectedItem(item);setDialogOpen(true);};
  const openNew = () => {setSelectedItem(null);setDialogOpen(true);};

  const nombresIntegrantes = integrantes.map(i => i.nombre);
  const porComprar = items.filter((i) => !i.comprado && !i.pagado);
  // Separar por tipo para desplegables
  const compradosInternos = items.filter(i => i.comprado && !i.pagado && i.comprador_nombre && nombresIntegrantes.includes(i.comprador_nombre));
  const compradosExternos = items.filter(i => i.comprado && !i.pagado && i.comprador_nombre && !nombresIntegrantes.includes(i.comprador_nombre));
  const comprados = items.filter((i) => i.comprado && !i.pagado);
  const pagadosInternos = items.filter(i => i.pagado && i.comprador_nombre && nombresIntegrantes.includes(i.comprador_nombre));
  const pagadosExternos = items.filter(i => i.pagado && i.comprador_nombre && !nombresIntegrantes.includes(i.comprador_nombre));
  const pagados = items.filter((i) => i.pagado);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-8 h-8 border-4 border-[#4B1924]/20 border-t-[#4B1924] rounded-full animate-spin" />
    </div>);


  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } } }}
      className="max-w-2xl mx-auto px-4 py-10"
    >
      {/* Header */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.42 } } }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[#630027] text-3xl font-black">Cuentas y compras</h1>
            <HelpIcon section="cuentas" />
          </div>
          <p className="text-gray-400 text-sm mt-1">{porComprar.length} pendiente{porComprar.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <motion.div whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <Button onClick={() => setCuentasOpen((v) => !v)} variant="outline" className="bg-background text-[#630027] px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors border shadow-sm hover:text-accent-foreground h-9 border-[#4B1924]/20 hover:bg-[#4B1924]/5">
              <CreditCard className="w-4 h-4 mr-1.5" /> Cuentas
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
            <Button onClick={openNew} className="bg-[#630027] text-white px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors border-0 shadow h-9 hover:bg-[#3a1019]">
              <Plus className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Panel Cuentas */}
      <AnimatePresence>
        {cuentasOpen && <CuentasPanelFixed items={items} onClose={() => setCuentasOpen(false)} onPagosActualizados={loadData} />}
      </AnimatePresence>

      {/* Para comprar */}
      <motion.section
        variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.38 } } }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-4 h-4 text-[#4B1924]/60" />
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Para comprar</h2>
          <span className="text-xs text-gray-400">({porComprar.length})</span>
        </div>
        <div className="space-y-2">
          {porComprar.length === 0 ?
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="text-center py-10"
          >
              <motion.p animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="text-4xl mb-2">🛒</motion.p>
              <p className="text-gray-300 text-sm">La lista está vacía</p>
            </motion.div> :

          <AnimatePresence>
              {porComprar.map((item, i) =>
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25, delay: i * 0.04 }}>
                  <ItemCompraCard item={item} onClick={() => openEdit(item)} />
                </motion.div>
            )}
            </AnimatePresence>
          }
        </div>
      </motion.section>

      {/* Comprados internos */}
      {compradosInternos.length > 0 &&
      <section className="mb-4">
          <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} onClick={() => setCompradosOpen((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-3 select-none">
            <CheckCircle2 className="w-4 h-4 text-red-400" />
            <span className="text-red-400">Comprados (internos)</span>
            <span className="text-gray-300">({compradosInternos.length})</span>
            <motion.span animate={{ rotate: compradosOpen ? 180 : 0 }} transition={{ duration: 0.22 }}><ChevronDown className="w-4 h-4" /></motion.span>
          </motion.button>
          <AnimatePresence initial={false}>
            {compradosOpen &&
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                {compradosInternos.map((item) => <ItemCompraCard key={item.id} item={item} onClick={() => openEdit(item)} />)}
              </motion.div>
          }
          </AnimatePresence>
        </section>
      }

      {/* Comprados externos */}
      {compradosExternos.length > 0 &&
      <section className="mb-6">
          <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} onClick={() => setCompradosOpen((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-3 select-none">
            <CheckCircle2 className="w-4 h-4 text-orange-400" />
            <span className="text-orange-500">Comprados (externos)</span>
            <span className="text-gray-300">({compradosExternos.length})</span>
            <motion.span animate={{ rotate: compradosOpen ? 180 : 0 }} transition={{ duration: 0.22 }}><ChevronDown className="w-4 h-4" /></motion.span>
          </motion.button>
          <AnimatePresence initial={false}>
            {compradosOpen &&
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                {compradosExternos.map((item) => <ItemCompraCard key={item.id} item={item} onClick={() => openEdit(item)} />)}
              </motion.div>
          }
          </AnimatePresence>
        </section>
      }

      {/* Pagados internos */}
      {pagadosInternos.length > 0 &&
      <section className="mb-4">
          <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} onClick={() => setPagadosOpen((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-3 select-none">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-green-600">Pagados (internos)</span>
            <span className="text-gray-300">({pagadosInternos.length})</span>
            <motion.span animate={{ rotate: pagadosOpen ? 180 : 0 }} transition={{ duration: 0.22 }}><ChevronDown className="w-4 h-4" /></motion.span>
          </motion.button>
          <AnimatePresence initial={false}>
            {pagadosOpen &&
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                {pagadosInternos.map((item) => <ItemCompraCard key={item.id} item={item} onClick={() => openEdit(item)} />)}
              </motion.div>
          }
          </AnimatePresence>
        </section>
      }

      {/* Pagados externos */}
      {pagadosExternos.length > 0 &&
      <section>
          <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} onClick={() => setPagadosOpen((v) => !v)} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mb-3 select-none">
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
            <span className="text-teal-600">Pagados (externos)</span>
            <span className="text-gray-300">({pagadosExternos.length})</span>
            <motion.span animate={{ rotate: pagadosOpen ? 180 : 0 }} transition={{ duration: 0.22 }}><ChevronDown className="w-4 h-4" /></motion.span>
          </motion.button>
          <AnimatePresence initial={false}>
            {pagadosOpen &&
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2">
                {pagadosExternos.map((item) => <ItemCompraCard key={item.id} item={item} onClick={() => openEdit(item)} />)}
              </motion.div>
          }
          </AnimatePresence>
        </section>
      }

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.2 } } }}>
        <ArchivoCompras items={items} onRefresh={loadData} />
      </motion.div>

      <ItemCompraDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        integrantes={integrantes}
        isNew={!selectedItem}
        onSave={handleSave}
        onDelete={handleDelete}
        puedePagar={puedePagar} />

    </motion.div>);

}