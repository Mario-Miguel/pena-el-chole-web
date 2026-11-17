package com.penaelchole.backend.integrante;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.emptyString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
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
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class IntegranteControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    IntegranteRepository repository;

    @BeforeEach
    void limpiar() {
        repository.deleteAll();
    }

    @Test
    void listaIntegrantesEnSnakeCase() throws Exception {
        Integrante pepe = new Integrante("Pepe", "cargos", "tesorero");
        pepe.setFechaNacimiento(LocalDate.of(1990, 5, 17));
        repository.save(pepe);

        mockMvc.perform(get("/api/entities/Integrante"))
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
    void listaVaciaDevuelveArrayVacio() throws Exception {
        mockMvc.perform(get("/api/entities/Integrante"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // --- Rutas de error (GlobalExceptionHandler) ---

    @Test
    void patchDeIdInexistenteDevuelve404ConMensaje() throws Exception {
        mockMvc.perform(patch("/api/entities/Integrante/{id}", "no-existe")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"nombre": "Juan"}
                        """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Integrante no encontrado"));
    }

    @Test
    void postConNombreVacioDevuelve400ConMensaje() throws Exception {
        mockMvc.perform(post("/api/entities/Integrante")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"nombre": "", "cargo": "vocal"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("nombre")));
    }

    @Test
    void patchConFechaInvalidaDevuelve400ConMensaje() throws Exception {
        Integrante pepe = repository.save(new Integrante("Pepe", "cargos", "tesorero"));

        mockMvc.perform(patch("/api/entities/Integrante/{id}", pepe.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"fecha_nacimiento": "no-es-fecha"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Fecha no valida: no-es-fecha"));
    }

    @Test
    void patchConNombreVacioDevuelve400ConMensaje() throws Exception {
        Integrante pepe = repository.save(new Integrante("Pepe", "cargos", "tesorero"));

        mockMvc.perform(patch("/api/entities/Integrante/{id}", pepe.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"nombre": ""}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El nombre no puede estar vacío"));
    }

    @Test
    void patchWithoutNameGives200Response() throws Exception {
        Integrante pepe = repository.save(new Integrante("Pepe", "cargos", "tesorero"));

        mockMvc.perform(patch("/api/entities/Integrante/{id}", pepe.getId())
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
    void patchWithExplicitFieldWithNullEraseField() throws Exception {
        Integrante pepe = repository.save(new Integrante("Pepe", "cargos", "tesorero"));

        mockMvc.perform(patch("/api/entities/Integrante/{id}", pepe.getId())
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
    void getPorIdDevuelveElIntegrante() throws Exception {
        Integrante pepe = new Integrante("Pepe", "cargos", "tesorero");
        pepe.setFechaNacimiento(LocalDate.of(1990, 5, 17));
        repository.save(pepe);

        mockMvc.perform(get("/api/entities/Integrante/{id}", pepe.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(pepe.getId()))
                .andExpect(jsonPath("$.nombre").value("Pepe"))
                .andExpect(jsonPath("$.fecha_nacimiento").value("1990-05-17"));
    }

    @Test
    void getPorIdInexistenteDevuelve404ConMensaje() throws Exception {
        mockMvc.perform(get("/api/entities/Integrante/{id}", "no-existe"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Integrante no encontrado"));
    }

    // --- POST (create) ---

    @Test
    void postDevuelveLasFechasDeSistema() throws Exception {
        mockMvc.perform(post("/api/entities/Integrante")
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
    void bulkCreaTodosLosCamposEnElMismoOrden() throws Exception {
        mockMvc.perform(post("/api/entities/Integrante/bulk")
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
    void bulkConUnElementoInvalidoNoCreaNinguno() throws Exception {
        mockMvc.perform(post("/api/entities/Integrante/bulk")
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
    void deleteManyBorraSoloLosIdsIndicados() throws Exception {
        Integrante ana = repository.save(new Integrante("Ana", null, null));
        Integrante luis = repository.save(new Integrante("Luis", null, null));
        Integrante pepe = repository.save(new Integrante("Pepe", null, null));

        mockMvc.perform(post("/api/entities/Integrante/delete-many")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"ids": ["%s", "%s"]}
                        """.formatted(ana.getId(), luis.getId())))
                .andExpect(status().isNoContent());

        assertThat(repository.findAll())
                .extracting(Integrante::getId)
                .containsExactly(pepe.getId());
    }

    @Test
    void deleteManyIgnoraIdsInexistentes() throws Exception {
        Integrante pepe = repository.save(new Integrante("Pepe", null, null));

        mockMvc.perform(post("/api/entities/Integrante/delete-many")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"ids": ["no-existe"]}
                        """))
                .andExpect(status().isNoContent());

        assertThat(repository.existsById(pepe.getId())).isTrue();
    }

    @Test
    void deleteManySinIdsDevuelve400ConMensaje() throws Exception {
        mockMvc.perform(post("/api/entities/Integrante/delete-many")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(not(emptyString())));
    }

    // --- GET con sort / limit / skip (ListQuery) ---

    /** Guarda uno a uno con flush para que cada created_date sea posterior al anterior. */
    private void guardarEnOrden(String... nombres) {
        for (String nombre : nombres) {
            repository.saveAndFlush(new Integrante(nombre, null, null));
        }
    }

    @Test
    void sortDescendentePorCreatedDateDevuelveLosMasRecientesPrimero() throws Exception {
        guardarEnOrden("Ana", "Luis", "Pepe");

        mockMvc.perform(get("/api/entities/Integrante").param("sort", "-created_date"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nombre").value(contains("Pepe", "Luis", "Ana")));
    }

    @Test
    void sortAscendentePorNombreDevuelveOrdenAlfabetico() throws Exception {
        guardarEnOrden("Luis", "Ana", "Pepe");

        mockMvc.perform(get("/api/entities/Integrante").param("sort", "nombre"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nombre").value(contains("Ana", "Luis", "Pepe")));
    }

    @Test
    void limitYSkipDevuelvenLaVentanaPedida() throws Exception {
        guardarEnOrden("Dani", "Ana", "Carla", "Beto");

        // skip=1 no es múltiplo de limit=2: con paginación por número de página fallaría
        mockMvc.perform(get("/api/entities/Integrante")
                .param("sort", "nombre")
                .param("limit", "2")
                .param("skip", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nombre").value(contains("Beto", "Carla")));
    }

    @Test
    void paginarSinSortDevuelveCadaFilaUnaSolaVez() throws Exception {
        guardarEnOrden("A", "B", "C", "D", "E");

        // Igual que la exportación de CopiaSeguridad: pedir lotes hasta recibir menos de limit
        List<String> ids = new ArrayList<>();
        int limit = 2;
        for (int skip = 0;; skip += limit) {
            String body = mockMvc.perform(get("/api/entities/Integrante")
                    .param("limit", String.valueOf(limit))
                    .param("skip", String.valueOf(skip)))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            List<String> lote = JsonPath.read(body, "$[*].id");
            ids.addAll(lote);
            if (lote.size() < limit)
                break;
        }

        assertThat(ids).hasSize(5).doesNotHaveDuplicates();
    }

    @Test
    void sortPorCampoInexistenteDevuelve400ConMensaje() throws Exception {
        mockMvc.perform(get("/api/entities/Integrante").param("sort", "-no_existe"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("no_existe")));
    }

    @Test
    void limitCeroDevuelve400ConMensaje() throws Exception {
        mockMvc.perform(get("/api/entities/Integrante").param("limit", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(not(emptyString())));
    }

    @Test
    void limitNoNumericoDevuelve400ConMensaje() throws Exception {
        mockMvc.perform(get("/api/entities/Integrante").param("limit", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("limit")));
    }

    // --- GET con filtros de igualdad (Filters) ---

    private Integrante guardar(String nombre, String categoria, String cargo) {
        return repository.saveAndFlush(new Integrante(nombre, categoria, cargo));
    }

    @Test
    void filtroPorCampoDevuelveSoloLasCoincidencias() throws Exception {
        guardar("Ana", "cargos", "tesorero");
        guardar("Luis", "cargos", "vocal");
        guardar("Pepe", "socios", "tesorero");

        mockMvc.perform(get("/api/entities/Integrante")
                .param("cargo", "tesorero")
                .param("sort", "nombre"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nombre").value(contains("Ana", "Pepe")));
    }

    @Test
    void variosFiltrosSeCombinanConAnd() throws Exception {
        guardar("Ana", "cargos", "tesorero");
        guardar("Luis", "cargos", "vocal");
        guardar("Pepe", "socios", "tesorero");

        mockMvc.perform(get("/api/entities/Integrante")
                .param("cargo", "tesorero")
                .param("categoria", "cargos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nombre").value(contains("Ana")));
    }

    @Test
    void filtroPorIdDevuelveEseRegistro() throws Exception {
        guardar("Ana", null, null);
        Integrante luis = guardar("Luis", null, null);

        mockMvc.perform(get("/api/entities/Integrante").param("id", luis.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(luis.getId()));
    }

    @Test
    void filtroNumericoConvierteElValor() throws Exception {
        Integrante ana = new Integrante("Ana", null, null);
        ana.setCervezas(7);
        repository.saveAndFlush(ana);
        guardar("Luis", null, null);

        mockMvc.perform(get("/api/entities/Integrante").param("cervezas", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nombre").value(contains("Ana")));
    }

    @Test
    void filtroPorFechaEnSnakeCase() throws Exception {
        Integrante ana = new Integrante("Ana", null, null);
        ana.setFechaNacimiento(LocalDate.of(1990, 5, 17));
        repository.saveAndFlush(ana);
        guardar("Luis", null, null);

        mockMvc.perform(get("/api/entities/Integrante").param("fecha_nacimiento", "1990-05-17"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nombre").value(contains("Ana")));
    }

    @Test
    void filtroSinCoincidenciasDevuelveArrayVacio() throws Exception {
        guardar("Ana", "cargos", "tesorero");

        mockMvc.perform(get("/api/entities/Integrante").param("cargo", "presidente"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void filtrosSeCombinanConSortYLimit() throws Exception {
        guardar("Pepe", null, "vocal");
        guardar("Ana", null, "tesorero");
        guardar("Luis", null, "vocal");

        mockMvc.perform(get("/api/entities/Integrante")
                .param("cargo", "vocal")
                .param("sort", "nombre")
                .param("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].nombre").value(contains("Luis")));
    }

    @Test
    void filtroConValorNoValidoDevuelve400ConMensaje() throws Exception {
        mockMvc.perform(get("/api/entities/Integrante").param("cervezas", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Valor no válido para cervezas: abc"));
    }

    @Test
    void filtroPorCampoInexistenteDevuelve400ConMensaje() throws Exception {
        mockMvc.perform(get("/api/entities/Integrante").param("no_existe", "x"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("No se puede filtrar por: no_existe"));
    }

    // --- POST con todos los campos y DELETE /{id} ---

    @Test
    void postGuardaYDevuelveTodosLosCampos() throws Exception {
        String body = mockMvc.perform(post("/api/entities/Integrante")
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
        Integrante guardado = repository.findById(id).orElseThrow();
        assertThat(guardado.getNombre()).isEqualTo("Ana");
        assertThat(guardado.getCategoria()).isEqualTo("cargos");
        assertThat(guardado.getCargo()).isEqualTo("tesorero");
        assertThat(guardado.getCervezas()).isEqualTo(7);
        assertThat(guardado.getFechaNacimiento()).isEqualTo(LocalDate.of(1990, 5, 17));
    }

    @Test
    void postSinCervezasLasPoneACero() throws Exception {
        mockMvc.perform(post("/api/entities/Integrante")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"nombre": "Luis"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cervezas").value(0))
                .andExpect(jsonPath("$.fecha_nacimiento").value(nullValue()));
    }

    @Test
    void deleteBorraElIntegranteYDevuelve204() throws Exception {
        Integrante ana = guardar("Ana", null, null);
        Integrante luis = guardar("Luis", null, null);

        mockMvc.perform(delete("/api/entities/Integrante/{id}", ana.getId()))
                .andExpect(status().isNoContent());

        assertThat(repository.existsById(ana.getId())).isFalse();
        assertThat(repository.existsById(luis.getId())).isTrue();
    }

    @Test
    void deleteDeIdInexistenteDevuelve204() throws Exception {
        // Borrar algo que ya no existe deja el sistema igual: se trata como éxito
        mockMvc.perform(delete("/api/entities/Integrante/{id}", "no-existe"))
                .andExpect(status().isNoContent());
    }
}
