package com.penaelchole.backend.beerbatch;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotNull;

// cantidad, coste y fecha son NOT NULL en la tabla: sin @NotNull, un POST sin
// ellos llegaría a la base de datos y devolvería 409 en vez de 400.
public record BeerBatchRequest(
        @JsonProperty("cantidad") @NotNull(message = "La cantidad no puede estar vacía") Integer quantity,
        @JsonProperty("consumido_ajuste") Integer consumedAdjustment,
        @JsonProperty("coste") @NotNull(message = "El coste no puede estar vacío") BigDecimal cost,
        @JsonProperty("fecha") @NotNull(message = "La fecha no puede estar vacía") LocalDate date,
        @JsonProperty("notas") String notes,
        @JsonProperty("stock_minimo") Integer minimumStock,
        @JsonProperty("tipo") String type) {

}
