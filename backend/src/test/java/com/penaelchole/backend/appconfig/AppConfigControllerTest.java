package com.penaelchole.backend.appconfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.penaelchole.backend.TestcontainersConfiguration;
import com.penaelchole.backend.account.UserAccount;
import com.penaelchole.backend.auth.TokenService;
import com.penaelchole.backend.auth.UserSession;

/**
 * /api/entities/AppConfig: configuración global de la peña (clave/valor).
 * Cualquier usuario autenticado puede leerla; solo los admins pueden
 * crearla, modificarla o borrarla.
 *
 * Los tokens se emiten con TokenService para que pasen por el
 * JwtAuthenticationConverter de verdad (y así se comprueba hasRole('ADMIN')).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AppConfigControllerTest {

    private static final String URL = "/api/entities/AppConfig";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    AppConfigRepository repository;

    @Autowired
    TokenService tokenService;

    AppConfig precio;
    AppConfig nombre;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        precio = repository.saveAndFlush(new AppConfig("cerveza_precio", "1.5"));
        nombre = repository.saveAndFlush(new AppConfig("pena_nombre_oficial", "Peña El Chole"));
    }

    // --- tokens ---

    private String userToken() {
        return tokenService.createToken(new UserSession("socio-1", "Pepe", "vocal", null, false));
    }

    private String adminToken() {
        return tokenService.createToken(
                new UserSession(UserAccount.ADMIN_USERNAME, "Admin", null, null, true));
    }

    // --- peticiones ---

    private ResultActions perform(MockHttpServletRequestBuilder request, String token) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + token));
    }

    private ResultActions postJson(String url, String json, String token) throws Exception {
        return perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json), token);
    }

    private ResultActions patchConfig(String id, String json, String token) throws Exception {
        return perform(patch(URL + "/{id}", id).contentType(MediaType.APPLICATION_JSON).content(json), token);
    }

    private String valueOf(AppConfig config) {
        return repository.findById(config.getId()).orElseThrow().getValue();
    }

    // --- sin token ---

    @Test
    void withoutTokenReturns401() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
    }

    // --- lectura: cualquier usuario autenticado ---

    @Test
    void listReturnsConfigsWithSpanishKeys() throws Exception {
        perform(get(URL).param("sort", "clave"), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(notNullValue()))
                .andExpect(jsonPath("$[0].clave").value("cerveza_precio"))
                .andExpect(jsonPath("$[0].valor").value("1.5"))
                .andExpect(jsonPath("$[0].created_date").value(notNullValue()))
                .andExpect(jsonPath("$[0].key").doesNotExist())
                .andExpect(jsonPath("$[0].value").doesNotExist());
    }

    @Test
    void filterByClaveReturnsOnlyThatConfig() throws Exception {
        // Es como lo usa el frontend: AppConfig.filter({ clave: "cerveza_precio" })
        perform(get(URL).param("clave", "cerveza_precio"), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].valor").value(contains("1.5")));
    }

    @Test
    void filterByUnknownClaveReturnsEmptyArray() throws Exception {
        perform(get(URL).param("clave", "no_existe"), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getReturnsConfig() throws Exception {
        perform(get(URL + "/{id}", precio.getId()), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clave").value("cerveza_precio"))
                .andExpect(jsonPath("$.valor").value("1.5"));
    }

    @Test
    void getMissingConfigReturns404() throws Exception {
        perform(get(URL + "/{id}", "no-existe"), userToken())
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Configuración no encontrada"));
    }

    // --- escritura: solo admins ---

    @Test
    void regularUserCannotCreate() throws Exception {
        postJson(URL, "{\"clave\": \"pena_nif\", \"valor\": \"G123\"}", userToken())
                .andExpect(status().isForbidden());
        assertThat(repository.count()).isEqualTo(2);
    }

    @Test
    void regularUserCannotBulkCreate() throws Exception {
        postJson(URL + "/bulk", "[{\"clave\": \"pena_nif\", \"valor\": \"G123\"}]", userToken())
                .andExpect(status().isForbidden());
        assertThat(repository.count()).isEqualTo(2);
    }

    @Test
    void regularUserCannotUpdate() throws Exception {
        patchConfig(precio.getId(), "{\"valor\": \"0\"}", userToken())
                .andExpect(status().isForbidden());
        assertThat(valueOf(precio)).isEqualTo("1.5");
    }

    @Test
    void regularUserCannotDelete() throws Exception {
        perform(delete(URL + "/{id}", precio.getId()), userToken())
                .andExpect(status().isForbidden());
        assertThat(repository.existsById(precio.getId())).isTrue();
    }

    @Test
    void regularUserCannotDeleteMany() throws Exception {
        postJson(URL + "/delete-many", "{\"ids\": [\"%s\"]}".formatted(precio.getId()), userToken())
                .andExpect(status().isForbidden());
        assertThat(repository.existsById(precio.getId())).isTrue();
    }

    // --- crear ---

    @Test
    void adminCanCreate() throws Exception {
        postJson(URL, "{\"clave\": \"pena_nif\", \"valor\": \"G123\"}", adminToken())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(notNullValue()))
                .andExpect(jsonPath("$.clave").value("pena_nif"))
                .andExpect(jsonPath("$.valor").value("G123"));
        assertThat(repository.count()).isEqualTo(3);
    }

    @Test
    void adminCanBulkCreate() throws Exception {
        postJson(URL + "/bulk", """
                [{"clave": "pena_nif", "valor": "G123"}, {"clave": "pena_iban", "valor": "ES00"}]
                """, adminToken())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(2)));
        assertThat(repository.count()).isEqualTo(4);
    }

    @Test
    void createWithBlankClaveReturns400() throws Exception {
        postJson(URL, "{\"clave\": \"\", \"valor\": \"x\"}", adminToken())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La clave no puede estar vacía"));
    }

    @Test
    void createWithoutValorReturns400() throws Exception {
        postJson(URL, "{\"clave\": \"pena_nif\"}", adminToken())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El valor no puede estar vacío"));
    }

    @Test
    void createWithDuplicatedClaveReturns409() throws Exception {
        postJson(URL, "{\"clave\": \"cerveza_precio\", \"valor\": \"2\"}", adminToken())
                .andExpect(status().isConflict());
        assertThat(repository.count()).isEqualTo(2);
    }

    @Test
    void valorLongerThan500CharsIsAccepted() throws Exception {
        // Valores JSON como menu_desactivado o las etiquetas del menú pueden ser largos
        String largo = "x".repeat(2000);
        postJson(URL, "{\"clave\": \"menu_etiquetas\", \"valor\": \"%s\"}".formatted(largo), adminToken())
                .andExpect(status().isCreated());
    }

    // --- PATCH ---

    @Test
    void adminCanUpdateValorAndItIsPersisted() throws Exception {
        // Así lo manda el frontend: solo { valor }
        patchConfig(precio.getId(), "{\"valor\": \"2\"}", adminToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clave").value("cerveza_precio"))
                .andExpect(jsonPath("$.valor").value("2"));

        // Se ha guardado de verdad, no solo en la respuesta
        perform(get(URL + "/{id}", precio.getId()), userToken())
                .andExpect(jsonPath("$.valor").value("2"));
        assertThat(valueOf(precio)).isEqualTo("2");
    }

    @Test
    void patchWithSameClaveIsAllowed() throws Exception {
        patchConfig(precio.getId(), "{\"clave\": \"cerveza_precio\", \"valor\": \"3\"}", adminToken())
                .andExpect(status().isOk());
        assertThat(valueOf(precio)).isEqualTo("3");
    }

    @Test
    void patchCannotChangeClave() throws Exception {
        patchConfig(precio.getId(), "{\"clave\": \"otra\", \"valor\": \"3\"}", adminToken())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La clave no se puede modificar"));

        AppConfig stored = repository.findById(precio.getId()).orElseThrow();
        assertThat(stored.getKey()).isEqualTo("cerveza_precio");
        assertThat(stored.getValue()).isEqualTo("1.5");
    }

    @Test
    void patchWithNullValorIsRejected() throws Exception {
        // La columna es NOT NULL: no se puede "borrar" el valor
        patchConfig(precio.getId(), "{\"valor\": null}", adminToken())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El valor no puede estar vacío"));
        assertThat(valueOf(precio)).isEqualTo("1.5");
    }

    @Test
    void patchOfMissingConfigReturns404() throws Exception {
        patchConfig("no-existe", "{\"valor\": \"x\"}", adminToken())
                .andExpect(status().isNotFound());
    }

    // --- borrar ---

    @Test
    void adminCanDelete() throws Exception {
        perform(delete(URL + "/{id}", precio.getId()), adminToken())
                .andExpect(status().isNoContent());
        assertThat(repository.existsById(precio.getId())).isFalse();
    }

    @Test
    void adminCanDeleteMany() throws Exception {
        postJson(URL + "/delete-many", "{\"ids\": [\"%s\", \"%s\"]}".formatted(precio.getId(), nombre.getId()),
                adminToken())
                .andExpect(status().isNoContent());
        assertThat(repository.count()).isZero();
    }
}
