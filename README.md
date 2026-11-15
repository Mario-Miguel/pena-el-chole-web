# Peña El Chole — Web App

Aplicación de gestión para la Peña El Chole construida con React + Vite + Tailwind CSS sobre la plataforma Base44.

## Estructura del proyecto

```
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
```

## Instalación

```bash
npm install
npm run dev
```

## Tecnologías

- React 18 + Vite 6
- Tailwind CSS 3
- Framer Motion (animaciones)
- Lucide React (iconos)
- Base44 SDK (backend, auth, base de datos)

## Páginas principales

- 🏠 **Inicio** (`/Inicio`)
- 👥 **Integrantes** (`/Integrantes`)
- 🍺 **La despensa de Simón** (`/Cerveza`)
- 📦 **Inventario y compras** (`/Almacen`)
- 💰 **Finanzas** (`/Finanzas`)
- 🎪 **Desfile** (`/Desfile`)
- 💬 **Comunidad** (`/Comunidad`)
- 🛠️ **Herramientas** (`/Herramientas`)
