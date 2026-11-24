# `Sugerencia` → paquete `suggestion`

> Buzón de sugerencias: texto de un integrante que los demás pueden votar.

**Fase del ROADMAP:** Phase 8: Community & chat

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Sugerencia`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Sugerencia` |
| Endpoint | `/api/entities/Sugerencia` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.suggestion` |
| Tabla en la base de datos | `suggestion` |
| Migración | `src/main/resources/db/migration/V<n>__create_suggestion.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_suggestion.sql` (en `src/main/resources/db/migration/`)
- [ ] `Suggestion.java`: la entidad (la tabla en Java)
- [ ] `SuggestionRepository.java`: acceso a la base de datos
- [ ] `SuggestionRequest.java`: lo que llega del frontend al **crear**
- [ ] `SuggestionPatch.java`: lo que llega del frontend al **modificar**
- [ ] `SuggestionResponse.java`: lo que se devuelve al frontend
- [ ] `SuggestionService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `SuggestionController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Sugerencia")`)
- [ ] `SuggestionControllerTest.java` en `src/test/java/com/penaelchole/backend/suggestion/`
- [ ] Marcar la casilla de `Sugerencia` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `archivada` | `archived` | `boolean` | `archived` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `autor_nombre` | `authorName` | `String` | `author_name` | `TEXT` |  |
| `texto` | `text` | `String` | `text` | `TEXT` |  |
| `titulo` | `title` | `String` | `title` | `TEXT` |  |
| `votos` | `votes` | `Integer` | `votes` | `INTEGER` |  |
| `votos_ids` | `voterIds` | `List<String>` | `voter_ids` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de ids de quienes han votado. Ver "Listas y objetos (jsonb)" en la guía |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Sugerencia`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Sugerencia` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/Sugerencia?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/Sugerencia` | crear |
| `update` | `PATCH /api/entities/Sugerencia/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/Sugerencia/{id}` | borrar uno |

- **Filtros:** `archivada`
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `Sugerencia`:

- `src/components/cargos/PanelVocal.jsx`
- `src/components/comunidad/SugerenciasContent.jsx`
- `src/components/inicio/WidgetsDashboard.jsx`
- `src/pages/Sugerencias.jsx`

## Cosas a tener en cuenta

- `votos` es el número de votos y `votos_ids` quién ha votado. El frontend mantiene los dos a la vez.
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `archivada` devuelve solo las filas que coinciden.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
