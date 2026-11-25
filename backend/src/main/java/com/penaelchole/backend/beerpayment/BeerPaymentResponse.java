package com.penaelchole.backend.beerpayment;

import java.math.BigDecimal;
import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

// @JsonNaming: createdDate -> "created_date" (lo que espera el frontend)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record BeerPaymentResponse(
        String id,
        @JsonProperty("integrante_id") String memberId,
        @JsonProperty("importe") BigDecimal amount,
        @JsonProperty("fecha") Instant date,
        @JsonProperty("notas") String notes,
        @JsonProperty("archivado") boolean archived,
        @JsonProperty("anio_archivo") Integer archiveYear,
        Instant createdDate,
        Instant updatedDate,
        String createdById) {
    public static BeerPaymentResponse from(BeerPayment p) {
        return new BeerPaymentResponse(
                p.getId(),
                p.getMemberId(),
                p.getAmount(),
                p.getDate(),
                p.getNotes(),
                p.isArchived(),
                p.getArchiveYear(),
                p.getCreatedDate(),
                p.getUpdatedDate(),
                p.getCreatedById());
    }
}
