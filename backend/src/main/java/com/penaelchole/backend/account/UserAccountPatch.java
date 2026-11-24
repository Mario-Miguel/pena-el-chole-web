package com.penaelchole.backend.account;

import java.util.Optional;

import static com.penaelchole.backend.common.PatchFields.text;

import tools.jackson.databind.JsonNode;

public record UserAccountPatch(
        Optional<String> memberId,
        Optional<String> username,
        Optional<String> password,
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
}