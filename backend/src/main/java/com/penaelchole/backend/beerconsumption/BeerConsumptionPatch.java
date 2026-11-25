package com.penaelchole.backend.beerconsumption;

import static com.penaelchole.backend.common.PatchFields.bool;
import static com.penaelchole.backend.common.PatchFields.integer;
import static com.penaelchole.backend.common.PatchFields.text;

import java.util.Optional;

import tools.jackson.databind.JsonNode;

public record BeerConsumptionPatch(
        Optional<Integer> quantity,
        Optional<String> memberId,
        Optional<String> type,
        Optional<Boolean> archived,
        Optional<Integer> archiveYear) {
    public static BeerConsumptionPatch from(JsonNode changes) {
        return new BeerConsumptionPatch(
                integer(changes, "cantidad"),
                text(changes, "integrante_id"),
                text(changes, "tipo"),
                bool(changes, "archivado"),
                integer(changes, "anio_archivo"));
    }
}
