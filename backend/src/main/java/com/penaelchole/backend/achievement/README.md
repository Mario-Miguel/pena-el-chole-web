# `Logro` → paquete `achievement`

> Logro de gamificación: se consigue al llegar a un umbral (p. ej. 100 cervezas) y da puntos.

**Fase del ROADMAP:** Phase 11: The rest

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Logro`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Logro` |
| Endpoint | `/api/entities/Logro` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.achievement` |
| Tabla en la base de datos | `achievement` |
| Migración | `src/main/resources/db/migration/V<n>__create_achievement.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_achievement.sql` (en `src/main/resources/db/migration/`)
- [ ] `Achievement.java`: la entidad (la tabla en Java)
- [ ] `AchievementRepository.java`: acceso a la base de datos
- [ ] `AchievementRequest.java`: lo que llega del frontend al **crear**
- [ ] `AchievementPatch.java`: lo que llega del frontend al **modificar**
- [ ] `AchievementResponse.java`: lo que se devuelve al frontend
- [ ] `AchievementService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `AchievementController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Logro")`)
- [ ] `AchievementControllerTest.java` en `src/test/java/com/penaelchole/backend/achievement/`
- [ ] Marcar la casilla de `Logro` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `activo` | `active` | `boolean` | `active` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `categoria` | `category` | `String` | `category` | `TEXT` |  |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `icono` | `icon` | `String` | `icon` | `TEXT` |  |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `puntos` | `points` | `Integer` | `points` | `INTEGER` |  |
| `umbral` | `threshold` | `Integer` | `threshold` | `INTEGER` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Logro`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Logro` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/Logro` | crear |
| `bulkCreate` | `POST /api/entities/Logro/bulk` | crear varios a la vez |
| `update` | `PATCH /api/entities/Logro/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/Logro/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** —

Archivos del frontend que usan `Logro`:

- `src/components/admin/GamificacionesPanel.jsx`
- `src/pages/Logros.jsx`

## Cosas a tener en cuenta

- El frontend usa `bulkCreate` para crear los logros por defecto desde `GamificacionesPanel.jsx` (panel de admin).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
