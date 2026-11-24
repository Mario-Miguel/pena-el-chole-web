# `PagoRegistrado` → paquete `recordedpayment`

> Pago apuntado por el tesorero: quién pagó, cuánto y quién lo registró.

**Fase del ROADMAP:** Phase 3: Finances

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `PagoRegistrado`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `PagoRegistrado` |
| Endpoint | `/api/entities/PagoRegistrado` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.recordedpayment` |
| Tabla en la base de datos | `recorded_payment` |
| Migración | `src/main/resources/db/migration/V<n>__create_recorded_payment.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_recorded_payment.sql` (en `src/main/resources/db/migration/`)
- [ ] `RecordedPayment.java`: la entidad (la tabla en Java)
- [ ] `RecordedPaymentRepository.java`: acceso a la base de datos
- [ ] `RecordedPaymentRequest.java`: lo que llega del frontend al **crear**
- [ ] `RecordedPaymentPatch.java`: lo que llega del frontend al **modificar**
- [ ] `RecordedPaymentResponse.java`: lo que se devuelve al frontend
- [ ] `RecordedPaymentService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `RecordedPaymentController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/PagoRegistrado")`)
- [ ] `RecordedPaymentControllerTest.java` en `src/test/java/com/penaelchole/backend/recordedpayment/`
- [ ] Marcar la casilla de `PagoRegistrado` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `importe` | `amount` | `BigDecimal` | `amount` | `NUMERIC(10, 2)` | dinero: usa `BigDecimal`, nunca `double` |
| `persona` | `person` | `String` | `person` | `TEXT` |  |
| `registrado_por` | `recordedBy` | `String` | `recorded_by` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `PagoRegistrado`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/PagoRegistrado` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/PagoRegistrado` | crear |
| `delete` | `DELETE /api/entities/PagoRegistrado/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `PagoRegistrado`:

- `src/components/cargos/HerramientasCargo.jsx`
- `src/components/cargos/PanelTesorero.jsx`
- `src/components/compra/ArchivoCompras.jsx`
- `src/components/compra/CuentasExternasPanel.jsx`
- `src/components/compra/CuentasPanelFixed.jsx`
- `src/pages/Almacen.jsx`
- `src/pages/Contabilidad.jsx`
- `src/pages/Cuentas.jsx`

## Cosas a tener en cuenta

- Tiene importes de dinero: usa `BigDecimal` en Java y `NUMERIC(10, 2)` en SQL. Con `double` las cuentas acaban con decimales raros (0.1 + 0.2 = 0.30000000000000004).
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
