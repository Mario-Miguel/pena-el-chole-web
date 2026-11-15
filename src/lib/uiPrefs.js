import { base44 } from "@/api/base44Client";

export const UI_PREFS = [
  { key: "pena_show_theme_toggle", label: "Botón modo claro/oscuro", group: "Cabecera", default: true },
  { key: "pena_show_search", label: "Búsqueda global", group: "Cabecera", default: false },
  { key: "pena_show_notif_bell", label: "Campana de notificaciones", group: "Cabecera", default: true },
  { key: "pena_show_avatar", label: "Avatar / acceso al perfil", group: "Cabecera", default: true },
  { key: "pena_show_app_drawer", label: "Cajón de apps (cuadrícula)", group: "Navegación", default: true },
  { key: "pena_show_apps_label", label: "Etiqueta del cajón de apps", group: "Navegación", default: false },
];

export function getPref(key, defaultVal = true) {
  const stored = localStorage.getItem(key);
  if (stored === null) return defaultVal;
  return stored === "true";
}

export function setPref(key, value) {
  localStorage.setItem(key, String(value));
}
