# `SugerenciaActividad` → paquete `activitysuggestion`

> Propuesta de actividad que hace un integrante y que los demás pueden votar.

**Fase del ROADMAP:** Phase 6: Organization & calendar

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `SugerenciaActividad`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `SugerenciaActividad` |
| Endpoint | `/api/entities/SugerenciaActividad` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.activitysuggestion` |
| Tabla en la base de datos | `activity_suggestion` |
| Migración | `src/main/resources/db/migration/V<n>__create_activity_suggestion.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_activity_suggestion.sql` (en `src/main/resources/db/migration/`)
- [ ] `ActivitySuggestion.java`: la entidad (la tabla en Java)
- [ ] `ActivitySuggestionRepository.java`: acceso a la base de datos
- [ ] `ActivitySuggestionRequest.java`: lo que llega del frontend al **crear**
- [ ] `ActivitySuggestionPatch.java`: lo que llega del frontend al **modificar**
- [ ] `ActivitySuggestionResponse.java`: lo que se devuelve al frontend
- [ ] `ActivitySuggestionService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `ActivitySuggestionController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/SugerenciaActividad")`)
- [ ] `ActivitySuggestionControllerTest.java` en `src/test/java/com/penaelchole/backend/activitysuggestion/`
- [ ] Marcar la casilla de `SugerenciaActividad` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `autor_id` | `authorId` | `String` | `author_id` | `VARCHAR(36)` | id de un `Integrante` (tabla `member`). Clave foránea, ver la guía |
| `autor_nombre` | `authorName` | `String` | `author_name` | `TEXT` |  |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `estado` | `status` | `String` | `status` | `TEXT` |  |
| `titulo` | `title` | `String` | `title` | `TEXT` |  |
| `votos_ids` | `voterIds` | `List<String>` | `voter_ids` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de ids de quienes han votado. Ver "Listas y objetos (jsonb)" en la guía |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `SugerenciaActividad`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/SugerenciaActividad` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/SugerenciaActividad` | crear |
| `update` | `PATCH /api/entities/SugerenciaActividad/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/SugerenciaActividad/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `SugerenciaActividad`:

- `src/components/actividades/SugerenciasActividades.jsx`

## Cosas a tener en cuenta

- `votos_ids` es la lista de quienes han votado; el frontend manda la lista completa en cada voto.
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
