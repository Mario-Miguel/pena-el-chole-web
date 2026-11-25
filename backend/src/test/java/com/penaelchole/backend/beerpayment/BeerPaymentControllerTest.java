package com.penaelchole.backend.beerpayment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;

import org.junit.jupiter.api.AfterEach;
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
import com.penaelchole.backend.auth.TokenService;
import com.penaelchole.backend.auth.UserSession;
import com.penaelchole.backend.member.Member;
import com.penaelchole.backend.member.MemberRepository;

/**
 * /api/entities/CervezaPago. Los cuerpos imitan lo que manda el frontend:
 * - CuentasCerveza.jsx: create({ integrante_id, importe, fecha, notas, archivado: false });
 *   "descontar" y "fijar" crean pagos con importe negativo.
 * - MiCervezaPerfil.jsx: filter({ integrante_id }). Contabilidad.jsx: list("-fecha", 500).
 * - Cerveza.jsx (archivar): update(id, { archivado: true, anio_archivo }).
 * Leer: cualquier usuario. Escribir: solo presidente, vicepresidente o admin.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class BeerPaymentControllerTest {

    private static final String URL = "/api/entities/CervezaPago";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    BeerPaymentRepository repository;

    @Autowired
    MemberRepository memberRepository;

    @Autowired
    TokenService tokenService;

    Member pepe;
    Member lucia;
    BeerPayment pepeEnero;
    BeerPayment pepeCorreccion;
    BeerPayment luciaMarzo;
    BeerPayment pepeArchivado;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        pepe = memberRepository.saveAndFlush(new Member("Pepe Pago", "socios", null));
        lucia = memberRepository.saveAndFlush(new Member("Lucía Pago", "socios", null));
        pepeEnero = repository.saveAndFlush(new BeerPayment(
                pepe.getId(), new BigDecimal("10.00"), Instant.parse("2026-01-15T19:00:00Z"), "Efectivo"));
        pepeCorreccion = repository.saveAndFlush(new BeerPayment(
                pepe.getId(), new BigDecimal("-2.50"), Instant.parse("2026-02-01T19:00:00Z"), "Descuento"));
        luciaMarzo = repository.saveAndFlush(new BeerPayment(
                lucia.getId(), new BigDecimal("4.00"), Instant.parse("2026-03-10T19:00:00Z"), null));
        BeerPayment archivado = new BeerPayment(
                pepe.getId(), new BigDecimal("20.00"), Instant.parse("2025-06-01T19:00:00Z"), null);
        archivado.setArchived(true);
        archivado.setArchiveYear(2025);
        pepeArchivado = repository.saveAndFlush(archivado);
    }

    // Otros tests borran todos los integrantes: si quedan pagos, la clave
    // foránea no les dejaría.
    @AfterEach
    void cleanUp() {
        repository.deleteAll();
        memberRepository.delete(pepe);
        memberRepository.delete(lucia);
    }

    // --- tokens y peticiones ---

    private String userToken() {
        return tokenService.createToken(new UserSession("socio-1", "Pepe", "vocal", null, false));
    }

    private String presidentToken() {
        return tokenService.createToken(new UserSession("socio-2", "Presi", "presidente", null, false));
    }

    private ResultActions perform(MockHttpServletRequestBuilder request, String token) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + token));
    }

    private ResultActions postJson(String url, String json, String token) throws Exception {
        return perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json), token);
    }

    private ResultActions patchPago(String id, String json, String token) throws Exception {
        return perform(patch(URL + "/{id}", id).contentType(MediaType.APPLICATION_JSON).content(json), token);
    }

    private BeerPayment stored(BeerPayment p) {
        return repository.findById(p.getId()).orElseThrow();
    }

    // --- sin token ---

    @Test
    void withoutTokenReturns401() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
    }

    // --- lectura: cualquier usuario ---

    @Test
    void getReturnsSpanishKeys() throws Exception {
        perform(get(URL + "/{id}", pepeEnero.getId()), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.integrante_id").value(pepe.getId()))
                .andExpect(jsonPath("$.importe").value(10.0))
                .andExpect(jsonPath("$.fecha").value("2026-01-15T19:00:00Z"))
                .andExpect(jsonPath("$.notas").value("Efectivo"))
                .andExpect(jsonPath("$.archivado").value(false))
                .andExpect(jsonPath("$.anio_archivo").value(nullValue()))
                .andExpect(jsonPath("$.created_date").value(notNullValue()))
                .andExpect(jsonPath("$.amount").doesNotExist())
                .andExpect(jsonPath("$.integrante_nombre").doesNotExist());
    }

    @Test
    void getMissingPaymentReturns404() throws Exception {
        perform(get(URL + "/{id}", "no-existe"), userToken())
                .andExpect(status().isNotFound());
    }

    @Test
    void listSortedByFechaDescLikeContabilidad() throws Exception {
        perform(get(URL).param("sort", "-fecha").param("limit", "500"), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id").value(contains(
                        luciaMarzo.getId(), pepeCorreccion.getId(), pepeEnero.getId(), pepeArchivado.getId())));
    }

    @Test
    void filterByIntegranteIdLikeMiCervezaPerfil() throws Exception {
        perform(get(URL).param("integrante_id", pepe.getId()), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id").value(containsInAnyOrder(
                        pepeEnero.getId(), pepeCorreccion.getId(), pepeArchivado.getId())));
    }

    @Test
    void filterByArchivado() throws Exception {
        perform(get(URL).param("archivado", "true"), userToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(pepeArchivado.getId()));
    }

    // --- crear (toEntity) ---

    @Test
    void presidentCreatesLikeAnadirPago() throws Exception {
        postJson(URL, """
                {"integrante_id": "%s", "importe": 7.35, "fecha": "2026-11-25T18:30:00.000Z",
                 "notas": "Bizum", "archivado": false}
                """.formatted(lucia.getId()), presidentToken())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(notNullValue()))
                .andExpect(jsonPath("$.integrante_id").value(lucia.getId()))
                .andExpect(jsonPath("$.importe").value(7.35))
                .andExpect(jsonPath("$.fecha").value("2026-11-25T18:30:00Z"))
                .andExpect(jsonPath("$.notas").value("Bizum"))
                .andExpect(jsonPath("$.archivado").value(false));
        assertThat(repository.count()).isEqualTo(5);
    }

    @Test
    void negativeAmountIsAllowedForCorrections() throws Exception {
        // CuentasCerveza: "descontar" 3€ -> importe -3
        postJson(URL, """
                {"integrante_id": "%s", "importe": -3, "fecha": "2026-11-25T18:30:00.000Z", "notas": "Descuento"}
                """.formatted(pepe.getId()), presidentToken())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.importe").value(-3));
    }

    @Test
    void createForInvitados() throws Exception {
        postJson(URL, "{\"integrante_id\": null, \"importe\": 5}", presidentToken())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.integrante_id").value(nullValue()));
    }

    @Test
    void createStoresMoneyExactly() throws Exception {
        postJson(URL, "{\"integrante_id\": \"%s\", \"importe\": 0.30}".formatted(lucia.getId()), presidentToken())
                .andExpect(status().isCreated());
        assertThat(repository.findAll())
                .extracting(BeerPayment::getAmount)
                .anySatisfy(a -> assertThat(a).isEqualByComparingTo("0.30"));
    }

    @Test
    void createWithoutImporteReturns400() throws Exception {
        postJson(URL, "{\"integrante_id\": \"%s\"}".formatted(pepe.getId()), presidentToken())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El importe no puede estar vacío ni ser 0"));
        assertThat(repository.count()).isEqualTo(4);
    }

    @Test
    void createWithZeroImporteReturns400() throws Exception {
        postJson(URL, "{\"integrante_id\": \"%s\", \"importe\": 0}".formatted(pepe.getId()), presidentToken())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El importe no puede estar vacío ni ser 0"));
    }

    @Test
    void createWithUnknownIntegranteReturns409() throws Exception {
        postJson(URL, "{\"integrante_id\": \"no-existe\", \"importe\": 5}", presidentToken())
                .andExpect(status().isConflict());
        assertThat(repository.count()).isEqualTo(4);
    }

    @Test
    void regularUserCannotCreate() throws Exception {
        postJson(URL, "{\"integrante_id\": \"%s\", \"importe\": 1000}".formatted(pepe.getId()), userToken())
                .andExpect(status().isForbidden());
        assertThat(repository.count()).isEqualTo(4);
    }

    // --- PATCH (applyChanges) ---

    @Test
    void archiveLikeArchivarAnio() throws Exception {
        patchPago(pepeEnero.getId(), "{\"archivado\": true, \"anio_archivo\": 2026}", presidentToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivado").value(true))
                .andExpect(jsonPath("$.anio_archivo").value(2026));

        BeerPayment saved = stored(pepeEnero);
        assertThat(saved.isArchived()).isTrue();
        assertThat(saved.getArchiveYear()).isEqualTo(2026);
        assertThat(saved.getAmount()).isEqualByComparingTo("10.00");
        assertThat(saved.getNotes()).isEqualTo("Efectivo");
        assertThat(saved.getMemberId()).isEqualTo(pepe.getId());
    }

    @Test
    void patchIsVisibleInLaterGet() throws Exception {
        patchPago(luciaMarzo.getId(), "{\"notas\": \"Corregido\", \"importe\": 4.5}", presidentToken())
                .andExpect(status().isOk());
        perform(get(URL + "/{id}", luciaMarzo.getId()), userToken())
                .andExpect(jsonPath("$.notas").value("Corregido"))
                .andExpect(jsonPath("$.importe").value(4.5));
    }

    @Test
    void nullImporteReturns400AndChangesNothing() throws Exception {
        patchPago(pepeEnero.getId(), "{\"importe\": null, \"notas\": \"x\"}", presidentToken())
                .andExpect(status().isBadRequest());

        BeerPayment saved = stored(pepeEnero);
        assertThat(saved.getAmount()).isEqualByComparingTo("10.00");
        assertThat(saved.getNotes()).isEqualTo("Efectivo");
    }

    @Test
    void invalidFechaReturns400() throws Exception {
        patchPago(pepeEnero.getId(), "{\"fecha\": \"ayer\"}", presidentToken())
                .andExpect(status().isBadRequest());
    }

    @Test
    void patchOfMissingPaymentReturns404() throws Exception {
        patchPago("no-existe", "{\"archivado\": true}", presidentToken())
                .andExpect(status().isNotFound());
    }

    @Test
    void regularUserCannotPatch() throws Exception {
        patchPago(pepeEnero.getId(), "{\"importe\": 1000}", userToken())
                .andExpect(status().isForbidden());
        assertThat(stored(pepeEnero).getAmount()).isEqualByComparingTo("10.00");
    }

    // --- borrar: solo admin (lo usa la copia de seguridad) ---

    @Test
    void presidentCanDelete() throws Exception {
        perform(delete(URL + "/{id}", luciaMarzo.getId()), presidentToken())
                .andExpect(status().isNoContent());
        assertThat(repository.existsById(luciaMarzo.getId())).isFalse();
    }

    @Test
    void regularUserCannotDelete() throws Exception {
        perform(delete(URL + "/{id}", luciaMarzo.getId()), userToken())
                .andExpect(status().isForbidden());
        assertThat(repository.existsById(luciaMarzo.getId())).isTrue();
    }

    @Test
    void regularUserCannotDeleteMany() throws Exception {
        postJson(URL + "/delete-many", "{\"ids\": [\"%s\"]}".formatted(luciaMarzo.getId()), userToken())
                .andExpect(status().isForbidden());
        assertThat(repository.existsById(luciaMarzo.getId())).isTrue();
    }
}
