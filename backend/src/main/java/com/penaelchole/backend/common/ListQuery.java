package com.penaelchole.backend.common;

import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public record ListQuery(
        String sort, Integer limit, Integer skip, Map<String, String> filters) {

    public Pageable toPageable(Class<?> entity) {
        Sort s = toSort(entity).and(Sort.by("id"));
        if (limit == null)
            return Pageable.unpaged(s);
        return new OffsetPageable(skip == null ? 0 : skip, limit, s);
    }

    public Sort toSort(Class<?> entity) {
        if (sort == null || sort.isBlank())
            return Sort.unsorted();
        boolean desc = sort.startsWith("-");
        String field = Fields.snakeToCamel(desc ? sort.substring(1) : sort);
        if (!hasField(entity, field))
            throw new IllegalArgumentException("No se puede ordenar por: " + sort);
        return desc ? Sort.by(field).descending() : Sort.by(field).ascending();
    }

    private static boolean hasField(Class<?> type, String name) {
        for (Class<?> c = type; c != null; c = c.getSuperclass()) {
            for (var f : c.getDeclaredFields())
                if (f.getName().equals(name) && !f.isAnnotationPresent(NoFiltrable.class))
                    return true;
        }
        return false;
    }
}
