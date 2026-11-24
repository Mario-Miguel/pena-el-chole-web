package com.penaelchole.backend.member;

import java.time.LocalDate;
import java.util.Optional;

import static com.penaelchole.backend.common.PatchFields.date;
import static com.penaelchole.backend.common.PatchFields.text;

import tools.jackson.databind.JsonNode;

public record MemberPatch(
        Optional<String> name,
        Optional<String> category,
        Optional<String> role,
        Optional<Integer> beers,
        Optional<LocalDate> birthDate) {
    // Las claves JSON son las del frontend (español, snake_case)
    public static MemberPatch from(JsonNode json) {
        return new MemberPatch(
                text(json, "nombre"),
                text(json, "categoria"),
                text(json, "cargo"),
                json.has("cervezas")
                        ? Optional.ofNullable(json.get("cervezas").isNull() ? null : json.get("cervezas").asInt())
                        : null,
                date(json, "fecha_nacimiento"));
    }
}
