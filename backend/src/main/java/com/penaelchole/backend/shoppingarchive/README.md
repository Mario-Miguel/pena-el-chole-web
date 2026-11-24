# `CompraArchivo` → paquete `shoppingarchive`

> Copia archivada de una lista de la compra ya cerrada, con totales y los datos guardados como texto JSON.

**Fase del ROADMAP:** Phase 5: Warehouse & shopping

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `CompraArchivo`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `CompraArchivo` |
| Endpoint | `/api/entities/CompraArchivo` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.shoppingarchive` |
| Tabla en la base de datos | `shopping_archive` |
| Migración | `src/main/resources/db/migration/V<n>__create_shopping_archive.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_shopping_archive.sql` (en `src/main/resources/db/migration/`)
- [ ] `ShoppingArchive.java`: la entidad (la tabla en Java)
- [ ] `ShoppingArchiveRepository.java`: acceso a la base de datos
- [ ] `ShoppingArchiveRequest.java`: lo que llega del frontend al **crear**
- [ ] `ShoppingArchivePatch.java`: lo que llega del frontend al **modificar**
- [ ] `ShoppingArchiveResponse.java`: lo que se devuelve al frontend
- [ ] `ShoppingArchiveService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `ShoppingArchiveController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/CompraArchivo")`)
- [ ] `ShoppingArchiveControllerTest.java` en `src/test/java/com/penaelchole/backend/shoppingarchive/`
- [ ] Marcar la casilla de `CompraArchivo` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `anio` | `year` | `Integer` | `year` | `INTEGER` |  |
| `archivado_por` | `archivedBy` | `String` | `archived_by` | `TEXT` |  |
| `cuentas_json` | `accountsJson` | `String` | `accounts_json` | `TEXT` | texto que contiene JSON (el frontend hace `JSON.stringify`) |
| `items_json` | `itemsJson` | `String` | `items_json` | `TEXT` | texto que contiene JSON (el frontend hace `JSON.stringify`) |
| `titulo` | `title` | `String` | `title` | `TEXT` |  |
| `total_gasto` | `totalSpent` | `BigDecimal` | `total_spent` | `NUMERIC(10, 2)` | dinero: usa `BigDecimal`, nunca `double` |
| `total_items` | `totalItems` | `Integer` | `total_items` | `INTEGER` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `CompraArchivo`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/CompraArchivo` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/CompraArchivo` | crear |
| `delete` | `DELETE /api/entities/CompraArchivo/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `CompraArchivo`:

- `src/components/compra/ArchivoCompras.jsx`

## Cosas a tener en cuenta

- `cuentas_json` e `items_json` son **texto**: el frontend hace `JSON.stringify(...)` antes de enviarlos. Guárdalos como `TEXT`, no como `jsonb`.
- Tiene importes de dinero: usa `BigDecimal` en Java y `NUMERIC(10, 2)` en SQL. Con `double` las cuentas acaban con decimales raros (0.1 + 0.2 = 0.30000000000000004).
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
