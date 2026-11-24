# `MovimientoCaja` → paquete `cashmovement`

> Apunte del libro de caja: un ingreso o un gasto de dinero de la peña.

**Fase del ROADMAP:** Phase 3: Finances

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `MovimientoCaja`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `MovimientoCaja` |
| Endpoint | `/api/entities/MovimientoCaja` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.cashmovement` |
| Tabla en la base de datos | `cash_movement` |
| Migración | `src/main/resources/db/migration/V<n>__create_cash_movement.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_cash_movement.sql` (en `src/main/resources/db/migration/`)
- [ ] `CashMovement.java`: la entidad (la tabla en Java)
- [ ] `CashMovementRepository.java`: acceso a la base de datos
- [ ] `CashMovementRequest.java`: lo que llega del frontend al **crear**
- [ ] `CashMovementPatch.java`: lo que llega del frontend al **modificar**
- [ ] `CashMovementResponse.java`: lo que se devuelve al frontend
- [ ] `CashMovementService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `CashMovementController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/MovimientoCaja")`)
- [ ] `CashMovementControllerTest.java` en `src/test/java/com/penaelchole/backend/cashmovement/`
- [ ] Marcar la casilla de `MovimientoCaja` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `cantidad` | `quantity` | `BigDecimal` | `quantity` | `NUMERIC(10, 2)` | dinero: usa `BigDecimal`, nunca `double` |
| `categoria` | `category` | `String` | `category` | `TEXT` |  |
| `concepto` | `concept` | `String` | `concept` | `TEXT` |  |
| `fecha` | `date` | `LocalDate` | `date` | `DATE` | solo el día, formato `"2026-03-01"`. |
| `fuente` | `source` | `String` | `source` | `TEXT` |  |
| `notas` | `notes` | `String` | `notes` | `TEXT` |  |
| `tipo` | `type` | `String` | `type` | `TEXT` |  |
| `usuario` | `userName` | `String` | `user_name` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `MovimientoCaja`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/MovimientoCaja` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/MovimientoCaja` | crear |
| `delete` | `DELETE /api/entities/MovimientoCaja/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-fecha`, `-created_date`

Archivos del frontend que usan `MovimientoCaja`:

- `src/components/contabilidad/NuevoMovimientoDialog.jsx`
- `src/components/finanzas/LibroCajaContent.jsx`
- `src/components/inicio/WidgetsDashboard.jsx`
- `src/pages/Contabilidad.jsx`
- `src/pages/LibroCaja.jsx`
- `src/pages/Tesoreria.jsx`

## Cosas a tener en cuenta

- Tiene importes de dinero: usa `BigDecimal` en Java y `NUMERIC(10, 2)` en SQL. Con `double` las cuentas acaban con decimales raros (0.1 + 0.2 = 0.30000000000000004).
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-fecha` devuelve el orden correcto.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
