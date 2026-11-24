# `EntregaTalonario` → paquete `lotterybookdelivery`

> Registro histórico de cada entrega de un talonario a un integrante.

**Fase del ROADMAP:** Phase 10: Vehicles & lottery

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `EntregaTalonario`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

> **Antes de empezar:** esta entidad apunta a `Loteria`, `TalonarioLoteria`. Hazla(s) primero, porque la clave foránea de la migración necesita que la otra tabla exista.

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `EntregaTalonario` |
| Endpoint | `/api/entities/EntregaTalonario` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.lotterybookdelivery` |
| Tabla en la base de datos | `lottery_book_delivery` |
| Migración | `src/main/resources/db/migration/V<n>__create_lottery_book_delivery.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_lottery_book_delivery.sql` (en `src/main/resources/db/migration/`)
- [ ] `LotteryBookDelivery.java`: la entidad (la tabla en Java)
- [ ] `LotteryBookDeliveryRepository.java`: acceso a la base de datos
- [ ] `LotteryBookDeliveryRequest.java`: lo que llega del frontend al **crear**
- [ ] `LotteryBookDeliveryPatch.java`: lo que llega del frontend al **modificar**
- [ ] `LotteryBookDeliveryResponse.java`: lo que se devuelve al frontend
- [ ] `LotteryBookDeliveryService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `LotteryBookDeliveryController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/EntregaTalonario")`)
- [ ] `LotteryBookDeliveryControllerTest.java` en `src/test/java/com/penaelchole/backend/lotterybookdelivery/`
- [ ] Marcar la casilla de `EntregaTalonario` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `cantidad_asignada` | `assignedQuantity` | `Integer` | `assigned_quantity` | `INTEGER` |  |
| `cantidad_vendida` | `soldQuantity` | `Integer` | `sold_quantity` | `INTEGER` |  |
| `fecha_entrega` | `deliveryDate` | `Instant` | `delivery_date` | `TIMESTAMPTZ` | día y hora, formato `"2026-03-01T18:30:00.000Z"`. |
| `integrante_id` | `memberId` | `String` | `member_id` | `VARCHAR(36)` | id de un `Integrante` (tabla `member`). Clave foránea, ver la guía |
| `integrante_nombre` | `memberName` | `String` | `member_name` | `TEXT` |  |
| `loteria_id` | `lotteryId` | `String` | `lottery_id` | `VARCHAR(36)` | id de un `Loteria` (tabla `lottery`). Clave foránea, ver la guía |
| `loteria_nombre` | `lotteryName` | `String` | `lottery_name` | `TEXT` |  |
| `numeros_fin` | `lastNumber` | `String` | `last_number` | `TEXT` |  |
| `numeros_inicio` | `firstNumber` | `String` | `first_number` | `TEXT` |  |
| `talonario_id` | `bookId` | `String` | `book_id` | `VARCHAR(36)` | id de un `TalonarioLoteria` (tabla `lottery_book`). Clave foránea, ver la guía |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `EntregaTalonario`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/EntregaTalonario` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/EntregaTalonario` | crear |

- **Filtros:** —
- **Orden (`sort`):** `-fecha_entrega`

Archivos del frontend que usan `EntregaTalonario`:

- `src/pages/Loteria.jsx`

## Cosas a tener en cuenta

- Es un historial: solo se crea y se lista.
- Haz antes `Loteria` y `TalonarioLoteria`, porque apunta a las dos.
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.
- El frontend no borra nunca esta entidad. Aun así, `delete` y `delete-many` tienen que existir (los usa la copia de seguridad); protégelos para que solo los use un admin.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-fecha_entrega` devuelve el orden correcto.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
