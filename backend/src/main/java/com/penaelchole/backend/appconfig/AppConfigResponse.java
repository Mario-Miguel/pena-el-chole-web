package com.penaelchole.backend.appconfig;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record AppConfigResponse(
        String id,
        @JsonProperty("clave") String key,
        @JsonProperty("valor") String value,
        Instant createdDate,
        Instant updatedDate,
        String createdById) {

    public static AppConfigResponse from(AppConfig a) {
        return new AppConfigResponse(
                a.getId(),
                a.getKey(),
                a.getValue(),
                a.getCreatedDate(),
                a.getUpdatedDate(),
                a.getCreatedById());
    }
}
