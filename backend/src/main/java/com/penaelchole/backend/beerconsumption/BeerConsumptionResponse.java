package com.penaelchole.backend.beerconsumption;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

// @JsonNaming: createdDate -> "created_date". Cerveza.jsx ordena los consumos
// por created_date para quitar el más reciente.
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record BeerConsumptionResponse(
        String id,
        @JsonProperty("cantidad") int quantity,
        @JsonProperty("integrante_id") String memberId,
        @JsonProperty("tipo") String type,
        @JsonProperty("archivado") boolean archived,
        @JsonProperty("anio_archivo") Integer archiveYear,
        Instant createdDate,
        Instant updatedDate,
        String createdById) {
    public static BeerConsumptionResponse from(BeerConsumption b) {
        return new BeerConsumptionResponse(
                b.getId(),
                b.getQuantity(),
                b.getMemberId(),
                b.getType(),
                b.isArchived(),
                b.getArchiveYear(),
                b.getCreatedDate(),
                b.getUpdatedDate(),
                b.getCreatedById());
    }
}
