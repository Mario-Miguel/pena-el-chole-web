package com.penaelchole.backend.auth;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
                @JsonProperty("usuario") @NotBlank(message = "Usuario no puede estar vacio") String username,
                @JsonProperty("contrasena") @NotBlank(message = "Contraseña no puede estar vacia") String password) {
}
