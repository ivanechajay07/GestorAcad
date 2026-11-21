package com.gestoracad.dto;

import jakarta.validation.constraints.NotNull;

/**
 * DTO de un prerrequisito de curso.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoPrerrequisito {

    private Long id;
    private Long courseId;

    @NotNull(message = "El curso prerrequisito es obligatorio")
    private Long prerequisiteId;

    private String prerequisiteCode;
    private String prerequisiteName;
    private int credits;
    private boolean active;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Long getPrerequisiteId() {
        return prerequisiteId;
    }

    public void setPrerequisiteId(Long prerequisiteId) {
        this.prerequisiteId = prerequisiteId;
    }

    public String getPrerequisiteCode() {
        return prerequisiteCode;
    }

    public void setPrerequisiteCode(String prerequisiteCode) {
        this.prerequisiteCode = prerequisiteCode;
    }

    public String getPrerequisiteName() {
        return prerequisiteName;
    }

    public void setPrerequisiteName(String prerequisiteName) {
        this.prerequisiteName = prerequisiteName;
    }

    public int getCredits() {
        return credits;
    }

    public void setCredits(int credits) {
        this.credits = credits;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
