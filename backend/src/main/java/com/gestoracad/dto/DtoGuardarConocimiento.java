package com.gestoracad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Datos para registrar una fuente documental.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoGuardarConocimiento {

    @NotBlank(message = "El nombre del documento es obligatorio")
    @Size(max = 160, message = "El nombre no puede exceder 160 caracteres")
    private String name;

    @NotBlank(message = "La categoría es obligatoria")
    @Size(max = 60, message = "La categoría no puede exceder 60 caracteres")
    private String category;

    @NotBlank(message = "El contenido es obligatorio")
    @Size(max = 100000, message = "El contenido no puede exceder 100 000 caracteres")
    private String content;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
