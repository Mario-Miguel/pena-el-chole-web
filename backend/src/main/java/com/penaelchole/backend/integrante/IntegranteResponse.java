package com.penaelchole.backend.integrante;

import java.time.Instant;
import java.time.LocalDate;
import tools.jackson.databind.PropertyNamingStrategies;
import tools.jackson.databind.annotation.JsonNaming;

/**
 * Lo que se devuelve en JSON. Separarlo de la entidad JPA evita exponer detalles internos
 * y permite cambiar la base de datos sin romper el contrato con el frontend.
 * El frontend espera los campos en snake_case (created_date, fecha_nacimiento...).
 */
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record IntegranteResponse(
        String id,
        String nombre,
        String categoria,
        String cargo,
        int cervezas,
        LocalDate fechaNacimiento,
        Instant createdDate,
        Instant updatedDate,
        String createdById) {

    public static IntegranteResponse from(Integrante i) {
        return new IntegranteResponse(
                i.getId(),
                i.getNombre(),
                i.getCategoria(),
                i.getCargo(),
                i.getCervezas(),
                i.getFechaNacimiento(),
                i.getCreatedDate(),
                i.getUpdatedDate(),
                i.getCreatedById());
    }
}
