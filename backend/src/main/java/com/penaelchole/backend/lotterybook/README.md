# `TalonarioLoteria` → paquete `lotterybook`

> Talonario de papeletas de una lotería asignado a un integrante, con cuántas ha vendido.

**Fase del ROADMAP:** Phase 10: Vehicles & lottery

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `TalonarioLoteria`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

> **Antes de empezar:** esta entidad apunta a `Loteria`. Hazla(s) primero, porque la clave foránea de la migración necesita que la otra tabla exista.

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `TalonarioLoteria` |
| Endpoint | `/api/entities/TalonarioLoteria` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.lotterybook` |
| Tabla en la base de datos | `lottery_book` |
| Migración | `src/main/resources/db/migration/V<n>__create_lottery_book.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_lottery_book.sql` (en `src/main/resources/db/migration/`)
- [ ] `LotteryBook.java`: la entidad (la tabla en Java)
- [ ] `LotteryBookRepository.java`: acceso a la base de datos
- [ ] `LotteryBookRequest.java`: lo que llega del frontend al **crear**
- [ ] `LotteryBookPatch.java`: lo que llega del frontend al **modificar**
- [ ] `LotteryBookResponse.java`: lo que se devuelve al frontend
- [ ] `LotteryBookService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `LotteryBookController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/TalonarioLoteria")`)
- [ ] `LotteryBookControllerTest.java` en `src/test/java/com/penaelchole/backend/lotterybook/`
- [ ] Marcar la casilla de `TalonarioLoteria` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `cantidad_asignada` | `assignedQuantity` | `Integer` | `assigned_quantity` | `INTEGER` |  |
| `cantidad_vendida` | `soldQuantity` | `Integer` | `sold_quantity` | `INTEGER` |  |
| `entregado` | `delivered` | `boolean` | `delivered` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `integrante_id` | `memberId` | `String` | `member_id` | `VARCHAR(36)` | id de un `Integrante` (tabla `member`). Clave foránea, ver la guía |
| `integrante_nombre` | `memberName` | `String` | `member_name` | `TEXT` |  |
| `loteria_id` | `lotteryId` | `String` | `lottery_id` | `VARCHAR(36)` | id de un `Loteria` (tabla `lottery`). Clave foránea, ver la guía |
| `numeros_fin` | `lastNumber` | `String` | `last_number` | `TEXT` |  |
| `numeros_inicio` | `firstNumber` | `String` | `first_number` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `TalonarioLoteria`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/TalonarioLoteria` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/TalonarioLoteria` | crear |
| `update` | `PATCH /api/entities/TalonarioLoteria/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/TalonarioLoteria/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `TalonarioLoteria`:

- `src/components/inicio/WidgetsDashboard.jsx`
- `src/components/loteria/HerramientasGestion.jsx`
- `src/pages/Contabilidad.jsx`
- `src/pages/Loteria.jsx`

## Cosas a tener en cuenta

- `numeros_inicio` y `numeros_fin` son el rango de papeletas del talonario; guárdalos como texto por si tienen ceros a la izquierda.
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
