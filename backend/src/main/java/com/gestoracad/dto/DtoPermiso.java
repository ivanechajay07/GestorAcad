package com.gestoracad.dto;

/**
 * DTO que representa un permiso atómico del sistema.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoPermiso {
    private Long id;
    private String name;
    private String module;
    private String description;

    public DtoPermiso() {
    }

    public DtoPermiso(Long id, String name, String module, String description) {
        this.id = id;
        this.name = name;
        this.module = module;
        this.description = description;
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
