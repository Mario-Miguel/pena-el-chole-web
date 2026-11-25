package com.penaelchole.backend.achievement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
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
 * /api/entities/Logro. Los cuerpos imitan lo que manda el frontend:
 * - GamificacionesPanel.jsx: bulkCreate(LOGROS_POR_DEFECTO) (sin "activo"),
 *   create/update({ ...editLogro }) (objeto entero, con id y fechas en el update)
 *   y update(id, { activo: !logro.activo }).
 * - Logros.jsx: list() como usuario normal.
 * Leer es para cualquier usuario; crear, modificar y borrar, solo para admins.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AchievementControllerTest {

    private static final String URL = "/api/entities/Logro";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    AchievementRepository repository;

    @Autowired
    TokenService tokenService;

    Achievement catador;
    Achievement conversador;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        catador = repository.saveAndFlush(new Achievement(
                true, "cerveza", "Consumir 5 cervezas en la peña", "🍺", "Catador Novel", 10, 5));
        conversador = repository.saveAndFlush(new Achievement(
                false, "chat", "Enviar 50 mensajes en el chat", "💬", "Conversador", 15, 50));
    }

    // --- tokens y peticiones ---

    private String userToken() {
        return tokenService.createToken(new UserSession("socio-1", "Pepe", "vocal", null, false));
    }

    private String adminToken() {
        return tokenService.createToken(
                new UserSession(UserAccount.ADMIN_USERNAME, "Admin", null, null, true));
    }

    private ResultActions perform(MockHttpServletRequestBuilder request, String token) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + token));
    }

    private ResultActions postJson(String url, String json, String token) throws Exception {
        return perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json), token);
    }

    private ResultActions patchLogro(String id, String json, String token) throws Exception {
        return perform(patch(URL + "/{id}", id).contentType(MediaType.APPLICATION_JSON).content(json), token);
    }

    private Achievement stored(Achievement a) {
        return repository.findById(a.getId()).orElseThrow();
    }

    // --- sin token ---

    @Test
    void withoutTokenReturns401() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
    }

    // --- lectura: cualquier usuario ---

    @Test
    void regularUserCanListWithSpanishKeys() throws Exception {
        perform(get(URL).param("sort", "nombre"), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].nombre").value("Catador Novel"))
                .andExpect(jsonPath("$[0].descripcion").value("Consumir 5 cervezas en la peña"))
                .andExpect(jsonPath("$[0].icono").value("🍺"))
                .andExpect(jsonPath("$[0].categoria").value("cerveza"))
                .andExpect(jsonPath("$[0].puntos").value(10))
                .andExpect(jsonPath("$[0].umbral").value(5))
                .andExpect(jsonPath("$[0].activo").value(true))
                .andExpect(jsonPath("$[0].id").value(notNullValue()))
                .andExpect(jsonPath("$[0].created_date").value(notNullValue()))
                .andExpect(jsonPath("$[0].name").doesNotExist())
                .andExpect(jsonPath("$[0].active").doesNotExist());
    }

    @Test
    void getReturnsAchievement() throws Exception {
        perform(get(URL + "/{id}", conversador.getId()), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Conversador"))
                .andExpect(jsonPath("$.activo").value(false));
    }

    @Test
    void getMissingAchievementReturns404() throws Exception {
        perform(get(URL + "/{id}", "no-existe"), userToken())
                .andExpect(status().isNotFound());
    }

    // --- crear (toEntity) ---

    @Test
    void adminCreatesLikeNuevoLogro() throws Exception {
        // GamificacionesPanel: setEditLogro({ nombre, descripcion, icono, categoria, puntos, umbral, activo: true })
        postJson(URL, """
                {"nombre": "Votante Cívico", "descripcion": "Participar en 5 votaciones", "icono": "🗳️",
                 "categoria": "votaciones", "puntos": 20, "umbral": 5, "activo": true}
                """, adminToken())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(notNullValue()))
                .andExpect(jsonPath("$.nombre").value("Votante Cívico"))
                .andExpect(jsonPath("$.categoria").value("votaciones"))
                .andExpect(jsonPath("$.puntos").value(20))
                .andExpect(jsonPath("$.umbral").value(5))
                .andExpect(jsonPath("$.activo").value(true));
        assertThat(repository.count()).isEqualTo(3);
    }

    @Test
    void createWithoutActivoPuntosOrUmbralUsesDefaults() throws Exception {
        postJson(URL, "{\"nombre\": \"Mínimo\"}", adminToken())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.activo").value(false))
                .andExpect(jsonPath("$.puntos").value(0))
                .andExpect(jsonPath("$.umbral").value(0))
                .andExpect(jsonPath("$.categoria").value(nullValue()))
                .andExpect(jsonPath("$.descripcion").value(nullValue()))
                .andExpect(jsonPath("$.icono").value(nullValue()));
    }

    @Test
    void createWithNullValuesUsesDefaults() throws Exception {
        postJson(URL, """
                {"nombre": "Con nulls", "activo": null, "puntos": null, "umbral": null}
                """, adminToken())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.activo").value(false))
                .andExpect(jsonPath("$.puntos").value(0))
                .andExpect(jsonPath("$.umbral").value(0));
    }

    @Test
    void createWithBlankNombreReturns400() throws Exception {
        postJson(URL, "{\"nombre\": \" \", \"puntos\": 10}", adminToken())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El nombre no puede estar vacío"));
        assertThat(repository.count()).isEqualTo(2);
    }

    @Test
    void createWithoutNombreReturns400() throws Exception {
        postJson(URL, "{\"puntos\": 10}", adminToken())
                .andExpect(status().isBadRequest());
        assertThat(repository.count()).isEqualTo(2);
    }

    @Test
    void regularUserCannotCreate() throws Exception {
        postJson(URL, "{\"nombre\": \"Trampa\", \"puntos\": 1000}", userToken())
                .andExpect(status().isForbidden());
        assertThat(repository.count()).isEqualTo(2);
    }

    @Test
    void adminBulkCreatesLikeLogrosPorDefecto() throws Exception {
        // LOGROS_POR_DEFECTO no incluye "activo"
        postJson(URL + "/bulk", """
                [{"nombre": "Bebedor Experimentado", "descripcion": "Consumir 25 cervezas", "icono": "🍻",
                  "categoria": "cerveza", "puntos": 25, "umbral": 25},
                 {"nombre": "Leyenda Cervecera", "descripcion": "Consumir 100 cervezas", "icono": "👑",
                  "categoria": "cerveza", "puntos": 100, "umbral": 100}]
                """, adminToken())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].nombre").value(contains("Bebedor Experimentado", "Leyenda Cervecera")))
                .andExpect(jsonPath("$[*].umbral").value(contains(25, 100)))
                .andExpect(jsonPath("$[*].activo").value(contains(false, false)));
        assertThat(repository.count()).isEqualTo(4);
    }

    @Test
    void regularUserCannotBulkCreate() throws Exception {
        postJson(URL + "/bulk", "[{\"nombre\": \"A\"}]", userToken())
                .andExpect(status().isForbidden());
        assertThat(repository.count()).isEqualTo(2);
    }

    // --- PATCH (applyChanges) ---

    @Test
    void toggleActivoIsPersisted() throws Exception {
        // GamificacionesPanel: update(logro.id, { activo: !logro.activo })
        patchLogro(conversador.getId(), "{\"activo\": true}", adminToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(true));
        assertThat(stored(conversador).isActive()).isTrue();

        patchLogro(conversador.getId(), "{\"activo\": false}", adminToken())
                .andExpect(status().isOk());
        assertThat(stored(conversador).isActive()).isFalse();
    }

    @Test
    void editWholeObjectLikeEditarLogro() throws Exception {
        // GamificacionesPanel: update(editLogro.id, { ...editLogro }), con id y fechas incluidos
        patchLogro(catador.getId(), """
                {"id": "%s", "nombre": "Catador Experto", "descripcion": "Consumir 10 cervezas",
                 "icono": "🍺", "categoria": "cerveza", "puntos": 20, "umbral": 10, "activo": true,
                 "created_date": "2026-01-01T00:00:00Z", "updated_date": "2026-01-01T00:00:00Z",
                 "created_by_id": null}
                """.formatted(catador.getId()), adminToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Catador Experto"));

        Achievement saved = stored(catador);
        assertThat(saved.getName()).isEqualTo("Catador Experto");
        assertThat(saved.getDescription()).isEqualTo("Consumir 10 cervezas");
        assertThat(saved.getPoints()).isEqualTo(20);
        assertThat(saved.getThreshold()).isEqualTo(10);
        assertThat(saved.getId()).isEqualTo(catador.getId());
    }

    @Test
    void patchOneFieldKeepsTheOthers() throws Exception {
        patchLogro(catador.getId(), "{\"umbral\": 8}", adminToken())
                .andExpect(status().isOk());

        Achievement saved = stored(catador);
        assertThat(saved.getThreshold()).isEqualTo(8);
        assertThat(saved.getName()).isEqualTo("Catador Novel");
        assertThat(saved.getDescription()).isEqualTo("Consumir 5 cervezas en la peña");
        assertThat(saved.getIcon()).isEqualTo("🍺");
        assertThat(saved.getCategory()).isEqualTo("cerveza");
        assertThat(saved.getPoints()).isEqualTo(10);
        assertThat(saved.isActive()).isTrue();
    }

    @Test
    void patchIsVisibleInLaterGet() throws Exception {
        patchLogro(catador.getId(), "{\"puntos\": 50}", adminToken())
                .andExpect(status().isOk());
        perform(get(URL + "/{id}", catador.getId()), userToken())
                .andExpect(jsonPath("$.puntos").value(50));
    }

    @Test
    void nullTextFieldsAreCleared() throws Exception {
        patchLogro(catador.getId(), """
                {"descripcion": null, "icono": null, "categoria": null}
                """, adminToken())
                .andExpect(status().isOk());

        Achievement saved = stored(catador);
        assertThat(saved.getDescription()).isNull();
        assertThat(saved.getIcon()).isNull();
        assertThat(saved.getCategory()).isNull();
    }

    @Test
    void nullNumbersAndActivoUseDefaults() throws Exception {
        patchLogro(catador.getId(), """
                {"puntos": null, "umbral": null, "activo": null}
                """, adminToken())
                .andExpect(status().isOk());

        Achievement saved = stored(catador);
        assertThat(saved.getPoints()).isZero();
        assertThat(saved.getThreshold()).isZero();
        assertThat(saved.isActive()).isFalse();
    }

    @Test
    void blankNombreReturns400AndChangesNothing() throws Exception {
        patchLogro(catador.getId(), "{\"nombre\": \"\", \"puntos\": 99}", adminToken())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El nombre no puede estar vacío"));

        Achievement saved = stored(catador);
        assertThat(saved.getName()).isEqualTo("Catador Novel");
        assertThat(saved.getPoints()).isEqualTo(10);
    }

    @Test
    void nullNombreReturns400() throws Exception {
        patchLogro(catador.getId(), "{\"nombre\": null}", adminToken())
                .andExpect(status().isBadRequest());
        assertThat(stored(catador).getName()).isEqualTo("Catador Novel");
    }

    @Test
    void patchOfMissingAchievementReturns404() throws Exception {
        patchLogro("no-existe", "{\"activo\": true}", adminToken())
                .andExpect(status().isNotFound());
    }

    @Test
    void regularUserCannotPatch() throws Exception {
        patchLogro(catador.getId(), "{\"puntos\": 1000}", userToken())
                .andExpect(status().isForbidden());
        assertThat(stored(catador).getPoints()).isEqualTo(10);
    }

    // --- borrar ---

    @Test
    void adminCanDelete() throws Exception {
        perform(delete(URL + "/{id}", catador.getId()), adminToken())
                .andExpect(status().isNoContent());
        assertThat(repository.existsById(catador.getId())).isFalse();
    }

    @Test
    void adminCanDeleteMany() throws Exception {
        postJson(URL + "/delete-many", "{\"ids\": [\"%s\", \"%s\"]}".formatted(catador.getId(), conversador.getId()),
                adminToken())
                .andExpect(status().isNoContent());
        assertThat(repository.count()).isZero();
    }

    @Test
    void regularUserCannotDelete() throws Exception {
        perform(delete(URL + "/{id}", catador.getId()), userToken())
                .andExpect(status().isForbidden());
        assertThat(repository.existsById(catador.getId())).isTrue();
    }

    @Test
    void regularUserCannotDeleteMany() throws Exception {
        postJson(URL + "/delete-many", "{\"ids\": [\"%s\"]}".formatted(catador.getId()), userToken())
                .andExpect(status().isForbidden());
        assertThat(repository.existsById(catador.getId())).isTrue();
    }
}
