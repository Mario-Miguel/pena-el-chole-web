# `Tarea` → paquete `task`

> Tarea pendiente de la lista de "To Do" de la peña.

**Fase del ROADMAP:** Phase 6: Organization & calendar

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Tarea`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Tarea` |
| Endpoint | `/api/entities/Tarea` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.task` |
| Tabla en la base de datos | `task` |
| Migración | `src/main/resources/db/migration/V<n>__create_task.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_task.sql` (en `src/main/resources/db/migration/`)
- [ ] `Task.java`: la entidad (la tabla en Java)
- [ ] `TaskRepository.java`: acceso a la base de datos
- [ ] `TaskRequest.java`: lo que llega del frontend al **crear**
- [ ] `TaskPatch.java`: lo que llega del frontend al **modificar**
- [ ] `TaskResponse.java`: lo que se devuelve al frontend
- [ ] `TaskService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `TaskController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Tarea")`)
- [ ] `TaskControllerTest.java` en `src/test/java/com/penaelchole/backend/task/`
- [ ] Marcar la casilla de `Tarea` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `categoria` | `category` | `String` | `category` | `TEXT` |  |
| `completada` | `completed` | `boolean` | `completed` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `fecha_completada` | `completedDate` | `Instant` | `completed_date` | `TIMESTAMPTZ` | día y hora, formato `"2026-03-01T18:30:00.000Z"`. |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Tarea`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Tarea` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/Tarea?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/Tarea` | crear |
| `update` | `PATCH /api/entities/Tarea/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/Tarea/{id}` | borrar uno |
| `subscribe` | `GET /api/events` (SSE) | avisos en tiempo real |

- **Filtros:** `completada`
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `Tarea`:

- `src/Layout.jsx`
- `src/components/cargos/DashboardJunta.jsx`
- `src/components/cargos/PanelPresidente.jsx`
- `src/components/cargos/PanelSecretario.jsx`
- `src/components/cargos/PanelVocal.jsx`
- `src/components/inicio/WidgetsDashboard.jsx`
- `src/components/organizacion/TareasContent.jsx`
- `src/pages/ToDo.jsx`

## Cosas a tener en cuenta

- Necesita **tiempo real**: cuando alguien crea o completa una tarea, a los demás les aparece sin recargar. Haz primero el CRUD normal y deja el tiempo real para cuando exista `/api/events` (ver "Cross-cutting features" en el ROADMAP).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `completada` devuelve solo las filas que coinciden.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
