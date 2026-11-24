package com.penaelchole.backend.appconfig;

import com.penaelchole.backend.common.ApiName;
import com.penaelchole.backend.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

@Entity
public class AppConfig extends BaseEntity {

    @ApiName("clave")
    @Column(nullable = false)
    private String key;

    @ApiName("valor")
    @Column(nullable = false)
    private String value;

    protected AppConfig() {
    }

    public AppConfig(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public void applyChanges(AppConfigPatch changes) {
        if (changes.key() != null && !changes.key().map(key::equals).orElse(false)) {
            throw new IllegalArgumentException("La clave no se puede modificar");
        }
        if (changes.value() != null) {
            String newValue = changes.value().orElse(null);
            if (newValue == null || newValue.isBlank()) {
                throw new IllegalArgumentException("El valor no puede estar vacío");
            }
            setValue(newValue);
        }
    }

}
