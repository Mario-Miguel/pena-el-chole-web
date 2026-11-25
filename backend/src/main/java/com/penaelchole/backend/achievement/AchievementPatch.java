package com.penaelchole.backend.achievement;

import static com.penaelchole.backend.common.PatchFields.bool;
import static com.penaelchole.backend.common.PatchFields.integer;
import static com.penaelchole.backend.common.PatchFields.text;

import java.util.Optional;

import tools.jackson.databind.JsonNode;

public record AchievementPatch(
        Optional<Boolean> active,
        Optional<String> category,
        Optional<String> description,
        Optional<String> icon,
        Optional<String> name,
        Optional<Integer> points,
        Optional<Integer> threshold) {

    // Las claves JSON son las del frontend (español)
    public static AchievementPatch from(JsonNode json) {
        return new AchievementPatch(
                bool(json, "activo"),
                text(json, "categoria"),
                text(json, "descripcion"),
                text(json, "icono"),
                text(json, "nombre"),
                integer(json, "puntos"),
                integer(json, "umbral"));
    }
}
