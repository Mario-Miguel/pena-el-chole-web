# `Actividad` → paquete `activity`

> Actividad o evento de la peña: fecha, lugar, precio, aforo e inscritos.

**Fase del ROADMAP:** Phase 6: Organization & calendar

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Actividad`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Actividad` |
| Endpoint | `/api/entities/Actividad` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.activity` |
| Tabla en la base de datos | `activity` |
| Migración | `src/main/resources/db/migration/V<n>__create_activity.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_activity.sql` (en `src/main/resources/db/migration/`)
- [ ] `Activity.java`: la entidad (la tabla en Java)
- [ ] `ActivityRepository.java`: acceso a la base de datos
- [ ] `ActivityRequest.java`: lo que llega del frontend al **crear**
- [ ] `ActivityPatch.java`: lo que llega del frontend al **modificar**
- [ ] `ActivityResponse.java`: lo que se devuelve al frontend
- [ ] `ActivityService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `ActivityController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Actividad")`)
- [ ] `ActivityControllerTest.java` en `src/test/java/com/penaelchole/backend/activity/`
- [ ] Marcar la casilla de `Actividad` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `aforo_maximo` | `maxCapacity` | `Integer` | `max_capacity` | `INTEGER` |  |
| `categoria` | `category` | `String` | `category` | `TEXT` |  |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `estado` | `status` | `String` | `status` | `TEXT` |  |
| `fecha` | `date` | `Instant` | `date` | `TIMESTAMPTZ` | día y hora, formato `"2026-03-01T18:30:00.000Z"`. Puede llegar como `""` (texto vacío): trátalo como `null`. |
| `imagen_url` | `imageUrl` | `String` | `image_url` | `TEXT` | URL (normalmente de un archivo subido) |
| `inscritos_ids` | `attendeeIds` | `List<String>` | `attendee_ids` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de ids de integrantes inscritos. Ver "Listas y objetos (jsonb)" en la guía |
| `lugar` | `place` | `String` | `place` | `TEXT` |  |
| `notificacion_enviada` | `notificationSent` | `boolean` | `notification_sent` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `precio` | `price` | `BigDecimal` | `price` | `NUMERIC(10, 2)` | dinero: usa `BigDecimal`, nunca `double` |
| `titulo` | `title` | `String` | `title` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Actividad`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Actividad` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/Actividad?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/Actividad` | crear |
| `update` | `PATCH /api/entities/Actividad/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/Actividad/{id}` | borrar uno |
| `subscribe` | `GET /api/events` (SSE) | avisos en tiempo real |

- **Filtros:** `estado`
- **Orden (`sort`):** `-fecha`

Archivos del frontend que usan `Actividad`:

- `src/Layout.jsx`
- `src/components/actividades/ActividadDialog.jsx`
- `src/components/inicio/WidgetsDashboard.jsx`
- `src/pages/Actividades.jsx`
- `src/pages/Calendario.jsx`

## Cosas a tener en cuenta

- `fecha` es fecha **y hora** (el formulario usa `localToISO`), así que es un `Instant`.
- `inscritos_ids` es la lista de integrantes apuntados. El frontend manda la lista completa cada vez (igual que `leida_por` en `Notificacion`).
- Necesita **tiempo real** (ver `Tarea`).
- Tiene importes de dinero: usa `BigDecimal` en Java y `NUMERIC(10, 2)` en SQL. Con `double` las cuentas acaban con decimales raros (0.1 + 0.2 = 0.30000000000000004).
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `estado` devuelve solo las filas que coinciden.
- [ ] Ordenar con `sort=-fecha` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
