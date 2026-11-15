package com.penaelchole.backend.integrante;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.penaelchole.backend.TestcontainersConfiguration;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

/** Arranca la app completa contra un PostgreSQL real en Docker (Testcontainers). */
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
}
