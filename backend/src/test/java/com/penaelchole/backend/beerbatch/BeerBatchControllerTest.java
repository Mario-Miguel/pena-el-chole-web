package com.penaelchole.backend.beerbatch;

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

import java.math.BigDecimal;
import java.time.LocalDate;

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

import com.jayway.jsonpath.JsonPath;
import com.penaelchole.backend.TestcontainersConfiguration;
import com.penaelchole.backend.auth.TokenService;
import com.penaelchole.backend.auth.UserSession;

/**
 * /api/entities/LoteCerveza. Los cuerpos imitan lo que manda
 * InventarioCerveza.jsx:
 * - list("-fecha")
 * - create({ tipo, cantidad, coste, fecha, notas, stock_minimo: 0 })
 * - update(id, { stock_minimo }) al cambiar el mínimo de un tipo
 * - update(id, { tipo, cantidad, coste, consumido_ajuste, notas }) al editar
 * - delete(id)
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class BeerBatchControllerTest {

    private static final String URL = "/api/entities/LoteCerveza";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    BeerBatchRepository repository;

    @Autowired
    TokenService tokenService;

    BeerBatch mahouMarzo;
    BeerBatch alhambraEnero;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        alhambraEnero = repository.saveAndFlush(new BeerBatch(
                48, 0, new BigDecimal("30.00"), LocalDate.of(2026, 1, 10), "Para Reyes", 6, "Alhambra"));
        mahouMarzo = repository.saveAndFlush(new BeerBatch(
                24, 2, new BigDecimal("18.50"), LocalDate.of(2026, 3, 1), "", 0, "Mahou"));
    }

    // --- tokens y peticiones ---

    private String userToken() {
        return tokenService.createToken(new UserSession("socio-1", "Pepe", "vocal", null, false));
    }

    private ResultActions perform(MockHttpServletRequestBuilder request, String token) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + token));
    }

    private ResultActions postJson(String url, String json) throws Exception {
        return perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json), userToken());
    }

    private ResultActions patchLote(String id, String json) throws Exception {
        return perform(patch(URL + "/{id}", id).contentType(MediaType.APPLICATION_JSON).content(json), userToken());
    }

    private BeerBatch stored(BeerBatch b) {
        return repository.findById(b.getId()).orElseThrow();
    }

    // --- sin token ---

    @Test
    void withoutTokenReturns401() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
    }

    // --- lectura ---

    @Test
    void listSortedByFechaDescWithSpanishKeys() throws Exception {
        perform(get(URL).param("sort", "-fecha"), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].tipo").value(contains("Mahou", "Alhambra")))
                .andExpect(jsonPath("$[0].cantidad").value(24))
                .andExpect(jsonPath("$[0].consumido_ajuste").value(2))
                .andExpect(jsonPath("$[0].coste").value(18.5))
                .andExpect(jsonPath("$[0].fecha").value("2026-03-01"))
                .andExpect(jsonPath("$[0].notas").value(""))
                .andExpect(jsonPath("$[0].stock_minimo").value(0))
                .andExpect(jsonPath("$[0].id").value(notNullValue()))
                .andExpect(jsonPath("$[0].created_date").value(notNullValue()))
                .andExpect(jsonPath("$[0].updated_date").value(notNullValue()))
                .andExpect(jsonPath("$[0].quantity").doesNotExist())
                .andExpect(jsonPath("$[0].createdDate").doesNotExist());
    }

    @Test
    void listSortedByFechaAsc() throws Exception {
        perform(get(URL).param("sort", "fecha"), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].tipo").value(contains("Alhambra", "Mahou")));
    }

    @Test
    void listWithLimitLikeContabilidad() throws Exception {
        // Contabilidad.jsx: list("-fecha", 200)
        perform(get(URL).param("sort", "-fecha").param("limit", "1"), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].tipo").value("Mahou"));
    }

    @Test
    void getReturnsBatch() throws Exception {
        perform(get(URL + "/{id}", alhambraEnero.getId()), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("Alhambra"))
                .andExpect(jsonPath("$.notas").value("Para Reyes"));
    }

    @Test
    void getMissingBatchReturns404() throws Exception {
        perform(get(URL + "/{id}", "no-existe"), userToken())
                .andExpect(status().isNotFound());
    }

    // --- crear (toEntity) ---

    @Test
    void createLikeAnadirLote() throws Exception {
        postJson(URL, """
                {"tipo": "Estrella", "cantidad": 36, "coste": 27.45, "fecha": "2026-04-15",
                 "notas": "", "stock_minimo": 0}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(notNullValue()))
                .andExpect(jsonPath("$.tipo").value("Estrella"))
                .andExpect(jsonPath("$.cantidad").value(36))
                .andExpect(jsonPath("$.coste").value(27.45))
                .andExpect(jsonPath("$.fecha").value("2026-04-15"))
                .andExpect(jsonPath("$.stock_minimo").value(0))
                .andExpect(jsonPath("$.created_date").value(notNullValue()));
        assertThat(repository.count()).isEqualTo(3);
    }

    @Test
    void createStoresMoneyWithoutRoundingErrors() throws Exception {
        String id = JsonPath.read(postJson(URL, """
                {"tipo": "Estrella", "cantidad": 3, "coste": 0.30, "fecha": "2026-04-15"}
                """).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
        assertThat(repository.findById(id).orElseThrow().getCost()).isEqualByComparingTo("0.30");
    }

    @Test
    void createWithoutFechaReturns400() throws Exception {
        postJson(URL, "{\"tipo\": \"Estrella\", \"cantidad\": 36, \"coste\": 0}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La fecha no puede estar vacía"));
        assertThat(repository.count()).isEqualTo(2);
    }

    @Test
    void createWithoutCantidadReturns400() throws Exception {
        postJson(URL, "{\"tipo\": \"Estrella\", \"coste\": 0, \"fecha\": \"2026-04-15\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La cantidad no puede estar vacía"));
        assertThat(repository.count()).isEqualTo(2);
    }

    // --- PATCH (applyChanges) ---

    @Test
    void patchStockMinimoKeepsTheOthers() throws Exception {
        // InventarioCerveza: update(l.id, { stock_minimo: valor })
        patchLote(alhambraEnero.getId(), "{\"stock_minimo\": 12}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock_minimo").value(12));

        BeerBatch saved = stored(alhambraEnero);
        assertThat(saved.getMinimumStock()).isEqualTo(12);
        assertThat(saved.getQuantity()).isEqualTo(48);
        assertThat(saved.getConsumedAdjustment()).isZero();
        assertThat(saved.getCost()).isEqualByComparingTo("30.00");
        assertThat(saved.getDate()).isEqualTo(LocalDate.of(2026, 1, 10));
        assertThat(saved.getNotes()).isEqualTo("Para Reyes");
        assertThat(saved.getType()).isEqualTo("Alhambra");
    }

    @Test
    void editLoteLikeGuardarLote() throws Exception {
        // InventarioCerveza: update(id, { tipo, cantidad, coste, consumido_ajuste, notas })
        patchLote(mahouMarzo.getId(), """
                {"tipo": "Mahou 5 Estrellas", "cantidad": 30, "coste": 21.99,
                 "consumido_ajuste": 5, "notas": "Corregido"}
                """)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("Mahou 5 Estrellas"));

        BeerBatch saved = stored(mahouMarzo);
        assertThat(saved.getType()).isEqualTo("Mahou 5 Estrellas");
        assertThat(saved.getQuantity()).isEqualTo(30);
        assertThat(saved.getCost()).isEqualByComparingTo("21.99");
        assertThat(saved.getConsumedAdjustment()).isEqualTo(5);
        assertThat(saved.getNotes()).isEqualTo("Corregido");
        // lo que no venía no cambia
        assertThat(saved.getDate()).isEqualTo(LocalDate.of(2026, 3, 1));
        assertThat(saved.getMinimumStock()).isZero();
    }

    @Test
    void patchFechaIsPersistedAndVisibleInLaterGet() throws Exception {
        patchLote(mahouMarzo.getId(), "{\"fecha\": \"2026-02-14\"}")
                .andExpect(status().isOk());
        perform(get(URL + "/{id}", mahouMarzo.getId()), userToken())
                .andExpect(jsonPath("$.fecha").value("2026-02-14"));
    }

    @Test
    void nullOptionalFieldsAreCleared() throws Exception {
        patchLote(alhambraEnero.getId(), """
                {"notas": null, "tipo": null, "stock_minimo": null, "consumido_ajuste": null}
                """)
                .andExpect(status().isOk());

        BeerBatch saved = stored(alhambraEnero);
        assertThat(saved.getNotes()).isNull();
        assertThat(saved.getType()).isNull();
        assertThat(saved.getMinimumStock()).isNull();
        assertThat(saved.getConsumedAdjustment()).isNull();
    }

    @Test
    void nullCantidadReturns400AndChangesNothing() throws Exception {
        patchLote(alhambraEnero.getId(), "{\"cantidad\": null, \"notas\": \"x\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La cantidad no puede estar vacía"));

        BeerBatch saved = stored(alhambraEnero);
        assertThat(saved.getQuantity()).isEqualTo(48);
        assertThat(saved.getNotes()).isEqualTo("Para Reyes");
    }

    @Test
    void nullCosteReturns400() throws Exception {
        patchLote(alhambraEnero.getId(), "{\"coste\": null}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El coste no puede estar vacío"));
    }

    @Test
    void nullFechaReturns400() throws Exception {
        patchLote(alhambraEnero.getId(), "{\"fecha\": null}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La fecha no puede estar vacía"));
    }

    @Test
    void invalidFechaReturns400() throws Exception {
        patchLote(alhambraEnero.getId(), "{\"fecha\": \"10/01/2026\"}")
                .andExpect(status().isBadRequest());
        assertThat(stored(alhambraEnero).getDate()).isEqualTo(LocalDate.of(2026, 1, 10));
    }

    @Test
    void patchOfMissingBatchReturns404() throws Exception {
        patchLote("no-existe", "{\"stock_minimo\": 1}")
                .andExpect(status().isNotFound());
    }

    // --- borrar ---

    @Test
    void deleteReturns204AndRemovesIt() throws Exception {
        perform(delete(URL + "/{id}", mahouMarzo.getId()), userToken())
                .andExpect(status().isNoContent());
        assertThat(repository.existsById(mahouMarzo.getId())).isFalse();
        perform(get(URL + "/{id}", mahouMarzo.getId()), userToken())
                .andExpect(status().isNotFound());
    }
}
