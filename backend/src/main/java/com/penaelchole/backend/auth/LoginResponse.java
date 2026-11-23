package com.penaelchole.backend.auth;

import com.fasterxml.jackson.annotation.JsonProperty;

public record LoginResponse(
                String token,
                @JsonProperty("sesion") UserSession session) {
}
