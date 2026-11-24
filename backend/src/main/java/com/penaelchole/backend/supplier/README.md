# `Proveedor` → paquete `supplier`

> Proveedor al que se le compra (solo el nombre). Se usa para autocompletar en Tickets.

**Fase del ROADMAP:** Phase 3: Finances

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Proveedor`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Proveedor` |
| Endpoint | `/api/entities/Proveedor` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.supplier` |
| Tabla en la base de datos | `supplier` |
| Migración | `src/main/resources/db/migration/V<n>__create_supplier.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_supplier.sql` (en `src/main/resources/db/migration/`)
- [ ] `Supplier.java`: la entidad (la tabla en Java)
- [ ] `SupplierRepository.java`: acceso a la base de datos
- [ ] `SupplierRequest.java`: lo que llega del frontend al **crear**
- [ ] `SupplierPatch.java`: lo que llega del frontend al **modificar**
- [ ] `SupplierResponse.java`: lo que se devuelve al frontend
- [ ] `SupplierService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `SupplierController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Proveedor")`)
- [ ] `SupplierControllerTest.java` en `src/test/java/com/penaelchole/backend/supplier/`
- [ ] Marcar la casilla de `Proveedor` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Proveedor`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Proveedor` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/Proveedor` | crear |
| `delete` | `DELETE /api/entities/Proveedor/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `nombre`

Archivos del frontend que usan `Proveedor`:

- `src/pages/Tickets.jsx`

## Cosas a tener en cuenta

- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=nombre` devuelve el orden correcto.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
