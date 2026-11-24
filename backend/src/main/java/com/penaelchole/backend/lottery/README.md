# `Loteria` → paquete `lottery`

> Sorteo de lotería que vende la peña: número, precios y papeletas.

**Fase del ROADMAP:** Phase 10: Vehicles & lottery

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Loteria`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Loteria` |
| Endpoint | `/api/entities/Loteria` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.lottery` |
| Tabla en la base de datos | `lottery` |
| Migración | `src/main/resources/db/migration/V<n>__create_lottery.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_lottery.sql` (en `src/main/resources/db/migration/`)
- [ ] `Lottery.java`: la entidad (la tabla en Java)
- [ ] `LotteryRepository.java`: acceso a la base de datos
- [ ] `LotteryRequest.java`: lo que llega del frontend al **crear**
- [ ] `LotteryPatch.java`: lo que llega del frontend al **modificar**
- [ ] `LotteryResponse.java`: lo que se devuelve al frontend
- [ ] `LotteryService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `LotteryController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Loteria")`)
- [ ] `LotteryControllerTest.java` en `src/test/java/com/penaelchole/backend/lottery/`
- [ ] Marcar la casilla de `Loteria` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `estado` | `status` | `String` | `status` | `TEXT` |  |
| `fecha_limite` | `dueDate` | `LocalDate` | `due_date` | `DATE` | solo el día, formato `"2026-03-01"`. Puede llegar como `""` (texto vacío): trátalo como `null`. |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `numero_que_se_juega` | `lotteryNumber` | `String` | `lottery_number` | `TEXT` | el número de lotería como texto: puede empezar por 0 (p. ej. "04512") |
| `precio_carroza` | `floatPrice` | `BigDecimal` | `float_price` | `NUMERIC(10, 2)` | dinero: usa `BigDecimal`, nunca `double` |
| `precio_participacion` | `sharePrice` | `BigDecimal` | `share_price` | `NUMERIC(10, 2)` | dinero: usa `BigDecimal`, nunca `double` |
| `total_papeletas` | `totalTickets` | `Integer` | `total_tickets` | `INTEGER` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Loteria`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Loteria` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/Loteria` | crear |
| `update` | `PATCH /api/entities/Loteria/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/Loteria/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `Loteria`:

- `src/components/inicio/WidgetsDashboard.jsx`
- `src/pages/Contabilidad.jsx`
- `src/pages/Loteria.jsx`

## Cosas a tener en cuenta

- `numero_que_se_juega` debe ser **texto**: un número de lotería puede empezar por cero (`"04512"`) y como número se perdería.
- Tiene importes de dinero: usa `BigDecimal` en Java y `NUMERIC(10, 2)` en SQL. Con `double` las cuentas acaban con decimales raros (0.1 + 0.2 = 0.30000000000000004).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
