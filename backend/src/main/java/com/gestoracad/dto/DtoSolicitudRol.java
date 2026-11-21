package com.gestoracad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO de petición para crear o actualizar un rol institucional.
 * Incluye el nombre, la descripción y los identificadores de los permisos asociados.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoSolicitudRol {

    @NotBlank(message = "El nombre del rol es obligatorio")
    @Size(min = 3, max = 50, message = "El nombre del rol debe tener entre 3 y 50 caracteres")
    private String name;

    @NotBlank(message = "La descripción del rol es obligatoria")
    @Size(max = 255, message = "La descripción no debe exceder 255 caracteres")
    private String description;

    private List<Long> permissionIds = new ArrayList<>();

    public DtoSolicitudRol() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Long> getPermissionIds() {
        return permissionIds;
    }

    public void setPermissionIds(List<Long> permissionIds) {
        this.permissionIds = permissionIds;
    }
}
