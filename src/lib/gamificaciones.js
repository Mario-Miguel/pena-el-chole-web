import { base44 } from "@/api/base44Client";

// Logros sugeridos en función del contenido de la app
export const LOGROS_POR_DEFECTO = [
  { nombre: "Catador Novel", descripcion: "Consumir 5 cervezas en la peña", icono: "🍺", categoria: "cerveza", puntos: 10, umbral: 5 },
  { nombre: "Bebedor Experimentado", descripcion: "Consumir 25 cervezas", icono: "🍻", categoria: "cerveza", puntos: 25, umbral: 25 },
  { nombre: "Leyenda Cervecera", descripcion: "Consumir 100 cervezas", icono: "👑", categoria: "cerveza", puntos: 100, umbral: 100 },
  { nombre: "Socio Activo", descripcion: "Apuntarse a 3 actividades", icono: "🎯", categoria: "actividades", puntos: 15, umbral: 3 },
  { nombre: "Alma de la Fiesta", descripcion: "Apuntarse a 10 actividades", icono: "🎉", categoria: "actividades", puntos: 40, umbral: 10 },
  { nombre: "Mente Creativa", descripcion: "Hacer 3 sugerencias de actividades", icono: "💡", categoria: "sugerencias", puntos: 15, umbral: 3 },
  { nombre: "Votante Cívico", descripcion: "Participar en 5 votaciones", icono: "🗳️", categoria: "votaciones", puntos: 20, umbral: 5 },
  { nombre: "Conversador", descripcion: "Enviar 50 mensajes en el chat", icono: "💬", categoria: "chat", puntos: 15, umbral: 50 },
  { nombre: "Cronista", descripcion: "Crear 10 notas personales", icono: "📝", categoria: "notas", puntos: 15, umbral: 10 },
  { nombre: "Peña Lover", descripcion: "Desbloquear 5 logros distintos", icono: "❤️", categoria: "especial", puntos: 50, umbral: 5 },
];

export const CATEGORIAS_LOGRO = {
  cerveza: { label: "Cervezas", emoji: "🍺" },
  actividades: { label: "Actividades", emoji: "🎯" },
  sugerencias: { label: "Sugerencias", emoji: "💡" },
  votaciones: { label: "Votaciones", emoji: "🗳️" },
  chat: { label: "Chat", emoji: "💬" },
  notas: { label: "Notas", emoji: "📝" },
  social: { label: "Social", emoji: "🤝" },
  especial: { label: "Especial", emoji: "⭐" },
};

const safeList = async (name) => {
  try { return await base44.entities[name].list(); } catch { return []; }
};

// Computa el progreso de cada integrante en cada logro activo + puntos totales
export async function computarGamificacion(integrantes, logros) {
  const logrosActivos = (logros || []).filter(l => l.activo && l.categoria !== "especial");
  const logrosEspeciales = (logros || []).filter(l => l.activo && l.categoria === "especial");

  const [actividades, sugerencias, mensajes, notas] = await Promise.all([
    safeList("Actividad"),
    safeList("SugerenciaActividad"),
    safeList("ChatMensaje"),
    safeList("NotaPersonal"),
  ]);

  const resultado = integrantes.map(int => {
    const progresoPorLogro = {};
    let puntos = 0;
    let completadosCount = 0;

    for (const logro of logrosActivos) {
      let p = 0;
      switch (logro.categoria) {
        case "cerveza": p = int.cervezas || 0; break;
        case "actividades": p = actividades.filter(a => (a.inscritos_ids || []).includes(int.id)).length; break;
        case "sugerencias": p = sugerencias.filter(s => s.autor_id === int.id).length; break;
        case "votaciones": p = sugerencias.filter(s => (s.votos_ids || []).includes(int.id)).length; break;
        case "chat": p = mensajes.filter(m => m.autor_id === int.id).length; break;
        case "notas": p = notas.filter(n => n.integrante_id === int.id).length; break;
        default: p = 0;
      }
      const completado = p >= logro.umbral;
      progresoPorLogro[logro.id] = { progreso: Math.min(p, logro.umbral), completado };
      if (completado) { puntos += logro.puntos || 0; completadosCount++; }
    }

    return { integrante: int, progresoPorLogro, puntos, completadosCount };
  });

  // Segunda pasada: logros especiales basados en logros completados
  for (const logro of logrosEspeciales) {
    for (const r of resultado) {
      const p = r.completadosCount;
      const completado = p >= logro.umbral;
      r.progresoPorLogro[logro.id] = { progreso: Math.min(p, logro.umbral), completado };
      if (completado) r.puntos += logro.puntos || 0;
    }
  }

  resultado.sort((a, b) => b.puntos - a.puntos);
  return resultado;
}