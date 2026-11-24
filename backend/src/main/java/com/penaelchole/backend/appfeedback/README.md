# `FeedbackApp` → paquete `appfeedback`

> Comentarios y fallos de la app que envían los usuarios desde Ajustes.

**Fase del ROADMAP:** Phase 8: Community & chat

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `FeedbackApp`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `FeedbackApp` |
| Endpoint | `/api/entities/FeedbackApp` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.appfeedback` |
| Tabla en la base de datos | `app_feedback` |
| Migración | `src/main/resources/db/migration/V<n>__create_app_feedback.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_app_feedback.sql` (en `src/main/resources/db/migration/`)
- [ ] `AppFeedback.java`: la entidad (la tabla en Java)
- [ ] `AppFeedbackRepository.java`: acceso a la base de datos
- [ ] `AppFeedbackRequest.java`: lo que llega del frontend al **crear**
- [ ] `AppFeedbackPatch.java`: lo que llega del frontend al **modificar**
- [ ] `AppFeedbackResponse.java`: lo que se devuelve al frontend
- [ ] `AppFeedbackService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `AppFeedbackController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/FeedbackApp")`)
- [ ] `AppFeedbackControllerTest.java` en `src/test/java/com/penaelchole/backend/appfeedback/`
- [ ] Marcar la casilla de `FeedbackApp` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `autor_nombre` | `authorName` | `String` | `author_name` | `TEXT` |  |
| `leido` | `read` | `boolean` | `read` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `mensaje` | `message` | `String` | `message` | `TEXT` |  |
| `tipo` | `type` | `String` | `type` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `FeedbackApp`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/FeedbackApp` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/FeedbackApp` | crear |
| `update` | `PATCH /api/entities/FeedbackApp/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/FeedbackApp/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `FeedbackApp`:

- `src/pages/Admin.jsx`
- `src/pages/Ajustes.jsx`

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
