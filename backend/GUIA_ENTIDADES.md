# Guía: cómo implementar una entidad en el backend

Esta guía es para quien empieza a trabajar en el backend y no tiene mucha experiencia programando. Explica, paso a paso, cómo pasar una entidad del frontend (por ejemplo `Proveedor`) a una tabla de la base de datos con sus endpoints y sus tests.

Cada entidad pendiente tiene una carpeta en `src/main/java/com/penaelchole/backend/<paquete>/` con un `README.md`. Ese README dice **qué** hay que hacer para esa entidad (nombres, campos, tipos, filtros y cosas especiales). Esta guía explica **cómo** hacerlo, y vale para todas.

Documentos relacionados:

- [`ROADMAP.md`](ROADMAP.md): el plan y el orden en que conviene hacer las entidades.
- [`API.md`](API.md): el contrato con el frontend (qué endpoints existen y qué devuelven). Si cambias algo del contrato, actualízalo.
- [`README.md`](README.md): cómo arrancar el proyecto.

---

## 1. Antes de empezar

### Conceptos

| Palabra | Qué es |
| --- | --- |
| **Entidad** | Un tipo de dato de la app: `Proveedor`, `Cuota`, `Tarea`… En Java es una clase; en la base de datos, una tabla. |
| **Migración** | Un archivo `.sql` que crea o cambia tablas. Flyway los ejecuta en orden (`V1`, `V2`…) al arrancar la app. |
| **Repository** | La clase que lee y escribe en la base de datos. Spring la crea sola a partir de una interfaz. |
| **Service** | La lógica: valida, transforma y llama al repository. |
| **Controller** | Recibe las peticiones HTTP del frontend (`GET`, `POST`, `PATCH`, `DELETE`) y llama al service. |
| **DTO** (`Request`, `Patch`, `Response`) | Clases que representan el JSON que entra y sale. Separan lo que ve el frontend de cómo se guarda. |
| **Test** | Código que llama a los endpoints y comprueba que responden lo que deben. |

Una petición recorre siempre el mismo camino:

```
frontend → Controller → Service → Repository → base de datos
                                     ↓
frontend ← Response ←─────────── Service
```

### Idiomas: inglés por dentro, español por fuera

- **Código, tablas y columnas en inglés**: clase `Supplier`, tabla `supplier`, campo `name`.
- **Lo que ve el frontend en español**: URL `/api/entities/Proveedor` y JSON con claves como `nombre`.
- Se traducen con dos anotaciones:
  - `@JsonProperty("nombre")` en los DTOs (`Request`, `Response`).
  - `@ApiName("nombre")` en el campo de la entidad, para que funcionen los filtros (`?nombre=...`) y el orden (`sort=nombre`).

El README de cada entidad ya trae una tabla con el nombre en inglés de cada campo.

### Arrancar el proyecto y los tests

Necesitas Docker abierto.

```bash
cd backend
docker compose up -d          # base de datos local
./mvnw spring-boot:run        # arranca la API en http://localhost:8080
./mvnw test                   # todos los tests
./mvnw test -Dtest=SupplierControllerTest   # solo los de una clase
```

### Mira primero el frontend

El README de la entidad lista los archivos del frontend que la usan. Ábrelos y busca el nombre de la entidad (por ejemplo `Proveedor`). Fíjate en:

- **Qué campos se envían** en `create(...)` y `update(...)`, y con qué valores.
- **Qué formato tienen las fechas**: `"2026-03-01"` (solo día) o `"2026-03-01T18:30:00.000Z"` (día y hora).
- **Si a veces se manda `""` (texto vacío) o `null`.**
- **Quién puede hacer cada cosa**: si un botón solo aparece cuando `puedeConfigurar` es verdadero, esa acción es solo para admins.

---

## 2. Los pasos

Como ejemplo usaremos una entidad inventada, `Herramienta` (en inglés `Tool`), con estos campos:

| JSON | Java | Tipo |
| --- | --- | --- |
| `nombre` | `name` | texto, obligatorio |
| `precio` | `price` | dinero |
| `prestada` | `lent` | sí/no |
| `fecha_compra` | `purchaseDate` | fecha (solo día) |

Sustituye los nombres por los de tu entidad. Si te pierdes, compara con un paquete que ya funciona: [`appconfig`](src/main/java/com/penaelchole/backend/appconfig) (el más sencillo) o [`notification`](src/main/java/com/penaelchole/backend/notification) (con listas y fechas).

### Paso 1: la migración

Crea `src/main/resources/db/migration/V<n>__create_tool.sql`, donde `<n>` es el siguiente número libre (mira qué hay en esa carpeta: si el último es `V6__...`, el tuyo es `V7__...`). Hay **dos guiones bajos** después del número.

```sql
CREATE TABLE tool (
    -- Columnas comunes (BaseEntity): ponlas SIEMPRE
    id             VARCHAR(36)   PRIMARY KEY,
    created_date   TIMESTAMPTZ   NOT NULL,
    updated_date   TIMESTAMPTZ   NOT NULL,
    created_by_id  VARCHAR(36),

    -- Columnas de la entidad
    name           TEXT          NOT NULL,
    price          NUMERIC(10, 2),
    lent           BOOLEAN       NOT NULL DEFAULT false,
    purchase_date  DATE
);
```

Reglas:

- **Nunca modifiques una migración que ya se ha ejecutado** (en tu base de datos o en la de otra persona). Flyway guarda una "huella" de cada archivo y, si cambia, la app no arranca. Si te equivocas, crea otra migración nueva que lo corrija (`ALTER TABLE ...`).
  - Excepción: si la migración es tuya, todavía no la has subido a git y solo se ha ejecutado en tu ordenador, puedes cambiarla y borrar tu base de datos local con `docker compose down -v && docker compose up -d`.
- **Nombres en inglés y en `snake_case`**: `purchase_date`, no `purchaseDate` ni `fecha_compra`.
- **`NOT NULL`** solo en lo que el frontend siempre manda (y en los `BOOLEAN`, con `DEFAULT false`). Si dudas, déjalo sin `NOT NULL`.
- No uses como nombre de columna palabras reservadas de SQL como `user`, `order` o `group`. Usa `user_name`, `sort_order`, `group_id`…

Los tipos SQL que corresponden a cada tipo Java están en la [tabla de tipos](#3-tabla-de-tipos).

### Paso 2: la entidad

`Tool.java` en la carpeta de la entidad:

```java
package com.penaelchole.backend.tool;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.penaelchole.backend.common.ApiName;
import com.penaelchole.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity                                  // esta clase es una tabla (tool)
public class Tool extends BaseEntity {   // hereda id, created_date, updated_date, created_by_id

    @ApiName("nombre")                   // nombre que usa el frontend en filtros y sort
    @Column(nullable = false)
    private String name;

    @ApiName("precio")
    private BigDecimal price;

    @ApiName("prestada")
    @Column(nullable = false)
    private boolean lent;

    @ApiName("fecha_compra")
    private LocalDate purchaseDate;      // Spring lo guarda en la columna purchase_date

    // JPA necesita un constructor vacío. "protected" para que no lo use nadie más.
    protected Tool() {
    }

    public Tool(String name, BigDecimal price, boolean lent, LocalDate purchaseDate) {
        this.name = name;
        this.price = price;
        this.lent = lent;
        this.purchaseDate = purchaseDate;
    }

    // Getters (y setters solo de lo que se pueda cambiar)
    public String getName() { return name; }
    public BigDecimal getPrice() { return price; }
    public boolean isLent() { return lent; }
    public LocalDate getPurchaseDate() { return purchaseDate; }

    /** Aplica un PATCH. Solo cambia los campos que vienen en el JSON. */
    public void applyChanges(ToolPatch changes) {
        if (changes.name() != null) {
            String newName = changes.name().orElse(null);
            if (newName == null || newName.isBlank())
                throw new IllegalArgumentException("El nombre no puede estar vacío");
            this.name = newName;
        }
        if (changes.price() != null)
            this.price = changes.price().orElse(null);
        if (changes.lent() != null)
            this.lent = changes.lent().orElse(false);
        if (changes.purchaseDate() != null)
            this.purchaseDate = changes.purchaseDate().orElse(null);
    }
}
```

`applyChanges` se explica en el [paso 5](#paso-5-el-patch).

### Paso 3: el repository

`ToolRepository.java`. Solo es una interfaz; Spring escribe el código por ti:

```java
package com.penaelchole.backend.tool;

import com.penaelchole.backend.common.BaseRepository;

public interface ToolRepository extends BaseRepository<Tool> {
}
```

`BaseRepository` ya trae `findAll`, `findById`, `save`, `deleteById` y los filtros. Si alguna vez necesitas una búsqueda concreta, Spring la crea a partir del nombre del método: `Optional<Tool> findByName(String name)`. Para varias condiciones, únelas con `And`: `findByNameAndLent(...)`.

### Paso 4: Request y Response

`ToolRequest.java`: lo que llega del frontend al **crear** (`POST`).

```java
package com.penaelchole.backend.tool;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ToolRequest(
        @JsonProperty("nombre") @NotBlank(message = "El nombre no puede estar vacío") String name,
        @JsonProperty("precio") BigDecimal price,
        @JsonProperty("prestada") Boolean lent,       // Boolean (con mayúscula), NO boolean
        @JsonProperty("fecha_compra") LocalDate purchaseDate) {
}
```

- **Usa `Boolean`, `Integer`… (con mayúscula) en el `Request`**, no `boolean` o `int`. Si el frontend no manda ese campo, con `boolean` la petición falla con un 400 vacío. Con `Boolean` llega `null` y en el service decides el valor por defecto.
- **`@NotBlank`** solo en lo que de verdad es obligatorio. Antes de ponerlo, comprueba que el frontend nunca manda ese campo vacío.

`ToolResponse.java`: lo que se **devuelve** al frontend.

```java
package com.penaelchole.backend.tool;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record ToolResponse(
        String id,
        @JsonProperty("nombre") String name,
        @JsonProperty("precio") BigDecimal price,
        @JsonProperty("prestada") boolean lent,
        @JsonProperty("fecha_compra") LocalDate purchaseDate,
        Instant createdDate,        // sale como created_date gracias a @JsonNaming
        Instant updatedDate,
        String createdById) {

    public static ToolResponse from(Tool t) {
        return new ToolResponse(
                t.getId(), t.getName(), t.getPrice(), t.isLent(), t.getPurchaseDate(),
                t.getCreatedDate(), t.getUpdatedDate(), t.getCreatedById());
    }
}
```

### Paso 5: el Patch

Un `PATCH` modifica **solo** los campos que vienen en el JSON. Por eso cada campo puede estar en tres situaciones, y el `Patch` las distingue con `Optional`:

| JSON recibido | Valor en Java | Qué significa |
| --- | --- | --- |
| `{}` (no viene `precio`) | `null` | no tocar el precio |
| `{"precio": null}` | `Optional.empty()` | borrar el precio |
| `{"precio": 12.5}` | `Optional.of(12.5)` | cambiar el precio |

Por eso en `applyChanges` siempre se pregunta primero `if (changes.price() != null)`. **Si te olvidas de ese `if` y llamas directamente a `changes.price().orElse(...)`, la app falla con un `NullPointerException` (error 500)** en cuanto el campo no venga.

`ToolPatch.java`:

```java
package com.penaelchole.backend.tool;

import static com.penaelchole.backend.common.PatchFields.bool;
import static com.penaelchole.backend.common.PatchFields.date;
import static com.penaelchole.backend.common.PatchFields.decimal;
import static com.penaelchole.backend.common.PatchFields.text;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import tools.jackson.databind.JsonNode;

public record ToolPatch(
        Optional<String> name,
        Optional<BigDecimal> price,
        Optional<Boolean> lent,
        Optional<LocalDate> purchaseDate) {

    // Las claves son las del frontend (español, snake_case)
    public static ToolPatch from(JsonNode json) {
        return new ToolPatch(
                text(json, "nombre"),
                decimal(json, "precio"),
                bool(json, "prestada"),
                date(json, "fecha_compra"));
    }
}
```

Los lectores (`text`, `integer`, `bool`, `date`, `instant`, `stringList`) están en `common/PatchFields.java`. Si te falta uno, añádelo allí siguiendo el mismo patrón. Por ejemplo, para dinero todavía no existe `decimal`:

```java
public static Optional<BigDecimal> decimal(JsonNode json, String name) {
    return field(json, name, JsonNode::decimalValue);
}
```

**Campos que no se pueden cambiar.** Si un campo no debe modificarse después de crearlo (por ejemplo, el autor de un mensaje), **recházalo** con un error en `applyChanges`; no lo ignores en silencio. Si lo ignoras, el frontend recibe un 200 y cree que se ha guardado. Ejemplo en `notification/Notification.java`:

```java
if (changes.title() != null && !changes.title().map(title::equals).orElse(false))
    throw new IllegalArgumentException("El titulo no se puede modificar");
```

### Paso 6: el Service

`ToolService.java`:

```java
package com.penaelchole.backend.tool;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.penaelchole.backend.common.BaseEntityService;
import com.penaelchole.backend.common.Filters;
import com.penaelchole.backend.common.ListQuery;
import com.penaelchole.backend.common.ResourceNotFoundException;

@Service   // ¡imprescindible! Sin esto la app no arranca
public class ToolService implements BaseEntityService<ToolRequest, ToolResponse, ToolPatch> {

    private final ToolRepository repository;

    public ToolService(ToolRepository repository) {   // Spring pasa el repository solo
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ToolResponse> list(ListQuery query) {
        return repository.findAll(Filters.<Tool>byEquality(query.filters()), query.toPageable(Tool.class))
                .map(ToolResponse::from).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ToolResponse get(String id) {
        return ToolResponse.from(find(id));
    }

    @Override
    @Transactional
    public ToolResponse insert(ToolRequest request) {
        return ToolResponse.from(repository.saveAndFlush(toEntity(request)));
    }

    @Override
    @Transactional
    public List<ToolResponse> bulkInsert(List<ToolRequest> requests) {
        List<Tool> tools = requests.stream().map(ToolService::toEntity).toList();
        return repository.saveAllAndFlush(tools).stream().map(ToolResponse::from).toList();
    }

    @Override
    @Transactional   // ¡imprescindible! Sin esto el PATCH responde bien pero NO guarda nada
    public ToolResponse update(String id, ToolPatch changes) {
        Tool tool = find(id);
        tool.applyChanges(changes);   // no hace falta llamar a save(): al acabar la transacción se guarda solo
        return ToolResponse.from(tool);
    }

    @Override
    @Transactional
    public void delete(String id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public void bulkDelete(List<String> ids) {
        repository.deleteAllById(ids);
    }

    private Tool find(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Herramienta no encontrada"));   // → 404
    }

    private static Tool toEntity(ToolRequest r) {
        return new Tool(
                r.name(),
                r.price(),
                Boolean.TRUE.equals(r.lent()),   // null → false
                r.purchaseDate());
    }
}
```

Para devolver un error al frontend no hace falta nada especial: lanza una excepción y `GlobalExceptionHandler` la convierte en una respuesta `{ "message": "..." }`:

| Excepción | Código HTTP |
| --- | --- |
| `IllegalArgumentException("mensaje")` | 400 (datos incorrectos) |
| `ResourceNotFoundException("mensaje")` | 404 (no existe) |
| `AccessDeniedException("mensaje")` | 403 (no tienes permiso) |
| Se viola un `UNIQUE` o una clave foránea de la base de datos | 409 (conflicto) |

### Paso 7: el Controller

`ToolController.java`:

```java
package com.penaelchole.backend.tool;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.penaelchole.backend.common.BaseEntityController;
import com.penaelchole.backend.common.DeleteManyRequest;
import com.penaelchole.backend.common.ListQuery;

import tools.jackson.databind.JsonNode;

@RestController                                  // ¡imprescindible! Sin esto el endpoint da 404
@RequestMapping("/api/entities/Herramienta")     // el nombre EXACTO que usa el frontend
public class ToolController implements BaseEntityController<ToolRequest, ToolResponse> {

    private final ToolService service;

    public ToolController(ToolService service) {
        this.service = service;
    }

    @Override
    public List<ToolResponse> list(ListQuery query) { return service.list(query); }

    @Override
    public ToolResponse get(String id) { return service.get(id); }

    @Override
    public ToolResponse insert(ToolRequest request) { return service.insert(request); }

    @Override
    @PreAuthorize("hasRole('ADMIN')")            // solo admins
    public List<ToolResponse> bulkCreate(List<ToolRequest> request) { return service.bulkInsert(request); }

    @Override
    public ToolResponse update(String id, JsonNode changes) {
        return service.update(id, ToolPatch.from(changes));
    }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(String id) { service.delete(id); }

    @Override
    @PreAuthorize("hasRole('ADMIN')")
    public void bulkDelete(DeleteManyRequest request) { service.bulkDelete(request.ids()); }
}
```

Las rutas (`@GetMapping`, `@PostMapping`…) ya están definidas en `BaseEntityController`; aquí solo se rellena qué hace cada una.

**Permisos.** Todos los endpoints exigen haber iniciado sesión. Para restringir uno a admins, añade `@PreAuthorize("hasRole('ADMIN')")`. En el backend, "admin" es lo mismo que `puedeConfigurar` en el frontend: el usuario `__admin__`, el presidente o el vicepresidente. Mira en el frontend quién ve el botón de cada acción:

- **Si cualquiera puede hacerlo** (crear una sugerencia, marcar algo como leído…), no pongas `@PreAuthorize`.
- **Si solo lo hace un admin** (borrar, configurar…), ponlo.
- **`bulkCreate` y `delete-many`** solo los usa la copia de seguridad, así que normalmente van solo para admins. El README de la entidad avisa si el frontend los usa para otra cosa.

### Paso 8: los tests

Crea `src/test/java/com/penaelchole/backend/tool/ToolControllerTest.java`. Copia la estructura de `appconfig/AppConfigControllerTest.java`, que tiene ejemplos de todo: token de usuario normal y de admin, crear, filtrar, PATCH y borrar. El esqueleto es este:

```java
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)   // arranca un PostgreSQL de pruebas en Docker
class ToolControllerTest {

    private static final String URL = "/api/entities/Herramienta";

    @Autowired MockMvc mockMvc;
    @Autowired ToolRepository repository;
    @Autowired TokenService tokenService;

    @BeforeEach
    void setUp() {
        repository.deleteAll();   // cada test empieza con la tabla vacía
    }

    private String userToken() {
        return tokenService.createToken(new UserSession("pepe", "Pepe", "vocal", null, false));
    }

    @Test
    void createReturnsSpanishKeys() throws Exception {
        mockMvc.perform(post(URL)
                        .header("Authorization", "Bearer " + userToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre": "Taladro", "precio": 49.90, "prestada": false, "fecha_compra": "2026-03-01"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Taladro"))
                .andExpect(jsonPath("$.fecha_compra").value("2026-03-01"));
    }
}
```

Consejos:

- **Copia el JSON de lo que manda el frontend de verdad**, con sus `""` y sus `null`. Así los tests encuentran los problemas reales.
- **Después de un `PATCH`, comprueba que se ha guardado** leyendo otra vez de la base de datos (`repository.findById(...)`), no solo la respuesta.
- **Prueba también los errores**: id que no existe (404), datos vacíos (400) y usuario sin permiso (403).

### Paso 9: terminar

- [ ] `./mvnw test` pasa entero (no solo tus tests).
- [ ] Arranca el backend y el frontend (`pnpm run dev` en la raíz) y prueba la página que usa la entidad.
- [ ] Marca la casilla de la entidad en `ROADMAP.md`.
- [ ] Si has cambiado algo del contrato (un endpoint nuevo o una regla especial), apúntalo en `API.md`.

---

## 3. Tabla de tipos

| Lo que manda el frontend | Tipo Java (entidad) | Tipo SQL (migración) | Notas |
| --- | --- | --- | --- |
| Texto | `String` | `TEXT` | |
| Id de otra entidad (`integrante_id`…) | `String` | `VARCHAR(36)` | Ver [claves foráneas](#claves-foráneas-campos-_id) |
| Número entero (cantidades, años) | `Integer` | `INTEGER` | |
| Dinero (`importe`, `precio`, `coste`) | `BigDecimal` | `NUMERIC(10, 2)` | **Nunca** `double`: 0.1 + 0.2 = 0.30000000000000004 |
| Sí/no | `boolean` | `BOOLEAN NOT NULL DEFAULT false` | En el `Request`, `Boolean` |
| Fecha sin hora `"2026-03-01"` | `LocalDate` | `DATE` | |
| Fecha con hora `"2026-03-01T18:30:00.000Z"` | `Instant` | `TIMESTAMPTZ` | |
| Lista `["a", "b"]` | `List<String>` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | Ver [listas y objetos](#listas-y-objetos-jsonb) |
| Lista de objetos `[{...}, {...}]` | `List<Map<String, Object>>` | `JSONB NOT NULL DEFAULT '[]'::jsonb` | |
| Objeto `{ "clave": [...] }` | `Map<String, List<String>>` (según la forma) | `JSONB NOT NULL DEFAULT '{}'::jsonb` | |
| Texto que contiene JSON (`JSON.stringify(...)`) | `String` | `TEXT` | No es `jsonb`: el frontend ya lo convierte en texto |

---

## 4. Casos especiales

### Fechas

- Mira **siempre** qué formato manda el frontend. Si usa `new Date().toISOString()` lleva hora (`Instant`). Si usa `toISOString().split("T")[0]`, `format(fecha, "yyyy-MM-dd")` o un `<input type="date">`, es solo el día (`LocalDate`).
- Muchos formularios mandan `""` (texto vacío) cuando la fecha no se rellena. Eso **no** es una fecha válida: haz un test con `""` para ver qué pasa. En el `Patch`, el lector `date(...)` devuelve un error 400 con `""`; si quieres que cuente como `null`, cámbialo en `PatchFields`.

### Listas y objetos (jsonb)

Para guardar una lista u objeto en una sola columna:

**Migración:**

```sql
photos JSONB NOT NULL DEFAULT '[]'::jsonb,
```

**Entidad:**

```java
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@ApiName("fotos")
@NotFilterable                          // no se puede filtrar ni ordenar por una lista
@JdbcTypeCode(SqlTypes.JSON)            // le dice a Hibernate que lo guarde como JSON
@Column(nullable = false, columnDefinition = "jsonb")
private List<String> photos = new ArrayList<>();
```

- **Al asignar, haz una copia:** `this.photos = new ArrayList<>(nuevas)`. Si guardas la lista que te pasan, alguien puede cambiarla desde fuera.
- **Al devolverla, devuelve una copia que no se pueda modificar:** `return List.copyOf(photos);`.
- **En el constructor, convierte `null` en lista vacía:** `this.photos = photos == null ? new ArrayList<>() : new ArrayList<>(photos);`.
- **En el `Patch`:**
  - Para `List<String>` usa `stringList(json, "fotos")`.
  - Para listas de objetos todavía no hay lector en `PatchFields`: hay que añadir uno. Pide ayuda la primera vez.

El ejemplo completo es `notification/Notification.java` (campo `readBy`, que en el frontend es `leida_por`).

### Claves foráneas (campos `*_id`)

Cuando un campo guarda el id de otra entidad (`integrante_id`, `vehiculo_id`…), añade en la migración una **clave foránea**. Así la base de datos no deja guardar un id que no existe:

```sql
member_id VARCHAR(36) REFERENCES member(id) ON DELETE CASCADE,
```

¿Qué pasa si se borra la fila a la que apunta?

- **`ON DELETE CASCADE`**: se borra también esta fila. Por ejemplo, si se borra un vehículo, se borran sus piezas.
- **`ON DELETE SET NULL`**: esta fila se queda, pero con el id a `null`. Por ejemplo, si se borra un integrante, se conserva el historial de pagos.
- **Sin nada**: la base de datos **no deja** borrar la fila apuntada mientras haya filas que la usen (error 409).

La tabla a la que apuntas tiene que existir antes: su migración debe tener un número **menor**. Por eso algunas entidades hay que hacerlas después de otras (el README de cada una lo avisa). Los integrantes están en la tabla `member`.

Muchas entidades guardan además el nombre al lado del id (`integrante_nombre`). Es una copia para que el frontend no tenga que buscarlo: guárdalo tal cual, como texto.

### Tiempo real

Algunas entidades (`Tarea`, `Actividad`, `ChatMensaje`…) se actualizan en las pantallas de los demás sin recargar. Esto todavía no existe en el backend. Haz primero el CRUD normal, que funciona igualmente (solo hay que recargar la página para ver los cambios), y deja el tiempo real para más adelante.

---

## 5. Errores frecuentes

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| La app no arranca: `No qualifying bean of type '...Service'` | Falta `@Service` en el service | Añádelo |
| Todas las peticiones dan **404** | Falta `@RestController` o `@RequestMapping` en el controller, o el nombre de la URL no coincide con el del frontend | Revisa las dos anotaciones y el nombre exacto |
| El `PATCH` responde bien pero al recargar no ha cambiado nada | Falta `@Transactional` en `update` | Añádelo |
| `?campo=valor` o `sort=campo` dan **400** "No se puede filtrar/ordenar por…" | Falta `@ApiName("campo")` en la entidad | Añádelo con el nombre en español |
| **500** con `NullPointerException ... because the return value of "...Patch.xxx()" is null` | Usas `changes.xxx()` sin comprobar antes `!= null` | Ver [paso 5](#paso-5-el-patch) |
| **400** con el cuerpo vacío: `Cannot map null into type boolean` | Un `boolean`/`int` (minúscula) en el `Request` y el frontend no manda ese campo | Usa `Boolean`/`Integer` |
| La app no arranca: `Validate failed: Migration checksum mismatch` | Has cambiado una migración que ya se había ejecutado | Deja la migración como estaba y crea otra nueva. Si solo estaba en tu ordenador: `docker compose down -v && docker compose up -d` |
| La app no arranca: `Schema-validation: missing column` o `wrong column type` | La entidad y la migración no coinciden (nombre o tipo) | Compara campo a campo: `purchaseDate` en Java ↔ `purchase_date` en SQL |
| **409** al crear | Se viola un `UNIQUE`, un `NOT NULL` o una clave foránea | Mira el log del backend: dice qué restricción ha fallado |
| Los tests fallan con errores de Docker | Docker no está abierto | Abre Docker Desktop |

Si te atascas, busca el mensaje de error exacto en el log del backend o en la salida de `./mvnw test`: casi siempre dice qué archivo y qué línea fallan.
