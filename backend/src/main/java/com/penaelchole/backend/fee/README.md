# `Cuota` → paquete `fee`

> Cuota que tiene que pagar un integrante (p. ej. la cuota anual) y si ya está pagada.

**Fase del ROADMAP:** Phase 3: Finances

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Cuota`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Cuota` |
| Endpoint | `/api/entities/Cuota` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.fee` |
| Tabla en la base de datos | `fee` |
| Migración | `src/main/resources/db/migration/V<n>__create_fee.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_fee.sql` (en `src/main/resources/db/migration/`)
- [ ] `Fee.java`: la entidad (la tabla en Java)
- [ ] `FeeRepository.java`: acceso a la base de datos
- [ ] `FeeRequest.java`: lo que llega del frontend al **crear**
- [ ] `FeePatch.java`: lo que llega del frontend al **modificar**
- [ ] `FeeResponse.java`: lo que se devuelve al frontend
- [ ] `FeeService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `FeeController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Cuota")`)
- [ ] `FeeControllerTest.java` en `src/test/java/com/penaelchole/backend/fee/`
- [ ] Marcar la casilla de `Cuota` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `concepto` | `concept` | `String` | `concept` | `TEXT` |  |
| `fecha_pago` | `paymentDate` | `LocalDate (¡revisar!)` | `payment_date` | `DATE` | el frontend lo manda a veces con hora y a veces sin ella. Ver notas. Puede llegar como `""` (texto vacío): trátalo como `null`. |
| `importe` | `amount` | `BigDecimal` | `amount` | `NUMERIC(10, 2)` | dinero: usa `BigDecimal`, nunca `double` |
| `integrante_id` | `memberId` | `String` | `member_id` | `VARCHAR(36)` | id de un `Integrante` (tabla `member`). Clave foránea, ver la guía |
| `integrante_nombre` | `memberName` | `String` | `member_name` | `TEXT` |  |
| `pagada` | `paid` | `boolean` | `paid` | `BOOLEAN NOT NULL DEFAULT false` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Cuota`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Cuota` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/Cuota?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/Cuota` | crear |
| `update` | `PATCH /api/entities/Cuota/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/Cuota/{id}` | borrar uno |

- **Filtros:** `pagada`
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `Cuota`:

- `src/components/cargos/HerramientasCargo.jsx`
- `src/components/finanzas/CuotasContent.jsx`
- `src/components/inicio/WidgetsDashboard.jsx`
- `src/components/socios/GestionSocios.jsx`
- `src/pages/Contabilidad.jsx`
- `src/pages/Cuotas.jsx`
- `src/pages/Perfil.jsx`
- `src/pages/Tesoreria.jsx`

## Cosas a tener en cuenta

- `fecha_pago` llega de dos formas distintas según el componente: con hora (`new Date().toISOString()`) o solo el día (`"2026-03-01"`), y a veces como `""`. Elige `LocalDate` y acepta ambos formatos (cortando lo que va después de la `T`), o habla con quien lleve el frontend para unificarlo.
- Tiene importes de dinero: usa `BigDecimal` en Java y `NUMERIC(10, 2)` en SQL. Con `double` las cuentas acaban con decimales raros (0.1 + 0.2 = 0.30000000000000004).
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `pagada` devuelve solo las filas que coinciden.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
