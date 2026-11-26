package com.gestoracad.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO de una evaluación.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoEvaluacion {

    private Long id;
    private Long sectionId;

    @NotBlank(message = "El nombre de la evaluación es obligatorio")
    @Size(max = 120, message = "El nombre no puede exceder 120 caracteres")
    private String name;

    @NotBlank(message = "El tipo es obligatorio")
    @Pattern(regexp = "PRACTICA|PARCIAL|FINAL|OTRO", message = "Tipo de evaluación inválido")
    private String type;

    @NotNull(message = "El peso es obligatorio")
    @DecimalMin(value = "0.00", message = "El peso no puede ser negativo")
    @DecimalMax(value = "100.00", message = "El peso no puede exceder 100")
    private BigDecimal weight;

    private LocalDate date;

    @NotNull(message = "La nota máxima es obligatoria")
    @DecimalMin(value = "0.01", message = "La nota máxima debe ser mayor a 0")
    @DecimalMax(value = "20.00", message = "La nota máxima no puede exceder 20")
    private BigDecimal maxScore;

    private boolean active;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSectionId() {
        return sectionId;
    }

    public void setSectionId(Long sectionId) {
        this.sectionId = sectionId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public BigDecimal getMaxScore() {
        return maxScore;
    }

    public void setMaxScore(BigDecimal maxScore) {
        this.maxScore = maxScore;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
