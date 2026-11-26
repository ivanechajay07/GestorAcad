package com.gestoracad.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * DTO que representa una asignación (carga académica) de un docente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoAsignacionDocente {

    private Long id;

    private Long teacherId;

    private String teacherName;

    @NotBlank(message = "El periodo académico es obligatorio")
    @Size(max = 20, message = "El periodo no puede exceder 20 caracteres")
    private String period;

    @NotBlank(message = "El curso o asignatura es obligatorio")
    @Size(max = 200, message = "El curso no puede exceder 200 caracteres")
    private String course;

    @Size(max = 20, message = "El código del curso no puede exceder 20 caracteres")
    private String courseCode;

    @Size(max = 10, message = "La sección no puede exceder 10 caracteres")
    private String section;

    @Min(value = 0, message = "Los créditos no pueden ser negativos")
    private Integer credits;

    @Min(value = 0, message = "Las horas teóricas no pueden ser negativas")
    private Integer theoryHours;

    @Min(value = 0, message = "Las horas prácticas no pueden ser negativas")
    private Integer practiceHours;

    @Min(value = 0, message = "Las horas totales no pueden ser negativas")
    private Integer totalHours;

    @NotBlank(message = "El estado de la asignación es obligatorio")
    private String status;

    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DtoAsignacionDocente() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public String getTeacherName() {
        return teacherName;
    }

    public void setTeacherName(String teacherName) {
        this.teacherName = teacherName;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public Integer getCredits() {
        return credits;
    }

    public void setCredits(Integer credits) {
        this.credits = credits;
    }

    public Integer getTheoryHours() {
        return theoryHours;
    }

    public void setTheoryHours(Integer theoryHours) {
        this.theoryHours = theoryHours;
    }

    public Integer getPracticeHours() {
        return practiceHours;
    }

    public void setPracticeHours(Integer practiceHours) {
        this.practiceHours = practiceHours;
    }

    public Integer getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(Integer totalHours) {
        this.totalHours = totalHours;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
