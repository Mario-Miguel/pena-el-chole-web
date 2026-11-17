package com.penaelchole.backend.common;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.jspecify.annotations.Nullable;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

public class ListQueryResolver implements HandlerMethodArgumentResolver {
    private static final Set<String> RESERVED = Set.of("sort", "limit", "skip");

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.getParameterType() == ListQuery.class;
    }

    @Override
    public @Nullable Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {
        Map<String, String> filters = new LinkedHashMap<>();
        webRequest.getParameterMap().forEach((k, v) -> {
            if (!RESERVED.contains(k))
                filters.put(k, v[0]);
        });
        return new ListQuery(webRequest.getParameter("sort"), ListQueryResolver.integer(webRequest, "limit"),
                ListQueryResolver.integer(webRequest, "skip"), filters);
    }

    private static Integer integer(NativeWebRequest webRequest, String name) {
        String v = webRequest.getParameter(name);
        if (v == null)
            return null;
        try {
            return Integer.valueOf(v);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(name + " must be a number: " + v);
        }
    }

}
