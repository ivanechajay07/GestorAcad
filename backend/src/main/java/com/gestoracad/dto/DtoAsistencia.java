package com.gestoracad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * DTO de asistencia.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoAsistencia {

    private Long id;
    private Long sectionId;

    @NotNull(message = "El estudiante es obligatorio")
    private Long studentId;

    private String studentCode;
    private String studentName;
    private LocalDate date;

    @NotBlank(message = "El estado es obligatorio")
    @Pattern(regexp = "PRESENTE|AUSENTE|TARDANZA|JUSTIFICADO", message = "Estado de asistencia inválido")
    private String status;

    @Size(max = 255, message = "La observación no puede exceder 255 caracteres")
    private String observation;

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

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentCode() {
        return studentCode;
    }

    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
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
}
