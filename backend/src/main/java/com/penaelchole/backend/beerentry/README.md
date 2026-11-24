# `CervezaEntrada` → paquete `beerentry`

> Cuenta de cervezas de una persona en "La despensa de Simón": cuántas lleva y si las ha pagado.

**Fase del ROADMAP:** Phase 4: Beer

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `CervezaEntrada`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `CervezaEntrada` |
| Endpoint | `/api/entities/CervezaEntrada` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.beerentry` |
| Tabla en la base de datos | `beer_entry` |
| Migración | `src/main/resources/db/migration/V<n>__create_beer_entry.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_beer_entry.sql` (en `src/main/resources/db/migration/`)
- [ ] `BeerEntry.java`: la entidad (la tabla en Java)
- [ ] `BeerEntryRepository.java`: acceso a la base de datos
- [ ] `BeerEntryRequest.java`: lo que llega del frontend al **crear**
- [ ] `BeerEntryPatch.java`: lo que llega del frontend al **modificar**
- [ ] `BeerEntryResponse.java`: lo que se devuelve al frontend
- [ ] `BeerEntryService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `BeerEntryController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/CervezaEntrada")`)
- [ ] `BeerEntryControllerTest.java` en `src/test/java/com/penaelchole/backend/beerentry/`
- [ ] Marcar la casilla de `CervezaEntrada` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `cervezas` | `beers` | `Integer` | `beers` | `INTEGER` |  |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `pagado` | `paid` | `boolean` | `paid` | `BOOLEAN NOT NULL DEFAULT false` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `CervezaEntrada`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/CervezaEntrada` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/CervezaEntrada?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/CervezaEntrada` | crear |
| `update` | `PATCH /api/entities/CervezaEntrada/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/CervezaEntrada/{id}` | borrar uno |

- **Filtros:** `nombre`
- **Orden (`sort`):** `-cervezas`, `-created_date`

Archivos del frontend que usan `CervezaEntrada`:

- `src/components/cargos/PanelPresidente.jsx`
- `src/components/cerveza/CuentasCerveza.jsx`
- `src/components/cerveza/MiCervezaPerfil.jsx`
- `src/components/inicio/WidgetsDashboard.jsx`
- `src/pages/Cerveza.jsx`
- `src/pages/Contabilidad.jsx`
- `src/pages/Perfil.jsx`

## Cosas a tener en cuenta

- Ojo: no tiene `integrante_id`, la persona se identifica por `nombre` (puede ser alguien de fuera de la peña). El frontend filtra por `nombre`.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `nombre` devuelve solo las filas que coinciden.
- [ ] Ordenar con `sort=-cervezas` devuelve el orden correcto.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
