package com.penaelchole.backend.integrante;

import com.penaelchole.backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import java.time.LocalDate;

/**
 * Miembro de la peña. Se mapea a la tabla "integrante" (V1__create_integrante.sql).
 * Spring Boot traduce los nombres camelCase a snake_case: fechaNacimiento -> fecha_nacimiento.
 */
@Entity
public class Integrante extends BaseEntity {

    @Column(nullable = false)
    private String nombre;

    /** cargos, socios, contribuyentes, socios_honorificos, patitas, especial... */
    private String categoria;

    /** presidente, vicepresidente, tesorero, secretario, vocal... (solo si categoria = cargos) */
    private String cargo;

    @Column(nullable = false)
    private int cervezas;

    private LocalDate fechaNacimiento;

    // JPA necesita un constructor sin argumentos
    protected Integrante() {
    }

    public Integrante(String nombre, String categoria, String cargo) {
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
}
