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
        String field = Fields.filterable(entity, desc ? sort.substring(1) : sort)
                .orElseThrow(() -> new IllegalArgumentException("No se puede ordenar por: " + sort))
                .getName();
        return desc ? Sort.by(field).descending() : Sort.by(field).ascending();
    }
}
