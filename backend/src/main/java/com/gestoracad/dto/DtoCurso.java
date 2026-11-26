package com.gestoracad.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * DTO de un curso del catálogo académico.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoCurso {

    private Long id;

    @NotBlank(message = "El código del curso es obligatorio")
    @Size(max = 20, message = "El código no puede exceder 20 caracteres")
    @Pattern(regexp = "[A-Za-z0-9-]{3,20}", message = "El código solo admite letras, números y guiones")
    private String code;

    @NotBlank(message = "El nombre del curso es obligatorio")
    @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
    private String name;

    @Min(value = 1, message = "Los créditos deben ser al menos 1")
    @Max(value = 30, message = "Los créditos no pueden exceder 30")
    private int credits;

    @Min(value = 0, message = "Las horas teóricas no pueden ser negativas")
    @Max(value = 40, message = "Las horas teóricas no pueden exceder 40")
    private int theoryHours;

    @Min(value = 0, message = "Las horas prácticas no pueden ser negativas")
    @Max(value = 40, message = "Las horas prácticas no pueden exceder 40")
    private int practiceHours;

    @NotBlank(message = "El tipo de curso es obligatorio")
    @Pattern(regexp = "GENERAL|ESPECIFICO|ELECTIVO", message = "El tipo debe ser GENERAL, ESPECIFICO o ELECTIVO")
    private String type;

    @Size(max = 255, message = "La descripción no puede exceder 255 caracteres")
    private String description;

    private int totalHours;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getCredits() {
        return credits;
    }

    public void setCredits(int credits) {
        this.credits = credits;
    }

    public int getTheoryHours() {
        return theoryHours;
    }

    public void setTheoryHours(int theoryHours) {
        this.theoryHours = theoryHours;
    }

    public int getPracticeHours() {
        return practiceHours;
    }

    public void setPracticeHours(int practiceHours) {
        this.practiceHours = practiceHours;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(int totalHours) {
        this.totalHours = totalHours;
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
