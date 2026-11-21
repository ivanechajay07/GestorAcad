package com.gestoracad.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO que representa una admisión de estudiante.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoAdmisionEstudiante {

    private Long id;

    private Long studentId;

    private String studentName;

    @NotBlank(message = "La modalidad de admisión es obligatoria")
    @Size(max = 40, message = "La modalidad no puede exceder 40 caracteres")
    private String modality;

    @NotBlank(message = "El periodo de ingreso es obligatorio")
    @Size(max = 20, message = "El periodo no puede exceder 20 caracteres")
    private String period;

    @Size(max = 200, message = "El colegio de procedencia no puede exceder 200 caracteres")
    private String highSchool;

    @DecimalMin(value = "0.00", message = "El puntaje no puede ser negativo")
    @DecimalMax(value = "100.00", message = "El puntaje no puede exceder 100")
    private BigDecimal score;

    private LocalDate admissionDate;

    @NotBlank(message = "El estado de la admisión es obligatorio")
    private String status;

    @Size(max = 255, message = "La observación no puede exceder 255 caracteres")
    private String observation;

    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DtoAdmisionEstudiante() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getModality() {
        return modality;
    }

    public void setModality(String modality) {
        this.modality = modality;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public String getHighSchool() {
        return highSchool;
    }

    public void setHighSchool(String highSchool) {
        this.highSchool = highSchool;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public LocalDate getAdmissionDate() {
        return admissionDate;
    }

    public void setAdmissionDate(LocalDate admissionDate) {
        this.admissionDate = admissionDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getObservation() {
        return observation;
    }

    public void setObservation(String observation) {
        this.observation = observation;
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
