# `ChatMensaje` → paquete `chatmessage`

> Mensaje del chat dentro de un grupo, con adjuntos y reacciones.

**Fase del ROADMAP:** Phase 8: Community & chat

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `ChatMensaje`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

> **Antes de empezar:** esta entidad apunta a `ChatGrupo`. Hazla(s) primero, porque la clave foránea de la migración necesita que la otra tabla exista.

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `ChatMensaje` |
| Endpoint | `/api/entities/ChatMensaje` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.chatmessage` |
| Tabla en la base de datos | `chat_message` |
| Migración | `src/main/resources/db/migration/V<n>__create_chat_message.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_chat_message.sql` (en `src/main/resources/db/migration/`)
- [ ] `ChatMessage.java`: la entidad (la tabla en Java)
- [ ] `ChatMessageRepository.java`: acceso a la base de datos
- [ ] `ChatMessageRequest.java`: lo que llega del frontend al **crear**
- [ ] `ChatMessagePatch.java`: lo que llega del frontend al **modificar**
- [ ] `ChatMessageResponse.java`: lo que se devuelve al frontend
- [ ] `ChatMessageService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `ChatMessageController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/ChatMensaje")`)
- [ ] `ChatMessageControllerTest.java` en `src/test/java/com/penaelchole/backend/chatmessage/`
- [ ] Marcar la casilla de `ChatMensaje` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `adjunto_tipo` | `attachmentType` | `String` | `attachment_type` | `TEXT` |  |
| `adjunto_url` | `attachmentUrl` | `String` | `attachment_url` | `TEXT` | URL (normalmente de un archivo subido) |
| `autor_id` | `authorId` | `String` | `author_id` | `VARCHAR(36)` | id de un `Integrante` (tabla `member`). Clave foránea, ver la guía |
| `autor_nombre` | `authorName` | `String` | `author_name` | `TEXT` |  |
| `grupo_id` | `groupId` | `String` | `group_id` | `VARCHAR(36)` | id de un `ChatGrupo` (tabla `chat_group`). Clave foránea, ver la guía |
| `pie_texto` | `caption` | `String` | `caption` | `TEXT` |  |
| `reacciones` | `reactions` | `Map<String, List<String>>` | `reactions` | `JSONB NOT NULL DEFAULT '{}'::jsonb` | objeto `{ "👍": [ids…], "❤️": [ids…] }`: emoji → ids de quien reaccionó. Ver "Listas y objetos (jsonb)" en la guía |
| `texto` | `text` | `String` | `text` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `ChatMensaje`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/ChatMensaje` | listar (con `sort`, `limit`, `skip`) |
| `filter` | `GET /api/entities/ChatMensaje?campo=valor` | listar filtrando por igualdad |
| `create` | `POST /api/entities/ChatMensaje` | crear |
| `update` | `PATCH /api/entities/ChatMensaje/{id}` | modificar algunos campos |
| `delete` | `DELETE /api/entities/ChatMensaje/{id}` | borrar uno |
| `subscribe` | `GET /api/events` (SSE) | avisos en tiempo real |

- **Filtros:** `grupo_id`
- **Orden (`sort`):** `-created_date`, `created_date`

Archivos del frontend que usan `ChatMensaje`:

- `src/components/inicio/WidgetsDashboard.jsx`
- `src/components/notifications/NotificationBell.jsx`
- `src/pages/Admin.jsx`
- `src/pages/Chat.jsx`

## Cosas a tener en cuenta

- `reacciones` es un objeto, no una lista: `{ "👍": ["id1", "id2"] }`. En Java: `Map<String, List<String>>` en una columna `jsonb`.
- El frontend pide los mensajes en los dos órdenes (`created_date` y `-created_date`).
- Necesita **tiempo real**: es el caso más importante (ver `Tarea`).
- Tiene campos de tipo lista/objeto guardados como `jsonb`: necesitan `@JdbcTypeCode(SqlTypes.JSON)` y `@NotFilterable` en la entidad, y un lector especial en el `Patch`. Hay un ejemplo completo en `notification/Notification.java` (campo `readBy`).
- Tiene ids de otras entidades: añade la clave foránea en la migración (`REFERENCES tabla(id)`). Decide qué pasa si se borra la fila a la que apunta (`ON DELETE CASCADE` o `ON DELETE SET NULL`). Ver la guía.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Filtrar por `grupo_id` devuelve solo las filas que coinciden.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] Ordenar con `sort=created_date` devuelve el orden correcto.
- [ ] `PATCH` de un campo → `200` y el cambio **se ha guardado** (haz un `GET` después, o mira el repositorio).
- [ ] `PATCH` sin un campo → ese campo no cambia.
- [ ] Los campos `jsonb` se guardan y se devuelven igual (listas vacías, con elementos, y con `null`).
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
