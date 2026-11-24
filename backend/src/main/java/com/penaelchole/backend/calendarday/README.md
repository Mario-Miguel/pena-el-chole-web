# `DiaCalendario` → paquete `calendarday`

> Notas y fotos asociadas a un día concreto del calendario.

**Fase del ROADMAP:** Phase 6: Organization & calendar

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `DiaCalendario`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `DiaCalendario` |
| Endpoint | `/api/entities/DiaCalendario` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.calendarday` |
| Tabla en la base de datos | `calendar_day` |
| Migración | `src/main/resources/db/migration/V<n>__create_calendar_day.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_calendar_day.sql` (en `src/main/resources/db/migration/`)
- [ ] `CalendarDay.java`: la entidad (la tabla en Java)
- [ ] `CalendarDayRepository.java`: acceso a la base de datos
- [ ] `CalendarDayRequest.java`: lo que llega del frontend al **crear**
- [ ] `CalendarDayPatch.java`: lo que llega del frontend al **modificar**
- [ ] `CalendarDayResponse.java`: lo que se devuelve al frontend
- [ ] `CalendarDayService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `CalendarDayController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/DiaCalendario")`)
- [ ] `CalendarDayControllerTest.java` en `src/test/java/com/penaelchole/backend/calendarday/`
- [ ] Marcar la casilla de `DiaCalendario` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `fecha` | `date` | `LocalDate` | `date` | `DATE` | solo el día, formato `"2026-03-01"`. |
| `fotos` | `photos` | `List<String>` | `photos` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de URLs de fotos. Ver "Listas y objetos (jsonb)" en la guía |
| `notas` | `notes` | `String` | `notes` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `DiaCalendario`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/DiaCalendario` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/DiaCalendario?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/DiaCalendario` | crear |
| `update` | `PATCH /api/entities/DiaCalendario/{id}` | modificar algunos campos |

- **Filtros:** `fecha`
- **Orden (`sort`):** —

Archivos del frontend que usan `DiaCalendario`:

- `src/components/calendario/CalendarioInicio.jsx`
- `src/components/calendario/DiaDrawer.jsx`
- `src/pages/Calendario.jsx`

## Cosas a tener en cuenta

- Solo debería haber una fila por día: añade un `UNIQUE` sobre `fecha` en la migración. El frontend busca el día con `filter({ fecha })`.
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).
- El frontend no borra nunca esta entidad. Aun así, `delete` y `delete-many` tienen que existir (los usa la copia de seguridad); protégelos para que solo los use un admin.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `fecha` devuelve solo las filas que coinciden.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
