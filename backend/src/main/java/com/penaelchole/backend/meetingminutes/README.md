# `ActaReunion` → paquete `meetingminutes`

> Acta de una reunión: fecha, asistentes, puntos tratados, acuerdos y si está firmada.

**Fase del ROADMAP:** Phase 7: Secretary & documents

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `ActaReunion`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `ActaReunion` |
| Endpoint | `/api/entities/ActaReunion` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.meetingminutes` |
| Tabla en la base de datos | `meeting_minutes` |
| Migración | `src/main/resources/db/migration/V<n>__create_meeting_minutes.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_meeting_minutes.sql` (en `src/main/resources/db/migration/`)
- [ ] `MeetingMinutes.java`: la entidad (la tabla en Java)
- [ ] `MeetingMinutesRepository.java`: acceso a la base de datos
- [ ] `MeetingMinutesRequest.java`: lo que llega del frontend al **crear**
- [ ] `MeetingMinutesPatch.java`: lo que llega del frontend al **modificar**
- [ ] `MeetingMinutesResponse.java`: lo que se devuelve al frontend
- [ ] `MeetingMinutesService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `MeetingMinutesController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/ActaReunion")`)
- [ ] `MeetingMinutesControllerTest.java` en `src/test/java/com/penaelchole/backend/meetingminutes/`
- [ ] Marcar la casilla de `ActaReunion` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `acuerdos` | `agreements` | `String` | `agreements` | `TEXT` |  |
| `asistentes` | `attendees` | `String` | `attendees` | `TEXT` | texto con los nombres separados por ", " (no es un array) |
| `carpeta` | `folder` | `String` | `folder` | `TEXT` |  |
| `fecha` | `date` | `LocalDate` | `date` | `DATE` | solo el día, formato `"2026-03-01"`. Puede llegar como `""` (texto vacío): trátalo como `null`. |
| `firmada` | `signed` | `boolean` | `signed` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `puntos` | `agenda` | `String` | `agenda` | `TEXT` | texto con el orden del día (no es un número) |
| `tareas_derivadas` | `followUpTasks` | `String` | `follow_up_tasks` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `ActaReunion`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/ActaReunion` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/ActaReunion` | crear |
| `update` | `PATCH /api/entities/ActaReunion/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/ActaReunion/{id}` | borrar uno |
| `subscribe` | `GET /api/events` (SSE) | avisos en tiempo real |

- **Filtros:** —
- **Orden (`sort`):** `-fecha`

Archivos del frontend que usan `ActaReunion`:

- `src/Layout.jsx`
- `src/components/secretaria/ActasReunionContent.jsx`
- `src/pages/ActasReunion.jsx`

## Cosas a tener en cuenta

- Aunque el roadmap diga otra cosa: `asistentes` es **un texto** con nombres separados por coma, y `puntos` es **un texto** (el orden del día), no un número.
- Necesita **tiempo real** (ver `Tarea`).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-fecha` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
