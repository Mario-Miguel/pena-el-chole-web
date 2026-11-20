package com.penaelchole.backend.member;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record MemberRequest (
    @NotBlank String nombre,
    String categoria,
    String cargo,
    Integer cervezas,
    LocalDate fechaNacimiento
){}
