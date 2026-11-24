package com.penaelchole.backend.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

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
 * /api/entities/Notificacion. Los cuerpos de las peticiones imitan lo que manda
 * el frontend:
 * - lib/notificaciones.js (notificarMiembros): fecha_publicacion = ahora en ISO.
 * - pages/Notificaciones.jsx (handleCrear): mensaje puede ser "" y las fechas null.
 * - NotificationBell / Notificaciones: PATCH { leida_por: [...] } y { archivada }.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class NotificationControllerTest {

    private static final String URL = "/api/entities/Notificacion";
    private static final Instant PUBLICADA = Instant.parse("2026-03-01T10:00:00Z");

    @Autowired
    MockMvc mockMvc;

    @Autowired
    NotificationRepository repository;

    @Autowired
    TokenService tokenService;

    Notification fiesta;
    Notification reunion;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        fiesta = repository.saveAndFlush(new Notification(
                false, null, PUBLICADA, List.of(), "Sábado a las 22h", "evento", "Fiesta"));
        reunion = repository.saveAndFlush(new Notification(
                true, PUBLICADA, PUBLICADA, List.of("pepe"), "Orden del día", "reunion", "Reunión"));
    }

    // --- tokens y peticiones ---

    private String userToken() {
        return tokenService.createToken(new UserSession("pepe", "Pepe", "vocal", null, false));
    }

    private String adminToken() {
        return tokenService.createToken(
                new UserSession(UserAccount.ADMIN_USERNAME, "Admin", null, null, true));
    }

    /** Por defecto, como usuario normal (crear y marcar como leída son para todos). */
    private ResultActions perform(MockHttpServletRequestBuilder request) throws Exception {
        return perform(request, userToken());
    }

    private ResultActions perform(MockHttpServletRequestBuilder request, String token) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + token));
    }

    private ResultActions postJson(String url, String json) throws Exception {
        return postJson(url, json, userToken());
    }

    private ResultActions postJson(String url, String json, String token) throws Exception {
        return perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json), token);
    }

    private ResultActions patchNotif(String id, String json) throws Exception {
        return perform(patch(URL + "/{id}", id).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private Notification stored(Notification n) {
        return repository.findById(n.getId()).orElseThrow();
    }

    // --- sin token ---

    @Test
    void withoutTokenReturns401() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
    }

    // --- lectura ---

    @Test
    void listReturnsNotificationsWithSpanishKeys() throws Exception {
        perform(get(URL + "/{id}", reunion.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Reunión"))
                .andExpect(jsonPath("$.mensaje").value("Orden del día"))
                .andExpect(jsonPath("$.tipo").value("reunion"))
                .andExpect(jsonPath("$.archivada").value(true))
                .andExpect(jsonPath("$.fecha_publicacion").value(notNullValue()))
                .andExpect(jsonPath("$.fecha_archivo").value(notNullValue()))
                .andExpect(jsonPath("$.leida_por").value(contains("pepe")))
                .andExpect(jsonPath("$.created_date").value(notNullValue()))
                .andExpect(jsonPath("$.read_by").doesNotExist());
    }

    @Test
    void filterByArchivada() throws Exception {
        // Notificaciones.jsx: filter({ archivada: false }, "-created_date")
        perform(get(URL).param("archivada", "false").param("sort", "-created_date"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].titulo").value(contains("Fiesta")));
    }

    @Test
    void sortByCreatedDateDescending() throws Exception {
        perform(get(URL).param("sort", "-created_date"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].titulo").value(contains("Reunión", "Fiesta")));
    }

    @Test
    void filterByLeidaPorIsNotAllowed() throws Exception {
        perform(get(URL).param("leida_por", "pepe"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getMissingNotificationReturns404() throws Exception {
        perform(get(URL + "/{id}", "no-existe"))
                .andExpect(status().isNotFound());
    }

    // --- crear ---

    @Test
    void createLikeNotificarMiembros() throws Exception {
        postJson(URL, """
                {"titulo": "Nueva acta", "mensaje": "Reunión del lunes", "tipo": "reunion",
                 "leida_por": [], "archivada": false, "fecha_publicacion": "2026-03-02T18:30:00.000Z"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(notNullValue()))
                .andExpect(jsonPath("$.titulo").value("Nueva acta"))
                .andExpect(jsonPath("$.archivada").value(false))
                .andExpect(jsonPath("$.leida_por", empty()));
        assertThat(repository.count()).isEqualTo(3);
    }

    @Test
    void createWithoutFechaPublicacionPublishesNow() throws Exception {
        Instant before = Instant.now();
        postJson(URL, """
                {"titulo": "Aviso", "mensaje": "Hola", "tipo": "otro", "leida_por": [],
                 "archivada": false, "fecha_publicacion": null, "fecha_archivo": null}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fecha_publicacion").value(notNullValue()))
                .andExpect(jsonPath("$.fecha_archivo").value(nullValue()));

        Notification created = repository.findAll().stream()
                .filter(n -> n.getTitle().equals("Aviso")).findFirst().orElseThrow();
        assertThat(created.getPublishDate()).isAfterOrEqualTo(before.minusSeconds(1));
    }

    @Test
    void createWithEmptyMensajeIsAllowed() throws Exception {
        // Notificaciones.jsx manda mensaje: form.mensaje || ""
        postJson(URL, """
                {"titulo": "Solo título", "mensaje": "", "tipo": "otro", "leida_por": [], "archivada": false}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mensaje").value(""));
    }

    @Test
    void createWithoutLeidaPorStartsEmpty() throws Exception {
        postJson(URL, """
                {"titulo": "Aviso", "mensaje": "Hola", "tipo": "otro"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.leida_por", empty()))
                .andExpect(jsonPath("$.archivada").value(false));
    }

    @Test
    void createWithBlankTituloReturns400() throws Exception {
        postJson(URL, """
                {"titulo": " ", "mensaje": "Hola", "tipo": "otro", "leida_por": []}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El titulo no puede estar vacio"));
    }

    @Test
    void createWithInvalidDateReturns400() throws Exception {
        postJson(URL, """
                {"titulo": "Aviso", "mensaje": "Hola", "tipo": "otro", "fecha_publicacion": "mañana"}
                """)
                .andExpect(status().isBadRequest());
    }

    @Test
    void createWithoutMensajeIsAllowed() throws Exception {
        // mensaje es opcional (columna nullable)
        postJson(URL, """
                {"titulo": "Solo título", "tipo": "otro"}
                """)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mensaje").value(nullValue()));
    }

    @Test
    void regularUserCannotBulkCreate() throws Exception {
        postJson(URL + "/bulk", """
                [{"titulo": "A", "mensaje": "a", "tipo": "otro"}]
                """)
                .andExpect(status().isForbidden());
        assertThat(repository.count()).isEqualTo(2);
    }

    @Test
    void adminCanBulkCreate() throws Exception {
        // CopiaSeguridad.jsx restaura con bulkCreate
        postJson(URL + "/bulk", """
                [{"titulo": "A", "mensaje": "a", "tipo": "otro", "leida_por": []},
                 {"titulo": "B", "mensaje": "b", "tipo": "otro", "leida_por": []}]
                """, adminToken())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(2)));
        assertThat(repository.count()).isEqualTo(4);
    }

    // --- PATCH leida_por ---

    @Test
    void markAsReadIsPersisted() throws Exception {
        // NotificationBell: update(id, { leida_por: [...leida_por, integranteId] })
        patchNotif(fiesta.getId(), "{\"leida_por\": [\"pepe\"]}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.leida_por").value(contains("pepe")));

        perform(get(URL + "/{id}", fiesta.getId()))
                .andExpect(jsonPath("$.leida_por").value(contains("pepe")));
        assertThat(stored(fiesta).getReadBy()).containsExactly("pepe");
    }

    @Test
    void markAsReadAppendsToExistingReaders() throws Exception {
        patchNotif(reunion.getId(), "{\"leida_por\": [\"pepe\", \"ana\"]}")
                .andExpect(status().isOk());
        assertThat(stored(reunion).getReadBy()).containsExactly("pepe", "ana");
    }

    @Test
    void markAsUnreadRemovesReader() throws Exception {
        // Notificaciones.jsx: leida_por.filter(id => id !== usuarioId)
        patchNotif(reunion.getId(), "{\"leida_por\": []}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.leida_por", empty()));
        assertThat(stored(reunion).getReadBy()).isEmpty();
    }

    @Test
    void duplicatedReadersAreRemoved() throws Exception {
        patchNotif(fiesta.getId(), "{\"leida_por\": [\"pepe\", \"ana\", \"pepe\"]}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.leida_por").value(contains("pepe", "ana")));
    }

    @Test
    void nullLeidaPorMeansNobodyHasReadIt() throws Exception {
        patchNotif(reunion.getId(), "{\"leida_por\": null}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.leida_por", empty()));
        assertThat(stored(reunion).getReadBy()).isEmpty();
    }

    @Test
    void leidaPorMustBeAnArray() throws Exception {
        patchNotif(fiesta.getId(), "{\"leida_por\": \"pepe\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("leida_por debe ser un array"));
    }

    @Test
    void leidaPorMustContainOnlyStrings() throws Exception {
        patchNotif(fiesta.getId(), "{\"leida_por\": [1, {}]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("leida_por solo puede contener textos"));
        assertThat(stored(fiesta).getReadBy()).isEmpty();
    }

    @Test
    void patchWithoutLeidaPorKeepsReaders() throws Exception {
        patchNotif(reunion.getId(), "{\"archivada\": false}")
                .andExpect(status().isOk());
        assertThat(stored(reunion).getReadBy()).containsExactly("pepe");
    }

    // --- PATCH archivada / fechas ---

    @Test
    void archiveAndUnarchive() throws Exception {
        patchNotif(fiesta.getId(), "{\"archivada\": true}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archivada").value(true));
        assertThat(stored(fiesta).getArchived()).isTrue();

        patchNotif(fiesta.getId(), "{\"archivada\": false}")
                .andExpect(status().isOk());
        assertThat(stored(fiesta).getArchived()).isFalse();
    }

    @Test
    void changeFechaArchivo() throws Exception {
        patchNotif(fiesta.getId(), "{\"fecha_archivo\": \"2026-04-01T00:00:00Z\"}")
                .andExpect(status().isOk());
        assertThat(stored(fiesta).getArchiveDate()).isEqualTo(Instant.parse("2026-04-01T00:00:00Z"));

        patchNotif(fiesta.getId(), "{\"fecha_archivo\": null}")
                .andExpect(status().isOk());
        assertThat(stored(fiesta).getArchiveDate()).isNull();
    }

    @Test
    void invalidFechaArchivoReturns400() throws Exception {
        patchNotif(fiesta.getId(), "{\"fecha_archivo\": \"2026-04-01\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Fecha no valida: 2026-04-01"));
    }

    // --- PATCH de campos inmutables ---

    @Test
    void cannotChangeTitulo() throws Exception {
        patchNotif(fiesta.getId(), "{\"titulo\": \"Otra\", \"archivada\": true}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El titulo no se puede modificar"));
        // Si un campo falla, no se aplica nada
        assertThat(stored(fiesta).getTitle()).isEqualTo("Fiesta");
        assertThat(stored(fiesta).getArchived()).isFalse();
    }

    @Test
    void cannotChangeMensaje() throws Exception {
        // Si no se puede editar, debe rechazarse; ignorarlo en silencio devuelve 200
        // con el mensaje antiguo y el cliente cree que se ha guardado
        patchNotif(fiesta.getId(), "{\"mensaje\": \"otro\"}").andExpect(status().isBadRequest());
        assertThat(stored(fiesta).getMessage()).isEqualTo("Sábado a las 22h");
    }

    @Test
    void cannotChangeTipoOrFechaPublicacion() throws Exception {
        patchNotif(fiesta.getId(), "{\"tipo\": \"compra\"}").andExpect(status().isBadRequest());
        patchNotif(fiesta.getId(), "{\"fecha_publicacion\": \"2027-01-01T00:00:00Z\"}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void sendingSameImmutableValuesIsAllowed() throws Exception {
        patchNotif(fiesta.getId(), """
                {"titulo": "Fiesta", "tipo": "evento", "mensaje": "Sábado a las 22h",
                 "fecha_publicacion": "2026-03-01T10:00:00Z", "archivada": true}
                """)
                .andExpect(status().isOk());
        assertThat(stored(fiesta).getArchived()).isTrue();
    }

    @Test
    void patchOfMissingNotificationReturns404() throws Exception {
        patchNotif("no-existe", "{\"archivada\": true}")
                .andExpect(status().isNotFound());
    }

    // --- borrar ---

    @Test
    void regularUserCannotDelete() throws Exception {
        perform(delete(URL + "/{id}", fiesta.getId()))
                .andExpect(status().isForbidden());
        assertThat(repository.existsById(fiesta.getId())).isTrue();
    }

    @Test
    void regularUserCannotDeleteMany() throws Exception {
        postJson(URL + "/delete-many", "{\"ids\": [\"%s\"]}".formatted(fiesta.getId()))
                .andExpect(status().isForbidden());
        assertThat(repository.existsById(fiesta.getId())).isTrue();
    }

    @Test
    void adminCanDelete() throws Exception {
        perform(delete(URL + "/{id}", fiesta.getId()), adminToken())
                .andExpect(status().isNoContent());
        assertThat(repository.existsById(fiesta.getId())).isFalse();
    }

    @Test
    void adminCanDeleteMany() throws Exception {
        postJson(URL + "/delete-many", "{\"ids\": [\"%s\", \"%s\"]}".formatted(fiesta.getId(), reunion.getId()),
                adminToken())
                .andExpect(status().isNoContent());
        assertThat(repository.count()).isZero();
    }

    // --- operaciones para todos los usuarios ---

    @Test
    void regularUserCanCreateAndArchive() throws Exception {
        // notificarMiembros se llama desde acciones de cualquier usuario, y
        // Notificaciones.jsx auto-archiva al cargar la página (también usuarios normales)
        postJson(URL, "{\"titulo\": \"Aviso\", \"mensaje\": \"Hola\", \"tipo\": \"otro\"}")
                .andExpect(status().isCreated());
        patchNotif(fiesta.getId(), "{\"archivada\": true}")
                .andExpect(status().isOk());
    }
}
