# `NotaPersonal` → paquete `personalnote`

> Nota privada de un integrante. Solo la debe ver su dueño.

**Fase del ROADMAP:** Phase 11: The rest

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `NotaPersonal`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `NotaPersonal` |
| Endpoint | `/api/entities/NotaPersonal` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.personalnote` |
| Tabla en la base de datos | `personal_note` |
| Migración | `src/main/resources/db/migration/V<n>__create_personal_note.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_personal_note.sql` (en `src/main/resources/db/migration/`)
- [ ] `PersonalNote.java`: la entidad (la tabla en Java)
- [ ] `PersonalNoteRepository.java`: acceso a la base de datos
- [ ] `PersonalNoteRequest.java`: lo que llega del frontend al **crear**
- [ ] `PersonalNotePatch.java`: lo que llega del frontend al **modificar**
- [ ] `PersonalNoteResponse.java`: lo que se devuelve al frontend
- [ ] `PersonalNoteService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `PersonalNoteController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/NotaPersonal")`)
- [ ] `PersonalNoteControllerTest.java` en `src/test/java/com/penaelchole/backend/personalnote/`
- [ ] Marcar la casilla de `NotaPersonal` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `contenido` | `content` | `String` | `content` | `TEXT` |  |
| `integrante_id` | `memberId` | `String` | `member_id` | `VARCHAR(36)` | id de un `Integrante` (tabla `member`). Clave foránea, ver la guía |
| `titulo` | `title` | `String` | `title` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `NotaPersonal`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `filter` | `GET /api/entities/NotaPersonal?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/NotaPersonal` | crear |
| `update` | `PATCH /api/entities/NotaPersonal/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/NotaPersonal/{id}` | borrar uno |

- **Filtros:** `integrante_id`
- **Orden (`sort`):** —

Archivos del frontend que usan `NotaPersonal`:

- `src/components/notas/NotasBubble.jsx`
- `src/components/notas/NotasButton.jsx`
- `src/pages/NotasPersonales.jsx`

## Cosas a tener en cuenta

- **Son notas privadas**: un usuario solo debe poder ver, editar y borrar las suyas. No te fíes del `integrante_id` que manda el frontend: compáralo con el id del usuario que viene en el token (mira cómo lo hace `UserAccountService`).
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `integrante_id` devuelve solo las filas que coinciden.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
