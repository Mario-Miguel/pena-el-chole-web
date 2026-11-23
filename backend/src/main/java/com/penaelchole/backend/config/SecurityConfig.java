package com.penaelchole.backend.config;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

/**
 * Sin esta clase, Spring Security bloquea todas las peticiones con un
 * usuario/contraseña generado.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private static final Set<String> ADMIN_ROLES = Set.of("presidente", "vicepresidente");

    private static final RequestMatcher PUBLIC = new OrRequestMatcher(
            PathPatternRequestMatcher.withDefaults().matcher("/api/auth/login"),
            PathPatternRequestMatcher.withDefaults().matcher("/api/auth/usuarios"),
            PathPatternRequestMatcher.withDefaults().matcher("/error"),
            PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.GET, "/api/files/**"));

    private static final RequestMatcher EVENTS = PathPatternRequestMatcher.withDefaults().matcher("/api/events");

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // API sin cookies de sesión: CSRF no aplica
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(PUBLIC).permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(o -> o.bearerTokenResolver(bearerTokenResolver()).jwt(Customizer.withDefaults()))
                .build();
    }

    private static BearerTokenResolver bearerTokenResolver() {
        DefaultBearerTokenResolver header = new DefaultBearerTokenResolver();
        return request -> {
            if (PUBLIC.matches(request))
                return null;
            if (EVENTS.matches(request))
                return request.getParameter("token");
            return header.resolve(request);
        };
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    JwtEncoder jwtEncoder(@Value("${app.jwt.secret}") String secret) {
        SecretKey key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    @Bean
    JwtDecoder jwtDecoder(@Value("${app.jwt.secret}") String secret) {
        SecretKey key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            List<GrantedAuthority> authorities = new ArrayList<>();

            String role = jwt.getClaim("role");
            if (role != null && !role.isBlank()) {
                role = role.trim().toLowerCase(Locale.ROOT);
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase(Locale.ROOT)));
            }

            boolean isAdmin = Boolean.TRUE.equals(jwt.getClaim("admin"));

            if (isAdmin || (role != null && ADMIN_ROLES.contains(role))) {
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            }

            return authorities;
        });
        return converter;
    }

}
