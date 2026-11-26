package com.gestoracad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de petición para crear o actualizar un permiso atómico del sistema.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoSolicitudPermiso {

    @NotBlank(message = "El nombre del permiso es obligatorio")
    @Size(min = 3, max = 100, message = "El nombre debe tener entre 3 y 100 caracteres")
    private String name;

    @NotBlank(message = "El módulo es obligatorio")
    @Size(max = 50, message = "El módulo no debe exceder 50 caracteres")
    private String module;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 255, message = "La descripción no debe exceder 255 caracteres")
    private String description;

    public DtoSolicitudPermiso() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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
}
