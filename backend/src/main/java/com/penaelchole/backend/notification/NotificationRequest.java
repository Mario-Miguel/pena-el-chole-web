package com.penaelchole.backend.notification;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record NotificationRequest(
                @JsonProperty("archivada") Boolean archived,
                @JsonProperty("fecha_archivo") Instant archiveDate,
                @JsonProperty("fecha_publicacion") Instant publishDate,
                @JsonProperty("leida_por") List<String> readBy,
                @JsonProperty("mensaje") String message,
                @JsonProperty("tipo") @NotBlank(message = "El tipo no puede estar vacio") String type,
                @JsonProperty("titulo") @NotBlank(message = "El titulo no puede estar vacio") String title) {
}
