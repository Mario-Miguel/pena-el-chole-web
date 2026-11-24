# `ConsumoCerveza` → paquete `beerconsumption`

> Cada consumo de cerveza que apunta un integrante (cantidad y tipo).

**Fase del ROADMAP:** Phase 4: Beer

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `ConsumoCerveza`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `ConsumoCerveza` |
| Endpoint | `/api/entities/ConsumoCerveza` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.beerconsumption` |
| Tabla en la base de datos | `beer_consumption` |
| Migración | `src/main/resources/db/migration/V<n>__create_beer_consumption.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_beer_consumption.sql` (en `src/main/resources/db/migration/`)
- [ ] `BeerConsumption.java`: la entidad (la tabla en Java)
- [ ] `BeerConsumptionRepository.java`: acceso a la base de datos
- [ ] `BeerConsumptionRequest.java`: lo que llega del frontend al **crear**
- [ ] `BeerConsumptionPatch.java`: lo que llega del frontend al **modificar**
- [ ] `BeerConsumptionResponse.java`: lo que se devuelve al frontend
- [ ] `BeerConsumptionService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `BeerConsumptionController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/ConsumoCerveza")`)
- [ ] `BeerConsumptionControllerTest.java` en `src/test/java/com/penaelchole/backend/beerconsumption/`
- [ ] Marcar la casilla de `ConsumoCerveza` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `cantidad` | `quantity` | `Integer` | `quantity` | `INTEGER` |  |
| `integrante_id` | `memberId` | `String` | `member_id` | `VARCHAR(36)` | id de un `Integrante` (tabla `member`). Clave foránea, ver la guía |
| `integrante_nombre` | `memberName` | `String` | `member_name` | `TEXT` |  |
| `tipo` | `type` | `String` | `type` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `ConsumoCerveza`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/ConsumoCerveza` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/ConsumoCerveza?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/ConsumoCerveza` | crear |
| `bulkCreate` | `POST /api/entities/ConsumoCerveza/bulk` | crear varios a la vez |
| `update` | `PATCH /api/entities/ConsumoCerveza/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/ConsumoCerveza/{id}` | borrar uno |

- **Filtros:** `integrante_id`, `tipo`
- **Orden (`sort`):** —

Archivos del frontend que usan `ConsumoCerveza`:

- `src/pages/Cerveza.jsx`

## Cosas a tener en cuenta

- El frontend usa `bulkCreate` (`POST /bulk`) en el uso normal, no solo en las copias de seguridad: no lo protejas solo para admins.
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `integrante_id` devuelve solo las filas que coinciden.
- [ ] Filtrar por `tipo` devuelve solo las filas que coinciden.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
