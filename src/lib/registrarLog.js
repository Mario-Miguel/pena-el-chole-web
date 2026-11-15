import { base44 } from "@/api/base44Client";

/**
 * Registra una acción en el log de auditoría (AdminLog).
 * @param {object} params
 * @param {string} params.accion     - "crear" | "editar" | "eliminar"
 * @param {string} params.entidad    - Nombre de la entidad (ej: "Integrante")
 * @param {string} params.descripcion - Texto legible del evento
 * @param {string} [params.autorNombre] - Nombre del usuario que realiza la acción
 */
export async function registrarLog({ accion, entidad, descripcion, autorNombre = "Sistema" }) {
  try {
    await base44.entities.AdminLog.create({
      accion,
      entidad,
      descripcion,
      autor_nombre: autorNombre,
    });
  } catch (e) {
    // No bloquear la acción principal si falla el log
    console.warn("registrarLog error:", e);
  }
}