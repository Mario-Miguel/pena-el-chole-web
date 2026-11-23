package com.penaelchole.backend.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.penaelchole.backend.TestcontainersConfiguration;
import com.penaelchole.backend.auth.TokenService;
import com.penaelchole.backend.auth.UserSession;
import com.penaelchole.backend.member.Member;
import com.penaelchole.backend.member.MemberRepository;

/**
 * Permisos de /api/entities/SesionUsuario (API.md, "Special rules for
 * SesionUsuario"): los admins (esAdmin, presidente, vicepresidente) gestionan
 * cualquier cuenta; un usuario normal solo cambia la contraseña y el avatar de
 * la suya.
 *
 * Los tokens se emiten con TokenService (no con .with(jwt())) para que pasen
 * por el JwtAuthenticationConverter de verdad.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class UserAccountControllerTest {

    private static final String URL = "/api/entities/SesionUsuario";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserAccountRepository accounts;

    @Autowired
    MemberRepository members;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    TokenService tokenService;

    @Value("${app.jwt.secret}")
    String jwtSecret;

    Member pepe;
    Member ana;
    Member luis;
    UserAccount pepeAccount;
    UserAccount anaAccount;

    @BeforeEach
    void setUp() {
        accounts.deleteAll();
        members.deleteAll();
        pepe = members.save(new Member("Pepe Pérez", "cargos", "vocal"));
        ana = members.save(new Member("Ana García", "cargos", "tesorero"));
        luis = members.save(new Member("Luis Ruiz", "socios", null));
        pepeAccount = accounts.saveAndFlush(
                new UserAccount(pepe.getId(), "pepe", passwordEncoder.encode("secreto1"), null));
        anaAccount = accounts.saveAndFlush(
                new UserAccount(ana.getId(), "ana", passwordEncoder.encode("secreto2"), null));
    }

    // --- tokens ---

    private String tokenFor(Member m) {
        return tokenService.createToken(new UserSession(m.getId(), m.getName(), m.getRole(), null, false));
    }

    private String tokenWithRole(Member m, String role) {
        return tokenService.createToken(new UserSession(m.getId(), m.getName(), role, null, false));
    }

    private String adminToken() {
        return tokenService.createToken(
                new UserSession(UserAccount.ADMIN_USERNAME, "Admin", null, null, true));
    }

    /** Token firmado a mano sin claims "admin" ni "role" (p. ej. de una versión antigua). */
    private String tokenWithoutClaims(Member m) {
        var key = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder()
                .subject(m.getId())
                .issuedAt(now)
                .expiresAt(now.plus(1, ChronoUnit.HOURS))
                .build();
        return new NimbusJwtEncoder(new ImmutableSecret<>(key))
                .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }

    // --- peticiones ---

    private ResultActions perform(MockHttpServletRequestBuilder request, String token) throws Exception {
        return mockMvc.perform(request.header("Authorization", "Bearer " + token));
    }

    private ResultActions patchAccount(String id, String json, String token) throws Exception {
        return perform(patch(URL + "/{id}", id).contentType(MediaType.APPLICATION_JSON).content(json), token);
    }

    private ResultActions createAccount(String token) throws Exception {
        return perform(post(URL).contentType(MediaType.APPLICATION_JSON).content("""
                {"integrante_id": "%s", "usuario": "luis", "contrasena": "secreto3"}
                """.formatted(luis.getId())), token);
    }

    private boolean passwordMatches(UserAccount account, String password) {
        String hash = accounts.findById(account.getId()).orElseThrow().getPasswordHash();
        return passwordEncoder.matches(password, hash);
    }

    // --- sin token ---

    @Test
    void withoutTokenReturns401() throws Exception {
        mockMvc.perform(get(URL)).andExpect(status().isUnauthorized());
        mockMvc.perform(patch(URL + "/{id}", pepeAccount.getId())
                .contentType(MediaType.APPLICATION_JSON).content("{\"avatar_url\": \"x\"}"))
                .andExpect(status().isUnauthorized());
    }

    // --- lectura: cualquier usuario autenticado ---

    @Test
    void regularUserCanListAccountsWithoutPasswords() throws Exception {
        perform(get(URL), tokenFor(pepe))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].contrasena").doesNotExist())
                .andExpect(jsonPath("$[0].password_hash").doesNotExist());
    }

    @Test
    void regularUserCanGetAnAccount() throws Exception {
        perform(get(URL + "/{id}", anaAccount.getId()), tokenFor(pepe))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario").value("ana"));
    }

    // --- endpoints solo para admins ---

    @Test
    void regularUserCannotCreateAccount() throws Exception {
        createAccount(tokenFor(pepe))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").exists());
        assertThat(accounts.findByMemberId(luis.getId())).isEmpty();
    }

    @Test
    void regularUserCannotBulkCreate() throws Exception {
        perform(post(URL + "/bulk").contentType(MediaType.APPLICATION_JSON).content("""
                [{"integrante_id": "%s", "usuario": "luis", "contrasena": "secreto3"}]
                """.formatted(luis.getId())), tokenFor(pepe))
                .andExpect(status().isForbidden());
        assertThat(accounts.findByMemberId(luis.getId())).isEmpty();
    }

    @Test
    void regularUserCannotDeleteEvenOwnAccount() throws Exception {
        perform(delete(URL + "/{id}", pepeAccount.getId()), tokenFor(pepe))
                .andExpect(status().isForbidden());
        assertThat(accounts.existsById(pepeAccount.getId())).isTrue();
    }

    @Test
    void regularUserCannotDeleteMany() throws Exception {
        perform(post(URL + "/delete-many").contentType(MediaType.APPLICATION_JSON).content("""
                {"ids": ["%s"]}
                """.formatted(anaAccount.getId())), tokenFor(pepe))
                .andExpect(status().isForbidden());
        assertThat(accounts.existsById(anaAccount.getId())).isTrue();
    }

    @Test
    void adminCanCreateAndDelete() throws Exception {
        createAccount(adminToken()).andExpect(status().isCreated());
        UserAccount luisAccount = accounts.findByMemberId(luis.getId()).orElseThrow();

        perform(delete(URL + "/{id}", luisAccount.getId()), adminToken())
                .andExpect(status().isNoContent());
        assertThat(accounts.existsById(luisAccount.getId())).isFalse();
    }

    @Test
    void presidenteIsAdmin() throws Exception {
        createAccount(tokenWithRole(pepe, "presidente")).andExpect(status().isCreated());
    }

    @Test
    void vicepresidenteIsAdmin() throws Exception {
        createAccount(tokenWithRole(pepe, "vicepresidente")).andExpect(status().isCreated());
    }

    @Test
    void adminRoleIgnoresCaseAndSpaces() throws Exception {
        createAccount(tokenWithRole(pepe, " Presidente ")).andExpect(status().isCreated());
    }

    @Test
    void otherRolesAreNotAdmin() throws Exception {
        createAccount(tokenWithRole(pepe, "tesorero")).andExpect(status().isForbidden());
        createAccount(tokenWithRole(pepe, "secretario")).andExpect(status().isForbidden());
    }

    @Test
    void tokenWithoutAdminOrRoleClaimsIsRegularUser() throws Exception {
        // Si falta el claim "admin", no debe petar: es un usuario normal
        createAccount(tokenWithoutClaims(pepe)).andExpect(status().isForbidden());
        patchAccount(pepeAccount.getId(), "{\"avatar_url\": \"/api/files/a.jpg\"}", tokenWithoutClaims(pepe))
                .andExpect(status().isOk());
    }

    // --- PATCH de la cuenta propia ---

    @Test
    void userCanChangeOwnPassword() throws Exception {
        patchAccount(pepeAccount.getId(), "{\"contrasena\": \"nueva123\"}", tokenFor(pepe))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contrasena").doesNotExist());

        assertThat(passwordMatches(pepeAccount, "nueva123")).isTrue();
        assertThat(passwordMatches(pepeAccount, "secreto1")).isFalse();
    }

    @Test
    void userCanChangeOwnAvatar() throws Exception {
        patchAccount(pepeAccount.getId(), "{\"avatar_url\": \"/api/files/pepe.jpg\"}", tokenFor(pepe))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar_url").value("/api/files/pepe.jpg"));
    }

    @Test
    void userCanChangePasswordAndAvatarTogether() throws Exception {
        patchAccount(pepeAccount.getId(), """
                {"contrasena": "nueva123", "avatar_url": "/api/files/pepe.jpg"}
                """, tokenFor(pepe))
                .andExpect(status().isOk());
        assertThat(passwordMatches(pepeAccount, "nueva123")).isTrue();
    }

    @Test
    void userCannotChangeOwnUsername() throws Exception {
        patchAccount(pepeAccount.getId(), "{\"usuario\": \"pepito\"}", tokenFor(pepe))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Solo puedes cambiar tu contraseña y tu avatar"));
        assertThat(accounts.findById(pepeAccount.getId()).orElseThrow().getUsername()).isEqualTo("pepe");
    }

    @Test
    void userCannotEnableOrDisableOwnAccount() throws Exception {
        patchAccount(pepeAccount.getId(), "{\"disabled\": true}", tokenFor(pepe))
                .andExpect(status().isForbidden());
        assertThat(accounts.findById(pepeAccount.getId()).orElseThrow().isDisabled()).isFalse();
    }

    @Test
    void userCannotMoveOwnAccountToOtherMember() throws Exception {
        patchAccount(pepeAccount.getId(), "{\"integrante_id\": \"%s\"}".formatted(luis.getId()), tokenFor(pepe))
                .andExpect(status().isForbidden());
    }

    @Test
    void forbiddenFieldBlocksWholePatch() throws Exception {
        // Si un campo no está permitido, tampoco se aplican los permitidos
        patchAccount(pepeAccount.getId(), """
                {"contrasena": "nueva123", "usuario": "pepito"}
                """, tokenFor(pepe))
                .andExpect(status().isForbidden());
        assertThat(passwordMatches(pepeAccount, "secreto1")).isTrue();
    }

    @Test
    void forbiddenCheckRunsBeforeValidation() throws Exception {
        // Un usuario normal no debe poder averiguar qué usuarios existen
        patchAccount(pepeAccount.getId(), "{\"usuario\": \"ana\"}", tokenFor(pepe))
                .andExpect(status().isForbidden());
    }

    // --- PATCH de la cuenta de otro ---

    @Test
    void userCannotChangeOtherUsersPassword() throws Exception {
        patchAccount(anaAccount.getId(), "{\"contrasena\": \"hackeada\"}", tokenFor(pepe))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Solo puedes modificar tu propia cuenta"));
        assertThat(passwordMatches(anaAccount, "secreto2")).isTrue();
    }

    @Test
    void userCannotChangeOtherUsersAvatar() throws Exception {
        patchAccount(anaAccount.getId(), "{\"avatar_url\": \"/api/files/x.jpg\"}", tokenFor(pepe))
                .andExpect(status().isForbidden());
        assertThat(accounts.findById(anaAccount.getId()).orElseThrow().getAvatarUrl()).isNull();
    }

    @Test
    void patchOfMissingAccountReturns404() throws Exception {
        patchAccount("no-existe", "{\"avatar_url\": \"x\"}", tokenFor(pepe))
                .andExpect(status().isNotFound());
    }

    // --- PATCH como admin ---

    @Test
    void adminCanChangeAnyFieldOfAnyAccount() throws Exception {
        patchAccount(anaAccount.getId(), """
                {"usuario": "anita", "disabled": true, "contrasena": "nueva456", "avatar_url": "/api/files/a.jpg"}
                """, adminToken())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario").value("anita"))
                .andExpect(jsonPath("$.disabled").value(true))
                .andExpect(jsonPath("$.avatar_url").value("/api/files/a.jpg"));
        assertThat(passwordMatches(anaAccount, "nueva456")).isTrue();
    }

    @Test
    void presidenteCanChangeOtherUsersAccount() throws Exception {
        patchAccount(anaAccount.getId(), "{\"disabled\": true}", tokenWithRole(pepe, "presidente"))
                .andExpect(status().isOk());
        assertThat(accounts.findById(anaAccount.getId()).orElseThrow().isDisabled()).isTrue();
    }

    @Test
    void adminStillGetsValidationErrors() throws Exception {
        patchAccount(anaAccount.getId(), "{\"usuario\": \"pepe\"}", adminToken())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Ese usuario ya existe"));
    }
}
