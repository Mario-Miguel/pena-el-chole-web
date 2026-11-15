// Centralized dynamic import functions for all lazy-loaded pages.
// Enables bulk prefetching (after initial load) and hover-based prefetch on nav links
// so navigation feels instant — chunks are already cached by the time the user clicks.

export const pageImports = {
  Admin: () => import('../pages/Admin'),
  Integrantes: () => import('../pages/Integrantes'),
  Calendario: () => import('../pages/Calendario'),
  Memoria: () => import('../pages/Memoria'),
  Cuentas: () => import('../pages/Cuentas'),
  Cerveza: () => import('../pages/Cerveza'),
  ToDo: () => import('../pages/ToDo'),
  Obra: () => import('../pages/Obra'),
  Almacen: () => import('../pages/Almacen'),
  Concurso: () => import('../pages/Concurso'),
  Resultados: () => import('../pages/Resultados'),
  Trofeos: () => import('../pages/Trofeos'),
  Desfile: () => import('../pages/Desfile'),
  Sugerencias: () => import('../pages/Sugerencias'),
  Votaciones: () => import('../pages/Votaciones'),
  Comunidad: () => import('../pages/Comunidad'),
  NotasPersonales: () => import('../pages/NotasPersonales'),
  Notificaciones: () => import('../pages/Notificaciones'),
  Chat: () => import('../pages/Chat'),
  Ajustes: () => import('../pages/Ajustes'),
  Perfil: () => import('../pages/Perfil'),
  PanelCargos: () => import('../pages/PanelCargos'),
  Ayuda: () => import('../pages/Ayuda'),
  Presupuesto: () => import('../pages/Presupuesto'),
  Cuotas: () => import('../pages/Cuotas'),
  Vehiculos: () => import('../pages/Vehiculos'),
  Enlaces: () => import('../pages/Enlaces'),
  GruposTrabajo: () => import('../pages/GruposTrabajo'),
  Organizacion: () => import('../pages/Organizacion'),
  LibroCaja: () => import('../pages/LibroCaja'),
  GestionDocumental: () => import('../pages/GestionDocumental'),
  ActasReunion: () => import('../pages/ActasReunion'),
  Finanzas: () => import('../pages/Finanzas'),
  Secretaria: () => import('../pages/Secretaria'),
  Herramientas: () => import('../pages/Herramientas'),
  Actividades: () => import('../pages/Actividades'),
  Seguridad: () => import('../pages/Seguridad'),
  GestionCargos: () => import('../pages/GestionCargos'),
  Tesoreria: () => import('../pages/Tesoreria'),
  Loteria: () => import('../pages/Loteria'),
  Tickets: () => import('../pages/Tickets'),
  DatosPena: () => import('../pages/DatosPena'),
  Contabilidad: () => import('../pages/Contabilidad'),
  TourGuia: () => import('../pages/TourGuia'),
  Logros: () => import('../pages/Logros'),
};

const prefetched = new Set();

export function prefetchPage(name) {
  if (prefetched.has(name)) return;
  const fn = pageImports[name];
  if (fn) {
    prefetched.add(name);
    fn();
  }
}

export function prefetchAllPages() {
  Object.keys(pageImports).forEach((name) => prefetchPage(name));
}

// Global hover/touch prefetch: when the user hovers or taps an internal link,
// preload that page's chunk before they actually click.
export function setupHoverPrefetch() {
  const handler = (e) => {
    const link = e.target.closest?.('a[href^="/"]');
    if (!link) return;
    const path = link.getAttribute('href').slice(1);
    if (path) prefetchPage(path);
  };
  document.addEventListener('mouseover', handler, { passive: true });
  document.addEventListener('touchstart', handler, { passive: true });
  return () => {
    document.removeEventListener('mouseover', handler);
    document.removeEventListener('touchstart', handler);
  };
}