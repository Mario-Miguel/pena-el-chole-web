package com.penaelchole.backend.beerbatch;

import static com.penaelchole.backend.common.PatchFields.decimal;
import static com.penaelchole.backend.common.PatchFields.integer;
import static com.penaelchole.backend.common.PatchFields.text;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import com.penaelchole.backend.common.PatchFields;

import tools.jackson.databind.JsonNode;

public record BeerBatchPatch(
        Optional<Integer> quantity,
        Optional<Integer> consumedAdjustment,
        Optional<BigDecimal> cost,
        Optional<LocalDate> date,
        Optional<String> notes,
        Optional<Integer> minimumStock,
        Optional<String> type) {

    // Las claves JSON son las del frontend (español)
    public static BeerBatchPatch from(JsonNode changes) {
        return new BeerBatchPatch(
                integer(changes, "cantidad"),
                integer(changes, "consumido_ajuste"),
                decimal(changes, "coste"),
                // "date" a secas sería el accessor del record, no PatchFields.date
                PatchFields.date(changes, "fecha"),
                text(changes, "notas"),
                integer(changes, "stock_minimo"),
                text(changes, "tipo"));
    }
}
