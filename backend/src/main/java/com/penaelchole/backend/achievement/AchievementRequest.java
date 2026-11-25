package com.penaelchole.backend.achievement;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;

// Tipos envoltorio (Boolean, Integer) para poder distinguir "no viene" (null)
// de false/0: los logros por defecto del frontend no mandan "activo".
public record AchievementRequest(
        @JsonProperty("activo") Boolean active,
        @JsonProperty("categoria") String category,
        @JsonProperty("descripcion") String description,
        @JsonProperty("icono") String icon,
        @JsonProperty("nombre") @NotBlank(message = "El nombre no puede estar vacío") String name,
        @JsonProperty("puntos") Integer points,
        @JsonProperty("umbral") Integer threshold) {

}
