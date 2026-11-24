# `ObraAnio` → paquete `paradeyear`

> La obra (temática del desfile) de un año.

**Fase del ROADMAP:** Phase 9: Parade

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `ObraAnio`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `ObraAnio` |
| Endpoint | `/api/entities/ObraAnio` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.paradeyear` |
| Tabla en la base de datos | `parade_year` |
| Migración | `src/main/resources/db/migration/V<n>__create_parade_year.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_parade_year.sql` (en `src/main/resources/db/migration/`)
- [ ] `ParadeYear.java`: la entidad (la tabla en Java)
- [ ] `ParadeYearRepository.java`: acceso a la base de datos
- [ ] `ParadeYearRequest.java`: lo que llega del frontend al **crear**
- [ ] `ParadeYearPatch.java`: lo que llega del frontend al **modificar**
- [ ] `ParadeYearResponse.java`: lo que se devuelve al frontend
- [ ] `ParadeYearService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `ParadeYearController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/ObraAnio")`)
- [ ] `ParadeYearControllerTest.java` en `src/test/java/com/penaelchole/backend/paradeyear/`
- [ ] Marcar la casilla de `ObraAnio` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `campoTexto` | `text` | `String` | `text` | `TEXT` |  |
| `titulo` | `title` | `String` | `title` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `ObraAnio`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/ObraAnio` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/ObraAnio` | crear |
| `update` | `PATCH /api/entities/ObraAnio/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/ObraAnio/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-anio`

Archivos del frontend que usan `ObraAnio`:

- `src/components/obra/GuionJurado.jsx`
- `src/components/obra/ObraAnioCard.jsx`
- `src/components/trofeos/ObraContent.jsx`
- `src/pages/Obra.jsx`

## Cosas a tener en cuenta

- El campo `campoTexto` está en camelCase en el frontend (no en snake_case como los demás). Usa exactamente `@JsonProperty("campoTexto")` y `@ApiName("campoTexto")`.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-anio` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
