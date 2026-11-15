# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Management web app (PWA) for "Peña El Chole", a club/association. The frontend is React 18 + Vite 6 + Tailwind 3 + shadcn/ui. It was originally built on the Base44 platform and has been moved off it: it now talks to a custom REST backend (Spring Boot, in `backend/`) that the user is writing themselves **as a learning project**. Don't implement backend code unless explicitly asked. UI text, identifiers, entity names and comments are in **Spanish**; keep new code consistent with that.

## Commands

The package manager is **pnpm** (`pnpm-workspace.yaml` allows esbuild's build script).

```bash
pnpm install
pnpm run dev        # vite dev server; proxies /api -> http://localhost:8080
pnpm run build      # production build -> dist/ (also the main correctness check)
pnpm run preview
```

Backend (Spring Boot 4.1, Java 21, Maven wrapper), see `backend/README.md`: `cd backend && docker compose up -d && ./mvnw spring-boot:run`; tests with `./mvnw test` (single test: `./mvnw test -Dtest=IntegranteControllerTest`), which need Docker for Testcontainers. Code is organized by feature package (`integrante/` = entity, repository, service, controller, DTO); the schema is managed by Flyway migrations with `ddl-auto=validate`.

There is no frontend test suite. `lint`/`typecheck` scripts exist in `package.json`, but eslint/typescript are not installed and there is no config for them.

## Frontend ⇄ backend contract

- All backend access goes through `src/api/client.js` (`import { api } from "@/api/client"`). It mimics the old Base44 SDK shape so call sites stayed the same:
  - `api.entities.<Entity>.list/filter/get/create/bulkCreate/update/delete/deleteMany/schema/subscribe`
  - `api.auth.login/me/logout/usuariosAcceso`
  - `api.uploadFile`, `api.invokeLLM`, `api.generateImage`
- `api.entities` is a Proxy, so dynamic names (`api.entities[key]`) work.
- **`backend/API.md` is the source of truth for endpoints.** If you change or add a call in `client.js`, update `API.md` in the same change.
- The JWT is stored in `localStorage["pena_token"]`. A 401 clears it and redirects to `/Acceso`. Real-time updates use a single SSE stream (`/api/events?token=`).
- `SesionUsuario.contrasena` is write-only: the backend hashes it and never returns it. Don't add UI that reads passwords.

## Architecture

**Routing:** `src/App.jsx` defines all routes by hand (`/<PageName>`, matching the files in `src/pages/`). Most pages are `React.lazy` loaded; `Inicio` and `Acceso` load eagerly. Many legacy pages are now `<Navigate>` redirects to consolidated pages (e.g. Cuotas/LibroCaja/Presupuesto → Finanzas; ToDo/GruposTrabajo/TareasReunion → Organizacion; Concurso/Resultados/Trofeos/Obra → Desfile). `src/pages.config.js` is a leftover Base44 file and isn't imported. To add a page, add a route in `App.jsx`, an entry in `src/lib/pagePrefetch.js` (`pageImports`) and, if it belongs in navigation, an entry in `ALL_PAGES` in `src/lib/menuConfig.js`. Build links with `createPageUrl(name)` from `@/utils`.

**Auth/session:** `src/components/auth/AuthContext.jsx` is provided inside `Layout.jsx`. `login()` calls the backend. The session `{ integranteId, nombre, cargo, avatarUrl, esAdmin, soloLectura? }` is cached in `localStorage["pena_sesion"]`, and `refreshSesion()` re-reads it from `/api/auth/me`. Permissions come from `cargo` (presidente, vicepresidente, tesorero, secretario, vocal…) and `esAdmin` (e.g. `puedeConfigurar`). `Layout.jsx` redirects users without a session to `/Acceso`. The special admin username is `ADMIN_ID = "__admin__"`; the backend checks its password.

**Layout:** `src/Layout.jsx` wraps every page: header, `Sidebar` (desktop), `HamburgerMenu`/`BottomNav` (mobile), chat bubble, notifications and the browser notifications fed by `subscribe`. `components/layout/PageTransition` animates pages with framer-motion.

**Data access:** components call `api.entities.*` directly, mostly inside `useEffect`; React Query is configured in `App.jsx` but rarely used. Audit logging goes through `registrarLog()` (`src/lib/registrarLog.js`), member notifications through `src/lib/notificaciones.js`, and money calculations through `src/lib/finanzas.js`. Entity field schemas are not in the repo; work them out from the components that read and write them.

**Runtime-configurable app settings:** stored as key/value rows (`clave`/`valor`) in the `AppConfig` entity, cached in `localStorage`, and broadcast with `window` CustomEvents that components listen for:
- `src/lib/appConfig.js`: primary/secondary colour (CSS vars `--app-primary`, `--app-secondary`), app name, custom menu labels. Events: `appNombreChanged`, `appLabelsChanged`. Edited in `components/admin/AjustesApp.jsx`.
- `src/lib/menuConfig.js`: `ALL_PAGES` is the central page registry (labels, emoji, help text for Ayuda). It also stores disabled pages (`AppConfig` key `menu_desactivado`; `UNDISABLEABLE` pages can't be disabled) and the menu order.
- `src/lib/uiPrefs.js`: per-device UI toggles, event `uiPrefChanged`.

**Styling:** Tailwind with shadcn/ui components in `src/components/ui/` (react-day-picker v8, recharts v2, tailwind-merge v2: keep these major versions). The brand colour `#630027` appears both as `var(--app-primary)` and hard-coded in classes. Dark mode uses the `.dark` class, with many overrides in `src/index.css`. The `@/` alias is defined in `vite.config.js`. The PWA files are `public/manifest.json`, `public/sw.js` and `public/logo.jpg`.

**Base44 leftovers:** the admin "Código" panel (`components/admin/CodigoApp.jsx`) and `src/lib/webSourceFiles.js` come from Base44's "download code" feature. They embed stale copies of old config files and still reference the `*.base44.app` URL. Don't treat them as a source of truth. `appConfig_db.json` is an old dump of `AppConfig`.
