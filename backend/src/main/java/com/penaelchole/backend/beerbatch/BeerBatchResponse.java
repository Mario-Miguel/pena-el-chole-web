package com.penaelchole.backend.beerbatch;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

// @JsonNaming: createdDate -> "created_date" (lo que espera el frontend)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record BeerBatchResponse(
        String id,
        @JsonProperty("cantidad") Integer quantity,
        @JsonProperty("consumido_ajuste") Integer consumedAdjustment,
        @JsonProperty("coste") BigDecimal cost,
        @JsonProperty("fecha") LocalDate date,
        @JsonProperty("notas") String notes,
        @JsonProperty("stock_minimo") Integer minimumStock,
        @JsonProperty("tipo") String type,
        Instant createdDate,
        Instant updatedDate,
        String createdById) {
    public static BeerBatchResponse from(BeerBatch b) {
        return new BeerBatchResponse(
                b.getId(),
                b.getQuantity(),
                b.getConsumedAdjustment(),
                b.getCost(),
                b.getDate(),
                b.getNotes(),
                b.getMinimumStock(),
                b.getType(),
                b.getCreatedDate(),
                b.getUpdatedDate(),
                b.getCreatedById());
    }
}
