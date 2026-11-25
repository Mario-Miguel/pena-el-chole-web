package com.penaelchole.backend.beerpayment;

import java.math.BigDecimal;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotNull;

// integrante_id puede ser null: es un pago de los invitados.
// importe puede ser negativo (corrección); que no sea 0 lo comprueba la entidad.
public record BeerPaymentRequest(
        @JsonProperty("integrante_id") String memberId,
        @JsonProperty("importe") @NotNull(message = "El importe no puede estar vacío ni ser 0") BigDecimal amount,
        @JsonProperty("fecha") Instant date,
        @JsonProperty("notas") String notes) {
}
