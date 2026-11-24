# `AdminLog` → paquete `adminlog`

> Registro de auditoría: quién hizo qué cambio en la app (crear, editar, borrar…). Se escribe desde `registrarLog()` en `src/lib/registrarLog.js` y se consulta en el panel de Admin.

**Fase del ROADMAP:** Phase 2: Login & configuration

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `AdminLog`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `AdminLog` |
| Endpoint | `/api/entities/AdminLog` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.adminlog` |
| Tabla en la base de datos | `admin_log` |
| Migración | `src/main/resources/db/migration/V<n>__create_admin_log.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_admin_log.sql` (en `src/main/resources/db/migration/`)
- [ ] `AdminLog.java`: la entidad (la tabla en Java)
- [ ] `AdminLogRepository.java`: acceso a la base de datos
- [ ] `AdminLogRequest.java`: lo que llega del frontend al **crear**
- [ ] `AdminLogPatch.java`: lo que llega del frontend al **modificar**
- [ ] `AdminLogResponse.java`: lo que se devuelve al frontend
- [ ] `AdminLogService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `AdminLogController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/AdminLog")`)
- [ ] `AdminLogControllerTest.java` en `src/test/java/com/penaelchole/backend/adminlog/`
- [ ] Marcar la casilla de `AdminLog` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `accion` | `action` | `String` | `action` | `TEXT` |  |
| `autor_nombre` | `authorName` | `String` | `author_name` | `TEXT` |  |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `entidad` | `entity` | `String` | `entity` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `AdminLog`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/AdminLog` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/AdminLog` | crear |
| `delete` | `DELETE /api/entities/AdminLog/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `AdminLog`:

- `src/components/admin/AuditoriaPanel.jsx`
- `src/components/admin/HistorialAuditoria.jsx`
- `src/components/comunidad/SugerenciasContent.jsx`
- `src/lib/registrarLog.js`
- `src/pages/Admin.jsx`
- `src/pages/Sugerencias.jsx`

## Cosas a tener en cuenta

- Es solo de lectura y escritura de registros: el frontend nunca hace `update`. Puedes no implementar el PATCH lógico (lanza un error 400) o dejarlo vacío.
- Cualquier usuario genera registros al hacer cosas en la app, así que `create` debe estar abierto a todos. `delete` (limpiar el historial) debería ser solo para admins.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
