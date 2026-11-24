# `VehiculoTarea` → paquete `vehicletask`

> Tarea pendiente de un vehículo (reparación, limpieza…).

**Fase del ROADMAP:** Phase 10: Vehicles & lottery

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `VehiculoTarea`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

> **Antes de empezar:** esta entidad apunta a `Vehiculo`. Hazla(s) primero, porque la clave foránea de la migración necesita que la otra tabla exista.

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `VehiculoTarea` |
| Endpoint | `/api/entities/VehiculoTarea` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.vehicletask` |
| Tabla en la base de datos | `vehicle_task` |
| Migración | `src/main/resources/db/migration/V<n>__create_vehicle_task.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_vehicle_task.sql` (en `src/main/resources/db/migration/`)
- [ ] `VehicleTask.java`: la entidad (la tabla en Java)
- [ ] `VehicleTaskRepository.java`: acceso a la base de datos
- [ ] `VehicleTaskRequest.java`: lo que llega del frontend al **crear**
- [ ] `VehicleTaskPatch.java`: lo que llega del frontend al **modificar**
- [ ] `VehicleTaskResponse.java`: lo que se devuelve al frontend
- [ ] `VehicleTaskService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `VehicleTaskController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/VehiculoTarea")`)
- [ ] `VehicleTaskControllerTest.java` en `src/test/java/com/penaelchole/backend/vehicletask/`
- [ ] Marcar la casilla de `VehiculoTarea` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `completada` | `completed` | `boolean` | `completed` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `fecha_completada` | `completedDate` | `Instant` | `completed_date` | `TIMESTAMPTZ` | día y hora, formato `"2026-03-01T18:30:00.000Z"`. |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `vehiculo_id` | `vehicleId` | `String` | `vehicle_id` | `VARCHAR(36)` | id de un `Vehiculo` (tabla `vehicle`). Clave foránea, ver la guía |
| `vehiculo_nombre` | `vehicleName` | `String` | `vehicle_name` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `VehiculoTarea`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/VehiculoTarea` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/VehiculoTarea` | crear |
| `update` | `PATCH /api/entities/VehiculoTarea/{id}` | modificar algunos campos |

- **Filtros:** —
- **Orden (`sort`):** —

Archivos del frontend que usan `VehiculoTarea`:

- `src/pages/Vehiculos.jsx`

## Cosas a tener en cuenta

- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.
- El frontend no borra nunca esta entidad. Aun así, `delete` y `delete-many` tienen que existir (los usa la copia de seguridad); protégelos para que solo los use un admin.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
