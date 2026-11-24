# `Presupuesto` → paquete `budget`

> Presupuesto anual: lista de partidas de gasto y de ingresos previstos para un año.

**Fase del ROADMAP:** Phase 3: Finances

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Presupuesto`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Presupuesto` |
| Endpoint | `/api/entities/Presupuesto` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.budget` |
| Tabla en la base de datos | `budget` |
| Migración | `src/main/resources/db/migration/V<n>__create_budget.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_budget.sql` (en `src/main/resources/db/migration/`)
- [ ] `Budget.java`: la entidad (la tabla en Java)
- [ ] `BudgetRepository.java`: acceso a la base de datos
- [ ] `BudgetRequest.java`: lo que llega del frontend al **crear**
- [ ] `BudgetPatch.java`: lo que llega del frontend al **modificar**
- [ ] `BudgetResponse.java`: lo que se devuelve al frontend
- [ ] `BudgetService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `BudgetController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Presupuesto")`)
- [ ] `BudgetControllerTest.java` en `src/test/java/com/penaelchole/backend/budget/`
- [ ] Marcar la casilla de `Presupuesto` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `anio` | `year` | `Integer` | `year` | `INTEGER` |  |
| `ingresos` | `incomes` | `List<Map<String, Object>>` | `incomes` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de objetos (cada ingreso previsto). Ver "Listas y objetos (jsonb)" en la guía |
| `partidas` | `expenseItems` | `List<Map<String, Object>>` | `expense_items` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de objetos (cada partida del presupuesto). Ver "Listas y objetos (jsonb)" en la guía |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Presupuesto`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Presupuesto` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/Presupuesto` | crear |
| `update` | `PATCH /api/entities/Presupuesto/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/Presupuesto/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-anio`

Archivos del frontend que usan `Presupuesto`:

- `src/components/cargos/PanelPresupuesto.jsx`
- `src/components/finanzas/PresupuestoContent.jsx`
- `src/pages/Presupuesto.jsx`

## Cosas a tener en cuenta

- `partidas` e `ingresos` son listas de objetos. Abre `src/components/finanzas/PresupuestoContent.jsx` para ver qué campos tiene cada objeto antes de decidir si guardarlo como `jsonb` (lo más sencillo) o en tablas aparte.
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-anio` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
