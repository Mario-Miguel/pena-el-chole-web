# `Vehiculo` → paquete `vehicle`

> Vehículo de la peña (p. ej. tractor o remolque de la carroza).

**Fase del ROADMAP:** Phase 10: Vehicles & lottery

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Vehiculo`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Vehiculo` |
| Endpoint | `/api/entities/Vehiculo` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.vehicle` |
| Tabla en la base de datos | `vehicle` |
| Migración | `src/main/resources/db/migration/V<n>__create_vehicle.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_vehicle.sql` (en `src/main/resources/db/migration/`)
- [ ] `Vehicle.java`: la entidad (la tabla en Java)
- [ ] `VehicleRepository.java`: acceso a la base de datos
- [ ] `VehicleRequest.java`: lo que llega del frontend al **crear**
- [ ] `VehiclePatch.java`: lo que llega del frontend al **modificar**
- [ ] `VehicleResponse.java`: lo que se devuelve al frontend
- [ ] `VehicleService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `VehicleController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Vehiculo")`)
- [ ] `VehicleControllerTest.java` en `src/test/java/com/penaelchole/backend/vehicle/`
- [ ] Marcar la casilla de `Vehiculo` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `tipo` | `type` | `String` | `type` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Vehiculo`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Vehiculo` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/Vehiculo` | crear |

- **Filtros:** —
- **Orden (`sort`):** —

Archivos del frontend que usan `Vehiculo`:

- `src/components/inicio/WidgetsDashboard.jsx`
- `src/pages/Vehiculos.jsx`

## Cosas a tener en cuenta

- El frontend solo usa `create` y `list` de momento.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.
- El frontend no borra nunca esta entidad. Aun así, `delete` y `delete-many` tienen que existir (los usa la copia de seguridad); protégelos para que solo los use un admin.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
