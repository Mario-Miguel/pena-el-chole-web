# `CervezaPago` → paquete `beerpayment`

> Pago de cervezas de un integrante. Lo pagado es la suma de sus pagos; las correcciones son pagos negativos. Al cerrar el año se archivan.

**Fase del ROADMAP:** Phase 4: Beer

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `CervezaPago`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `CervezaPago` |
| Endpoint | `/api/entities/CervezaPago` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.beerpayment` |
| Tabla en la base de datos | `beer_payment` |
| Migración | `src/main/resources/db/migration/V<n>__create_beer_payment.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [x] Migración `V<n>__create_beer_payment.sql` (en `src/main/resources/db/migration/`)
- [x] `BeerPayment.java`: la entidad (la tabla en Java)
- [x] `BeerPaymentRepository.java`: acceso a la base de datos
- [x] `BeerPaymentRequest.java`: lo que llega del frontend al **crear**
- [x] `BeerPaymentPatch.java`: lo que llega del frontend al **modificar**
- [x] `BeerPaymentResponse.java`: lo que se devuelve al frontend
- [x] `BeerPaymentService.java`: la lógica (con `@Service` y `@Transactional`)
- [x] `BeerPaymentController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/CervezaPago")`)
- [x] `BeerPaymentControllerTest.java` en `src/test/java/com/penaelchole/backend/beerpayment/`
- [x] Marcar la casilla de `CervezaPago` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity`.

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `integrante_id` | `memberId` | `String` | `member_id` | `VARCHAR(36)` | `REFERENCES member(id)`. `null` = invitados |
| `importe` | `amount` | `BigDecimal` | `amount` | `NUMERIC(10, 2) NOT NULL` | puede ser negativo, nunca 0 |
| `fecha` | `date` | `Instant` | `date` | `TIMESTAMPTZ` | `"2026-03-01T18:30:00.000Z"` |
| `notas` | `notes` | `String` | `notes` | `TEXT` | |
| `archivado` | `archived` | `boolean` | `archived` | `BOOLEAN NOT NULL DEFAULT false` | |
| `anio_archivo` | `archiveYear` | `Integer` | `archive_year` | `INTEGER` | |

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/CervezaPago?sort=-fecha` | movimientos en Contabilidad |
| `filter` | `GET /api/entities/CervezaPago?campo=valor` | por `archivado` y por `integrante_id` |
| `create` | `POST /api/entities/CervezaPago` | añadir pago, descontar o fijar (CuentasCerveza) |
| `update` | `PATCH /api/entities/CervezaPago/{id}` | archivar el año |

- **Filtros:** `archivado`, `integrante_id`
- **Orden (`sort`):** `-fecha`

Archivos del frontend que usan `CervezaPago`: `src/components/cerveza/CuentasCerveza.jsx`, `src/components/cerveza/MiCervezaPerfil.jsx`, `src/pages/Cerveza.jsx`, `src/pages/Contabilidad.jsx`, `src/lib/cerveza.js`.

## Cosas a tener en cuenta

- Lo pagado por alguien es `SUM(importe)` de sus pagos con `archivado = false`. "Descontar" y "Fijar" crean un pago negativo (o positivo) por la diferencia, así queda rastro de todo.
- Leer es para todos (cada integrante ve su historial en el perfil). Escribir, solo `ROLE_ADMIN` (admin, presidente, vicepresidente), igual que `puedeArchivar` en `Cerveza.jsx`.
- Dinero: `BigDecimal` en Java y `NUMERIC(10, 2)` en SQL.

## Tests mínimos

- [x] Sin token → `401`.
- [x] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [x] `GET` por id → `200`; con un id que no existe → `404`.
- [x] Filtrar por `archivado` devuelve solo las filas que coinciden.
- [x] Filtrar por `integrante_id` devuelve solo las filas que coinciden.
- [x] Ordenar con `sort=-fecha` devuelve el orden correcto.
- [x] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [x] `PATCH` sin un campo → ese campo no cambia.
- [x] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
