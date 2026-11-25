package com.penaelchole.backend.achievement;

import com.penaelchole.backend.common.ApiName;
import com.penaelchole.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class Achievement extends BaseEntity {

    @Column(nullable = false)
    @ApiName("activo")
    private boolean active;

    @ApiName("categoria")
    private String category;

    @ApiName("descripcion")
    private String description;

    @ApiName("icono")
    private String icon;

    @ApiName("nombre")
    private String name;

    @ApiName("puntos")
    private int points;

    @ApiName("umbral")
    private int threshold;

    protected Achievement() {
    }

    public Achievement(
            boolean active,
            String category,
            String description,
            String icon,
            String name,
            int points,
            int threshold) {
        this.active = active;
        this.category = category;
        this.description = description;
        this.icon = icon;
        this.name = name;
        this.points = points;
        this.threshold = threshold;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public int getThreshold() {
        return threshold;
    }

    public void setThreshold(int threshold) {
        this.threshold = threshold;
    }

    // null = el campo no venía en el JSON (no se toca)
    // Optional.empty() = venía con valor null
    public void applyChanges(AchievementPatch changes) {
        if (changes.active() != null) {
            setActive(changes.active().orElse(false));
        }

        if (changes.category() != null) {
            setCategory(changes.category().orElse(null));
        }

        if (changes.description() != null) {
            setDescription(changes.description().orElse(null));
        }

        if (changes.icon() != null) {
            setIcon(changes.icon().orElse(null));
        }

        if (changes.name() != null) {
            String newName = changes.name().orElse(null);
            if (newName == null || newName.isBlank()) {
                throw new IllegalArgumentException("El nombre no puede estar vacío");
            }
            setName(newName);
        }

        if (changes.points() != null) {
            setPoints(changes.points().orElse(0));
        }

        if (changes.threshold() != null) {
            setThreshold(changes.threshold().orElse(0));
        }
    }
}
