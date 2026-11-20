package com.penaelchole.backend.common;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Nombre con el que el frontend conoce este campo (filtros y sort), cuando no
 * coincide con el nombre Java pasado a snake_case. Ej: birthDate ->
 * "fecha_nacimiento". Sin la anotación se usa el snake_case del campo
 * (createdDate -> "created_date").
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface ApiName {
    String value();
}
