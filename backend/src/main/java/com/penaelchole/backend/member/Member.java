package com.penaelchole.backend.member;

import java.time.LocalDate;

import com.penaelchole.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Miembro de la peña. Se mapea a la tabla "integrante" con @Table
 * (V1__create_integrante.sql).
 * Spring Boot traduce los nombres camelCase a snake_case: fechaNacimiento ->
 * fecha_nacimiento.
 */
@Entity
@Table(name = "integrante")
public class Member extends BaseEntity {

    @Column(nullable = false)
    private String nombre;

    /** cargos, socios, contribuyentes, socios_honorificos, patitas, especial... */
    private String categoria;

    /**
     * presidente, vicepresidente, tesorero, secretario, vocal... (solo si categoria
     * = cargos)
     */
    private String cargo;

    @Column(nullable = false)
    private int cervezas;

    private LocalDate fechaNacimiento;

    // JPA necesita un constructor sin argumentos
    protected Member() {
    }

    public Member(String nombre, String categoria, String cargo) {
        this.nombre = nombre;
        this.categoria = categoria;
        this.cargo = cargo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getCargo() {
        return cargo;
    }

    public void setCargo(String cargo) {
        this.cargo = cargo;
    }

    public int getCervezas() {
        return cervezas;
    }

    public void setCervezas(int cervezas) {
        this.cervezas = cervezas;
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public void applyChanges(MemberPatch changes) {
        if (changes.nombre() != null) {
            String nombre = changes.nombre().orElse(null);
            if (nombre == null || nombre.isBlank()) {
                throw new IllegalArgumentException("El nombre no puede estar vacío");
            }
            setNombre(nombre);
        }
        if (changes.categoria() != null) {
            setCategoria(changes.categoria().orElse(null));
        }

        if (changes.cargo() != null) {
            setCargo(changes.cargo().orElse(null));
        }

        if (changes.cervezas() != null) {
            setCervezas(changes.cervezas().orElse(0));
        }

        if (changes.fechaNacimiento() != null) {
            setFechaNacimiento(changes.fechaNacimiento().orElse(null));
        }
    }

}
