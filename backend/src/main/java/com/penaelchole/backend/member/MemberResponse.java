package com.penaelchole.backend.member;

import java.time.Instant;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

/**
 * Lo que se devuelve en JSON. Separarlo de la entidad JPA evita exponer detalles internos
 * y permite cambiar la base de datos sin romper el contrato con el frontend.
 * El frontend espera los campos en snake_case y en español (fecha_nacimiento...):
 * @JsonProperty fija el nombre JSON cuando no coincide con el componente Java.
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record MemberResponse(
        String id,
        @JsonProperty("nombre") String name,
        @JsonProperty("categoria") String category,
        @JsonProperty("cargo") String role,
        @JsonProperty("cervezas") int beers,
        @JsonProperty("fecha_nacimiento") LocalDate birthDate,
        Instant createdDate,
        Instant updatedDate,
        String createdById) {

    public static MemberResponse from(Member m) {
        return new MemberResponse(
                m.getId(),
                m.getName(),
                m.getCategory(),
                m.getRole(),
                m.getBeers(),
                m.getBirthDate(),
                m.getCreatedDate(),
                m.getUpdatedDate(),
                m.getCreatedById());
    }
}
