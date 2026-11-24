# `Votacion` → paquete `poll`

> Votación con un tema y una lista de opciones.

**Fase del ROADMAP:** Phase 8: Community & chat

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Votacion`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Votacion` |
| Endpoint | `/api/entities/Votacion` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.poll` |
| Tabla en la base de datos | `poll` |
| Migración | `src/main/resources/db/migration/V<n>__create_poll.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_poll.sql` (en `src/main/resources/db/migration/`)
- [ ] `Poll.java`: la entidad (la tabla en Java)
- [ ] `PollRepository.java`: acceso a la base de datos
- [ ] `PollRequest.java`: lo que llega del frontend al **crear**
- [ ] `PollPatch.java`: lo que llega del frontend al **modificar**
- [ ] `PollResponse.java`: lo que se devuelve al frontend
- [ ] `PollService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `PollController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Votacion")`)
- [ ] `PollControllerTest.java` en `src/test/java/com/penaelchole/backend/poll/`
- [ ] Marcar la casilla de `Votacion` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `completada` | `completed` | `boolean` | `completed` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `fecha_completada` | `completedDate` | `Instant` | `completed_date` | `TIMESTAMPTZ` | día y hora, formato `"2026-03-01T18:30:00.000Z"`. |
| `opciones` | `options` | `List<String>` | `options` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de textos, uno por opción. Ver "Listas y objetos (jsonb)" en la guía |
| `tema` | `topic` | `String` | `topic` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Votacion`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Votacion` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/Votacion?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/Votacion` | crear |
| `update` | `PATCH /api/entities/Votacion/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/Votacion/{id}` | borrar uno |
| `subscribe` | `GET /api/events` (SSE) | avisos en tiempo real |

- **Filtros:** `completada`
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `Votacion`:

- `src/Layout.jsx`
- `src/components/cargos/DashboardJunta.jsx`
- `src/components/cargos/PanelPresidente.jsx`
- `src/components/cargos/PanelSecretario.jsx`
- `src/components/comunidad/VotacionesContent.jsx`
- `src/components/inicio/WidgetsDashboard.jsx`
- `src/components/notifications/NotificationBell.jsx`
- `src/pages/Inicio.jsx`
- `src/pages/Notificaciones.jsx`
- `src/pages/Votaciones.jsx`

## Cosas a tener en cuenta

- `opciones` es una lista de textos. Los votos se guardan aparte en `VotoRespuesta`.
- Necesita **tiempo real** (ver `Tarea`).
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `completada` devuelve solo las filas que coinciden.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
