package com.penaelchole.backend.auth;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UserSession(
        @JsonProperty("integranteId") String memberId,
        @JsonProperty("nombre") String name,
        @JsonProperty("cargo") String role,
        String avatarUrl,
        @JsonProperty("esAdmin") boolean admin) {
}
