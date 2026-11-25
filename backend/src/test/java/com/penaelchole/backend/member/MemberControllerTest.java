package com.penaelchole.backend.member;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.emptyString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;
import com.penaelchole.backend.TestcontainersConfiguration;

/**
 * Arranca la app completa contra un PostgreSQL real en Docker (Testcontainers).
 * Todas las rutas exigen JWT: .with(jwt()) añade uno ya "validado" sin pasar
 * por el JwtDecoder (spring-security-test).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class MemberControllerTest {

        @Autowired
        MockMvc mockMvc;

        @Autowired
        MemberRepository repository;

        @BeforeEach
        void cleanUp() {
                repository.deleteAll();
        }

        @Test
        void listReturnsMembersInSnakeCase() throws Exception {
                Member pepe = new Member("Pepe", "cargos", "tesorero");
                pepe.setBirthDate(LocalDate.of(1990, 5, 17));
                repository.save(pepe);

                mockMvc.perform(get("/api/entities/Integrante").with(jwt()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(1)))
                                .andExpect(jsonPath("$[0].id").value(notNullValue()))
                                .andExpect(jsonPath("$[0].nombre").value("Pepe"))
                                .andExpect(jsonPath("$[0].cargo").value("tesorero"))
                                .andExpect(jsonPath("$[0].cervezas").value(0))
                                .andExpect(jsonPath("$[0].fecha_nacimiento").value("1990-05-17"))
                                .andExpect(jsonPath("$[0].created_date").value(notNullValue()));
        }

        @Test
        void emptyListReturnsEmptyArray() throws Exception {
                mockMvc.perform(get("/api/entities/Integrante").with(jwt()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(0)));
        }

        // --- Rutas de error (GlobalExceptionHandler) ---

        @Test
        void patchUnknownIdReturns404WithMessage() throws Exception {
                mockMvc.perform(patch("/api/entities/Integrante/{id}", "no-existe").with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"nombre": "Juan"}
                                                """))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.message").value("Integrante no encontrado"));
        }

        @Test
        void postWithBlankNameReturns400WithMessage() throws Exception {
                mockMvc.perform(post("/api/entities/Integrante").with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"nombre": "", "cargo": "vocal"}
                                                """))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value(containsString("nombre")));
        }

        @Test
        void patchWithInvalidDateReturns400WithMessage() throws Exception {
                Member pepe = repository.save(new Member("Pepe", "cargos", "tesorero"));

                mockMvc.perform(patch("/api/entities/Integrante/{id}", pepe.getId()).with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"fecha_nacimiento": "no-es-fecha"}
                                                """))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Fecha no valida: no-es-fecha"));
        }

        @Test
        void patchWithBlankNameReturns400WithMessage() throws Exception {
                Member pepe = repository.save(new Member("Pepe", "cargos", "tesorero"));

                mockMvc.perform(patch("/api/entities/Integrante/{id}", pepe.getId()).with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"nombre": ""}
                                                """))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("El nombre no puede estar vacío"));
        }

        @Test
        void patchWithoutNameReturns200() throws Exception {
                Member pepe = repository.save(new Member("Pepe", "cargos", "tesorero"));

                mockMvc.perform(patch("/api/entities/Integrante/{id}", pepe.getId()).with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"cargo": "vocal"}
                                                """))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(pepe.getId()))
                                .andExpect(jsonPath("$.nombre").value("Pepe"))
                                .andExpect(jsonPath("$.categoria").value("cargos"))
                                .andExpect(jsonPath("$.cargo").value("vocal"))
                                .andExpect(jsonPath("$.created_date").value(notNullValue()));
        }

        @Test
        void patchWithExplicitNullClearsField() throws Exception {
                Member pepe = repository.save(new Member("Pepe", "cargos", "tesorero"));

                mockMvc.perform(patch("/api/entities/Integrante/{id}", pepe.getId()).with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"cargo": null}
                                                """))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(pepe.getId()))
                                .andExpect(jsonPath("$.nombre").value("Pepe"))
                                .andExpect(jsonPath("$.categoria").value("cargos"))
                                .andExpect(jsonPath("$.cargo").value(nullValue()))
                                .andExpect(jsonPath("$.created_date").value(notNullValue()));
        }

        // --- GET /{id} ---

        @Test
        void getByIdReturnsMember() throws Exception {
                Member pepe = new Member("Pepe", "cargos", "tesorero");
                pepe.setBirthDate(LocalDate.of(1990, 5, 17));
                repository.save(pepe);

                mockMvc.perform(get("/api/entities/Integrante/{id}", pepe.getId()).with(jwt()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(pepe.getId()))
                                .andExpect(jsonPath("$.nombre").value("Pepe"))
                                .andExpect(jsonPath("$.fecha_nacimiento").value("1990-05-17"));
        }

        @Test
        void getUnknownIdReturns404WithMessage() throws Exception {
                mockMvc.perform(get("/api/entities/Integrante/{id}", "no-existe").with(jwt()))
                                .andExpect(status().isNotFound())
                                .andExpect(jsonPath("$.message").value("Integrante no encontrado"));
        }

        // --- POST (create) ---

        @Test
        void postReturnsSystemDates() throws Exception {
                mockMvc.perform(post("/api/entities/Integrante").with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"nombre": "Ana"}
                                                """))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.created_date").value(notNullValue()))
                                .andExpect(jsonPath("$.updated_date").value(notNullValue()));
        }

        // --- POST /bulk ---

        @Test
        void bulkCreatesAllFieldsInOrder() throws Exception {
                mockMvc.perform(post("/api/entities/Integrante/bulk").with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                [
                                                  {"nombre": "Ana", "categoria": "cargos", "cargo": "tesorero",
                                                   "cervezas": 7, "fecha_nacimiento": "1990-05-17"},
                                                  {"nombre": "Luis"}
                                                ]
                                                """))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$", hasSize(2)))
                                .andExpect(jsonPath("$[0].id").value(notNullValue()))
                                .andExpect(jsonPath("$[0].nombre").value("Ana"))
                                .andExpect(jsonPath("$[0].categoria").value("cargos"))
                                .andExpect(jsonPath("$[0].cargo").value("tesorero"))
                                .andExpect(jsonPath("$[0].cervezas").value(7))
                                .andExpect(jsonPath("$[0].fecha_nacimiento").value("1990-05-17"))
                                .andExpect(jsonPath("$[0].created_date").value(notNullValue()))
                                .andExpect(jsonPath("$[1].nombre").value("Luis"))
                                .andExpect(jsonPath("$[1].cervezas").value(0))
                                .andExpect(jsonPath("$[1].fecha_nacimiento").value(nullValue()));

                assertThat(repository.count()).isEqualTo(2);
        }

        @Test
        void bulkWithOneInvalidItemCreatesNone() throws Exception {
                mockMvc.perform(post("/api/entities/Integrante/bulk").with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                [{"nombre": "Ana"}, {"nombre": ""}]
                                                """))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value(not(emptyString())));

                assertThat(repository.count()).isZero();
        }

        // --- POST /delete-many ---

        @Test
        void deleteManyDeletesOnlyGivenIds() throws Exception {
                Member ana = repository.save(new Member("Ana", null, null));
                Member luis = repository.save(new Member("Luis", null, null));
                Member pepe = repository.save(new Member("Pepe", null, null));

                mockMvc.perform(post("/api/entities/Integrante/delete-many").with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"ids": ["%s", "%s"]}
                                                """.formatted(ana.getId(), luis.getId())))
                                .andExpect(status().isNoContent());

                assertThat(repository.findAll())
                                .extracting(Member::getId)
                                .containsExactly(pepe.getId());
        }

        @Test
        void deleteManyIgnoresUnknownIds() throws Exception {
                Member pepe = repository.save(new Member("Pepe", null, null));

                mockMvc.perform(post("/api/entities/Integrante/delete-many").with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"ids": ["no-existe"]}
                                                """))
                                .andExpect(status().isNoContent());

                assertThat(repository.existsById(pepe.getId())).isTrue();
        }

        @Test
        void deleteManyWithoutIdsReturns400WithMessage() throws Exception {
                mockMvc.perform(post("/api/entities/Integrante/delete-many").with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{}"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value(not(emptyString())));
        }

        // --- GET con sort / limit / skip (ListQuery) ---

        /**
         * Guarda uno a uno con flush para que cada created_date sea posterior al
         * anterior.
         */
        private void saveInOrder(String... names) {
                for (String name : names) {
                        repository.saveAndFlush(new Member(name, null, null));
                }
        }

        @Test
        void sortDescByCreatedDateReturnsNewestFirst() throws Exception {
                saveInOrder("Ana", "Luis", "Pepe");

                mockMvc.perform(get("/api/entities/Integrante").with(jwt()).param("sort", "-created_date"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[*].nombre").value(contains("Pepe", "Luis", "Ana")));
        }

        @Test
        void sortAscByNameReturnsAlphabeticalOrder() throws Exception {
                saveInOrder("Luis", "Ana", "Pepe");

                mockMvc.perform(get("/api/entities/Integrante").with(jwt()).param("sort", "nombre"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[*].nombre").value(contains("Ana", "Luis", "Pepe")));
        }

        @Test
        void limitAndSkipReturnRequestedWindow() throws Exception {
                saveInOrder("Dani", "Ana", "Carla", "Beto");

                // skip=1 no es múltiplo de limit=2: con paginación por número de página
                // fallaría
                mockMvc.perform(get("/api/entities/Integrante").with(jwt())
                                .param("sort", "nombre")
                                .param("limit", "2")
                                .param("skip", "1"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[*].nombre").value(contains("Beto", "Carla")));
        }

        @Test
        void paginatingWithoutSortReturnsEachRowOnce() throws Exception {
                saveInOrder("A", "B", "C", "D", "E");

                // Igual que la exportación de CopiaSeguridad: pedir lotes hasta recibir menos
                // de limit
                List<String> ids = new ArrayList<>();
                int limit = 2;
                for (int skip = 0;; skip += limit) {
                        String body = mockMvc.perform(get("/api/entities/Integrante").with(jwt())
                                        .param("limit", String.valueOf(limit))
                                        .param("skip", String.valueOf(skip)))
                                        .andExpect(status().isOk())
                                        .andReturn().getResponse().getContentAsString();
                        List<String> batch = JsonPath.read(body, "$[*].id");
                        ids.addAll(batch);
                        if (batch.size() < limit)
                                break;
                }

                assertThat(ids).hasSize(5).doesNotHaveDuplicates();
        }

        @Test
        void sortByUnknownFieldReturns400WithMessage() throws Exception {
                mockMvc.perform(get("/api/entities/Integrante").with(jwt()).param("sort", "-no_existe"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value(containsString("no_existe")));
        }

        @Test
        void limitZeroReturns400WithMessage() throws Exception {
                mockMvc.perform(get("/api/entities/Integrante").with(jwt()).param("limit", "0"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value(not(emptyString())));
        }

        @Test
        void nonNumericLimitReturns400WithMessage() throws Exception {
                mockMvc.perform(get("/api/entities/Integrante").with(jwt()).param("limit", "abc"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value(containsString("limit")));
        }

        // --- GET con filtros de igualdad (Filters) ---

        private Member save(String name, String category, String role) {
                return repository.saveAndFlush(new Member(name, category, role));
        }

        @Test
        void filterByFieldReturnsOnlyMatches() throws Exception {
                save("Ana", "cargos", "tesorero");
                save("Luis", "cargos", "vocal");
                save("Pepe", "socios", "tesorero");

                mockMvc.perform(get("/api/entities/Integrante").with(jwt())
                                .param("cargo", "tesorero")
                                .param("sort", "nombre"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[*].nombre").value(contains("Ana", "Pepe")));
        }

        @Test
        void multipleFiltersAreCombinedWithAnd() throws Exception {
                save("Ana", "cargos", "tesorero");
                save("Luis", "cargos", "vocal");
                save("Pepe", "socios", "tesorero");

                mockMvc.perform(get("/api/entities/Integrante").with(jwt())
                                .param("cargo", "tesorero")
                                .param("categoria", "cargos"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[*].nombre").value(contains("Ana")));
        }

        @Test
        void filterByIdReturnsThatRow() throws Exception {
                save("Ana", null, null);
                Member luis = save("Luis", null, null);

                mockMvc.perform(get("/api/entities/Integrante").with(jwt()).param("id", luis.getId()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(1)))
                                .andExpect(jsonPath("$[0].id").value(luis.getId()));
        }

        @Test
        void numericFilterConvertsValue() throws Exception {
                Member ana = new Member("Ana", null, null);
                repository.saveAndFlush(ana);
                save("Luis", null, null);

                mockMvc.perform(get("/api/entities/Integrante").with(jwt()).param("cervezas", "7"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[*].nombre").value(contains("Ana")));
        }

        @Test
        void filterByDateInSnakeCase() throws Exception {
                Member ana = new Member("Ana", null, null);
                ana.setBirthDate(LocalDate.of(1990, 5, 17));
                repository.saveAndFlush(ana);
                save("Luis", null, null);

                mockMvc.perform(get("/api/entities/Integrante").with(jwt()).param("fecha_nacimiento", "1990-05-17"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[*].nombre").value(contains("Ana")));
        }

        @Test
        void filterWithoutMatchesReturnsEmptyArray() throws Exception {
                save("Ana", "cargos", "tesorero");

                mockMvc.perform(get("/api/entities/Integrante").with(jwt()).param("cargo", "presidente"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        void filtersCombineWithSortAndLimit() throws Exception {
                save("Pepe", null, "vocal");
                save("Ana", null, "tesorero");
                save("Luis", null, "vocal");

                mockMvc.perform(get("/api/entities/Integrante").with(jwt())
                                .param("cargo", "vocal")
                                .param("sort", "nombre")
                                .param("limit", "1"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[*].nombre").value(contains("Luis")));
        }

        @Test
        void filterWithInvalidValueReturns400WithMessage() throws Exception {
                mockMvc.perform(get("/api/entities/Integrante").with(jwt()).param("cervezas", "abc"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Valor no válido para cervezas: abc"));
        }

        @Test
        void filterByUnknownFieldReturns400WithMessage() throws Exception {
                mockMvc.perform(get("/api/entities/Integrante").with(jwt()).param("no_existe", "x"))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("No se puede filtrar por: no_existe"));
        }

        // --- POST con todos los campos y DELETE /{id} ---

        @Test
        void postSavesAndReturnsAllFields() throws Exception {
                String body = mockMvc.perform(post("/api/entities/Integrante").with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"nombre": "Ana", "categoria": "cargos", "cargo": "tesorero",
                                                 "cervezas": 7, "fecha_nacimiento": "1990-05-17"}
                                                """))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.id").value(notNullValue()))
                                .andExpect(jsonPath("$.nombre").value("Ana"))
                                .andExpect(jsonPath("$.categoria").value("cargos"))
                                .andExpect(jsonPath("$.cargo").value("tesorero"))
                                .andExpect(jsonPath("$.cervezas").value(7))
                                .andExpect(jsonPath("$.fecha_nacimiento").value("1990-05-17"))
                                .andReturn().getResponse().getContentAsString();

                // Comprueba también lo que quedó en la base de datos, no solo la respuesta
                String id = JsonPath.read(body, "$.id");
                Member saved = repository.findById(id).orElseThrow();
                assertThat(saved.getName()).isEqualTo("Ana");
                assertThat(saved.getCategory()).isEqualTo("cargos");
                assertThat(saved.getRole()).isEqualTo("tesorero");
                assertThat(saved.getBirthDate()).isEqualTo(LocalDate.of(1990, 5, 17));
        }

        @Test
        void postWithoutBeersDefaultsToZero() throws Exception {
                mockMvc.perform(post("/api/entities/Integrante").with(jwt())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"nombre": "Luis"}
                                                """))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.cervezas").value(0))
                                .andExpect(jsonPath("$.fecha_nacimiento").value(nullValue()));
        }

        @Test
        void deleteRemovesMemberAndReturns204() throws Exception {
                Member ana = save("Ana", null, null);
                Member luis = save("Luis", null, null);

                mockMvc.perform(delete("/api/entities/Integrante/{id}", ana.getId()).with(jwt()))
                                .andExpect(status().isNoContent());

                assertThat(repository.existsById(ana.getId())).isFalse();
                assertThat(repository.existsById(luis.getId())).isTrue();
        }

        @Test
        void deleteUnknownIdReturns204() throws Exception {
                // Borrar algo que ya no existe deja el sistema igual: se trata como éxito
                mockMvc.perform(delete("/api/entities/Integrante/{id}", "no-existe").with(jwt()))
                                .andExpect(status().isNoContent());
        }

        // --- Seguridad: sin token no se entra ---

        @Test
        void listWithoutTokenReturns401() throws Exception {
                mockMvc.perform(get("/api/entities/Integrante"))
                                .andExpect(status().isUnauthorized());
        }

        @Test
        void createWithoutTokenReturns401AndSavesNothing() throws Exception {
                mockMvc.perform(post("/api/entities/Integrante")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"nombre": "Ana"}
                                                """))
                                .andExpect(status().isUnauthorized());

                assertThat(repository.count()).isZero();
        }

        // --- created_by_id (JPA auditing: @CreatedBy + AuditorAware) ---

        private String createdByOf(String body) {
                String id = JsonPath.read(body, "$.id");
                return repository.findById(id).orElseThrow().getCreatedById();
        }

        @Test
        void postSavesTokenSubjectAsCreatedBy() throws Exception {
                String body = mockMvc.perform(post("/api/entities/Integrante")
                                .with(jwt().jwt(j -> j.subject("user-1")))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"nombre": "Ana"}
                                                """))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.created_by_id").value("user-1"))
                                .andReturn().getResponse().getContentAsString();

                // También en la base de datos, no solo en la respuesta
                assertThat(createdByOf(body)).isEqualTo("user-1");
        }

        @Test
        void bulkSavesCreatedByOnEveryRow() throws Exception {
                mockMvc.perform(post("/api/entities/Integrante/bulk")
                                .with(jwt().jwt(j -> j.subject("user-1")))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                [{"nombre": "Ana"}, {"nombre": "Luis"}]
                                                """))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$[*].created_by_id").value(contains("user-1", "user-1")));
        }

        @Test
        void createdByCannotBeSetFromRequestBody() throws Exception {
                // Lo decide el token, no el cliente
                mockMvc.perform(post("/api/entities/Integrante")
                                .with(jwt().jwt(j -> j.subject("user-1")))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"nombre": "Ana", "created_by_id": "otro"}
                                                """))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.created_by_id").value("user-1"));
        }

        @Test
        void patchByAnotherUserKeepsOriginalCreatedBy() throws Exception {
                String body = mockMvc.perform(post("/api/entities/Integrante")
                                .with(jwt().jwt(j -> j.subject("user-1")))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"nombre": "Ana"}
                                                """))
                                .andReturn().getResponse().getContentAsString();
                String id = JsonPath.read(body, "$.id");

                mockMvc.perform(patch("/api/entities/Integrante/{id}", id)
                                .with(jwt().jwt(j -> j.subject("user-2")))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"cargo": "vocal", "created_by_id": "user-2"}
                                                """))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.cargo").value("vocal"))
                                .andExpect(jsonPath("$.created_by_id").value("user-1"));

                assertThat(createdByOf(body)).isEqualTo("user-1");
        }

        @Test
        void adminCreatedRowsHaveAdminAsCreatedBy() throws Exception {
                mockMvc.perform(post("/api/entities/Integrante")
                                .with(jwt().jwt(j -> j.subject("__admin__")))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                                {"nombre": "Ana"}
                                                """))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.created_by_id").value("__admin__"));
        }

        @Test
        void savingWithoutAuthenticatedUserLeavesCreatedByNull() {
                // Fuera de una petición HTTP (p. ej. este setup de test) no hay usuario
                Member ana = repository.saveAndFlush(new Member("Ana", null, null));

                assertThat(ana.getCreatedById()).isNull();
        }
}
