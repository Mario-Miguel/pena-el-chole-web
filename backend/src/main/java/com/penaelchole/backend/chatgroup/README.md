# `ChatGrupo` → paquete `chatgroup`

> Grupo (sala) del chat: general, privado o de bot, con sus participantes.

**Fase del ROADMAP:** Phase 8: Community & chat

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `ChatGrupo`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `ChatGrupo` |
| Endpoint | `/api/entities/ChatGrupo` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.chatgroup` |
| Tabla en la base de datos | `chat_group` |
| Migración | `src/main/resources/db/migration/V<n>__create_chat_group.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_chat_group.sql` (en `src/main/resources/db/migration/`)
- [ ] `ChatGroup.java`: la entidad (la tabla en Java)
- [ ] `ChatGroupRepository.java`: acceso a la base de datos
- [ ] `ChatGroupRequest.java`: lo que llega del frontend al **crear**
- [ ] `ChatGroupPatch.java`: lo que llega del frontend al **modificar**
- [ ] `ChatGroupResponse.java`: lo que se devuelve al frontend
- [ ] `ChatGroupService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `ChatGroupController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/ChatGrupo")`)
- [ ] `ChatGroupControllerTest.java` en `src/test/java/com/penaelchole/backend/chatgroup/`
- [ ] Marcar la casilla de `ChatGrupo` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `avatar_url` | `avatarUrl` | `String` | `avatar_url` | `TEXT` | URL (normalmente de un archivo subido) |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `es_bot` | `bot` | `boolean` | `bot` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `es_general` | `general` | `boolean` | `general` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `es_privado` | `privateGroup` | `boolean` | `private_group` | `BOOLEAN NOT NULL DEFAULT false` |  |
| `nombre` | `name` | `String` | `name` | `TEXT` |  |
| `participantes` | `participants` | `List<String>` | `participants` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | lista de ids de integrantes. Ver "Listas y objetos (jsonb)" en la guía |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `ChatGrupo`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/ChatGrupo` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/ChatGrupo` | crear |
| `update` | `PATCH /api/entities/ChatGrupo/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/ChatGrupo/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `ChatGrupo`:

- `src/pages/Admin.jsx`
- `src/pages/Chat.jsx`

## Cosas a tener en cuenta

- `participantes` es una lista de ids de integrantes.
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
