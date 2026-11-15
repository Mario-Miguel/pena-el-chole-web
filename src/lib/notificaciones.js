import { api } from "@/api/client";

/**
 * Crea una notificación visible por todos los miembros en la campana de notificaciones.
 * @param {string} titulo - Título de la notificación
 * @param {string} mensaje - Mensaje/detalle
 * @param {string} tipo - "evento" | "reunion" | "votacion" | "compra" | "otro"
 */
export async function notificarMiembros(titulo, mensaje, tipo = "otro") {
  try {
    await api.entities.Notificacion.create({
      titulo,
      mensaje,
      tipo,
      leida_por: [],
      archivada: false,
      fecha_publicacion: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Error al crear notificación:", e);
  }
}

/**
 * Notifica la creación de un acta de reunión.
 */
export async function notificarNuevaActa(fecha, puntos) {
  const titulo = "📋 Nueva acta de reunión";
  const mensaje = `Reunión del ${fecha}${puntos ? ": " + puntos.substring(0, 100) : ""}`;
  await notificarMiembros(titulo, mensaje, "reunion");
}

/**
 * Notifica la creación de una actividad.
 */
export async function notificarNuevaActividad(titulo, fecha, lugar) {
  const fechaStr = fecha ? new Date(fecha).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
  const msg = `📅 ${titulo}${fechaStr ? " — " + fechaStr : ""}${lugar ? " · " + lugar : ""}`;
  await notificarMiembros("🎯 Nueva actividad", msg, "evento");
}