package com.penaelchole.backend.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.penaelchole.backend.TestcontainersConfiguration;

/**
 * Sin app.admin.password-hash configurado, el login de __admin__ queda
 * desactivado. Va en su propia clase porque necesita otra configuración
 * (y por tanto otro contexto de Spring).
 */
@SpringBootTest(properties = "app.admin.password-hash=")
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AdminLoginDisabledTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void adminLoginFailsWhenHashIsNotConfigured() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"usuario": "__admin__", "contrasena": "cualquiera"}
                        """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuario o contraseña incorrectos"));
    }
}
