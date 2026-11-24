# `VotoRespuesta` → paquete `pollvote`

> Voto de un integrante en una votación (qué opción eligió).

**Fase del ROADMAP:** Phase 8: Community & chat

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `VotoRespuesta`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

> **Antes de empezar:** esta entidad apunta a `Votacion`. Hazla(s) primero, porque la clave foránea de la migración necesita que la otra tabla exista.

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `VotoRespuesta` |
| Endpoint | `/api/entities/VotoRespuesta` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.pollvote` |
| Tabla en la base de datos | `poll_vote` |
| Migración | `src/main/resources/db/migration/V<n>__create_poll_vote.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_poll_vote.sql` (en `src/main/resources/db/migration/`)
- [ ] `PollVote.java`: la entidad (la tabla en Java)
- [ ] `PollVoteRepository.java`: acceso a la base de datos
- [ ] `PollVoteRequest.java`: lo que llega del frontend al **crear**
- [ ] `PollVotePatch.java`: lo que llega del frontend al **modificar**
- [ ] `PollVoteResponse.java`: lo que se devuelve al frontend
- [ ] `PollVoteService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `PollVoteController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/VotoRespuesta")`)
- [ ] `PollVoteControllerTest.java` en `src/test/java/com/penaelchole/backend/pollvote/`
- [ ] Marcar la casilla de `VotoRespuesta` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `integrante_id` | `memberId` | `String` | `member_id` | `VARCHAR(36)` | id de un `Integrante` (tabla `member`). Clave foránea, ver la guía |
| `opcion` | `option` | `String` | `option` | `TEXT` |  |
| `votacion_id` | `pollId` | `String` | `poll_id` | `VARCHAR(36)` | id de un `Votacion` (tabla `poll`). Clave foránea, ver la guía |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `VotoRespuesta`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/VotoRespuesta` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/VotoRespuesta?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/VotoRespuesta` | crear |
| `delete` | `DELETE /api/entities/VotoRespuesta/{id}` | borrar uno |

- **Filtros:** `votacion_id`
- **Orden (`sort`):** —

Archivos del frontend que usan `VotoRespuesta`:

- `src/components/cargos/DashboardJunta.jsx`
- `src/components/comunidad/VotacionesContent.jsx`
- `src/components/votaciones/VotacionCard.jsx`
- `src/pages/Votaciones.jsx`

## Cosas a tener en cuenta

- Un integrante solo debería votar una vez por votación: añade `UNIQUE (poll_id, member_id)` en la migración.
- Haz `Votacion` antes, porque `votacion_id` apunta a ella.
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `votacion_id` devuelve solo las filas que coinciden.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
