# `IAConversacion` → paquete `aiconversation`

> Mensajes de la conversación con la IA en el panel "IA Creador" de Admin.

**Fase del ROADMAP:** Phase 11: The rest

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `IAConversacion`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `IAConversacion` |
| Endpoint | `/api/entities/IAConversacion` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.aiconversation` |
| Tabla en la base de datos | `ai_conversation` |
| Migración | `src/main/resources/db/migration/V<n>__create_ai_conversation.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_ai_conversation.sql` (en `src/main/resources/db/migration/`)
- [ ] `AiConversation.java`: la entidad (la tabla en Java)
- [ ] `AiConversationRepository.java`: acceso a la base de datos
- [ ] `AiConversationRequest.java`: lo que llega del frontend al **crear**
- [ ] `AiConversationPatch.java`: lo que llega del frontend al **modificar**
- [ ] `AiConversationResponse.java`: lo que se devuelve al frontend
- [ ] `AiConversationService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `AiConversationController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/IAConversacion")`)
- [ ] `AiConversationControllerTest.java` en `src/test/java/com/penaelchole/backend/aiconversation/`
- [ ] Marcar la casilla de `IAConversacion` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `rol` | `role` | `String` | `role` | `TEXT` |  |
| `texto` | `text` | `String` | `text` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `IAConversacion`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/IAConversacion` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/IAConversacion` | crear |
| `delete` | `DELETE /api/entities/IAConversacion/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `created_date`

Archivos del frontend que usan `IAConversacion`:

- `src/components/admin/IACreador.jsx`

## Cosas a tener en cuenta

- Depende de la parte de IA del backend (`/api/ai/llm`), que es opcional. Déjala para el final.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=created_date` devuelve el orden correcto.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
