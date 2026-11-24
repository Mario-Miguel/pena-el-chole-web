# `Mascota` → paquete `pet`

> Mascota de un integrante.

**Fase del ROADMAP:** Phase 11: The rest

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Mascota`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Mascota` |
| Endpoint | `/api/entities/Mascota` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.pet` |
| Tabla en la base de datos | `pet` |
| Migración | `src/main/resources/db/migration/V<n>__create_pet.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_pet.sql` (en `src/main/resources/db/migration/`)
- [ ] `Pet.java`: la entidad (la tabla en Java)
- [ ] `PetRepository.java`: acceso a la base de datos
- [ ] `PetRequest.java`: lo que llega del frontend al **crear**
- [ ] `PetPatch.java`: lo que llega del frontend al **modificar**
- [ ] `PetResponse.java`: lo que se devuelve al frontend
- [ ] `PetService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `PetController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Mascota")`)
- [ ] `PetControllerTest.java` en `src/test/java/com/penaelchole/backend/pet/`
- [ ] Marcar la casilla de `Mascota` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `duenio_id` | `ownerId` | `String` | `owner_id` | `VARCHAR(36)` | id de un `Integrante` (tabla `member`). Clave foránea, ver la guía |
| `duenio_nombre` | `ownerName` | `String` | `owner_name` | `TEXT` |  |
| `especie` | `species` | `String` | `species` | `TEXT` |  |
| `foto_url` | `photoUrl` | `String` | `photo_url` | `TEXT` | URL (normalmente de un archivo subido) |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `raza` | `breed` | `String` | `breed` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Mascota`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Mascota` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/Mascota` | crear |
| `delete` | `DELETE /api/entities/Mascota/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** —

Archivos del frontend que usan `Mascota`:

- `src/components/integrantes/MascotasPanel.jsx`

## Cosas a tener en cuenta

- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
