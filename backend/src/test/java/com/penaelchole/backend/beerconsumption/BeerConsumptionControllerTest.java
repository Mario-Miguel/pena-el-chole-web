package com.penaelchole.backend.beerconsumption;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
 * /api/entities/ConsumoCerveza. Los cuerpos imitan lo que manda Cerveza.jsx:
 * - filter({ archivado: false }) para calcular las cervezas de cada uno
 * - bulkCreate([{ tipo, cantidad: 1, integrante_id }]) al guardar los pendientes
 *   (integrante_id null = invitados, tipo null si no hay inventario)
 * - update(id, { cantidad: c - 1 }) o delete(id) al quitar una cerveza
 * - update(id, { archivado: true, anio_archivo }) al archivar el año
 * Cualquier usuario con sesión puede apuntar y quitar cervezas.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class BeerConsumptionControllerTest {

    private static final String URL = "/api/entities/ConsumoCerveza";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    BeerConsumptionRepository repository;

    @Autowired
    MemberRepository memberRepository;

    @Autowired
    TokenService tokenService;

    Member pepe;
    Member lucia;
    BeerConsumption pepeMahou;
    BeerConsumption pepeAlhambra;
    BeerConsumption luciaMahou;
    BeerConsumption invitadosMahou;
    BeerConsumption pepeArchivado;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        pepe = memberRepository.saveAndFlush(new Member("Pepe Consumo", "socios", null));
        lucia = memberRepository.saveAndFlush(new Member("Lucía Consumo", "socios", null));
        pepeMahou = repository.saveAndFlush(new BeerConsumption(2, pepe.getId(), "Mahou"));
        pepeAlhambra = repository.saveAndFlush(new BeerConsumption(1, pepe.getId(), "Alhambra"));
        luciaMahou = repository.saveAndFlush(new BeerConsumption(1, lucia.getId(), "Mahou"));
        invitadosMahou = repository.saveAndFlush(new BeerConsumption(3, null, "Mahou"));
        BeerConsumption archivado = new BeerConsumption(5, pepe.getId(), "Mahou");
        archivado.setArchived(true);
        archivado.setArchiveYear(2025);
        pepeArchivado = repository.saveAndFlush(archivado);
    }

    // Otros tests borran todos los integrantes: si quedan consumos, la clave
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

    private ResultActions perform(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + userToken()));
    }

    private ResultActions postJson(String url, String json) throws Exception {
        return perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private ResultActions patchConsumo(String id, String json) throws Exception {
        return perform(patch(URL + "/{id}", id).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private BeerConsumption stored(BeerConsumption c) {
        return repository.findById(c.getId()).orElseThrow();
    }

    // --- sin token ---

    @Test
    void withoutTokenReturns401() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
    }

    // --- lectura ---

    @Test
    void getReturnsSpanishKeys() throws Exception {
        perform(get(URL + "/{id}", pepeMahou.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(pepeMahou.getId()))
                .andExpect(jsonPath("$.cantidad").value(2))
                .andExpect(jsonPath("$.integrante_id").value(pepe.getId()))
                .andExpect(jsonPath("$.tipo").value("Mahou"))
                .andExpect(jsonPath("$.archivado").value(false))
                .andExpect(jsonPath("$.anio_archivo").value(nullValue()))
                // Cerveza.jsx ordena por created_date para quitar el más reciente
                .andExpect(jsonPath("$.created_date").value(notNullValue()))
                .andExpect(jsonPath("$.createdDate").doesNotExist())
                .andExpect(jsonPath("$.member_id").doesNotExist())
                .andExpect(jsonPath("$.integrante_nombre").doesNotExist());
    }

    @Test
    void getMissingConsumptionReturns404() throws Exception {
        perform(get(URL + "/{id}", "no-existe"))
                .andExpect(status().isNotFound());
    }

    @Test
    void filterNotArchivedLikeCerveza() throws Exception {
        perform(get(URL).param("archivado", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id").value(containsInAnyOrder(
                        pepeMahou.getId(), pepeAlhambra.getId(), luciaMahou.getId(), invitadosMahou.getId())));
    }

    @Test
    void filterByIntegranteIdLikeMiCervezaPerfil() throws Exception {
        perform(get(URL).param("integrante_id", pepe.getId()).param("archivado", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id").value(containsInAnyOrder(pepeMahou.getId(), pepeAlhambra.getId())));
    }

    @Test
    void filterByTipo() throws Exception {
        perform(get(URL).param("tipo", "Alhambra"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(pepeAlhambra.getId()));
    }

    // --- crear (toEntity) ---

    @Test
    void createForMember() throws Exception {
        postJson(URL, """
                {"tipo": "Estrella", "cantidad": 1, "integrante_id": "%s"}
                """.formatted(lucia.getId()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(notNullValue()))
                .andExpect(jsonPath("$.tipo").value("Estrella"))
                .andExpect(jsonPath("$.cantidad").value(1))
                .andExpect(jsonPath("$.integrante_id").value(lucia.getId()))
                .andExpect(jsonPath("$.archivado").value(false))
                .andExpect(jsonPath("$.created_date").value(notNullValue()));
        assertThat(repository.count()).isEqualTo(6);
    }

    @Test
    void createForInvitadosWithoutTipo() throws Exception {
        // invitados: integrante_id null; sin inventario el tipo es null
        postJson(URL, "{\"tipo\": null, \"cantidad\": 1, \"integrante_id\": null}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.integrante_id").value(nullValue()))
                .andExpect(jsonPath("$.tipo").value(nullValue()));
    }

    @Test
    void createIgnoresArchivado() throws Exception {
        postJson(URL, "{\"cantidad\": 1, \"integrante_id\": \"%s\", \"archivado\": true}".formatted(pepe.getId()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.archivado").value(false));
    }

    @Test
    void bulkCreateLikeGuardarPendientes() throws Exception {
        postJson(URL + "/bulk", """
                [{"tipo": "Mahou", "cantidad": 1, "integrante_id": "%1$s"},
                 {"tipo": "Alhambra", "cantidad": 1, "integrante_id": "%1$s"}]
                """.formatted(lucia.getId()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].tipo").value(containsInAnyOrder("Mahou", "Alhambra")))
                .andExpect(jsonPath("$[*].integrante_id").value(everyItem(is(lucia.getId()))));
        assertThat(repository.count()).isEqualTo(7);
    }

    @Test
    void createWithoutCantidadReturns400() throws Exception {
        postJson(URL, "{\"tipo\": \"Mahou\", \"integrante_id\": \"%s\"}".formatted(pepe.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La cantidad no puede estar vacía"));
        assertThat(repository.count()).isEqualTo(5);
    }

    @Test
    void createWithZeroCantidadReturns400() throws Exception {
        postJson(URL, "{\"cantidad\": 0, \"integrante_id\": \"%s\"}".formatted(pepe.getId()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La cantidad tiene que ser mayor que 0"));
    }

    @Test
    void createWithBlankIntegranteIdReturns400() throws Exception {
        postJson(URL, "{\"cantidad\": 1, \"integrante_id\": \"\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El integrante no puede estar vacío"));
    }

    @Test
    void createWithUnknownIntegranteIdReturns409() throws Exception {
        // la clave foránea no deja guardar un integrante que no existe
        postJson(URL, "{\"cantidad\": 1, \"integrante_id\": \"no-existe\"}")
                .andExpect(status().isConflict());
        assertThat(repository.count()).isEqualTo(5);
    }

    // --- PATCH (applyChanges) ---

    @Test
    void decrementCantidadIsPersistedAndKeepsTheOthers() throws Exception {
        // Cerveza.jsx: update(masReciente.id, { cantidad: masReciente.cantidad - 1 })
        patchConsumo(pepeMahou.getId(), "{\"cantidad\": 1}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cantidad").value(1));

        BeerConsumption saved = stored(pepeMahou);
        assertThat(saved.getQuantity()).isEqualTo(1);
        assertThat(saved.getMemberId()).isEqualTo(pepe.getId());
        assertThat(saved.getType()).isEqualTo("Mahou");
        assertThat(saved.isArchived()).isFalse();
    }

    @Test
    void archiveLikeArchivarAnio() throws Exception {
        patchConsumo(pepeMahou.getId(), "{\"archivado\": true, \"anio_archivo\": 2026}")
                .andExpect(status().isOk());

        BeerConsumption saved = stored(pepeMahou);
        assertThat(saved.isArchived()).isTrue();
        assertThat(saved.getArchiveYear()).isEqualTo(2026);
        assertThat(saved.getQuantity()).isEqualTo(2);

        perform(get(URL).param("integrante_id", pepe.getId()).param("archivado", "false"))
                .andExpect(jsonPath("$[*].id").value(containsInAnyOrder(pepeAlhambra.getId())));
    }

    @Test
    void patchIsVisibleInLaterGet() throws Exception {
        patchConsumo(pepeMahou.getId(), "{\"tipo\": \"Estrella\"}")
                .andExpect(status().isOk());
        perform(get(URL + "/{id}", pepeMahou.getId()))
                .andExpect(jsonPath("$.tipo").value("Estrella"))
                .andExpect(jsonPath("$.cantidad").value(2));
    }

    @Test
    void zeroCantidadReturns400AndChangesNothing() throws Exception {
        patchConsumo(pepeMahou.getId(), "{\"cantidad\": 0, \"tipo\": \"Otra\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La cantidad tiene que ser mayor que 0"));

        BeerConsumption saved = stored(pepeMahou);
        assertThat(saved.getQuantity()).isEqualTo(2);
        assertThat(saved.getType()).isEqualTo("Mahou");
    }

    @Test
    void nullCantidadReturns400() throws Exception {
        patchConsumo(pepeMahou.getId(), "{\"cantidad\": null}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La cantidad no puede estar vacía"));
    }

    @Test
    void nullIntegranteIdMovesItToInvitados() throws Exception {
        patchConsumo(pepeMahou.getId(), "{\"integrante_id\": null}")
                .andExpect(status().isOk());
        assertThat(stored(pepeMahou).getMemberId()).isNull();
    }

    @Test
    void patchOfMissingConsumptionReturns404() throws Exception {
        patchConsumo("no-existe", "{\"cantidad\": 1}")
                .andExpect(status().isNotFound());
    }

    // --- borrar ---

    @Test
    void deleteReturns204AndRemovesIt() throws Exception {
        perform(delete(URL + "/{id}", luciaMahou.getId()))
                .andExpect(status().isNoContent());
        assertThat(repository.existsById(luciaMahou.getId())).isFalse();
    }

    @Test
    void memberWithConsumptionsCannotBeDeleted() throws Exception {
        String adminToken = tokenService.createToken(new UserSession("__admin__", "Admin", null, null, true));
        mockMvc.perform(delete("/api/entities/Integrante/{id}", lucia.getId())
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Ese integrante no existe o tiene cervezas apuntadas"));
        assertThat(memberRepository.existsById(lucia.getId())).isTrue();
    }
}
