package com.penaelchole.backend.appconfig;

import java.util.Optional;

import static com.penaelchole.backend.common.PatchFields.text;

import tools.jackson.databind.JsonNode;

public record AppConfigPatch(
        Optional<String> key,
        Optional<String> value) {
    public static AppConfigPatch from(JsonNode json) {
        return new AppConfigPatch(
                text(json, "clave"),
                text(json, "valor"));
    }
}
