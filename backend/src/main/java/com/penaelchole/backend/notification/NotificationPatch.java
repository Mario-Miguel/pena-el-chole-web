package com.penaelchole.backend.notification;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static com.penaelchole.backend.common.PatchFields.bool;
import static com.penaelchole.backend.common.PatchFields.instant;
import static com.penaelchole.backend.common.PatchFields.stringList;
import static com.penaelchole.backend.common.PatchFields.text;

import tools.jackson.databind.JsonNode;

public record NotificationPatch(
        Optional<Boolean> archived,
        Optional<Instant> archiveDate,
        Optional<Instant> publishDate,
        Optional<List<String>> readBy,
        Optional<String> message,
        Optional<String> type,
        Optional<String> title) {
    public static NotificationPatch from(JsonNode json) {
        return new NotificationPatch(
                bool(json, "archivada"),
                instant(json, "fecha_archivo"),
                instant(json, "fecha_publicacion"),
                stringList(json, "leida_por"),
                text(json, "mensaje"),
                text(json, "tipo"),
                text(json, "titulo"));
    }
}
