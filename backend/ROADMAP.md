# Backend roadmap

A step-by-step plan for replacing everything the frontend used to get from Base44. Tick the boxes as you go.

- The endpoint contract is in [`API.md`](API.md). How to run the project and the package layout are in [`README.md`](README.md).
- **New to the project?** Read [`GUIA_ENTIDADES.md`](GUIA_ENTIDADES.md) (step-by-step guide, in Spanish). Every pending entity has a folder in `src/main/java/com/penaelchole/backend/<package>/` with a `README.md` describing exactly what to implement.
- **About the entity tables (Phase 2 onwards):** they were generated automatically by scanning the frontend's `api.entities.X.create/update/filter/list` calls. The field lists show what the frontend _sends_, so they can be incomplete: some fields are only ever read, or are built in another component. The types are guesses based on values and names. Before writing a migration, open the listed files and check.

---

## Phase 0: Foundations (shared by every entity)

- [x] Project skeleton, PostgreSQL in Docker, Flyway, by-feature packages
- [x] `BaseEntity` (`id`, `created_date`, `updated_date`, `created_by_id`)
- [x] `Integrante`: GET list, POST, PATCH (partial, with `IntegrantePatch`), DELETE (204)
- [x] `GlobalExceptionHandler` (`IllegalArgumentException` → 400 `{ "message": ... }`)
- [x] **Docker WSL integration on**, so `./mvnw test` runs. Tests for POST/PATCH/DELETE of `Integrante`.
- [x] Add a 404 handler to `GlobalExceptionHandler` so `ResourceNotFoundException` also comes back as `{ "message": ... }`, plus a 400 for validation errors (`MethodArgumentNotValidException` from `@Valid`).
- [x] `GET /api/entities/Integrante/{id}`
- [x] **Sorting, filtering and paging on the list endpoint** (`?sort=-created_date&limit=50&skip=0&categoria=socios`). Every entity needs this, so build it once and reuse it:
  - `sort` maps to Spring Data's `Sort` (`-campo` → `Sort.by(DESC, "campo")`). Beware: the frontend sends snake_case (`created_date`) but JPA property names are camelCase (`createdDate`).
  - Equality filters: the simplest option is **Query by Example** (`repository.findAll(Example.of(probe), sort)`). The more flexible one is `Specification`, which is worth learning.
  - `limit`/`skip`: `PageRequest`, or `Limit` + an offset.
- [x] `POST /api/entities/Integrante/bulk` and `/delete-many`. Only the backup restore uses them, so they can wait.

## Phase 1: Authentication

- [x] `SesionUsuario` entity (see its table in Phase 2). Store `password_hash`, never the plain password. Use `BCryptPasswordEncoder` as a `PasswordEncoder` bean.
- [x] `POST /api/auth/login`: check the password, return `{ token, sesion }`. Issue the JWT with `NimbusJwtEncoder`, which comes with the `oauth2-resource-server` starter you already have, and an HMAC secret from configuration.
- [x] The `__admin__` user, with its password read from an environment variable (`@Value` / `@ConfigurationProperties`).
- [x] `GET /api/auth/me` and the public `GET /api/auth/usuarios`.
- [x] Lock down `SecurityConfig`: `oauth2ResourceServer(jwt)`, and `authenticated()` everywhere except login, `/api/auth/usuarios` and `GET /api/files/**`.
- [x] Put `integranteId`, `cargo` and `esAdmin` in the JWT claims. Fill `created_by_id` from the authenticated user (look up `@AuthenticationPrincipal`, or JPA auditing with `@CreatedBy` + `AuditorAware`).
- [x] Permissions: admins manage any account, and users may only change their own password and avatar (see `API.md`). Look at `@PreAuthorize` and method security.

## Cross-cutting features (fit them in when a phase needs them)

- [ ] **File uploads**: `POST /api/files` (`MultipartFile`), saved to disk with UUID names, `GET /api/files/{name}` public. Many entities store photos (`fotos`, `avatar_url`, `adjunto_url`…). Firebase Storage or S3 are possible later.
- [ ] **Real-time**: `GET /api/events` with `SseEmitter`. Publish an application event (`ApplicationEventPublisher`) from the services after create/update/delete, and a listener sends it to the connected clients. Needed by `ChatMensaje`, `Tarea`, `Votacion`, `ActaReunion` and `Actividad`.
- [ ] **AI**: `POST /api/ai/llm` (Claude API via `RestClient`, or Spring AI) and `/api/ai/image`. Optional.
- [ ] **Backup support**: `bulk` + `delete-many` on every entity.

## Design decisions you'll meet repeatedly

- **Relationships (`*_id` fields):** the frontend sends and filters by plain ids (`integrante_id`, `grupo_id`…). The simplest approach is a `String integranteId` column plus a database `FOREIGN KEY` in the migration. `@ManyToOne` is more "JPA" but you'd have to translate ids ↔ objects in your DTOs. Try it on one entity to learn it, and don't feel obliged to use it everywhere.
- **Copied names:** many entities store a name next to the id (`integrante_nombre`, `autor_nombre`, `comprador_nombre`). The frontend relies on them, so keep them as plain columns.
- **Array/object fields** (`fotos`, `opciones`, `items`, `leida_por`…): either a PostgreSQL `jsonb` column (`@JdbcTypeCode(SqlTypes.JSON)` on a `List<String>` / record field) or a child table (`@ElementCollection` / a separate entity). Use `jsonb` for lists of URLs and small embedded data, and a table when you need to query or filter on the items.
- **Dates:** fields like `fecha` usually hold `"YYYY-MM-DD"` (`LocalDate`); timestamps are `Instant`. Check what the component actually sends.
- **Generic shortcut:** if mapping all 58 entities by hand gets tedious, the less important ones (Phase 11) could share one generic `jsonb` table behind `/api/entities/{entity}` (see the tip in `API.md`). Spring picks the specific controllers over the generic one.

---

## Entities to map

`Integrante` is done. The order below follows what the frontend needs first: login and layout, then one page area at a time. Each phase leaves another section of the app working.

### Phase 2: Login & configuration

Needed to log in and render the layout.

#### `SesionUsuario`

- [x] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `update` · filters: `integrante_id`
- used in 5 file(s): `src/pages/Admin.jsx`, `src/pages/Cerveza.jsx`, `src/pages/Chat.jsx` …

| field           | type (guessed)           |
| --------------- | ------------------------ |
| `avatar_url`    | String (URL)             |
| `contrasena`    | String                   |
| `disabled`      | boolean                  |
| `integrante_id` | String (id → integrante) |
| `usuario`       | String                   |

#### `AppConfig`

- [x] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `update` · filters: `clave` · sort: `clave`
- used in 22 file(s): `src/components/HamburgerMenu.jsx`, `src/components/admin/AjustesApp.jsx`, `src/components/admin/CodigoApp.jsx` …

| field   | type (guessed) |
| ------- | -------------- |
| `clave` | String         |
| `valor` | String         |

#### `Notificacion`

- [x] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `update` · filters: `archivada` · sort: `-created_date`
- used in 12 file(s): `src/components/almacen/ItemAlmacenCard.jsx`, `src/components/cargos/PanelPresidente.jsx`, `src/components/cargos/PanelSecretario.jsx` …

| field               | type (guessed)             |
| ------------------- | -------------------------- |
| `archivada`         | boolean                    |
| `fecha_archivo`     | LocalDate / Instant        |
| `fecha_publicacion` | LocalDate / Instant        |
| `leida_por`         | array → JSON / child table |
| `mensaje`           | String                     |
| `tipo`              | String                     |
| `titulo`            | String                     |

#### `AdminLog`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list` · sort: `-created_date`
- used in 6 file(s): `src/components/admin/AuditoriaPanel.jsx`, `src/components/admin/HistorialAuditoria.jsx`, `src/components/comunidad/SugerenciasContent.jsx` …

| field          | type (guessed) |
| -------------- | -------------- |
| `accion`       | String         |
| `autor_nombre` | String         |
| `descripcion`  | String         |
| `entidad`      | String         |

#### `PermisoSeccion`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`
- used in 1 file(s): `src/components/admin/PermisosPanel.jsx`

| field               | type (guessed)           |
| ------------------- | ------------------------ |
| `integrante_id`     | String (id → integrante) |
| `integrante_nombre` | String                   |
| `permitido`         | String                   |
| `rol`               | String                   |
| `seccion`           | String                   |
| `tipo`              | String                   |

### Phase 3: Finances

Finanzas page (cash book, fees, budget) and Tickets.

#### `MovimientoCaja`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list` · sort: `-fecha`, `-created_date`
- used in 6 file(s): `src/components/contabilidad/NuevoMovimientoDialog.jsx`, `src/components/finanzas/LibroCajaContent.jsx`, `src/components/inicio/WidgetsDashboard.jsx` …

| field       | type (guessed)      |
| ----------- | ------------------- |
| `cantidad`  | number              |
| `categoria` | String              |
| `concepto`  | String              |
| `fecha`     | LocalDate / Instant |
| `fuente`    | String              |
| `notas`     | String              |
| `tipo`      | String              |
| `usuario`   | String              |

#### `Cuota`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `update` · filters: `pagada` · sort: `-created_date`
- used in 8 file(s): `src/components/cargos/HerramientasCargo.jsx`, `src/components/finanzas/CuotasContent.jsx`, `src/components/inicio/WidgetsDashboard.jsx` …

| field               | type (guessed)           |
| ------------------- | ------------------------ |
| `concepto`          | String                   |
| `fecha_pago`        | LocalDate / Instant      |
| `importe`           | number                   |
| `integrante_id`     | String (id → integrante) |
| `integrante_nombre` | String                   |
| `pagada`            | boolean                  |

#### `PagoRegistrado`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list` · sort: `-created_date`
- used in 8 file(s): `src/components/cargos/HerramientasCargo.jsx`, `src/components/cargos/PanelTesorero.jsx`, `src/components/compra/ArchivoCompras.jsx` …

| field            | type (guessed) |
| ---------------- | -------------- |
| `importe`        | number         |
| `persona`        | String         |
| `registrado_por` | String         |

#### `Presupuesto`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-anio`
- used in 3 file(s): `src/components/cargos/PanelPresupuesto.jsx`, `src/components/finanzas/PresupuestoContent.jsx`, `src/pages/Presupuesto.jsx`

| field      | type (guessed)             |
| ---------- | -------------------------- |
| `anio`     | number                     |
| `ingresos` | array → JSON / child table |
| `partidas` | array → JSON / child table |

#### `TicketFactura`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-created_date`
- used in 2 file(s): `src/pages/Contabilidad.jsx`, `src/pages/Tickets.jsx`

| field               | type (guessed)             |
| ------------------- | -------------------------- |
| `carpeta`           | String                     |
| `categoria`         | String                     |
| `concepto`          | String                     |
| `fecha`             | LocalDate / Instant        |
| `fecha_pago`        | LocalDate / Instant        |
| `fecha_vencimiento` | LocalDate / Instant        |
| `fotos`             | array → JSON / child table |
| `importe`           | number                     |
| `integrante_id`     | String (id → integrante)   |
| `integrante_nombre` | String                     |
| `items`             | array → JSON / child table |
| `notas`             | String                     |
| `pagado`            | boolean                    |
| `proveedor`         | String                     |
| `tipo`              | String                     |

#### `Proveedor`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list` · sort: `nombre`
- used in 1 file(s): `src/pages/Tickets.jsx`

| field    | type (guessed) |
| -------- | -------------- |
| `nombre` | String         |

#### `DeudaProveedor`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-created_date`, `-fecha`
- used in 3 file(s): `src/components/compra/ItemCompraDialog.jsx`, `src/components/tickets/DeudasPanel.jsx`, `src/pages/Contabilidad.jsx`

| field       | type (guessed) |
| ----------- | -------------- |
| `concepto`  | String         |
| `importe`   | number         |
| `pagado`    | boolean        |
| `proveedor` | String         |

### Phase 4: Beer

"La despensa de Simón" page.

#### `CervezaEntrada`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `update` · filters: `nombre` · sort: `-cervezas`, `-created_date`
- used in 7 file(s): `src/components/cargos/PanelPresidente.jsx`, `src/components/cerveza/CuentasCerveza.jsx`, `src/components/cerveza/MiCervezaPerfil.jsx` …

| field      | type (guessed) |
| ---------- | -------------- |
| `cervezas` | number         |
| `nombre`   | String         |
| `pagado`   | boolean        |

#### `ConsumoCerveza`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `bulkCreate`, `create`, `delete`, `filter`, `list`, `update` · filters: `integrante_id`, `tipo`
- used in 1 file(s): `src/pages/Cerveza.jsx`

| field               | type (guessed)           |
| ------------------- | ------------------------ |
| `cantidad`          | number                   |
| `integrante_id`     | String (id → integrante) |
| `integrante_nombre` | String                   |
| `tipo`              | String                   |

#### `CervezaPago`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `filter`, `list`, `update` · filters: `archivado`, `integrante_nombre` · sort: `-fecha`
- used in 4 file(s): `src/components/cerveza/CuentasCerveza.jsx`, `src/components/cerveza/MiCervezaPerfil.jsx`, `src/pages/Cerveza.jsx` …

| field               | type (guessed)      |
| ------------------- | ------------------- |
| `anio_archivo`      | number              |
| `archivado`         | boolean             |
| `fecha`             | LocalDate / Instant |
| `importe`           | number              |
| `integrante_nombre` | String              |
| `notas`             | String              |

#### `LoteCerveza`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-fecha`
- used in 3 file(s): `src/components/cerveza/InventarioCerveza.jsx`, `src/pages/Cerveza.jsx`, `src/pages/Contabilidad.jsx`

| field              | type (guessed)      |
| ------------------ | ------------------- |
| `cantidad`         | number              |
| `consumido_ajuste` | String              |
| `coste`            | number              |
| `fecha`            | LocalDate / Instant |
| `notas`            | String              |
| `stock_minimo`     | number              |
| `tipo`             | String              |

### Phase 5: Warehouse & shopping

Inventory, loans and the shopping list.

#### `ItemAlmacen`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `update` · filters: `id` · sort: `-created_date`
- used in 5 file(s): `src/components/almacen/ItemAlmacenCard.jsx`, `src/components/almacen/NuevoItemDialog.jsx`, `src/components/cargos/DashboardJunta.jsx` …

| field                  | type (guessed) |
| ---------------------- | -------------- |
| `cantidad`             | number         |
| `categoria`            | String         |
| `descripcion`          | String         |
| `frecuencia_revision`  | String         |
| `imagen_url`           | String (URL)   |
| `imagen_urls`          | String         |
| `miniatura_url`        | String (URL)   |
| `nombre`               | String         |
| `proveedor`            | String         |
| `proveedor_telefono`   | String         |
| `stock_minimo`         | number         |
| `ultimo_mantenimiento` | String         |

#### `MovimientoAlmacen`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list` · filters: `item_id` · sort: `-created_date`
- used in 4 file(s): `src/components/almacen/EstadisticasAlmacen.jsx`, `src/components/almacen/ExportarAlmacen.jsx`, `src/components/almacen/HistorialMovimientos.jsx` …

| field               | type (guessed)     |
| ------------------- | ------------------ |
| `cantidad`          | number             |
| `cantidad_anterior` | number             |
| `cantidad_nueva`    | number             |
| `integrante_nombre` | String             |
| `item_id`           | String (id → item) |
| `item_nombre`       | String             |
| `tipo`              | String             |

#### `PrestamoAlmacen`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-fecha_prestamo`
- used in 1 file(s): `src/components/almacen/PrestamosPanel.jsx`

| field                       | type (guessed)      |
| --------------------------- | ------------------- |
| `devuelto`                  | boolean             |
| `fecha_devolucion_estimada` | LocalDate / Instant |
| `fecha_devolucion_real`     | LocalDate / Instant |
| `fecha_prestamo`            | LocalDate / Instant |
| `item_id`                   | String (id → item)  |
| `item_nombre`               | String              |
| `notas`                     | String              |
| `prestado_a`                | String              |
| `registrado_por`            | String              |

#### `ItemCompra`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `update` · filters: `nombre`, `comprador_nombre`, `comprado` · sort: `-created_date`
- used in 16 file(s): `src/components/almacen/ItemAlmacenDetalle.jsx`, `src/components/almacen/StockBajoPanel.jsx`, `src/components/cargos/DashboardJunta.jsx` …

| field              | type (guessed)             |
| ------------------ | -------------------------- |
| `cantidad`         | number                     |
| `comprado`         | boolean                    |
| `comprador_nombre` | String                     |
| `descripcion`      | String                     |
| `fecha_pagado`     | LocalDate / Instant        |
| `fotos`            | array → JSON / child table |
| `fotos_ticket`     | array → JSON / child table |
| `nombre`           | String                     |
| `pagado`           | boolean                    |
| `precio`           | number                     |
| `thumbnail_url`    | String (URL)               |
| `tienda_sugerida`  | String                     |

#### `CompraArchivo`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list` · sort: `-created_date`
- used in 1 file(s): `src/components/compra/ArchivoCompras.jsx`

| field           | type (guessed) |
| --------------- | -------------- |
| `anio`          | number         |
| `archivado_por` | String         |
| `cuentas_json`  | String         |
| `items_json`    | String         |
| `titulo`        | String         |
| `total_gasto`   | number         |
| `total_items`   | number         |

### Phase 6: Organization & calendar

Tasks, groups, deadlines, activities.

#### `Tarea`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `subscribe`, `update` · filters: `completada` · sort: `-created_date` · **real-time**
- used in 8 file(s): `src/Layout.jsx`, `src/components/cargos/DashboardJunta.jsx`, `src/components/cargos/PanelPresidente.jsx` …

| field              | type (guessed)      |
| ------------------ | ------------------- |
| `categoria`        | String              |
| `completada`       | boolean             |
| `fecha_completada` | LocalDate / Instant |
| `nombre`           | String              |

#### `TareaReunion`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `update` · filters: `acta_id`, `integrante_id` · sort: `-created_date`
- used in 4 file(s): `src/components/secretaria/TareasActaPanel.jsx`, `src/components/tareas/KanbanTareas.jsx`, `src/pages/Calendario.jsx` …

| field               | type (guessed)           |
| ------------------- | ------------------------ |
| `acta_fecha`        | LocalDate / Instant      |
| `acta_id`           | String (id → acta)       |
| `descripcion`       | String                   |
| `estado`            | String                   |
| `fecha_limite`      | LocalDate / Instant      |
| `integrante_id`     | String (id → integrante) |
| `integrante_nombre` | String                   |

#### `GrupoTrabajo`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update`
- used in 2 file(s): `src/components/organizacion/GruposContent.jsx`, `src/pages/GruposTrabajo.jsx`

| field         | type (guessed)             |
| ------------- | -------------------------- |
| `color`       | String                     |
| `descripcion` | String                     |
| `emoji`       | String                     |
| `miembros`    | array → JSON / child table |
| `nombre`      | String                     |

#### `Actividad`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `subscribe`, `update` · filters: `estado` · sort: `-fecha` · **real-time**
- used in 5 file(s): `src/Layout.jsx`, `src/components/actividades/ActividadDialog.jsx`, `src/components/inicio/WidgetsDashboard.jsx` …

| field                  | type (guessed)      |
| ---------------------- | ------------------- |
| `aforo_maximo`         | number              |
| `categoria`            | String              |
| `descripcion`          | String              |
| `estado`               | String              |
| `fecha`                | LocalDate / Instant |
| `imagen_url`           | String (URL)        |
| `inscritos_ids`        | String[] (ids)      |
| `lugar`                | String              |
| `notificacion_enviada` | boolean             |
| `precio`               | number              |
| `titulo`               | String              |

#### `SugerenciaActividad`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-created_date`
- used in 1 file(s): `src/components/actividades/SugerenciasActividades.jsx`

| field          | type (guessed)      |
| -------------- | ------------------- |
| `autor_id`     | String (id → autor) |
| `autor_nombre` | String              |
| `descripcion`  | String              |
| `estado`       | String              |
| `titulo`       | String              |
| `votos_ids`    | String[] (ids)      |

#### `PlazoCalendario`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list` · sort: `fecha_inicio`, `-created_date`
- used in 3 file(s): `src/components/calendario/CalendarioInicio.jsx`, `src/components/organizacion/PlazosContent.jsx`, `src/pages/Calendario.jsx`

| field          | type (guessed)      |
| -------------- | ------------------- |
| `categoria`    | String              |
| `fecha_fin`    | LocalDate / Instant |
| `fecha_inicio` | LocalDate / Instant |

#### `DiaCalendario`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `filter`, `list`, `update` · filters: `fecha`
- used in 3 file(s): `src/components/calendario/CalendarioInicio.jsx`, `src/components/calendario/DiaDrawer.jsx`, `src/pages/Calendario.jsx`

| field   | type (guessed)             |
| ------- | -------------------------- |
| `fecha` | LocalDate / Instant        |
| `fotos` | array → JSON / child table |
| `notas` | String                     |

#### `CuentaAtras`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-created_date`
- used in 2 file(s): `src/components/countdown/MultipleCuentasAtras.jsx`, `src/pages/Inicio.jsx`

| field            | type (guessed)      |
| ---------------- | ------------------- |
| `fecha_objetivo` | LocalDate / Instant |
| `nombre_evento`  | String              |

### Phase 7: Secretary & documents

Meeting minutes, documents, gallery.

#### `ActaReunion`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `subscribe`, `update` · sort: `-fecha` · **real-time**
- used in 3 file(s): `src/Layout.jsx`, `src/components/secretaria/ActasReunionContent.jsx`, `src/pages/ActasReunion.jsx`

| field              | type (guessed)             |
| ------------------ | -------------------------- |
| `acuerdos`         | String                     |
| `asistentes`       | array → JSON / child table |
| `carpeta`          | String                     |
| `fecha`            | LocalDate / Instant        |
| `firmada`          | boolean                    |
| `puntos`           | number                     |
| `tareas_derivadas` | String                     |

#### `Documento`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-fecha`
- used in 5 file(s): `src/components/layout/GlobalSearch.jsx`, `src/components/secretaria/GestionDocumentalContent.jsx`, `src/components/secretaria/RellenarPlantillaDialog.jsx` …

| field          | type (guessed)          |
| -------------- | ----------------------- |
| `contenido`    | String                  |
| `descripcion`  | String                  |
| `es_plantilla` | boolean                 |
| `fecha`        | LocalDate / Instant     |
| `nombre`       | String                  |
| `plantilla_id` | String (id → plantilla) |
| `responsable`  | String                  |
| `tipo`         | String                  |
| `url`          | String (URL)            |

#### `Carpeta`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-created_date`
- used in 2 file(s): `src/components/galeria/FolderView.jsx`, `src/pages/Memoria.jsx`

| field           | type (guessed) |
| --------------- | -------------- |
| `anio`          | number         |
| `miniatura_url` | String (URL)   |
| `nombre`        | String         |

#### `MediaItem`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list` · filters: `carpeta_id` · sort: `-created_date`
- used in 2 file(s): `src/components/galeria/FolderView.jsx`, `src/pages/Memoria.jsx`

| field        | type (guessed)        |
| ------------ | --------------------- |
| `carpeta_id` | String (id → carpeta) |
| `nombre`     | String                |
| `subido_por` | String                |
| `tipo`       | String                |
| `url`        | String (URL)          |

### Phase 8: Community & chat

Votes, suggestions, chat (uses real-time).

#### `Votacion`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `subscribe`, `update` · filters: `completada` · sort: `-created_date` · **real-time**
- used in 10 file(s): `src/Layout.jsx`, `src/components/cargos/DashboardJunta.jsx`, `src/components/cargos/PanelPresidente.jsx` …

| field              | type (guessed)             |
| ------------------ | -------------------------- |
| `completada`       | boolean                    |
| `descripcion`      | String                     |
| `fecha_completada` | LocalDate / Instant        |
| `opciones`         | array → JSON / child table |
| `tema`             | String                     |

#### `VotoRespuesta`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list` · filters: `votacion_id`
- used in 4 file(s): `src/components/cargos/DashboardJunta.jsx`, `src/components/comunidad/VotacionesContent.jsx`, `src/components/votaciones/VotacionCard.jsx` …

| field           | type (guessed)           |
| --------------- | ------------------------ |
| `integrante_id` | String (id → integrante) |
| `opcion`        | String                   |
| `votacion_id`   | String (id → votacion)   |

#### `Sugerencia`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `update` · filters: `archivada` · sort: `-created_date`
- used in 4 file(s): `src/components/cargos/PanelVocal.jsx`, `src/components/comunidad/SugerenciasContent.jsx`, `src/components/inicio/WidgetsDashboard.jsx` …

| field          | type (guessed) |
| -------------- | -------------- |
| `archivada`    | boolean        |
| `autor_nombre` | String         |
| `texto`        | String         |
| `titulo`       | String         |
| `votos`        | number         |
| `votos_ids`    | String[] (ids) |

#### `FeedbackApp`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-created_date`
- used in 2 file(s): `src/pages/Admin.jsx`, `src/pages/Ajustes.jsx`

| field          | type (guessed) |
| -------------- | -------------- |
| `autor_nombre` | String         |
| `leido`        | boolean        |
| `mensaje`      | String         |
| `tipo`         | String         |

#### `ChatGrupo`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-created_date`
- used in 2 file(s): `src/pages/Admin.jsx`, `src/pages/Chat.jsx`

| field           | type (guessed)             |
| --------------- | -------------------------- |
| `avatar_url`    | String (URL)               |
| `descripcion`   | String                     |
| `es_bot`        | boolean                    |
| `es_general`    | boolean                    |
| `es_privado`    | boolean                    |
| `nombre`        | String                     |
| `participantes` | array → JSON / child table |

#### `ChatMensaje`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `list`, `subscribe`, `update` · filters: `grupo_id` · sort: `-created_date`, `created_date` · **real-time**
- used in 4 file(s): `src/components/inicio/WidgetsDashboard.jsx`, `src/components/notifications/NotificationBell.jsx`, `src/pages/Admin.jsx` …

| field          | type (guessed)             |
| -------------- | -------------------------- |
| `adjunto_tipo` | String                     |
| `adjunto_url`  | String (URL)               |
| `autor_id`     | String (id → autor)        |
| `autor_nombre` | String                     |
| `grupo_id`     | String (id → grupo)        |
| `pie_texto`    | String                     |
| `reacciones`   | array → JSON / child table |
| `texto`        | String                     |

### Phase 9: Parade

Float, contest and results.

#### `ObraAnio`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-anio`
- used in 4 file(s): `src/components/obra/GuionJurado.jsx`, `src/components/obra/ObraAnioCard.jsx`, `src/components/trofeos/ObraContent.jsx` …

| field        | type (guessed) |
| ------------ | -------------- |
| `campoTexto` | String         |
| `titulo`     | String         |

#### `ObraDocumento`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter` · filters: `obra_anio_id`, `seccion`
- used in 1 file(s): `src/components/shared/MediaGaleria.jsx`

| field          | type (guessed)          |
| -------------- | ----------------------- |
| `nombre`       | String                  |
| `obra_anio_id` | String (id → obra_anio) |
| `seccion`      | String                  |
| `tipo`         | String                  |
| `url`          | String (URL)            |

#### `ConcursoSeccion`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `filter`, `update` · filters: `tipo`
- used in 1 file(s): `src/components/concurso/ConcursoSeccionPanel.jsx`

| field       | type (guessed)             |
| ----------- | -------------------------- |
| `archivos`  | array → JSON / child table |
| `contenido` | String                     |
| `tipo`      | String                     |

#### `ResultadoAnio`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-anio`
- used in 3 file(s): `src/components/resultados/ResultadoAnioCard.jsx`, `src/components/trofeos/ResultadosContent.jsx`, `src/pages/Resultados.jsx`

| field           | type (guessed)             |
| --------------- | -------------------------- |
| `anio`          | number                     |
| `excel_urls`    | String                     |
| `filas`         | array → JSON / child table |
| `imagenes_urls` | String                     |

### Phase 10: Vehicles & lottery

#### `Vehiculo`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `list`
- used in 2 file(s): `src/components/inicio/WidgetsDashboard.jsx`, `src/pages/Vehiculos.jsx`

| field    | type (guessed) |
| -------- | -------------- |
| `nombre` | String         |
| `tipo`   | String         |

#### `VehiculoPieza`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `list`
- used in 1 file(s): `src/pages/Vehiculos.jsx`

| field             | type (guessed)         |
| ----------------- | ---------------------- |
| `estado`          | String                 |
| `nombre`          | String                 |
| `notas`           | String                 |
| `referencia`      | String                 |
| `vehiculo_id`     | String (id → vehiculo) |
| `vehiculo_nombre` | String                 |

#### `VehiculoRevision`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `list`, `update`
- used in 1 file(s): `src/pages/Vehiculos.jsx`

| field             | type (guessed)         |
| ----------------- | ---------------------- |
| `completada`      | boolean                |
| `fecha_proxima`   | LocalDate / Instant    |
| `fecha_ultima`    | LocalDate / Instant    |
| `notas`           | String                 |
| `titulo`          | String                 |
| `vehiculo_id`     | String (id → vehiculo) |
| `vehiculo_nombre` | String                 |

#### `VehiculoTarea`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `list`, `update`
- used in 1 file(s): `src/pages/Vehiculos.jsx`

| field              | type (guessed)         |
| ------------------ | ---------------------- |
| `completada`       | boolean                |
| `descripcion`      | String                 |
| `fecha_completada` | LocalDate / Instant    |
| `nombre`           | String                 |
| `vehiculo_id`      | String (id → vehiculo) |
| `vehiculo_nombre`  | String                 |

#### `Loteria`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-created_date`
- used in 3 file(s): `src/components/inicio/WidgetsDashboard.jsx`, `src/pages/Contabilidad.jsx`, `src/pages/Loteria.jsx`

| field                  | type (guessed)      |
| ---------------------- | ------------------- |
| `descripcion`          | String              |
| `estado`               | String              |
| `fecha_limite`         | LocalDate / Instant |
| `nombre`               | String              |
| `numero_que_se_juega`  | number              |
| `precio_carroza`       | number              |
| `precio_participacion` | number              |
| `total_papeletas`      | number              |

#### `TalonarioLoteria`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-created_date`
- used in 4 file(s): `src/components/inicio/WidgetsDashboard.jsx`, `src/components/loteria/HerramientasGestion.jsx`, `src/pages/Contabilidad.jsx` …

| field               | type (guessed)           |
| ------------------- | ------------------------ |
| `cantidad_asignada` | number                   |
| `cantidad_vendida`  | number                   |
| `entregado`         | boolean                  |
| `integrante_id`     | String (id → integrante) |
| `integrante_nombre` | String                   |
| `loteria_id`        | String (id → loteria)    |
| `numeros_fin`       | String                   |
| `numeros_inicio`    | String                   |

#### `EntregaTalonario`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `list` · sort: `-fecha_entrega`
- used in 1 file(s): `src/pages/Loteria.jsx`

| field               | type (guessed)           |
| ------------------- | ------------------------ |
| `cantidad_asignada` | number                   |
| `cantidad_vendida`  | number                   |
| `fecha_entrega`     | LocalDate / Instant      |
| `integrante_id`     | String (id → integrante) |
| `integrante_nombre` | String                   |
| `loteria_id`        | String (id → loteria)    |
| `loteria_nombre`    | String                   |
| `numeros_fin`       | String                   |
| `numeros_inicio`    | String                   |
| `talonario_id`      | String (id → talonario)  |

### Phase 11: The rest

Minor and admin features.

#### `Mascota`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`
- used in 1 file(s): `src/components/integrantes/MascotasPanel.jsx`

| field           | type (guessed)       |
| --------------- | -------------------- |
| `descripcion`   | String               |
| `duenio_id`     | String (id → duenio) |
| `duenio_nombre` | String               |
| `especie`       | String               |
| `foto_url`      | String (URL)         |
| `nombre`        | String               |
| `raza`          | String               |

#### `NotaPersonal`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `filter`, `update` · filters: `integrante_id`
- used in 3 file(s): `src/components/notas/NotasBubble.jsx`, `src/components/notas/NotasButton.jsx`, `src/pages/NotasPersonales.jsx`

| field           | type (guessed)           |
| --------------- | ------------------------ |
| `contenido`     | String                   |
| `integrante_id` | String (id → integrante) |
| `titulo`        | String                   |

#### `EnlaceUtil`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list`, `update` · sort: `-created_date`
- used in 1 file(s): `src/pages/Enlaces.jsx`

| field         | type (guessed) |
| ------------- | -------------- |
| `carpeta`     | String         |
| `descripcion` | String         |
| `icono`       | String         |
| `titulo`      | String         |
| `url`         | String (URL)   |

#### `Logro`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `bulkCreate`, `create`, `delete`, `list`, `update`
- used in 2 file(s): `src/components/admin/GamificacionesPanel.jsx`, `src/pages/Logros.jsx`

| field         | type (guessed) |
| ------------- | -------------- |
| `activo`      | boolean        |
| `categoria`   | String         |
| `descripcion` | String         |
| `icono`       | String         |
| `nombre`      | String         |
| `puntos`      | number         |
| `umbral`      | number         |

#### `Papelera`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list` · sort: `-created_date`
- used in 6 file(s): `src/components/comunidad/SugerenciasContent.jsx`, `src/components/galeria/FolderView.jsx`, `src/components/resultados/ResultadoAnioCard.jsx` …

| field           | type (guessed) |
| --------------- | -------------- |
| `datos_json`    | String         |
| `descripcion`   | String         |
| `eliminado_por` | String         |
| `entidad`       | String         |

#### `IAConversacion`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `delete`, `list` · sort: `created_date`
- used in 1 file(s): `src/components/admin/IACreador.jsx`

| field   | type (guessed) |
| ------- | -------------- |
| `rol`   | String         |
| `texto` | String         |

#### `IARegistro`

- [ ] Migration · Entity · Repository · Service · Controller · Test
- methods: `create`, `list` · sort: `created_date`
- used in 1 file(s): `src/components/admin/IACreador.jsx`

| field       | type (guessed)       |
| ----------- | -------------------- |
| `rol`       | String               |
| `sesion_id` | String (id → sesion) |
| `texto`     | String               |
