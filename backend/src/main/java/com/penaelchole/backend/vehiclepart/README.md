# `VehiculoPieza` → paquete `vehiclepart`

> Pieza o recambio de un vehículo.

**Fase del ROADMAP:** Phase 10: Vehicles & lottery

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `VehiculoPieza`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

> **Antes de empezar:** esta entidad apunta a `Vehiculo`. Hazla(s) primero, porque la clave foránea de la migración necesita que la otra tabla exista.

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `VehiculoPieza` |
| Endpoint | `/api/entities/VehiculoPieza` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.vehiclepart` |
| Tabla en la base de datos | `vehicle_part` |
| Migración | `src/main/resources/db/migration/V<n>__create_vehicle_part.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_vehicle_part.sql` (en `src/main/resources/db/migration/`)
- [ ] `VehiclePart.java`: la entidad (la tabla en Java)
- [ ] `VehiclePartRepository.java`: acceso a la base de datos
- [ ] `VehiclePartRequest.java`: lo que llega del frontend al **crear**
- [ ] `VehiclePartPatch.java`: lo que llega del frontend al **modificar**
- [ ] `VehiclePartResponse.java`: lo que se devuelve al frontend
- [ ] `VehiclePartService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `VehiclePartController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/VehiculoPieza")`)
- [ ] `VehiclePartControllerTest.java` en `src/test/java/com/penaelchole/backend/vehiclepart/`
- [ ] Marcar la casilla de `VehiculoPieza` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `estado` | `status` | `String` | `status` | `TEXT` |  |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `notas` | `notes` | `String` | `notes` | `TEXT` |  |
| `referencia` | `reference` | `String` | `reference` | `TEXT` |  |
| `vehiculo_id` | `vehicleId` | `String` | `vehicle_id` | `VARCHAR(36)` | id de un `Vehiculo` (tabla `vehicle`). Clave foránea, ver la guía |
| `vehiculo_nombre` | `vehicleName` | `String` | `vehicle_name` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `VehiculoPieza`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/VehiculoPieza` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/VehiculoPieza` | crear |

- **Filtros:** —
- **Orden (`sort`):** —

Archivos del frontend que usan `VehiculoPieza`:

- `src/pages/Vehiculos.jsx`

## Cosas a tener en cuenta

- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.
- El frontend no borra nunca esta entidad. Aun así, `delete` y `delete-many` tienen que existir (los usa la copia de seguridad); protégelos para que solo los use un admin.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
