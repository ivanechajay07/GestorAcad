package com.gestoracad.dto;

import java.util.HashSet;
import java.util.Set;

/**
 * DTO que representa un rol junto con sus permisos asociados.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoRol {
    private Long id;
    private String name;
    private String description;
    private Set<DtoPermiso> permissions = new HashSet<>();
    /** Cantidad de usuarios con este rol asignado (solo lectura, calculada por el servicio). */
    private long usuarios;

    public DtoRol() {
    }

    public DtoRol(Long id, String name, String description, Set<DtoPermiso> permissions) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.permissions = permissions;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Set<DtoPermiso> getPermissions() {
        return permissions;
    }

    public void setPermissions(Set<DtoPermiso> permissions) {
        this.permissions = permissions;
    }

    public long getUsuarios() {
        return usuarios;
    }

    public void setUsuarios(long usuarios) {
        this.usuarios = usuarios;
    }
}
