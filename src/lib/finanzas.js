/**
 * Utilidades centralizadas de cálculo financiero.
 * Evita duplicación de lógica entre componentes de contabilidad, tickets y balances.
 */

/** Convierte cualquier valor a número seguro (NaN → 0). */
export function toNum(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/** Formatea un valor como moneda europea (ej: 1234.5 → "1.234,50 €"). */
export function fmt(v) {
  return toNum(v).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

/** Suma total de ingresos de una lista de movimientos. */
export function calcIngresos(movimientos = []) {
  return movimientos
    .filter(m => m.tipo === "ingreso")
    .reduce((s, m) => s + toNum(m.cantidad), 0);
}

/** Suma total de gastos de una lista de movimientos. */
export function calcGastos(movimientos = []) {
  return movimientos
    .filter(m => m.tipo === "gasto")
    .reduce((s, m) => s + toNum(m.cantidad), 0);
}

/** Balance neto = ingresos − gastos. */
export function calcBalance(movimientos = []) {
  return calcIngresos(movimientos) - calcGastos(movimientos);
}

/** Agrupa movimientos por categoría, devolviendo { categoria, ingresos, gastos }[]. */
export function agruparPorCategoria(movimientos = []) {
  const map = {};
  for (const m of movimientos) {
    const cat = m.categoria || "otros";
    if (!map[cat]) map[cat] = { categoria: cat, ingresos: 0, gastos: 0 };
    if (m.tipo === "ingreso") map[cat].ingresos += toNum(m.cantidad);
    else if (m.tipo === "gasto") map[cat].gastos += toNum(m.cantidad);
  }
  return Object.values(map);
}

/**
 * Calcula el total de una línea de ticket considerando descuento e IVA.
 * @param {object} item - { precio, cantidad, iva, descuento, precio_incluye_iva }
 * @returns {{ base: number, iva: number, total: number }}
 */
export function calcLineaTicket(item = {}) {
  const precio = toNum(item.precio);
  const cantidad = toNum(item.cantidad) || 1;
  const descuento = toNum(item.descuento);
  const ivaPct = toNum(item.iva);

  const bruto = precio * cantidad;
  const trasDescuento = Math.max(0, bruto - descuento);

  let base, ivaAmount;
  if (item.precio_incluye_iva) {
    base = trasDescuento / (1 + ivaPct / 100);
    ivaAmount = trasDescuento - base;
  } else {
    base = trasDescuento;
    ivaAmount = base * (ivaPct / 100);
  }

  return {
    base: Math.round(base * 100) / 100,
    iva: Math.round(ivaAmount * 100) / 100,
    total: Math.round((base + ivaAmount) * 100) / 100,
  };
}

/** Calcula totales de un ticket completo a partir de sus líneas. */
export function calcTotalesTicket(items = []) {
  return items.reduce(
    (acc, item) => {
      const linea = calcLineaTicket(item);
      acc.base += linea.base;
      acc.iva += linea.iva;
      acc.total += linea.total;
      return acc;
    },
    { base: 0, iva: 0, total: 0 }
  );
}