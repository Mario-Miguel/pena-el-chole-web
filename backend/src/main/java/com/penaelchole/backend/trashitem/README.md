# `Papelera` → paquete `trashitem`

> Papelera: copia en texto JSON de algo que se ha borrado, para poder recuperarlo.

**Fase del ROADMAP:** Phase 11: The rest

Antes de empezar, lee la [guía paso a paso](../../../../../../../GUIA_ENTIDADES.md). Este archivo solo explica lo que es **especial** de `Papelera`.
Como ejemplo de una entidad ya terminada, mira el paquete [`appconfig`](../appconfig) (sencilla) o [`notification`](../notification) (con listas `jsonb`).

## Nombres

| Qué | Nombre |
| --- | --- |
| Nombre en el frontend y en la URL | `Papelera` |
| Endpoint | `/api/entities/Papelera` |
| Paquete Java (esta carpeta) | `com.penaelchole.backend.trashitem` |
| Tabla en la base de datos | `trash_item` |
| Migración | `src/main/resources/db/migration/V<n>__create_trash_item.sql` (con `<n>` = siguiente número libre) |

## Archivos que tienes que crear (en esta carpeta)

- [ ] Migración `V<n>__create_trash_item.sql` (en `src/main/resources/db/migration/`)
- [ ] `TrashItem.java`: la entidad (la tabla en Java)
- [ ] `TrashItemRepository.java`: acceso a la base de datos
- [ ] `TrashItemRequest.java`: lo que llega del frontend al **crear**
- [ ] `TrashItemPatch.java`: lo que llega del frontend al **modificar**
- [ ] `TrashItemResponse.java`: lo que se devuelve al frontend
- [ ] `TrashItemService.java`: la lógica (con `@Service` y `@Transactional`)
- [ ] `TrashItemController.java`: los endpoints (con `@RestController` y `@RequestMapping("/api/entities/Papelera")`)
- [ ] `TrashItemControllerTest.java` en `src/test/java/com/penaelchole/backend/trashitem/`
- [ ] Marcar la casilla de `Papelera` en `ROADMAP.md`

## Campos

Además de estos, todas las entidades tienen `id`, `created_date`, `updated_date` y `created_by_id`, que vienen de `BaseEntity` (no los declares otra vez, pero **sí** tienen que estar en la migración).

| JSON (frontend) | Campo Java | Tipo Java | Columna SQL | Tipo SQL | Notas |
| --- | --- | --- | --- | --- | --- |
| `datos_json` | `dataJson` | `String` | `data_json` | `TEXT` | texto que contiene JSON (el frontend hace `JSON.stringify`) |
| `descripcion` | `description` | `String` | `description` | `TEXT` |  |
| `eliminado_por` | `deletedBy` | `String` | `deleted_by` | `TEXT` |  |
| `entidad` | `entity` | `String` | `entity` | `TEXT` |  |

> Los tipos salen de mirar lo que envía el frontend, pero el roadmap avisa de que la lista de campos puede estar incompleta: algunos campos solo se leen. Antes de escribir la migración, abre los archivos de abajo y busca `Papelera`.

## Qué usa el frontend

| Método en el frontend | Endpoint | Para qué |
| --- | --- | --- |
| `list` | `GET /api/entities/Papelera` | listar (con `sort`, `limit`, `skip`) |
| `create` | `POST /api/entities/Papelera` | crear |
| `delete` | `DELETE /api/entities/Papelera/{id}` | borrar uno |

- **Filtros:** —
- **Orden (`sort`):** `-created_date`

Archivos del frontend que usan `Papelera`:

- `src/components/comunidad/SugerenciasContent.jsx`
- `src/components/galeria/FolderView.jsx`
- `src/components/resultados/ResultadoAnioCard.jsx`
- `src/pages/Admin.jsx`
- `src/pages/Cerveza.jsx`
- `src/pages/Sugerencias.jsx`

## Cosas a tener en cuenta

- `datos_json` es **texto** con el objeto borrado convertido con `JSON.stringify`. Guárdalo como `TEXT`.
- El frontend **no** modifica nunca esta entidad (no hay `update`). El endpoint PATCH tiene que existir igualmente (lo exige `BaseEntityController`), pero puede ser muy simple.

## Tests mínimos

- [ ] Sin token → `401`.
- [ ] Crear con los datos que manda el frontend → `201`, y la respuesta trae las claves en español.
- [ ] `GET` por id → `200`; con un id que no existe → `404`.
- [ ] Ordenar con `sort=-created_date` devuelve el orden correcto.
- [ ] Borrar → `204` y ya no existe. Si está protegido, un usuario normal recibe `403`.
