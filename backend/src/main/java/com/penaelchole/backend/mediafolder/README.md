# `Carpeta` → paquete `mediafolder`

> Carpeta de la galería de fotos/vídeos (página Memoria).

**Fase del ROADMAP:** Phase 7: Secretary & documents

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Carpeta`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Carpeta` |
| Endpoint | `/api/entities/Carpeta` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.mediafolder` |
| Tabla en la base de datos | `media_folder` |
| Migración | `src/main/resources/db/migration/V<n>__create_media_folder.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_media_folder.sql` (en `src/main/resources/db/migration/`)
- [ ] `MediaFolder.java`: la entidad (la tabla en Java)
- [ ] `MediaFolderRepository.java`: acceso a la base de datos
- [ ] `MediaFolderRequest.java`: lo que llega del frontend al **crear**
- [ ] `MediaFolderPatch.java`: lo que llega del frontend al **modificar**
- [ ] `MediaFolderResponse.java`: lo que se devuelve al frontend
- [ ] `MediaFolderService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `MediaFolderController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Carpeta")`)
- [ ] `MediaFolderControllerTest.java` en `src/test/java/com/penaelchole/backend/mediafolder/`
- [ ] Marcar la casilla de `Carpeta` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `anio` | `year` | `Integer` | `year` | `INTEGER` |  |
| `miniatura_url` | `thumbnailUrl` | `String` | `thumbnail_url` | `TEXT` | URL (normalmente de un archivo subido) |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Carpeta`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Carpeta` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/Carpeta` | crear |
| `update` | `PATCH /api/entities/Carpeta/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/Carpeta/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `Carpeta`:

- `src/components/galeria/FolderView.jsx`
- `src/pages/Memoria.jsx`

## Cosas a tener en cuenta

- Nada especial: es una entidad sencilla. Buena para empezar.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
