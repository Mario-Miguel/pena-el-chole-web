# `ItemCompra` → paquete `shoppingitem`

> Elemento de la lista de la compra: qué hay que comprar, quién lo compra, precio y si está comprado/pagado.

**Fase del ROADMAP:** Phase 5: Warehouse & shopping

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `ItemCompra`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `ItemCompra` |
| Endpoint | `/api/entities/ItemCompra` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.shoppingitem` |
| Tabla en la base de datos | `shopping_item` |
| Migración | `src/main/resources/db/migration/V<n>__create_shopping_item.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_shopping_item.sql` (en `src/main/resources/db/migration/`)
- [ ] `ShoppingItem.java`: la entidad (la tabla en Java)
- [ ] `ShoppingItemRepository.java`: acceso a la base de datos
- [ ] `ShoppingItemRequest.java`: lo que llega del frontend al **crear**
- [ ] `ShoppingItemPatch.java`: lo que llega del frontend al **modificar**
- [ ] `ShoppingItemResponse.java`: lo que se devuelve al frontend
- [ ] `ShoppingItemService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `ShoppingItemController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/ItemCompra")`)
- [ ] `ShoppingItemControllerTest.java` en `src/test/java/com/penaelchole/backend/shoppingitem/`
- [ ] Marcar la casilla de `ItemCompra` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `cantidad` | `quantity` | `Integer` | `quantity` | `INTEGER` |  |
| `comprado` | `bought` | `boolean` | `bought` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `comprador_nombre` | `buyerName` | `String` | `buyer_name` | `TEXT` |  |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `fecha_pagado` | `paidDate` | `Instant` | `paid_date` | `TIMESTAMPTZ` | día y hora, formato `"2026-03-01T18:30:00.000Z"`. |
| `fotos` | `photos` | `List<String>` | `photos` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de URLs de fotos. Ver "Listas y objetos (jsonb)" en la guía |
| `fotos_ticket` | `receiptPhotos` | `List<String>` | `receipt_photos` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de URLs de fotos del ticket. Ver "Listas y objetos (jsonb)" en la guía |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `pagado` | `paid` | `boolean` | `paid` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `precio` | `price` | `BigDecimal` | `price` | `NUMERIC(10, 2)` | dinero: usa `BigDecimal`, nunca `double` |
| `thumbnail_url` | `thumbnailUrl` | `String` | `thumbnail_url` | `TEXT` | URL (normalmente de un archivo subido) |
| `tienda_sugerida` | `suggestedShop` | `String` | `suggested_shop` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `ItemCompra`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/ItemCompra` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/ItemCompra?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/ItemCompra` | crear |
| `update` | `PATCH /api/entities/ItemCompra/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/ItemCompra/{id}` | borrar uno |

- **Filtros:** `nombre`, `comprador_nombre`, `comprado`
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `ItemCompra`:

- `src/components/almacen/ItemAlmacenDetalle.jsx`
- `src/components/almacen/StockBajoPanel.jsx`
- `src/components/cargos/DashboardJunta.jsx`
- `src/components/cargos/HerramientasCargo.jsx`
- `src/components/cargos/PanelPresidente.jsx`
- `src/components/cargos/PanelTesorero.jsx`
- `src/components/compra/ArchivoCompras.jsx`
- `src/components/compra/CuentasExternasPanel.jsx`
- `src/components/compra/CuentasPanel.jsx`
- `src/components/compra/CuentasPanelFixed.jsx`
- `src/components/inicio/WidgetsDashboard.jsx`
- `src/pages/Almacen.jsx`
- `src/pages/Cuentas.jsx`
- `src/pages/Perfil.jsx`
- `src/pages/Tesoreria.jsx`
- `src/pages/Tickets.jsx`

## Cosas a tener en cuenta

- Es la entidad más usada de esta fase (16 archivos). Repasa bien los filtros: `nombre`, `comprador_nombre` y `comprado`.
- Tiene importes de dinero: usa `BigDecimal` en Java y `NUMERIC(10, 2)` en SQL. Con `double` las cuentas acaban con decimales raros (0.1 + 0.2 = 0.30000000000000004).
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `nombre` devuelve solo las filas que coinciden.
- [ ] Filtrar por `comprador_nombre` devuelve solo las filas que coinciden.
- [ ] Filtrar por `comprado` devuelve solo las filas que coinciden.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
