package com.penaelchole.backend.common;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.Optional;

/**
 * Traduce los nombres que usa el frontend (snake_case, en español) a campos de
 * la entidad (camelCase, en inglés).
 */
public final class Fields {

    private Fields() {
    }

    /**
     * Busca el campo de la entidad (o de sus superclases, p. ej. BaseEntity) que
     * se expone como apiName y que se puede filtrar/ordenar.
     */
    public static Optional<Field> filterable(Class<?> type, String apiName) {
        for (Class<?> c = type; c != null; c = c.getSuperclass()) {
            for (Field f : c.getDeclaredFields()) {
                if (Modifier.isStatic(f.getModifiers()) || f.isAnnotationPresent(NotFilterable.class))
                    continue;
                if (apiName(f).equals(apiName))
                    return Optional.of(f);
            }
        }
        return Optional.empty();
    }

    static String apiName(Field f) {
        ApiName name = f.getAnnotation(ApiName.class);
        return name != null ? name.value() : camelToSnake(f.getName());
    }

    static String camelToSnake(String s) {
        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray()) {
            if (Character.isUpperCase(c))
                sb.append('_').append(Character.toLowerCase(c));
            else
                sb.append(c);
        }
        return sb.toString();
    }
}
