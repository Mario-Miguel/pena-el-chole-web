package com.penaelchole.backend.auth;

import com.fasterxml.jackson.annotation.JsonProperty;

public record UsersResponse(
        String id,
        @JsonProperty("nombre") String name,
        @JsonProperty("usuarioLogin") String username) {
}
