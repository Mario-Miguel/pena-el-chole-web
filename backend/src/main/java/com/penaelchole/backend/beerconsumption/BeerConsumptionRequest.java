package com.penaelchole.backend.beerconsumption;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

// integrante_id puede ser null: son las cervezas de los invitados.
// No hay "archivado" al crear: un consumo nuevo nunca está archivado.
public record BeerConsumptionRequest(
        @JsonProperty("cantidad") @NotNull(message = "La cantidad no puede estar vacía") @Positive(message = "La cantidad tiene que ser mayor que 0") Integer quantity,
        @JsonProperty("integrante_id") String memberId,
        @JsonProperty("tipo") String type) {
}
