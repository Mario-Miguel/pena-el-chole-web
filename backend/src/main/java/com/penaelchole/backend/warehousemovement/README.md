# `MovimientoAlmacen` → paquete `warehousemovement`

> Historial de cambios de cantidad de un objeto del almacén (entradas y salidas).

**Fase del ROADMAP:** Phase 5: Warehouse & shopping

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `MovimientoAlmacen`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

> **Antes de empezar:** esta entidad apunta a `ItemAlmacen`. Hazla(s) primero, porque la clave foránea de la migración necesita que la otra tabla exista.

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `MovimientoAlmacen` |
| Endpoint | `/api/entities/MovimientoAlmacen` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.warehousemovement` |
| Tabla en la base de datos | `warehouse_movement` |
| Migración | `src/main/resources/db/migration/V<n>__create_warehouse_movement.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_warehouse_movement.sql` (en `src/main/resources/db/migration/`)
- [ ] `WarehouseMovement.java`: la entidad (la tabla en Java)
- [ ] `WarehouseMovementRepository.java`: acceso a la base de datos
- [ ] `WarehouseMovementRequest.java`: lo que llega del frontend al **crear**
- [ ] `WarehouseMovementPatch.java`: lo que llega del frontend al **modificar**
- [ ] `WarehouseMovementResponse.java`: lo que se devuelve al frontend
- [ ] `WarehouseMovementService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `WarehouseMovementController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/MovimientoAlmacen")`)
- [ ] `WarehouseMovementControllerTest.java` en `src/test/java/com/penaelchole/backend/warehousemovement/`
- [ ] Marcar la casilla de `MovimientoAlmacen` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `cantidad` | `quantity` | `Integer` | `quantity` | `INTEGER` |  |
| `cantidad_anterior` | `previousQuantity` | `Integer` | `previous_quantity` | `INTEGER` |  |
| `cantidad_nueva` | `newQuantity` | `Integer` | `new_quantity` | `INTEGER` |  |
| `integrante_nombre` | `memberName` | `String` | `member_name` | `TEXT` |  |
| `item_id` | `itemId` | `String` | `item_id` | `VARCHAR(36)` | id de un `ItemAlmacen` (tabla `warehouse_item`). Clave foránea, ver la guía |
| `item_nombre` | `itemName` | `String` | `item_name` | `TEXT` |  |
| `tipo` | `type` | `String` | `type` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `MovimientoAlmacen`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/MovimientoAlmacen` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/MovimientoAlmacen?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/MovimientoAlmacen` | crear |
| `delete` | `DELETE /api/entities/MovimientoAlmacen/{id}` | borrar uno |

- **Filtros:** `item_id`
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `MovimientoAlmacen`:

- `src/components/almacen/EstadisticasAlmacen.jsx`
- `src/components/almacen/ExportarAlmacen.jsx`
- `src/components/almacen/HistorialMovimientos.jsx`
- `src/components/almacen/ItemAlmacenCard.jsx`

## Cosas a tener en cuenta

- Es un historial: el frontend nunca lo modifica (`update`), solo crea, lista y borra.
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `item_id` devuelve solo las filas que coinciden.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
