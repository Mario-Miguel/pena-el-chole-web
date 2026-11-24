# `ItemAlmacen` → paquete `warehouseitem`

> Objeto del almacén de la peña (inventario): cantidad, categoría, fotos, proveedor y mantenimiento.

**Fase del ROADMAP:** Phase 5: Warehouse & shopping

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `ItemAlmacen`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `ItemAlmacen` |
| Endpoint | `/api/entities/ItemAlmacen` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.warehouseitem` |
| Tabla en la base de datos | `warehouse_item` |
| Migración | `src/main/resources/db/migration/V<n>__create_warehouse_item.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_warehouse_item.sql` (en `src/main/resources/db/migration/`)
- [ ] `WarehouseItem.java`: la entidad (la tabla en Java)
- [ ] `WarehouseItemRepository.java`: acceso a la base de datos
- [ ] `WarehouseItemRequest.java`: lo que llega del frontend al **crear**
- [ ] `WarehouseItemPatch.java`: lo que llega del frontend al **modificar**
- [ ] `WarehouseItemResponse.java`: lo que se devuelve al frontend
- [ ] `WarehouseItemService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `WarehouseItemController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/ItemAlmacen")`)
- [ ] `WarehouseItemControllerTest.java` en `src/test/java/com/penaelchole/backend/warehouseitem/`
- [ ] Marcar la casilla de `ItemAlmacen` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `cantidad` | `quantity` | `Integer` | `quantity` | `INTEGER` |  |
| `categoria` | `category` | `String` | `category` | `TEXT` |  |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `frecuencia_revision` | `inspectionFrequencyDays` | `Integer` | `inspection_frequency_days` | `INTEGER` |  |
| `imagen_url` | `imageUrl` | `String` | `image_url` | `TEXT` | URL (normalmente de un archivo subido) |
| `imagen_urls` | `imageUrls` | `List<String>` | `image_urls` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de URLs de imágenes. Ver "Listas y objetos (jsonb)" en la guía |
| `miniatura_url` | `thumbnailUrl` | `String` | `thumbnail_url` | `TEXT` | URL (normalmente de un archivo subido) |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `proveedor` | `supplier` | `String` | `supplier` | `TEXT` |  |
| `proveedor_telefono` | `supplierPhone` | `String` | `supplier_phone` | `TEXT` |  |
| `stock_minimo` | `minimumStock` | `Integer` | `minimum_stock` | `INTEGER` |  |
| `ultimo_mantenimiento` | `lastMaintenance` | `LocalDate` | `last_maintenance` | `DATE` | solo el día, formato `"2026-03-01"`. |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `ItemAlmacen`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/ItemAlmacen` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/ItemAlmacen?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/ItemAlmacen` | crear |
| `update` | `PATCH /api/entities/ItemAlmacen/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/ItemAlmacen/{id}` | borrar uno |

- **Filtros:** `id`
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `ItemAlmacen`:

- `src/components/almacen/ItemAlmacenCard.jsx`
- `src/components/almacen/NuevoItemDialog.jsx`
- `src/components/cargos/DashboardJunta.jsx`
- `src/components/inicio/WidgetsDashboard.jsx`
- `src/pages/Almacen.jsx`

## Cosas a tener en cuenta

- `imagen_urls` es una lista de URLs (el roadmap dice String, pero el frontend manda un array).
- `frecuencia_revision` es un número de días y `ultimo_mantenimiento` una fecha `"YYYY-MM-DD"` (se usan en `MantenimientoPanel.jsx`).
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `id` devuelve solo las filas que coinciden.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
