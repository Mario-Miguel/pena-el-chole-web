package com.penaelchole.backend.common;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;

public final class Filters {
    public static <T> Specification<T> byEquality(Map<String, String> filters) {
        return (root, query, cb) -> cb.and(filters.entrySet().stream()
                .map(e -> {
                    // fecha_nacimiento -> birthDate (ver Fields y @ApiName)
                    Field field = Fields.filterable(root.getJavaType(), e.getKey())
                            .orElseThrow(() -> new IllegalArgumentException("No se puede filtrar por: " + e.getKey()));
                    Object value = convert(e.getValue(), field.getType(), e.getKey());
                    return cb.equal(root.get(field.getName()), value);
                })
                .toArray(Predicate[]::new));
    }

    static Object convert(String v, Class<?> type, String apiName) {
        try {
            if (type == String.class)
                return v;
            if (type == Boolean.class || type == boolean.class) {
                if (v.equals("true"))
                    return true;
                if (v.equals("false"))
                    return false;
                throw new IllegalArgumentException();
            }
            if (type == Integer.class || type == int.class)
                return Integer.valueOf(v);
            if (type == Long.class || type == long.class)
                return Long.valueOf(v);
            if (type == BigDecimal.class)
                return new BigDecimal(v);
            if (type == LocalDate.class)
                return LocalDate.parse(v);
            if (type == Instant.class)
                return Instant.parse(v);
            if (type.isEnum())
                return Enum.valueOf((Class) type, v);
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("Valor no válido para " + apiName + ": " + v);
        }
        throw new IllegalArgumentException("No se puede filtrar por: " + apiName);
    }

}
