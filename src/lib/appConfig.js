export const COLOR_KEY        = "app_color_primario";
export const COLOR_SEC_KEY    = "app_color_secundario";
export const NOMBRE_KEY       = "app_nombre";
export const LABELS_KEY       = "app_labels";
export const DEFAULT_COLOR     = "#630027";
export const DEFAULT_COLOR_SEC = "#C9A227";
export const DEFAULT_NOMBRE    = "Peña El Chole";

export function getStoredColor() {
  return localStorage.getItem(COLOR_KEY) || DEFAULT_COLOR;
}

export function getStoredColorSec() {
  return localStorage.getItem(COLOR_SEC_KEY) || DEFAULT_COLOR_SEC;
}

export function getStoredNombre() {
  return localStorage.getItem(NOMBRE_KEY) || DEFAULT_NOMBRE;
}

export function getStoredLabels() {
  try {
    return JSON.parse(localStorage.getItem(LABELS_KEY)) || {};
  } catch {
    return {};
  }
}

export function applyAppColor(hex) {
  document.documentElement.style.setProperty("--app-primary", hex);
  localStorage.setItem(COLOR_KEY, hex);
}

export function applyAppColorSec(hex) {
  document.documentElement.style.setProperty("--app-secondary", hex);
  localStorage.setItem(COLOR_SEC_KEY, hex);
}

export function applyAppNombre(nombre) {
  localStorage.setItem(NOMBRE_KEY, nombre);
  window.dispatchEvent(new CustomEvent("appNombreChanged", { detail: nombre }));
}

export function applyLabels(labels) {
  localStorage.setItem(LABELS_KEY, JSON.stringify(labels));
  window.dispatchEvent(new CustomEvent("appLabelsChanged", { detail: labels }));
}

export function initAppConfig() {
  document.documentElement.style.setProperty("--app-primary", getStoredColor());
  document.documentElement.style.setProperty("--app-secondary", getStoredColorSec());
}

export async function syncAppConfigFromDB(api) {
  try {
    const data = await api.entities.AppConfig.list();
    const color = data.find(c => c.clave === COLOR_KEY);
    if (color) applyAppColor(color.valor);
    const colorSec = data.find(c => c.clave === COLOR_SEC_KEY);
    if (colorSec) applyAppColorSec(colorSec.valor);
    const nombre = data.find(c => c.clave === NOMBRE_KEY);
    if (nombre) applyAppNombre(nombre.valor);
    const labels = data.find(c => c.clave === LABELS_KEY);
    if (labels) {
      try { applyLabels(JSON.parse(labels.valor)); } catch {}
    }
  } catch {}
}
