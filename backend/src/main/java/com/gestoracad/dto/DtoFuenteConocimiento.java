package com.gestoracad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * Metadatos de una fuente de conocimiento.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoFuenteConocimiento {

    private Long id;
    private String name;
    private String category;
    private int characters;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public int getCharacters() { return characters; }
    public void setCharacters(int characters) { this.characters = characters; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
