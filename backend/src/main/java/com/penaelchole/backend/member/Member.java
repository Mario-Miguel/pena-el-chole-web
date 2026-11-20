package com.penaelchole.backend.member;

import java.time.LocalDate;

import com.penaelchole.backend.common.ApiName;
import com.penaelchole.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

/**
 * Miembro de la peña. Se mapea a la tabla "member" (V2__rename_integrante_to_member.sql).
 * Spring Boot traduce los nombres camelCase a snake_case: birthDate -> birth_date.
 * @ApiName indica el nombre que usa el frontend en filtros y sort.
 */
@Entity
public class Member extends BaseEntity {

    @ApiName("nombre")
    @Column(nullable = false)
    private String name;

    /** cargos, socios, contribuyentes, socios_honorificos, patitas, especial... */
    @ApiName("categoria")
    private String category;

    /**
     * presidente, vicepresidente, tesorero, secretario, vocal... (solo si category
     * = cargos)
     */
    @ApiName("cargo")
    private String role;

    @ApiName("cervezas")
    @Column(nullable = false)
    private int beers;

    @ApiName("fecha_nacimiento")
    private LocalDate birthDate;

    // JPA necesita un constructor sin argumentos
    protected Member() {
    }

    public Member(String name, String category, String role) {
        this.name = name;
        this.category = category;
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public int getBeers() {
        return beers;
    }

    public void setBeers(int beers) {
        this.beers = beers;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public void applyChanges(MemberPatch changes) {
        if (changes.name() != null) {
            String name = changes.name().orElse(null);
            if (name == null || name.isBlank()) {
                throw new IllegalArgumentException("El nombre no puede estar vacío");
            }
            setName(name);
        }
        if (changes.category() != null) {
            setCategory(changes.category().orElse(null));
        }

        if (changes.role() != null) {
            setRole(changes.role().orElse(null));
        }

        if (changes.beers() != null) {
            setBeers(changes.beers().orElse(0));
        }

        if (changes.birthDate() != null) {
            setBirthDate(changes.birthDate().orElse(null));
        }
    }

}
