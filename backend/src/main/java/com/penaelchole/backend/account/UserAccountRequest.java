package com.penaelchole.backend.account;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record UserAccountRequest(
                @JsonProperty("integrante_id") @NotBlank(message = "El miembro no puede estar vacio") String memberId,
                @JsonProperty("usuario") @NotBlank(message = "El nombre de usuario no puede estar vacio") String username,
                @JsonProperty("contrasena") @NotBlank(message = "La contraseña no puede estar vacia") String password,
                @JsonProperty("disabled") Boolean disabled,
                @JsonProperty("avatar_url") String avatarUrl) {

}
