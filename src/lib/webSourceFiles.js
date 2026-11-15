/**
 * Archivos fuente de la app embebidos para descarga.
 * Solo se incluyen archivos sin template literals (backticks) para evitar
 * problemas de escaping. Los esquemas de entidades se obtienen dinámicamente.
 */

export const WEB_SOURCE_FILES = [
  {
    path: "index.html",
    content: `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="https://base44.com/logo_v2.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover" />
    <script>
      (function() {
        var saved = localStorage.getItem("pena_modo_apaisado");
        var apaisado = saved !== null
          ? saved === "true"
          : (window.screen.width >= 768 || window.screen.height >= 768);
        if (apaisado) {
          document.querySelector('meta[name="viewport"]').content =
            "width=device-width, initial-scale=1.0, viewport-fit=cover";
        }
      })();
    </script>
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#630027" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="El Chole" />
    <title>Peña El Chole</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js').catch(function() {});
        });
      }
    </script>
  </body>
</html>
`
  },
  {
    path: "package.json",
    content: `{
  "name": "base44-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --quiet",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc -p ./jsconfig.json",
    "preview": "vite preview"
  },
  "dependencies": {
    "@base44/sdk": "^0.8.46",
    "@base44/vite-plugin": "^1.0.35",
    "framer-motion": "^11.16.4",
    "lucide-react": "^0.475.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.26.0",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "jszip": "^3.10.1"
  }
}
`
  },
  {
    path: "vite.config.js",
    content: `import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  logLevel: 'error',
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});
`
  },
  {
    path: "tailwind.config.js",
    content: `/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
`
  },
  {
    path: "postcss.config.js",
    content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
  },
  {
    path: "src/main.jsx",
    content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
`
  },
  {
    path: "src/lib/utils.js",
    content: `import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const isIframe = window.self !== window.top;
`
  },
  {
    path: "src/api/base44Client.js",
    content: `import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});
`
  },
  {
    path: "src/lib/appConfig.js",
    content: `export const COLOR_KEY        = "app_color_primario";
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
`
  },
  {
    path: "src/lib/uiPrefs.js",
    content: `import { base44 } from "@/api/base44Client";

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
`
  },
  {
    path: "src/components/auth/AuthContext.jsx",
    content: `import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext(null);

export const ADMIN_ID = "__admin__";
export const ADMIN_PASSWORD = "Adminadmin3366";

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem("pena_sesion");
      if (saved) {
        try { setSesion(JSON.parse(saved)); } catch {}
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (username, password) => {
    if (username === ADMIN_ID) {
      if (password !== ADMIN_PASSWORD) throw new Error("Contraseña incorrecta");
      const s = { integranteId: ADMIN_ID, nombre: "Admin", cargo: null, avatarUrl: null, esAdmin: true };
      setSesion(s);
      localStorage.setItem("pena_sesion", JSON.stringify(s));
      return s;
    }
    const sesiones = await base44.entities.SesionUsuario.list();
    const sesionDB = sesiones.find(s => s.usuario && s.usuario.toLowerCase() === String(username).toLowerCase());
    if (!sesionDB) throw new Error("Usuario no encontrado");
    if (sesionDB.disabled) throw new Error("Usuario desactivado");
    if (sesionDB.contrasena !== password) throw new Error("Contraseña incorrecta");

    const ints = await base44.entities.Integrante.filter({ id: sesionDB.integrante_id });
    const integrante = ints[0] || { nombre: "Desconocido" };

    const s = {
      integranteId: sesionDB.integrante_id,
      nombre: integrante.nombre,
      cargo: integrante.cargo,
      avatarUrl: sesionDB.avatar_url || null,
      esAdmin: false,
    };
    setSesion(s);
    localStorage.setItem("pena_sesion", JSON.stringify(s));
    return s;
  };

  const logout = () => {
    setSesion(null);
    localStorage.removeItem("pena_sesion");
  };

  const puedeConfigurar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";

  return (
    <AuthContext.Provider value={{ sesion, loading, login, logout, puedeConfigurar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
`
  },
];

export const ENTITY_NAMES = [
  "Integrante", "SesionUsuario", "ItemCompra", "CompraArchivo", "TicketFactura",
  "Proveedor", "DeudaProveedor", "MovimientoCaja", "PagoRegistrado", "Cuota",
  "Presupuesto", "CervezaEntrada", "ConsumoCerveza", "CervezaPago", "LoteCerveza",
  "ItemAlmacen", "MovimientoAlmacen", "PrestamoAlmacen", "Vehiculo", "VehiculoPieza",
  "VehiculoRevision", "VehiculoTarea", "Loteria", "TalonarioLoteria", "EntregaTalonario",
  "ChatGrupo", "ChatMensaje", "Votacion", "VotoRespuesta", "Sugerencia",
  "SugerenciaActividad", "Actividad", "Tarea", "GrupoTrabajo", "ConcursoSeccion",
  "ObraAnio", "ResultadoAnio", "ObraDocumento", "MediaItem", "Carpeta",
  "NotaPersonal", "Documento", "ActaReunion", "DiaCalendario", "PlazoCalendario",
  "CuentaAtras", "EnlaceUtil", "Mascota", "Notificacion", "Logro",
  "PermisoSeccion", "AppConfig", "AdminLog", "Papelera", "FeedbackApp",
  "IAConversacion", "IARegistro", "TareaReunion",
];