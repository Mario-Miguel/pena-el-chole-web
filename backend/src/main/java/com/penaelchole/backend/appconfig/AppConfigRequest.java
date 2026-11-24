package com.penaelchole.backend.appconfig;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record AppConfigRequest(
        @JsonProperty("clave") @NotBlank(message = "La clave no puede estar vacía") String key,
        @JsonProperty("valor") @NotBlank(message = "El valor no puede estar vacío") String value) {

}
