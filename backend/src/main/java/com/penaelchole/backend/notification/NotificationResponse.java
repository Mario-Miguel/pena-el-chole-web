package com.penaelchole.backend.notification;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record NotificationResponse(
        String id,
        @JsonProperty("archivada") boolean archived,
        @JsonProperty("fecha_archivo") Instant archiveDate,
        @JsonProperty("fecha_publicacion") Instant publishDate,
        @JsonProperty("leida_por") List<String> readBy,
        @JsonProperty("mensaje") String message,
        @JsonProperty("tipo") String type,
        @JsonProperty("titulo") String title,
        Instant createdDate,
        Instant updatedDate,
        String createdById) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getArchived(),
                n.getArchiveDate(),
                n.getPublishDate(),
                n.getReadBy(),
                n.getMessage(),
                n.getType(),
                n.getTitle(),
                n.getCreatedDate(),
                n.getUpdatedDate(),
                n.getCreatedById());
    }
}
