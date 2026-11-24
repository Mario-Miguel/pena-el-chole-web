# `CuentaAtras` → paquete `countdown`

> Cuenta atrás hasta un evento que se muestra en la página de Inicio.

**Fase del ROADMAP:** Phase 6: Organization & calendar

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `CuentaAtras`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `CuentaAtras` |
| Endpoint | `/api/entities/CuentaAtras` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.countdown` |
| Tabla en la base de datos | `countdown` |
| Migración | `src/main/resources/db/migration/V<n>__create_countdown.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_countdown.sql` (en `src/main/resources/db/migration/`)
- [ ] `Countdown.java`: la entidad (la tabla en Java)
- [ ] `CountdownRepository.java`: acceso a la base de datos
- [ ] `CountdownRequest.java`: lo que llega del frontend al **crear**
- [ ] `CountdownPatch.java`: lo que llega del frontend al **modificar**
- [ ] `CountdownResponse.java`: lo que se devuelve al frontend
- [ ] `CountdownService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `CountdownController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/CuentaAtras")`)
- [ ] `CountdownControllerTest.java` en `src/test/java/com/penaelchole/backend/countdown/`
- [ ] Marcar la casilla de `CuentaAtras` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `fecha_objetivo` | `targetDate` | `Instant` | `target_date` | `TIMESTAMPTZ` | día y hora, formato `"2026-03-01T18:30:00.000Z"`. |
| `nombre_evento` | `eventName` | `String` | `event_name` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `CuentaAtras`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/CuentaAtras` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/CuentaAtras` | crear |
| `update` | `PATCH /api/entities/CuentaAtras/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/CuentaAtras/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `CuentaAtras`:

- `src/components/countdown/MultipleCuentasAtras.jsx`
- `src/pages/Inicio.jsx`

## Cosas a tener en cuenta

- `fecha_objetivo` es un instante con hora (`toISOString()`), así que `Instant`.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
