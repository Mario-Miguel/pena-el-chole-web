import { api } from "@/api/client";

// Las cervezas y lo pagado ya no se guardan como contadores: se calculan
// sumando los ConsumoCerveza y CervezaPago sin archivar de cada integrante.
// integrante_id = null en un consumo o pago significa "invitados".

export const PRECIO_CERVEZA_KEY = "cerveza_precio";
export const INVITADOS_ID = "invitados";
export const NOMBRE_INVITADOS = "Invitados";

// Clave de la cuenta a la que pertenece un consumo o pago
export const claveCuenta = (integranteId) => integranteId || INVITADOS_ID;
// Lo contrario: el integrante_id que hay que mandar al backend
export const integranteIdDeClave = (clave) => (clave === INVITADOS_ID ? null : clave);

const redondear = (n) => Math.round(n * 100) / 100;

/**
 * Devuelve una cuenta por persona: { id, integranteId, nombre, categoria, cervezas, pagado }.
 * Incluye a todos los integrantes que no son "patitas", a cualquiera que tenga
 * consumos o pagos, y siempre la cuenta de invitados.
 * `consumos` y `pagos` deben venir ya sin archivar.
 */
export function calcularCuentas(integrantes, consumos, pagos) {
  const cuentas = new Map();
  const asegurar = (clave) => {
    if (!cuentas.has(clave)) {
      const integrante = integrantes.find(i => i.id === clave);
      cuentas.set(clave, {
        id: clave,
        integranteId: integranteIdDeClave(clave),
        nombre: clave === INVITADOS_ID ? NOMBRE_INVITADOS : (integrante?.nombre || "Integrante borrado"),
        categoria: integrante?.categoria || null,
        cervezas: 0,
        pagado: 0,
      });
    }
    return cuentas.get(clave);
  };

  integrantes.filter(i => i.categoria !== "patitas").forEach(i => asegurar(i.id));
  asegurar(INVITADOS_ID);
  consumos.forEach(c => { asegurar(claveCuenta(c.integrante_id)).cervezas += c.cantidad || 0; });
  pagos.forEach(p => { asegurar(claveCuenta(p.integrante_id)).pagado += parseFloat(p.importe) || 0; });

  return [...cuentas.values()].map(c => ({ ...c, pagado: redondear(c.pagado) }));
}

export async function cargarPrecioCerveza() {
  const configs = await api.entities.AppConfig.filter({ clave: PRECIO_CERVEZA_KEY });
  return configs.length > 0 ? parseFloat(configs[0].valor) : 0.5;
}

/** Carga integrantes, consumos y pagos sin archivar y devuelve las cuentas. */
export async function cargarCuentasCerveza() {
  const [integrantes, consumos, pagos] = await Promise.all([
    api.entities.Integrante.list(),
    api.entities.ConsumoCerveza.filter({ archivado: false }),
    api.entities.CervezaPago.filter({ archivado: false }),
  ]);
  return calcularCuentas(integrantes, consumos, pagos);
}

/** Cuenta de un solo integrante: { cervezas, pagado }. */
export async function cargarMiCuentaCerveza(integranteId) {
  if (!integranteId) return { cervezas: 0, pagado: 0 };
  const [consumos, pagos] = await Promise.all([
    api.entities.ConsumoCerveza.filter({ integrante_id: integranteId, archivado: false }),
    api.entities.CervezaPago.filter({ integrante_id: integranteId, archivado: false }),
  ]);
  return {
    cervezas: consumos.reduce((s, c) => s + (c.cantidad || 0), 0),
    pagado: redondear(pagos.reduce((s, p) => s + (parseFloat(p.importe) || 0), 0)),
  };
}

/** "+5,00€" / "−2,50€" */
export const formatoImporte = (importe) => {
  const n = parseFloat(importe) || 0;
  return `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(2).replace(".", ",")}€`;
};
