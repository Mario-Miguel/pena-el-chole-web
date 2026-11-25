package com.penaelchole.backend.common;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import tools.jackson.databind.JsonNode;

public final class PatchFields {

    private PatchFields() {
    }

    public static <T> Optional<T> field(JsonNode json, String name, Function<JsonNode, T> reader) {
        if (!json.has(name))
            return null;
        JsonNode n = json.get(name);
        return n.isNull() ? Optional.empty() : Optional.of(reader.apply(n));
    }

    public static Optional<String> text(JsonNode json, String name) {
        return field(json, name, JsonNode::asString);
    }

    public static Optional<Integer> integer(JsonNode json, String name) {
        return field(json, name, JsonNode::asInt);
    }

    public static Optional<BigDecimal> decimal(JsonNode json, String name) {
        return field(json, name, JsonNode::asDecimal);
    }

    public static Optional<Boolean> bool(JsonNode json, String name) {
        return field(json, name, JsonNode::asBoolean);
    }

    public static Optional<LocalDate> date(JsonNode json, String name) {
        return field(json, name, n -> parse(n.asString(), LocalDate::parse));
    }

    public static Optional<Instant> instant(JsonNode json, String name) {
        return field(json, name, n -> parse(n.asString(), Instant::parse));
    }

    public static Optional<List<String>> stringList(JsonNode json, String name) {
        return field(json, name, n -> {
            if (!n.isArray())
                throw new IllegalArgumentException(name + " debe ser un array");
            List<String> list = new ArrayList<>();
            for (JsonNode item : n) {
                if (!item.isString())
                    throw new IllegalArgumentException(name + " solo puede contener textos");
                list.add(item.asString());
            }
            return list;
        });
    }

    private static <T> T parse(String s, Function<String, T> parser) {
        try {
            return parser.apply(s);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Fecha no valida: " + s);
        }
    }
}
