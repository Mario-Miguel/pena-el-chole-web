# `ConcursoSeccion` → paquete `contestsection`

> Sección de información del concurso (bases, jurado…) con texto y archivos.

**Fase del ROADMAP:** Phase 9: Parade

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `ConcursoSeccion`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `ConcursoSeccion` |
| Endpoint | `/api/entities/ConcursoSeccion` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.contestsection` |
| Tabla en la base de datos | `contest_section` |
| Migración | `src/main/resources/db/migration/V<n>__create_contest_section.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_contest_section.sql` (en `src/main/resources/db/migration/`)
- [ ] `ContestSection.java`: la entidad (la tabla en Java)
- [ ] `ContestSectionRepository.java`: acceso a la base de datos
- [ ] `ContestSectionRequest.java`: lo que llega del frontend al **crear**
- [ ] `ContestSectionPatch.java`: lo que llega del frontend al **modificar**
- [ ] `ContestSectionResponse.java`: lo que se devuelve al frontend
- [ ] `ContestSectionService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `ContestSectionController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/ConcursoSeccion")`)
- [ ] `ContestSectionControllerTest.java` en `src/test/java/com/penaelchole/backend/contestsection/`
- [ ] Marcar la casilla de `ConcursoSeccion` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `archivos` | `files` | `List<String>` | `files` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de textos; cada uno es un objeto JSON convertido a texto con `JSON.stringify`. Ver "Listas y objetos (jsonb)" en la guía |
| `contenido` | `content` | `String` | `content` | `TEXT` |  |
| `tipo` | `type` | `String` | `type` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `ConcursoSeccion`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `filter` | `GET /api/entities/ConcursoSeccion?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/ConcursoSeccion` | crear |
| `update` | `PATCH /api/entities/ConcursoSeccion/{id}` | modificar algunos campos |

- **Filtros:** `tipo`
- **Orden (`sort`):** —

Archivos del frontend que usan `ConcursoSeccion`:

- `src/components/concurso/ConcursoSeccionPanel.jsx`

## Cosas a tener en cuenta

- `archivos` es una lista de **textos**, y cada texto es un objeto JSON convertido con `JSON.stringify`. Guárdalo como `List<String>` en `jsonb` y no intentes interpretarlo.
- El frontend busca la sección por `tipo`: probablemente solo hay una fila por tipo (`UNIQUE (type)`).
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).
- El frontend no borra nunca esta entidad. Aun así, `delete` y `delete-many` tienen que existir (los usa la copia de seguridad); protégelos para que solo los use un admin.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `tipo` devuelve solo las filas que coinciden.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
