import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import JSZip from "jszip";
import { Code, Download, Copy, Check, ChevronDown, ChevronRight, RefreshCw, FolderTree, Smartphone, FileCode, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_PAGES, EXTRA_HELP_PAGES, UNDISABLEABLE } from "../../lib/menuConfig";
import { UI_PREFS } from "../../lib/uiPrefs";
import { WEB_SOURCE_FILES, ENTITY_NAMES } from "../../lib/webSourceFiles";
import { getSrcFiles } from "../../lib/sourceFilesCollector";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function downloadText(filename, content) {
  downloadBlob(new Blob([content], { type: "text/plain;charset=utf-8" }), filename);
}

export default function CodigoApp() {
  const [expanded, setExpanded] = useState(null);
  const [schemas, setSchemas] = useState({});
  const [loading, setLoading] = useState({});
  const [appConfigs, setAppConfigs] = useState([]);
  const [copied, setCopied] = useState(null);
  const [zipping, setZipping] = useState(false);
  const [apkZipping, setApkZipping] = useState(false);

  useEffect(() => {
    base44.entities.AppConfig.list("clave").then(setAppConfigs).catch(() => {});
  }, []);

  const fetchSchema = async (name) => {
    if (schemas[name]) { setExpanded(expanded === name ? null : name); return; }
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      const schema = await base44.entities[name].schema();
      setSchemas(prev => ({ ...prev, [name]: schema }));
      setExpanded(name);
    } catch {}
    setLoading(prev => ({ ...prev, [name]: false }));
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ═══ Descargar web completa como ZIP ═══
  const handleDownloadWeb = async () => {
    setZipping(true);
    try {
      const zip = new JSZip();
      const root = zip.folder("pena-el-chole-web");

      // Código fuente REAL de src/ (pages, components, lib, App.jsx, Layout.jsx, etc.)
      const srcFiles = await getSrcFiles();
      srcFiles.forEach(f => root.file(f.path, f.content));

      // Archivos de configuración raíz (index.html, package.json, vite.config.js, etc.)
      WEB_SOURCE_FILES.forEach(f => root.file(f.path, f.content));

      // Esquemas de entidades (todos, vía SDK)
      const entitiesFolder = root.folder("base44/entities");
      for (const name of ENTITY_NAMES) {
        try {
          const schema = await base44.entities[name].schema();
          entitiesFolder.file(`${name}.jsonc`, JSON.stringify(schema, null, 2));
        } catch {}
      }

      // Configuración dinámica
      root.file("src/lib/menuConfig.json", JSON.stringify(ALL_PAGES, null, 2));
      root.file("src/lib/uiPrefs.json", JSON.stringify(UI_PREFS, null, 2));
      root.file("appConfig_db.json", JSON.stringify(appConfigs, null, 2));

      // manifest.json
      const manifest = {
        id: "/",
        name: "Peña El Chole",
        short_name: "El Chole",
        description: "App de gestión de la Peña El Chole",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait-primary",
        background_color: "#faf8f6",
        theme_color: "#630027",
        lang: "es-ES",
        dir: "ltr",
        categories: ["productivity", "social", "utilities", "lifestyle"],
        prefer_related_applications: false,
        related_applications: [],
        iarc_rating_id: "",
        rating: { type: "IARC", rating: "3+", label: "Todos los públicos" },
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/icon-1024.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
        ],
        screenshots: [
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", form_factor: "wide", label: "Peña El Chole" },
        ],
      };
      root.folder("public").file("manifest.json", JSON.stringify(manifest, null, 2));
      try {
        const iconRes = await fetch("/icon.svg");
        const iconSvg = await iconRes.text();
        root.folder("public").file("icon.svg", iconSvg);
        for (const sz of [192, 512, 1024]) {
          const pngRes = await fetch(`/icon-${sz}.png`);
          const pngBuf = await pngRes.arrayBuffer();
          root.folder("public").file(`icon-${sz}.png`, pngBuf);
        }
      } catch {}
      root.folder("public").file("sw.js", `// Service Worker básico\nconst CACHE='el-chole-v1';\nself.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.add('/')));});\nself.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});`);

      // README
      root.file("README.md", README_CONTENT);

      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `pena-el-chole-web_${new Date().toISOString().split("T")[0]}.zip`);
    } catch (e) {
      console.error(e);
    }
    setZipping(false);
  };

  // ═══ Exportar APK (wrapper + guía) ═══
  const handleDownloadApk = async () => {
    setApkZipping(true);
    try {
      const zip = new JSZip();
      const root = zip.folder("pena-el-chole-apk");

      // PWA manifest
      const manifest = {
        id: "/",
        name: "Peña El Chole",
        short_name: "El Chole",
        description: "App de gestión de la Peña El Chole",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait-primary",
        background_color: "#faf8f6",
        theme_color: "#630027",
        lang: "es-ES",
        dir: "ltr",
        categories: ["productivity", "social", "utilities", "lifestyle"],
        prefer_related_applications: false,
        related_applications: [],
        iarc_rating_id: "",
        rating: { type: "IARC", rating: "3+", label: "Todos los públicos" },
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/icon-1024.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
        ],
        screenshots: [
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", form_factor: "wide", label: "Peña El Chole" },
        ],
      };
      root.file("public/manifest.json", JSON.stringify(manifest, null, 2));
      try {
        const iconRes = await fetch("/icon.svg");
        const iconSvg = await iconRes.text();
        root.file("public/icon.svg", iconSvg);
        for (const sz of [192, 512, 1024]) {
          const pngRes = await fetch(`/icon-${sz}.png`);
          const pngBuf = await pngRes.arrayBuffer();
          root.file(`public/icon-${sz}.png`, pngBuf);
        }
      } catch {}

      // Guía paso a paso
      root.file("GUIA_APK.md", APK_GUIDE);

      // Configuración PWABuilder
      root.file("pwabuilder.json", JSON.stringify({
        appUrl: "https://pena-el-chole-copy-3a25cef1.base44.app",
        appName: "Peña El Chole",
        packageName: "com.penaelchole.app",
        appVersion: "1.0.0",
        appVersionCode: 1,
        themeColor: "#630027",
        backgroundColor: "#faf8f6",
        displayMode: "standalone",
        orientation: "portrait",
        signInUrl: "",
        signingConfig: { keyAlias: "el-chole", keyPassword: "", keystoreFile: "", keystorePassword: "" },
      }, null, 2));

      // Service worker
      root.file("public/sw.js", `const CACHE='el-chole-v1';\nself.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.add('/')));self.skipWaiting();});\nself.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));});\nself.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});`);

      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `pena-el-chole-apk_${new Date().toISOString().split("T")[0]}.zip`);
    } catch (e) {
      console.error(e);
    }
    setApkZipping(false);
  };

  const menuConfigJson = JSON.stringify(ALL_PAGES, null, 2);
  const uiPrefsJson = JSON.stringify(UI_PREFS, null, 2);
  const appConfigJson = JSON.stringify(appConfigs, null, 2);

  return (
    <div className="space-y-4">
      {/* ═══ WEB: Descargar carpeta completa ═══ */}
      <div className="bg-gradient-to-br from-[#630027] to-[#4a001d] rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base">Descargar web completa</h3>
            <p className="text-white/70 text-xs mt-0.5">Código fuente completo de src/ (pages, components, lib, App.jsx, Layout.jsx), esquemas de todas las entidades y configuración.</p>
          </div>
        </div>
        <button onClick={handleDownloadWeb} disabled={zipping}
          className="w-full flex items-center justify-center gap-2 bg-white text-[#630027] hover:bg-white/90 disabled:opacity-50 text-sm font-bold py-2.5 rounded-xl transition-colors">
          {zipping ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generando ZIP...</> : <><Download className="w-4 h-4" /> Descargar .ZIP</>}
        </button>
      </div>

      {/* ═══ APK: Exportar a Android ═══ */}
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base">Exportar a APK</h3>
            <p className="text-white/70 text-xs mt-0.5">Descarga los archivos necesarios y la guía paso a paso para generar el APK instalable.</p>
          </div>
        </div>
        <button onClick={handleDownloadApk} disabled={apkZipping}
          className="w-full flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-white/90 disabled:opacity-50 text-sm font-bold py-2.5 rounded-xl transition-colors">
          {apkZipping ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generando...</> : <><Download className="w-4 h-4" /> Descargar paquete APK</>}
        </button>
        <div className="mt-3 bg-white/10 rounded-xl p-3 space-y-1.5">
          <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Pasos rápidos</p>
          <p className="text-[11px] text-white/60">1. Descarga el paquete y descomprímelo</p>
          <p className="text-[11px] text-white/60">2. Abre <span className="font-mono bg-white/10 px-1 rounded">pwabuilder.com</span> y pega la URL de la app</p>
          <p className="text-[11px] text-white/60">3. Genera el APK con la configuración incluida</p>
          <p className="text-[11px] text-white/60">4. Instala el APK en tu Android</p>
        </div>
        <div className="mt-2 bg-white/10 rounded-xl p-3 space-y-1">
          <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Cumplimiento PWA</p>
          <ChecklistItem ok text="manifest.json con name, short_name e iconos 512px" />
          <ChecklistItem ok text="Service Worker (sw.js) registrado" />
          <ChecklistItem ok text="start_url, scope y display: standalone" />
          <ChecklistItem ok text="theme_color y background_color" />
          <ChecklistItem ok text="Icono PNG 512x512 (any + maskable)" />
          <ChecklistItem ok text="Atajos (shortcuts) configurados" />
          <ChecklistItem ok text="Orientation: portrait-primary" />
          <ChecklistItem ok text="Caché offline con fetch handler" />
        </div>
      </div>

      {/* ═══ Páginas del menú ═══ */}
      <SectionCard title="Páginas del menú" icon="📋" filename="menuConfig.json"
        content={menuConfigJson} copied={copied === "menuConfig"}
        onCopy={() => handleCopy(menuConfigJson, "menuConfig")}>
        <div className="flex flex-wrap gap-1.5">
          {ALL_PAGES.map(p => (
            <span key={p.page} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg flex items-center gap-1">
              <span>{p.emoji}</span><span>{p.label}</span>
            </span>
          ))}
        </div>
      </SectionCard>

      {/* ═══ Preferencias UI ═══ */}
      <SectionCard title="Preferencias UI" icon="⚙️" filename="uiPrefs.json"
        content={uiPrefsJson} copied={copied === "uiPrefs"}
        onCopy={() => handleCopy(uiPrefsJson, "uiPrefs")}>
        <div className="space-y-1">
          {UI_PREFS.map(p => (
            <div key={p.key} className="flex items-center gap-2 text-xs">
              <span className="font-mono text-gray-500">{p.key}</span>
              <span className="text-gray-300">=</span>
              <span className="font-semibold text-[#630027]">{String(p.default)}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ═══ Esquemas de entidades ═══ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-4 h-4 text-[#630027]" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Esquemas de entidades ({ENTITY_NAMES.length})</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ENTITY_NAMES.map(name => {
            const active = expanded === name;
            return (
              <button key={name} onClick={() => fetchSchema(name)}
                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all text-xs font-semibold ${
                  active ? "bg-[#630027] text-white border-[#630027]" : "bg-white border-gray-200 text-gray-600 hover:border-[#630027]/40"
                }`}>
                {loading[name] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                  active ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
                <span className="flex-1 leading-tight">{name}</span>
              </button>
            );
          })}
        </div>
        <AnimatePresence>
          {expanded && schemas[expanded] && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 border-t border-gray-50 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-gray-400">{expanded} — schema</p>
                  <div className="flex gap-1">
                    <button onClick={() => handleCopy(JSON.stringify(schemas[expanded], null, 2), `schema_${expanded}`)}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#630027]">
                      {copied === `schema_${expanded}` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => downloadText(`${expanded}.schema.json`, JSON.stringify(schemas[expanded], null, 2))}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#630027]">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <pre className="bg-gray-50 rounded-xl p-3 text-[10px] text-gray-600 overflow-x-auto max-h-60 font-mono">{JSON.stringify(schemas[expanded], null, 2)}</pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ Configuración BD ═══ */}
      <SectionCard title="Configuración (AppConfig)" icon="🗃️" filename="appConfig.json"
        content={appConfigJson} copied={copied === "appConfig"}
        onCopy={() => handleCopy(appConfigJson, "appConfig")}>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {appConfigs.map(c => (
            <div key={c.id} className="flex items-center gap-2 text-xs">
              <span className="font-mono text-gray-500 truncate flex-1">{c.clave}</span>
              <span className="text-gray-300 truncate max-w-[120px]">{c.valor}</span>
            </div>
          ))}
          {appConfigs.length === 0 && <p className="text-gray-300 text-xs">Sin configuración</p>}
        </div>
      </SectionCard>
    </div>
  );
}

function ChecklistItem({ ok, text }) {
  return (
    <div className="flex items-center gap-1.5">
      {ok ? <Check className="w-3 h-3 text-green-400" /> : <ChevronRight className="w-3 h-3 text-white/40" />}
      <span className="text-[11px] text-white/60">{text}</span>
    </div>
  );
}

function SectionCard({ title, icon, filename, content, copied, onCopy, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onCopy} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#630027]">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => downloadText(filename, content)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#630027]">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setOpen(!open)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#630027]">
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <pre className="mt-3 bg-gray-50 rounded-xl p-3 text-[10px] text-gray-600 overflow-x-auto max-h-80 font-mono">{content}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ALL_PAGES_DEFAULT = [
  { emoji: '🏠', label: 'Inicio', page: 'Inicio' },
  { emoji: '👥', label: 'Integrantes', page: 'Integrantes' },
  { emoji: '🍺', label: 'La despensa de Simón', page: 'Cerveza' },
  { emoji: '📦', label: 'Inventario y compras', page: 'Almacen' },
  { emoji: '💰', label: 'Finanzas', page: 'Finanzas' },
  { emoji: '🎪', label: 'Desfile', page: 'Desfile' },
  { emoji: '💬', label: 'Comunidad', page: 'Comunidad' },
  { emoji: '🛠️', label: 'Herramientas', page: 'Herramientas' },
];

const README_CONTENT = `# Peña El Chole — Web App

Aplicación de gestión para la Peña El Chole construida con React + Vite + Tailwind CSS sobre la plataforma Base44.

## Estructura del proyecto

\`\`\`
pena-el-chole-web/
├── index.html              # Entry point HTML
├── package.json            # Dependencias del proyecto
├── vite.config.js          # Configuración de Vite
├── tailwind.config.js      # Configuración de Tailwind CSS
├── postcss.config.js       # Configuración de PostCSS
├── public/
│   ├── manifest.json       # PWA Manifest
│   └── sw.js                # Service Worker
├── src/
│   ├── main.jsx            # Punto de entrada React
│   ├── App.jsx             # Router principal
│   ├── Layout.jsx          # Layout con header, sidebar y bottom nav
│   ├── index.css           # Estilos globales + modo oscuro
│   ├── api/
│   │   └── base44Client.js  # Cliente Base44 SDK
│   ├── lib/
│   │   ├── utils.js         # Utilidades (cn, etc.)
│   │   ├── appConfig.js     # Configuración de la app (color, nombre)
│   │   ├── uiPrefs.js       # Preferencias de UI del usuario
│   │   ├── menuConfig.js    # Configuración de páginas del menú
│   │   └── tourData.js      # Tours guiados
│   ├── components/
│   │   ├── auth/            # Contexto de autenticación
│   │   ├── layout/          # Sidebar, BottomNav, ThemeToggle, etc.
│   │   ├── ui/              # Componentes shadcn/ui
│   │   └── ...              # Componentes de cada sección
│   └── pages/               # Páginas de la app
└── base44/
    └── entities/            # Esquemas de entidades (JSON)
\`\`\`

## Instalación

\`\`\`bash
npm install
npm run dev
\`\`\`

## Tecnologías

- React 18 + Vite 6
- Tailwind CSS 3
- Framer Motion (animaciones)
- Lucide React (iconos)
- Base44 SDK (backend, auth, base de datos)

## Páginas principales

${ALL_PAGES_DEFAULT.map(p => `- ${p.emoji} **${p.label}** (\`/${p.page}\`)`).join('\n')}
`;

const APK_GUIDE = `# Guía para generar el APK de Peña El Chole

## Método 1: PWABuilder (recomendado, más fácil)

1. Ve a https://www.pwabuilder.com
2. Pega la URL de la app: https://pena-el-chole-copy-3a25cef1.base44.app
3. Haz clic en "Start"
4. En la pestaña "Android", haz clic en "Generate Package"
5. Descarga el ZIP con el APK generado
6. Transfiere el APK a tu teléfono Android e instálalo

## Método 2: Bubblewrap (CLI, más control)

1. Instala Node.js y JDK 17
2. Instala Bubblewrap:
   \`\`\`bash
   npm install -g @bubblewrap/cli
   \`\`\`
3. Inicializa el proyecto:
   \`\`\`bash
   bubblewrap init --manifest https://pena-el-chole-copy-3a25cef1.base44.app/manifest.json
   \`\`\`
4. Construye el APK:
   \`\`\`bash
   bubblewrap build
   \`\`\`
5. El APK se generará en la carpeta app/release/

## Configuración del paquete

- **Package name:** com.penaelchole.app
- **App name:** Peña El Chole
- **Theme color:** #630027
- **Background:** #faf8f6
- **Orientation:** Portrait
- **Display mode:** Standalone

## Instalar el APK en Android

1. Habilita "Orígenes desconocidos" en Ajustes > Seguridad
2. Abre el archivo .apk descargado
3. Pulsa "Instalar"
4. Abre la app desde el cajón de aplicaciones

## Notas

- La app ya está configurada como PWA (Progressive Web App)
- El service worker permite uso offline básico
- Los iconos deben ser 192x192 y 512x512 PNG
- Para publicar en Google Play, necesitas una cuenta de desarrollador ($25)
`;