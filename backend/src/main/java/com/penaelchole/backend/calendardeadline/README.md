# `PlazoCalendario` → paquete `calendardeadline`

> Plazo en el calendario: un periodo con fecha de inicio y de fin (p. ej. "inscripciones").

**Fase del ROADMAP:** Phase 6: Organization & calendar

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `PlazoCalendario`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `PlazoCalendario` |
| Endpoint | `/api/entities/PlazoCalendario` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.calendardeadline` |
| Tabla en la base de datos | `calendar_deadline` |
| Migración | `src/main/resources/db/migration/V<n>__create_calendar_deadline.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_calendar_deadline.sql` (en `src/main/resources/db/migration/`)
- [ ] `CalendarDeadline.java`: la entidad (la tabla en Java)
- [ ] `CalendarDeadlineRepository.java`: acceso a la base de datos
- [ ] `CalendarDeadlineRequest.java`: lo que llega del frontend al **crear**
- [ ] `CalendarDeadlinePatch.java`: lo que llega del frontend al **modificar**
- [ ] `CalendarDeadlineResponse.java`: lo que se devuelve al frontend
- [ ] `CalendarDeadlineService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `CalendarDeadlineController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/PlazoCalendario")`)
- [ ] `CalendarDeadlineControllerTest.java` en `src/test/java/com/penaelchole/backend/calendardeadline/`
- [ ] Marcar la casilla de `PlazoCalendario` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `categoria` | `category` | `String` | `category` | `TEXT` |  |
| `fecha_fin` | `endDate` | `LocalDate` | `end_date` | `DATE` | solo el día, formato `"2026-03-01"`. |
| `fecha_inicio` | `startDate` | `LocalDate` | `start_date` | `DATE` | solo el día, formato `"2026-03-01"`. |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `PlazoCalendario`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/PlazoCalendario` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/PlazoCalendario` | crear |
| `delete` | `DELETE /api/entities/PlazoCalendario/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `fecha_inicio`, `-created_date`

Archivos del frontend que usan `PlazoCalendario`:

- `src/components/calendario/CalendarioInicio.jsx`
- `src/components/organizacion/PlazosContent.jsx`
- `src/pages/Calendario.jsx`

## Cosas a tener en cuenta

- Las fechas se envían con `format(fecha, "yyyy-MM-dd")`, son `LocalDate`.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=fecha_inicio` devuelve el orden correcto.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
