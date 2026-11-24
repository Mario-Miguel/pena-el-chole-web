# `PermisoSeccion` → paquete `sectionpermission`

> Permisos por sección de la app: permite o deniega a un integrante (o a un cargo) el acceso a una sección.

**Fase del ROADMAP:** Phase 2: Login & configuration

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `PermisoSeccion`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `PermisoSeccion` |
| Endpoint | `/api/entities/PermisoSeccion` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.sectionpermission` |
| Tabla en la base de datos | `section_permission` |
| Migración | `src/main/resources/db/migration/V<n>__create_section_permission.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_section_permission.sql` (en `src/main/resources/db/migration/`)
- [ ] `SectionPermission.java`: la entidad (la tabla en Java)
- [ ] `SectionPermissionRepository.java`: acceso a la base de datos
- [ ] `SectionPermissionRequest.java`: lo que llega del frontend al **crear**
- [ ] `SectionPermissionPatch.java`: lo que llega del frontend al **modificar**
- [ ] `SectionPermissionResponse.java`: lo que se devuelve al frontend
- [ ] `SectionPermissionService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `SectionPermissionController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/PermisoSeccion")`)
- [ ] `SectionPermissionControllerTest.java` en `src/test/java/com/penaelchole/backend/sectionpermission/`
- [ ] Marcar la casilla de `PermisoSeccion` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `integrante_id` | `memberId` | `String` | `member_id` | `VARCHAR(36)` | id de un `Integrante` (tabla `member`). Clave foránea, ver la guía |
| `integrante_nombre` | `memberName` | `String` | `member_name` | `TEXT` |  |
| `permitido` | `allowed` | `boolean` | `allowed` | `BOOLEAN NOT NULL DEFAULT false` | es un sí/no aunque el roadmap diga String |
| `rol` | `role` | `String` | `role` | `TEXT` |  |
| `seccion` | `section` | `String` | `section` | `TEXT` |  |
| `tipo` | `type` | `String` | `type` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `PermisoSeccion`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/PermisoSeccion` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/PermisoSeccion` | crear |
| `delete` | `DELETE /api/entities/PermisoSeccion/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** —

Archivos del frontend que usan `PermisoSeccion`:

- `src/components/admin/PermisosPanel.jsx`

## Cosas a tener en cuenta

- Solo lo gestiona un admin desde `PermisosPanel.jsx`. Protege `create` y `delete` con `@PreAuthorize("hasRole('ADMIN')")`.
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
