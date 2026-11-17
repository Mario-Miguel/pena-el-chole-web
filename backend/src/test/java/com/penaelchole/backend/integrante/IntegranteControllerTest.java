package com.penaelchole.backend.integrante;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

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
}
