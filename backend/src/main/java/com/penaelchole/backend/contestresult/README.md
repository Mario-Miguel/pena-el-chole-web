# `ResultadoAnio` → paquete `contestresult`

> Clasificación del concurso de un año: filas de resultados más imágenes y Excel.

**Fase del ROADMAP:** Phase 9: Parade

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `ResultadoAnio`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `ResultadoAnio` |
| Endpoint | `/api/entities/ResultadoAnio` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.contestresult` |
| Tabla en la base de datos | `contest_result` |
| Migración | `src/main/resources/db/migration/V<n>__create_contest_result.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_contest_result.sql` (en `src/main/resources/db/migration/`)
- [ ] `ContestResult.java`: la entidad (la tabla en Java)
- [ ] `ContestResultRepository.java`: acceso a la base de datos
- [ ] `ContestResultRequest.java`: lo que llega del frontend al **crear**
- [ ] `ContestResultPatch.java`: lo que llega del frontend al **modificar**
- [ ] `ContestResultResponse.java`: lo que se devuelve al frontend
- [ ] `ContestResultService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `ContestResultController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/ResultadoAnio")`)
- [ ] `ContestResultControllerTest.java` en `src/test/java/com/penaelchole/backend/contestresult/`
- [ ] Marcar la casilla de `ResultadoAnio` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `anio` | `year` | `Integer` | `year` | `INTEGER` |  |
| `excel_urls` | `excelUrls` | `List<String>` | `excel_urls` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de URLs de archivos Excel. Ver "Listas y objetos (jsonb)" en la guía |
| `filas` | `rows` | `List<Map<String, Object>>` | `rows` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de objetos (cada fila de la clasificación). Ver "Listas y objetos (jsonb)" en la guía |
| `imagenes_urls` | `imageUrls` | `List<String>` | `image_urls` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de URLs de imágenes. Ver "Listas y objetos (jsonb)" en la guía |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `ResultadoAnio`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/ResultadoAnio` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/ResultadoAnio` | crear |
| `update` | `PATCH /api/entities/ResultadoAnio/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/ResultadoAnio/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-anio`

Archivos del frontend que usan `ResultadoAnio`:

- `src/components/resultados/ResultadoAnioCard.jsx`
- `src/components/trofeos/ResultadosContent.jsx`
- `src/pages/Resultados.jsx`

## Cosas a tener en cuenta

- `filas` es una lista de objetos (una por posición en la clasificación). `imagenes_urls` y `excel_urls` son listas de URLs, aunque el roadmap diga String.
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-anio` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
