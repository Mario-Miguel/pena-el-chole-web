package com.penaelchole.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;

import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;
import com.penaelchole.backend.TestcontainersConfiguration;
import com.penaelchole.backend.member.Member;
import com.penaelchole.backend.member.MemberRepository;

/**
 * POST /api/auth/login contra un PostgreSQL real (Testcontainers).
 * Contrato en backend/API.md, sección "Auth".
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AuthControllerTest {

    private static final String ADMIN_PASSWORD = "elchole.123";

    // El hash del admin se genera al vuelo: así el test no depende de un hash
    // copiado a mano ni de la variable de entorno ADMIN_PASSWORD_HASH.
    @DynamicPropertySource
    static void adminPassword(DynamicPropertyRegistry registry) {
        String hash = new BCryptPasswordEncoder().encode(ADMIN_PASSWORD);
        registry.add("app.admin.password-hash", () -> hash);
        System.out.println(hash);
    }

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserAccountRepository accounts;

    @Autowired
    MemberRepository members;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Value("${app.jwt.secret}")
    String jwtSecret;

    Member pepe;

    @BeforeEach
    void setUp() {
        // Primero las cuentas: user_account.member_id apunta a member
        accounts.deleteAll();
        members.deleteAll();
        pepe = members.save(new Member("Pepe Pérez", "cargos", "tesorero"));
    }

    private UserAccount createAccount(String username, String password) {
        return accounts.saveAndFlush(
                new UserAccount(pepe.getId(), username, passwordEncoder.encode(password), null));
    }

    private ResultActions login(String usuario, String contrasena) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"usuario": "%s", "contrasena": "%s"}
                        """.formatted(usuario, contrasena)));
    }

    private Jwt decode(String token) {
        var key = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build().decode(token);
    }

    // --- Login correcto ---

    @Test
    void loginReturnsTokenAndSession() throws Exception {
        createAccount("pepe", "secreto");

        login("pepe", "secreto")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(notNullValue()))
                .andExpect(jsonPath("$.sesion.integranteId").value(pepe.getId()))
                .andExpect(jsonPath("$.sesion.nombre").value("Pepe Pérez"))
                .andExpect(jsonPath("$.sesion.cargo").value("tesorero"))
                .andExpect(jsonPath("$.sesion.avatarUrl").value(nullValue()))
                .andExpect(jsonPath("$.sesion.esAdmin").value(false));
    }

    @Test
    void loginReturnsAccountAvatar() throws Exception {
        UserAccount account = createAccount("pepe", "secreto");
        account.setAvatarUrl("/api/files/pepe.jpg");
        accounts.saveAndFlush(account);

        login("pepe", "secreto")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sesion.avatarUrl").value("/api/files/pepe.jpg"));
    }

    @Test
    void usernameIsCaseInsensitive() throws Exception {
        createAccount("Pepe", "secreto");

        login("pEPE", "secreto")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sesion.integranteId").value(pepe.getId()));
    }

    @Test
    void responseNeverContainsPasswordOrHash() throws Exception {
        UserAccount account = createAccount("pepe", "secreto");

        login("pepe", "secreto")
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString("secreto"))))
                .andExpect(content().string(not(containsString(account.getPasswordHash()))))
                .andExpect(content().string(not(containsString("contrasena"))));
    }

    // --- El token ---

    @Test
    void tokenIsSignedJwtWithMemberClaims() throws Exception {
        createAccount("pepe", "secreto");

        String body = login("pepe", "secreto").andReturn().getResponse().getContentAsString();
        // decode() comprueba la firma con el mismo secreto: si no coincide, lanza
        // excepción
        Jwt jwt = decode(JsonPath.read(body, "$.token"));

        assertThat(jwt.getSubject()).isEqualTo(pepe.getId());
        assertThat(jwt.getClaimAsString("role")).isEqualTo("tesorero");
        assertThat(jwt.<Boolean>getClaim("admin")).isFalse();
    }

    @Test
    void tokenExpiresInSevenDays() throws Exception {
        createAccount("pepe", "secreto");

        String body = login("pepe", "secreto").andReturn().getResponse().getContentAsString();
        Jwt jwt = decode(JsonPath.read(body, "$.token"));

        assertThat(Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt())).isEqualTo(Duration.ofDays(7));
        assertThat(jwt.getIssuedAt()).isBetween(Instant.now().minusSeconds(60), Instant.now());
    }

    @Test
    void tokenWithoutRoleOmitsRoleClaim() throws Exception {
        Member luis = members.save(new Member("Luis", "socios", null));
        accounts.saveAndFlush(new UserAccount(luis.getId(), "luis", passwordEncoder.encode("secreto"), null));

        String body = login("luis", "secreto")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sesion.cargo").value(nullValue()))
                .andReturn().getResponse().getContentAsString();

        assertThat(decode(JsonPath.read(body, "$.token")).hasClaim("role")).isFalse();
    }

    // --- Credenciales incorrectas: siempre 401 con el mismo mensaje ---

    @Test
    void wrongPasswordReturns401WithMessage() throws Exception {
        createAccount("pepe", "secreto");

        login("pepe", "otra")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuario o contraseña incorrectos"));
    }

    @Test
    void unknownUserReturnsSame401AsWrongPassword() throws Exception {
        // Mismo mensaje que con contraseña mala: no se puede averiguar qué usuarios
        // existen
        login("nadie", "secreto")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuario o contraseña incorrectos"));
    }

    @Test
    void disabledAccountReturns401EvenWithRightPassword() throws Exception {
        UserAccount account = createAccount("pepe", "secreto");
        account.setDisabled(true);
        accounts.saveAndFlush(account);

        login("pepe", "secreto")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuario o contraseña incorrectos"));
    }

    @Test
    void passwordIsCaseSensitive() throws Exception {
        createAccount("pepe", "secreto");

        login("pepe", "SECRETO").andExpect(status().isUnauthorized());
    }

    // --- Validación de la petición ---

    @Test
    void blankUsernameReturns400WithMessage() throws Exception {
        login("", "secreto")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Usuario")));
    }

    @Test
    void blankPasswordReturns400WithMessage() throws Exception {
        login("pepe", "")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Contraseña")));
    }

    @Test
    void missingFieldsReturn400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // --- Usuario __admin__ ---

    @Test
    void adminLoginReturnsAdminSession() throws Exception {
        login("__admin__", ADMIN_PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(notNullValue()))
                .andExpect(jsonPath("$.sesion.integranteId").value("__admin__"))
                .andExpect(jsonPath("$.sesion.nombre").value("Admin"))
                .andExpect(jsonPath("$.sesion.cargo").value(nullValue()))
                .andExpect(jsonPath("$.sesion.esAdmin").value(true));
    }

    @Test
    void adminTokenHasAdminClaims() throws Exception {
        String body = login("__admin__", ADMIN_PASSWORD).andReturn().getResponse().getContentAsString();
        Jwt jwt = decode(JsonPath.read(body, "$.token"));

        assertThat(jwt.getSubject()).isEqualTo("__admin__");
        assertThat(jwt.<Boolean>getClaim("admin")).isTrue();
        assertThat(jwt.hasClaim("role")).isFalse();
    }

    @Test
    void adminWithWrongPasswordReturns401() throws Exception {
        login("__admin__", "otra")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuario o contraseña incorrectos"));
    }

    @Test
    void adminDoesNotUseUserAccountTable() throws Exception {
        // Aunque exista una cuenta llamada __admin__, manda la contraseña de
        // configuración
        accounts.saveAndFlush(new UserAccount(pepe.getId(), "__admin__", passwordEncoder.encode("de-la-bd"), null));

        login("__admin__", "de-la-bd").andExpect(status().isUnauthorized());
        login("__admin__", ADMIN_PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sesion.esAdmin").value(true));
    }

    // --- Base de datos ---

    @Test
    void usernamesAreUniqueIgnoringCase() {
        createAccount("pepe", "secreto");

        // Lo garantiza el índice único sobre lower(username) de V3
        assertThatThrownBy(() -> createAccount("PEPE", "otra"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
