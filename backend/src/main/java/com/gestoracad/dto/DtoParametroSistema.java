package com.gestoracad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * DTO que representa un parámetro de configuración del sistema.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoParametroSistema {

    private Long id;

    @NotBlank(message = "La clave del parámetro es obligatoria")
    @Size(max = 100, message = "La clave no puede exceder 100 caracteres")
    private String key;

    @NotBlank(message = "El valor del parámetro es obligatorio")
    @Size(max = 500, message = "El valor no puede exceder 500 caracteres")
    private String value;

    @NotBlank(message = "El tipo de valor es obligatorio")
    private String valueType;

    @NotBlank(message = "El módulo es obligatorio")
    @Size(max = 50, message = "El módulo no puede exceder 50 caracteres")
    private String module;

    @Size(max = 255, message = "La descripción no puede exceder 255 caracteres")
    private String description;

    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DtoParametroSistema() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getValueType() {
        return valueType;
    }

    public void setValueType(String valueType) {
        this.valueType = valueType;
    }

    public String getModule() {
        return module;
    }

    public void setModule(String module) {
        this.module = module;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
