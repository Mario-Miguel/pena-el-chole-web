package com.penaelchole.backend.beerpayment;

import static com.penaelchole.backend.common.PatchFields.bool;
import static com.penaelchole.backend.common.PatchFields.decimal;
import static com.penaelchole.backend.common.PatchFields.instant;
import static com.penaelchole.backend.common.PatchFields.integer;
import static com.penaelchole.backend.common.PatchFields.text;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import tools.jackson.databind.JsonNode;

public record BeerPaymentPatch(
        Optional<String> memberId,
        Optional<BigDecimal> amount,
        Optional<Instant> date,
        Optional<String> notes,
        Optional<Boolean> archived,
        Optional<Integer> archiveYear) {
    public static BeerPaymentPatch from(JsonNode changes) {
        return new BeerPaymentPatch(
                text(changes, "integrante_id"),
                decimal(changes, "importe"),
                instant(changes, "fecha"),
                text(changes, "notas"),
                bool(changes, "archivado"),
                integer(changes, "anio_archivo"));
    }
}
