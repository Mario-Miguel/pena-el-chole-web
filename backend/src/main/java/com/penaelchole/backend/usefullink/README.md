# `EnlaceUtil` → paquete `usefullink`

> Enlace útil (web, documento) guardado en la página Enlaces.

**Fase del ROADMAP:** Phase 11: The rest

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `EnlaceUtil`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `EnlaceUtil` |
| Endpoint | `/api/entities/EnlaceUtil` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.usefullink` |
| Tabla en la base de datos | `useful_link` |
| Migración | `src/main/resources/db/migration/V<n>__create_useful_link.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_useful_link.sql` (en `src/main/resources/db/migration/`)
- [ ] `UsefulLink.java`: la entidad (la tabla en Java)
- [ ] `UsefulLinkRepository.java`: acceso a la base de datos
- [ ] `UsefulLinkRequest.java`: lo que llega del frontend al **crear**
- [ ] `UsefulLinkPatch.java`: lo que llega del frontend al **modificar**
- [ ] `UsefulLinkResponse.java`: lo que se devuelve al frontend
- [ ] `UsefulLinkService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `UsefulLinkController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/EnlaceUtil")`)
- [ ] `UsefulLinkControllerTest.java` en `src/test/java/com/penaelchole/backend/usefullink/`
- [ ] Marcar la casilla de `EnlaceUtil` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `carpeta` | `folder` | `String` | `folder` | `TEXT` |  |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `icono` | `icon` | `String` | `icon` | `TEXT` |  |
| `titulo` | `title` | `String` | `title` | `TEXT` |  |
| `url` | `url` | `String` | `url` | `TEXT` | URL (normalmente de un archivo subido) |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `EnlaceUtil`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/EnlaceUtil` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/EnlaceUtil` | crear |
| `update` | `PATCH /api/entities/EnlaceUtil/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/EnlaceUtil/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `EnlaceUtil`:

- `src/pages/Enlaces.jsx`

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
