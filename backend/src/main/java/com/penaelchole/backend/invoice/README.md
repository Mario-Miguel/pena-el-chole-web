# `TicketFactura` → paquete `invoice`

> Ticket o factura de una compra, con sus líneas (`items`), fotos y si está pagada.

**Fase del ROADMAP:** Phase 3: Finances

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `TicketFactura`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `TicketFactura` |
| Endpoint | `/api/entities/TicketFactura` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.invoice` |
| Tabla en la base de datos | `invoice` |
| Migración | `src/main/resources/db/migration/V<n>__create_invoice.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_invoice.sql` (en `src/main/resources/db/migration/`)
- [ ] `Invoice.java`: la entidad (la tabla en Java)
- [ ] `InvoiceRepository.java`: acceso a la base de datos
- [ ] `InvoiceRequest.java`: lo que llega del frontend al **crear**
- [ ] `InvoicePatch.java`: lo que llega del frontend al **modificar**
- [ ] `InvoiceResponse.java`: lo que se devuelve al frontend
- [ ] `InvoiceService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `InvoiceController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/TicketFactura")`)
- [ ] `InvoiceControllerTest.java` en `src/test/java/com/penaelchole/backend/invoice/`
- [ ] Marcar la casilla de `TicketFactura` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `carpeta` | `folder` | `String` | `folder` | `TEXT` |  |
| `categoria` | `category` | `String` | `category` | `TEXT` |  |
| `concepto` | `concept` | `String` | `concept` | `TEXT` |  |
| `fecha` | `date` | `LocalDate` | `date` | `DATE` | solo el día, formato `"2026-03-01"`. |
| `fecha_pago` | `paymentDate` | `LocalDate` | `payment_date` | `DATE` | solo el día, formato `"2026-03-01"`. Puede llegar como `""` (texto vacío): trátalo como `null`. |
| `fecha_vencimiento` | `dueDate` | `LocalDate` | `due_date` | `DATE` | solo el día, formato `"2026-03-01"`. Puede llegar como `""` (texto vacío): trátalo como `null`. |
| `fotos` | `photos` | `List<String>` | `photos` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de URLs de fotos. Ver "Listas y objetos (jsonb)" en la guía |
| `importe` | `amount` | `BigDecimal` | `amount` | `NUMERIC(10, 2)` | dinero: usa `BigDecimal`, nunca `double` |
| `integrante_id` | `memberId` | `String` | `member_id` | `VARCHAR(36)` | id de un `Integrante` (tabla `member`). Clave foránea, ver la guía |
| `integrante_nombre` | `memberName` | `String` | `member_name` | `TEXT` |  |
| `items` | `items` | `List<Map<String, Object>>` | `items` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de objetos (cada línea: `cantidad`, `precio`, `iva`, `descuento`…). Ver "Listas y objetos (jsonb)" en la guía |
| `notas` | `notes` | `String` | `notes` | `TEXT` |  |
| `pagado` | `paid` | `boolean` | `paid` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `proveedor` | `supplier` | `String` | `supplier` | `TEXT` |  |
| `tipo` | `type` | `String` | `type` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `TicketFactura`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/TicketFactura` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/TicketFactura` | crear |
| `update` | `PATCH /api/entities/TicketFactura/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/TicketFactura/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `TicketFactura`:

- `src/pages/Contabilidad.jsx`
- `src/pages/Tickets.jsx`

## Cosas a tener en cuenta

- `items` es una lista de objetos con su propia estructura (mira la función que calcula los totales al principio de `src/pages/Tickets.jsx`).
- `fecha_pago` y `fecha_vencimiento` pueden llegar como `""` (texto vacío) cuando no se rellenan. Trátalo como `null`.
- Tiene importes de dinero: usa `BigDecimal` en Java y `NUMERIC(10, 2)` en SQL. Con `double` las cuentas acaban con decimales raros (0.1 + 0.2 = 0.30000000000000004).
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
