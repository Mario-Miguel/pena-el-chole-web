# `ConsumoCerveza` → paquete `beerconsumption`

> Cada cerveza (o varias) que se apunta a un integrante. Es la única fuente de verdad: ya no hay contador `CervezaEntrada`.

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

- [x] Migración `V<n>__create_beer_consumption.sql` (en `src/main/resources/db/migration/`)
- [x] `BeerConsumption.java`: la entidad (la tabla en Java)
- [x] `BeerConsumptionRepository.java`: acceso a la base de datos
- [x] `BeerConsumptionRequest.java`: lo que llega del frontend al **crear**
- [x] `BeerConsumptionPatch.java`: lo que llega del frontend al **modificar**
- [x] `BeerConsumptionResponse.java`: lo que se devuelve al frontend
- [x] `BeerConsumptionService.java`: la lógica (con `@Service` y `@Transactional`)
- [x] `BeerConsumptionController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/ConsumoCerveza")`)
- [x] `BeerConsumptionControllerTest.java` en `src/test/java/com/penaelchole/backend/beerconsumption/`
- [x] Marcar la casilla de `ConsumoCerveza` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity`.

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `cantidad` | `quantity` | `int` | `quantity` | `INTEGER NOT NULL` | mayor que 0 |
| `integrante_id` | `memberId` | `String` | `member_id` | `VARCHAR(36)` | `REFERENCES member(id)`. `null` = invitados |
| `tipo` | `type` | `String` | `type` | `TEXT` | puede ser `null` (si no hay inventario) |
| `archivado` | `archived` | `boolean` | `archived` | `BOOLEAN NOT NULL DEFAULT false` | |
| `anio_archivo` | `archiveYear` | `Integer` | `archive_year` | `INTEGER` | |

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `filter` | `GET /api/entities/ConsumoCerveza?archivado=false` | calcular las cervezas de cada uno (`src/lib/cerveza.js`) |
| `bulkCreate` | `POST /api/entities/ConsumoCerveza/bulk` | guardar las cervezas pendientes |
| `update` | `PATCH /api/entities/ConsumoCerveza/{id}` | quitar una cerveza (`cantidad - 1`) y archivar el año |
| `delete` | `DELETE /api/entities/ConsumoCerveza/{id}` | quitar o limpiar cervezas |

- **Filtros:** `archivado`, `integrante_id`, `tipo`

Archivos del frontend que usan `ConsumoCerveza`: `src/pages/Cerveza.jsx`, `src/lib/cerveza.js`, `src/components/cerveza/MiCervezaPerfil.jsx`, `src/components/cargos/PanelPresidente.jsx`, `src/pages/Contabilidad.jsx`.

## Cosas a tener en cuenta

- Las cervezas de alguien son `SUM(cantidad)` de sus consumos con `archivado = false`.
- La clave foránea no tiene `ON DELETE`: no se puede borrar un integrante con consumos (409). Así no se pierde lo que debe.
- Al archivar el año no se borra nada: se hace `PATCH { archivado: true, anio_archivo }` de cada consumo.
- Cualquier usuario con sesión puede apuntar y quitar cervezas.

## Tests mínimos

- [x] Sin token → `401`.
- [x] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [x] `GET` por id → `200`; con un id que no existe → `404`.
- [x] Filtrar por `integrante_id` devuelve solo las filas que coinciden.
- [x] Filtrar por `tipo` devuelve solo las filas que coinciden.
- [x] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [x] `PATCH` sin un campo → ese campo no cambia.
- [x] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
