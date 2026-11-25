package com.penaelchole.backend.member;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record MemberRequest(
        @JsonProperty("nombre") @NotBlank(message = "El nombre no puede estar vacío") String name,
        @JsonProperty("categoria") String category,
        @JsonProperty("cargo") String role,
        @JsonProperty("fecha_nacimiento") LocalDate birthDate) {
}
