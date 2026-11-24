# `LoteCerveza` → paquete `beerbatch`

> Lote de cerveza comprado para el inventario: cantidad, coste, tipo y stock mínimo.

**Fase del ROADMAP:** Phase 4: Beer

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `LoteCerveza`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `LoteCerveza` |
| Endpoint | `/api/entities/LoteCerveza` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.beerbatch` |
| Tabla en la base de datos | `beer_batch` |
| Migración | `src/main/resources/db/migration/V<n>__create_beer_batch.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_beer_batch.sql` (en `src/main/resources/db/migration/`)
- [ ] `BeerBatch.java`: la entidad (la tabla en Java)
- [ ] `BeerBatchRepository.java`: acceso a la base de datos
- [ ] `BeerBatchRequest.java`: lo que llega del frontend al **crear**
- [ ] `BeerBatchPatch.java`: lo que llega del frontend al **modificar**
- [ ] `BeerBatchResponse.java`: lo que se devuelve al frontend
- [ ] `BeerBatchService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `BeerBatchController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/LoteCerveza")`)
- [ ] `BeerBatchControllerTest.java` en `src/test/java/com/penaelchole/backend/beerbatch/`
- [ ] Marcar la casilla de `LoteCerveza` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `cantidad` | `quantity` | `Integer` | `quantity` | `INTEGER` |  |
| `consumido_ajuste` | `consumedAdjustment` | `Integer` | `consumed_adjustment` | `INTEGER` |  |
| `coste` | `cost` | `BigDecimal` | `cost` | `NUMERIC(10, 2)` | dinero: usa `BigDecimal`, nunca `double` |
| `fecha` | `date` | `LocalDate` | `date` | `DATE` | solo el día, formato `"2026-03-01"`. |
| `notas` | `notes` | `String` | `notes` | `TEXT` |  |
| `stock_minimo` | `minimumStock` | `Integer` | `minimum_stock` | `INTEGER` |  |
| `tipo` | `type` | `String` | `type` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `LoteCerveza`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/LoteCerveza` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/LoteCerveza` | crear |
| `update` | `PATCH /api/entities/LoteCerveza/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/LoteCerveza/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-fecha`

Archivos del frontend que usan `LoteCerveza`:

- `src/components/cerveza/InventarioCerveza.jsx`
- `src/pages/Cerveza.jsx`
- `src/pages/Contabilidad.jsx`

## Cosas a tener en cuenta

- `consumido_ajuste` es un número entero (se suma en `InventarioCerveza.jsx`), aunque el roadmap diga String.
- Tiene importes de dinero: usa `BigDecimal` en Java y `NUMERIC(10, 2)` en SQL. Con `double` las cuentas acaban con decimales raros (0.1 + 0.2 = 0.30000000000000004).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-fecha` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
