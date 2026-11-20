package com.penaelchole.backend.member;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Optional;

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

    private static Optional<String> text(JsonNode json, String field) {
        if (!json.has(field))
            return null;
        JsonNode n = json.get(field);
        return n.isNull() ? Optional.empty() : Optional.of(n.asString());
    }

    private static Optional<LocalDate> date(JsonNode json, String field) {
        Optional<String> s = text(json, field);
        if (s == null || s.isEmpty())
            return s == null ? null : Optional.empty();

        try {
            return Optional.of(LocalDate.parse(s.get()));
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Fecha no valida: " + s.get());
        }
    }
}
