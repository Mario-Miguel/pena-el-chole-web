# `GrupoTrabajo` → paquete `workgroup`

> Grupo de trabajo (comisión) con su nombre, color, emoji y la lista de miembros.

**Fase del ROADMAP:** Phase 6: Organization & calendar

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `GrupoTrabajo`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `GrupoTrabajo` |
| Endpoint | `/api/entities/GrupoTrabajo` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.workgroup` |
| Tabla en la base de datos | `work_group` |
| Migración | `src/main/resources/db/migration/V<n>__create_work_group.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_work_group.sql` (en `src/main/resources/db/migration/`)
- [ ] `WorkGroup.java`: la entidad (la tabla en Java)
- [ ] `WorkGroupRepository.java`: acceso a la base de datos
- [ ] `WorkGroupRequest.java`: lo que llega del frontend al **crear**
- [ ] `WorkGroupPatch.java`: lo que llega del frontend al **modificar**
- [ ] `WorkGroupResponse.java`: lo que se devuelve al frontend
- [ ] `WorkGroupService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `WorkGroupController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/GrupoTrabajo")`)
- [ ] `WorkGroupControllerTest.java` en `src/test/java/com/penaelchole/backend/workgroup/`
- [ ] Marcar la casilla de `GrupoTrabajo` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `color` | `color` | `String` | `color` | `TEXT` |  |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `emoji` | `emoji` | `String` | `emoji` | `TEXT` |  |
| `miembros` | `members` | `List<Map<String, Object>>` | `members` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de objetos `{ id, nombre }`. Ver "Listas y objetos (jsonb)" en la guía |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `GrupoTrabajo`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/GrupoTrabajo` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/GrupoTrabajo` | crear |
| `update` | `PATCH /api/entities/GrupoTrabajo/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/GrupoTrabajo/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** —

Archivos del frontend que usan `GrupoTrabajo`:

- `src/components/organizacion/GruposContent.jsx`
- `src/pages/GruposTrabajo.jsx`

## Cosas a tener en cuenta

- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
