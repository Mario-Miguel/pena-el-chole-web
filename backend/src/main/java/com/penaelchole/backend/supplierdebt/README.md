# `DeudaProveedor` → paquete `supplierdebt`

> Dinero que la peña le debe a un proveedor.

**Fase del ROADMAP:** Phase 3: Finances

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `DeudaProveedor`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `DeudaProveedor` |
| Endpoint | `/api/entities/DeudaProveedor` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.supplierdebt` |
| Tabla en la base de datos | `supplier_debt` |
| Migración | `src/main/resources/db/migration/V<n>__create_supplier_debt.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_supplier_debt.sql` (en `src/main/resources/db/migration/`)
- [ ] `SupplierDebt.java`: la entidad (la tabla en Java)
- [ ] `SupplierDebtRepository.java`: acceso a la base de datos
- [ ] `SupplierDebtRequest.java`: lo que llega del frontend al **crear**
- [ ] `SupplierDebtPatch.java`: lo que llega del frontend al **modificar**
- [ ] `SupplierDebtResponse.java`: lo que se devuelve al frontend
- [ ] `SupplierDebtService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `SupplierDebtController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/DeudaProveedor")`)
- [ ] `SupplierDebtControllerTest.java` en `src/test/java/com/penaelchole/backend/supplierdebt/`
- [ ] Marcar la casilla de `DeudaProveedor` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `concepto` | `concept` | `String` | `concept` | `TEXT` |  |
| `importe` | `amount` | `BigDecimal` | `amount` | `NUMERIC(10, 2)` | dinero: usa `BigDecimal`, nunca `double` |
| `pagado` | `paid` | `boolean` | `paid` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `proveedor` | `supplier` | `String` | `supplier` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `DeudaProveedor`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/DeudaProveedor` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/DeudaProveedor` | crear |
| `update` | `PATCH /api/entities/DeudaProveedor/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/DeudaProveedor/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`, `-fecha`

Archivos del frontend que usan `DeudaProveedor`:

- `src/components/compra/ItemCompraDialog.jsx`
- `src/components/tickets/DeudasPanel.jsx`
- `src/pages/Contabilidad.jsx`

## Cosas a tener en cuenta

- Tiene importes de dinero: usa `BigDecimal` en Java y `NUMERIC(10, 2)` en SQL. Con `double` las cuentas acaban con decimales raros (0.1 + 0.2 = 0.30000000000000004).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] Ordenar con `sort=-fecha` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
