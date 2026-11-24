# `Documento` → paquete `document`

> Documento de secretaría (o plantilla para generar documentos).

**Fase del ROADMAP:** Phase 7: Secretary & documents

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Documento`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

> **Antes de empezar:** esta entidad apunta a `Documento`. Hazla(s) primero, porque la clave foránea de la migración necesita que la otra tabla exista.

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Documento` |
| Endpoint | `/api/entities/Documento` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.document` |
| Tabla en la base de datos | `document` |
| Migración | `src/main/resources/db/migration/V<n>__create_document.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_document.sql` (en `src/main/resources/db/migration/`)
- [ ] `Document.java`: la entidad (la tabla en Java)
- [ ] `DocumentRepository.java`: acceso a la base de datos
- [ ] `DocumentRequest.java`: lo que llega del frontend al **crear**
- [ ] `DocumentPatch.java`: lo que llega del frontend al **modificar**
- [ ] `DocumentResponse.java`: lo que se devuelve al frontend
- [ ] `DocumentService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `DocumentController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Documento")`)
- [ ] `DocumentControllerTest.java` en `src/test/java/com/penaelchole/backend/document/`
- [ ] Marcar la casilla de `Documento` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `contenido` | `content` | `String` | `content` | `TEXT` |  |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `es_plantilla` | `template` | `boolean` | `template` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `fecha` | `date` | `LocalDate (¡revisar!)` | `date` | `DATE` | el frontend lo manda a veces con hora y a veces sin ella. Ver notas. |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `plantilla_id` | `templateId` | `String` | `template_id` | `VARCHAR(36)` | id de un `Documento` (tabla `document`). Clave foránea, ver la guía |
| `responsable` | `responsible` | `String` | `responsible` | `TEXT` |  |
| `tipo` | `type` | `String` | `type` | `TEXT` |  |
| `url` | `url` | `String` | `url` | `TEXT` | URL (normalmente de un archivo subido) |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Documento`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Documento` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/Documento` | crear |
| `update` | `PATCH /api/entities/Documento/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/Documento/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-fecha`

Archivos del frontend que usan `Documento`:

- `src/components/layout/GlobalSearch.jsx`
- `src/components/secretaria/GestionDocumentalContent.jsx`
- `src/components/secretaria/RellenarPlantillaDialog.jsx`
- `src/components/secretaria/RellenarPlantillaEstructurada.jsx`
- `src/pages/GestionDocumental.jsx`

## Cosas a tener en cuenta

- `fecha` llega a veces con hora y a veces solo con el día (`"YYYY-MM-DD"`). Mira `GestionDocumentalContent.jsx` y decide un formato.
- `contenido` puede ser un texto largo (el cuerpo de una plantilla): usa `TEXT` en la migración.
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-fecha` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
