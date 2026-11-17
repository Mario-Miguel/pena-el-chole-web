package com.penaelchole.backend.common;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.metamodel.Attribute;

public final class Filters {
    public static <T> Specification<T> byEquality(Map<String, String> filtros) {
        return (root, query, cb) -> cb.and(filtros.entrySet().stream()
                .map(e -> {
                    String field = Fields.snakeToCamel(e.getKey()); // integrante_id -> integranteId
                    Attribute<? super T, ?> attr = attribute(root, field, e.getKey());
                    Object valor = convert(e.getValue(), attr.getJavaType(), e.getKey());
                    return cb.equal(root.get(field), valor);
                })
                .toArray(Predicate[]::new));
    }

    private static <T> Attribute<? super T, ?> attribute(Root<T> root, String campo, String original) {
        try {
            Attribute<? super T, ?> attr = root.getModel().getAttribute(campo); // includes BaseEntity (id...)
            if (attr.getJavaMember() instanceof Field f && f.isAnnotationPresent(NoFiltrable.class))
                throw new IllegalArgumentException();
            return attr;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("No se puede filtrar por: " + original);
        }
    }

    static Object convert(String v, Class<?> tipo, String campo) {
        try {
            if (tipo == String.class)
                return v;
            if (tipo == Boolean.class || tipo == boolean.class) {
                if (v.equals("true"))
                    return true;
                if (v.equals("false"))
                    return false;
                throw new IllegalArgumentException();
            }
            if (tipo == Integer.class || tipo == int.class)
                return Integer.valueOf(v);
            if (tipo == Long.class || tipo == long.class)
                return Long.valueOf(v);
            if (tipo == BigDecimal.class)
                return new BigDecimal(v);
            if (tipo == LocalDate.class)
                return LocalDate.parse(v);
            if (tipo == Instant.class)
                return Instant.parse(v);
            if (tipo.isEnum())
                return Enum.valueOf((Class) tipo, v);
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("Valor no válido para " + campo + ": " + v);
        }
        throw new IllegalArgumentException("No se puede filtrar por: " + campo);
    }

}
