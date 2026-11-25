package com.penaelchole.backend.achievement;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record AchievementResponse(
        String id,
        @JsonProperty("activo") boolean active,
        @JsonProperty("categoria") String category,
        @JsonProperty("descripcion") String description,
        @JsonProperty("icono") String icon,
        @JsonProperty("nombre") String name,
        @JsonProperty("puntos") int points,
        @JsonProperty("umbral") int threshold,
        Instant createdDate,
        Instant updatedDate,
        String createdById) {
    public static AchievementResponse from(Achievement entity) {
        return new AchievementResponse(
                entity.getId(),
                entity.isActive(),
                entity.getCategory(),
                entity.getDescription(),
                entity.getIcon(),
                entity.getName(),
                entity.getPoints(),
                entity.getThreshold(),
                entity.getCreatedDate(),
                entity.getUpdatedDate(),
                entity.getCreatedById());
    }
}
