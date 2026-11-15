export const COLOR_KEY        = "app_color_primario";
export const NOMBRE_KEY       = "app_nombre";
export const DEFAULT_COLOR     = "#630027";
export const DEFAULT_NOMBRE    = "Peña El Chole";

export function getStoredColor() {
  return localStorage.getItem(COLOR_KEY) || DEFAULT_COLOR;
}

export function getStoredNombre() {
  return localStorage.getItem(NOMBRE_KEY) || DEFAULT_NOMBRE;
}

export function initAppConfig() {
  document.documentElement.style.setProperty("--app-primary", getStoredColor());
}

export async function syncAppConfigFromDB(base44) {
  try {
    const data = await base44.entities.AppConfig.list();
    const color = data.find(c => c.clave === COLOR_KEY);
    if (color) {
      document.documentElement.style.setProperty("--app-primary", color.valor);
      localStorage.setItem(COLOR_KEY, color.valor);
    }
    const nombre = data.find(c => c.clave === NOMBRE_KEY);
    if (nombre) {
      localStorage.setItem(NOMBRE_KEY, nombre.valor);
      window.dispatchEvent(new CustomEvent("appNombreChanged", { detail: nombre.valor }));
    }
  } catch {}
}
