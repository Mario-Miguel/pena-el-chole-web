# `ObraDocumento` → paquete `paradedocument`

> Archivo (foto, PDF…) asociado a la obra de un año, ordenado por secciones.

**Fase del ROADMAP:** Phase 9: Parade

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `ObraDocumento`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

> **Antes de empezar:** esta entidad apunta a `ObraAnio`. Hazla(s) primero, porque la clave foránea de la migración necesita que la otra tabla exista.

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `ObraDocumento` |
| Endpoint | `/api/entities/ObraDocumento` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.paradedocument` |
| Tabla en la base de datos | `parade_document` |
| Migración | `src/main/resources/db/migration/V<n>__create_parade_document.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_parade_document.sql` (en `src/main/resources/db/migration/`)
- [ ] `ParadeDocument.java`: la entidad (la tabla en Java)
- [ ] `ParadeDocumentRepository.java`: acceso a la base de datos
- [ ] `ParadeDocumentRequest.java`: lo que llega del frontend al **crear**
- [ ] `ParadeDocumentPatch.java`: lo que llega del frontend al **modificar**
- [ ] `ParadeDocumentResponse.java`: lo que se devuelve al frontend
- [ ] `ParadeDocumentService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `ParadeDocumentController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/ObraDocumento")`)
- [ ] `ParadeDocumentControllerTest.java` en `src/test/java/com/penaelchole/backend/paradedocument/`
- [ ] Marcar la casilla de `ObraDocumento` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `obra_anio_id` | `paradeYearId` | `String` | `parade_year_id` | `VARCHAR(36)` | id de un `ObraAnio` (tabla `parade_year`). Clave foránea, ver la guía |
| `seccion` | `section` | `String` | `section` | `TEXT` |  |
| `tipo` | `type` | `String` | `type` | `TEXT` |  |
| `url` | `url` | `String` | `url` | `TEXT` | URL (normalmente de un archivo subido) |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `ObraDocumento`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `filter` | `GET /api/entities/ObraDocumento?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/ObraDocumento` | crear |
| `delete` | `DELETE /api/entities/ObraDocumento/{id}` | borrar uno |

- **Filtros:** `obra_anio_id`, `seccion`
- **Orden (`sort`):** —

Archivos del frontend que usan `ObraDocumento`:

- `src/components/shared/MediaGaleria.jsx`

## Cosas a tener en cuenta

- El frontend nunca llama a `list` sin filtros: siempre filtra por `obra_anio_id` y `seccion`.
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `obra_anio_id` devuelve solo las filas que coinciden.
- [ ] Filtrar por `seccion` devuelve solo las filas que coinciden.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
