package com.penaelchole.backend.auth;

import java.util.Optional;

import tools.jackson.databind.JsonNode;

public record UserAccountPatch(
        Optional<String> memberId,
        Optional<String> username,
        Optional<String> passwordHash,
        Optional<Boolean> disabled,
        Optional<String> avatarUrl) {
    // Las claves JSON son las del frontend (español, snake_case)
    public static UserAccountPatch from(JsonNode json) {
        return new UserAccountPatch(
                text(json, "integrante_id"),
                text(json, "usuario"),
                text(json, "contrasena"),
                json.has("disabled")
                        ? Optional.ofNullable(json.get("disabled").isNull() ? null : json.get("disabled").asBoolean())
                        : null,
                text(json, "avatar_url"));
    }

    private static Optional<String> text(JsonNode json, String field) {
        if (!json.has(field))
            return null;
        JsonNode n = json.get(field);
        return n.isNull() ? Optional.empty() : Optional.of(n.asString());
    }
}