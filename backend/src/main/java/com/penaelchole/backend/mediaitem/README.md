# `MediaItem` → paquete `mediaitem`

> Foto o vídeo de la galería, dentro de una carpeta.

**Fase del ROADMAP:** Phase 7: Secretary & documents

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `MediaItem`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

> **Antes de empezar:** esta entidad apunta a `Carpeta`. Hazla(s) primero, porque la clave foránea de la migración necesita que la otra tabla exista.

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `MediaItem` |
| Endpoint | `/api/entities/MediaItem` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.mediaitem` |
| Tabla en la base de datos | `media_item` |
| Migración | `src/main/resources/db/migration/V<n>__create_media_item.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_media_item.sql` (en `src/main/resources/db/migration/`)
- [ ] `MediaItem.java`: la entidad (la tabla en Java)
- [ ] `MediaItemRepository.java`: acceso a la base de datos
- [ ] `MediaItemRequest.java`: lo que llega del frontend al **crear**
- [ ] `MediaItemPatch.java`: lo que llega del frontend al **modificar**
- [ ] `MediaItemResponse.java`: lo que se devuelve al frontend
- [ ] `MediaItemService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `MediaItemController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/MediaItem")`)
- [ ] `MediaItemControllerTest.java` en `src/test/java/com/penaelchole/backend/mediaitem/`
- [ ] Marcar la casilla de `MediaItem` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `carpeta_id` | `folderId` | `String` | `folder_id` | `VARCHAR(36)` | id de un `Carpeta` (tabla `media_folder`). Clave foránea, ver la guía |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `subido_por` | `uploadedBy` | `String` | `uploaded_by` | `TEXT` |  |
| `tipo` | `type` | `String` | `type` | `TEXT` |  |
| `url` | `url` | `String` | `url` | `TEXT` | URL (normalmente de un archivo subido) |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `MediaItem`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/MediaItem` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/MediaItem?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/MediaItem` | crear |
| `delete` | `DELETE /api/entities/MediaItem/{id}` | borrar uno |

- **Filtros:** `carpeta_id`
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `MediaItem`:

- `src/components/galeria/FolderView.jsx`
- `src/pages/Memoria.jsx`

## Cosas a tener en cuenta

- `carpeta_id` apunta a una `Carpeta` (`media_folder`). Crea la de `Carpeta` antes y añade la clave foránea.
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `carpeta_id` devuelve solo las filas que coinciden.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
