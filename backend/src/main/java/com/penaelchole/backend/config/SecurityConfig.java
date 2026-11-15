package com.penaelchole.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Sin esta clase, Spring Security bloquea todas las peticiones con un usuario/contraseña generado.
 *
 * TODO: de momento todo es público. Cuando exista POST /api/auth/login (JWT),
 * cambiar permitAll() por authenticated() y configurar oauth2ResourceServer().jwt().
 */
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // API sin cookies de sesión: CSRF no aplica
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .build();
    }
}
