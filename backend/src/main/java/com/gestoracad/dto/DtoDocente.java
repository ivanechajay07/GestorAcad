package com.gestoracad.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO que representa a un docente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoDocente {

    private Long id;

    @NotBlank(message = "El código del docente es obligatorio")
    @Size(max = 20, message = "El código no puede exceder 20 caracteres")
    private String code;

    @NotBlank(message = "Los nombres del docente son obligatorios")
    @Size(max = 150, message = "Los nombres no pueden exceder 150 caracteres")
    private String firstName;

    @NotBlank(message = "Los apellidos del docente son obligatorios")
    @Size(max = 150, message = "Los apellidos no pueden exceder 150 caracteres")
    private String lastName;

    @Size(max = 20, message = "El documento de identidad no puede exceder 20 caracteres")
    private String documentId;

    @Email(message = "El correo electrónico debe tener un formato válido")
    @Size(max = 100, message = "El correo electrónico no puede exceder 100 caracteres")
    private String email;

    @Size(max = 25, message = "El teléfono no puede exceder 25 caracteres")
    private String phone;

    @Size(max = 200, message = "El grado académico no puede exceder 200 caracteres")
    private String academicDegree;

    @Size(max = 200, message = "El título profesional no puede exceder 200 caracteres")
    private String professionalTitle;

    @NotBlank(message = "La categoría docente es obligatoria")
    private String category;

    @NotBlank(message = "La dedicación docente es obligatoria")
    private String dedication;

    @Size(max = 150, message = "La facultad no puede exceder 150 caracteres")
    private String faculty;

    @Size(max = 150, message = "El departamento no puede exceder 150 caracteres")
    private String department;

    @Size(max = 200, message = "La especialidad principal no puede exceder 200 caracteres")
    private String mainSpecialty;

    private LocalDate birthDate;
    private LocalDate hireDate;

    @Size(max = 255, message = "La dirección no puede exceder 255 caracteres")
    private String address;

    private String fullName;
    private Long userId;
    private long specialtyCount;
    private long assignmentCount;
    private int weeklyLoad;

    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DtoDocente() {
    }

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

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getDocumentId() {
        return documentId;
    }

    public void setDocumentId(String documentId) {
        this.documentId = documentId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAcademicDegree() {
        return academicDegree;
    }

    public void setAcademicDegree(String academicDegree) {
        this.academicDegree = academicDegree;
    }

    public String getProfessionalTitle() {
        return professionalTitle;
    }

    public void setProfessionalTitle(String professionalTitle) {
        this.professionalTitle = professionalTitle;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDedication() {
        return dedication;
    }

    public void setDedication(String dedication) {
        this.dedication = dedication;
    }

    public String getFaculty() {
        return faculty;
    }

    public void setFaculty(String faculty) {
        this.faculty = faculty;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getMainSpecialty() {
        return mainSpecialty;
    }

    public void setMainSpecialty(String mainSpecialty) {
        this.mainSpecialty = mainSpecialty;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public LocalDate getHireDate() {
        return hireDate;
    }

    public void setHireDate(LocalDate hireDate) {
        this.hireDate = hireDate;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public long getSpecialtyCount() {
        return specialtyCount;
    }

    public void setSpecialtyCount(long specialtyCount) {
        this.specialtyCount = specialtyCount;
    }

    public long getAssignmentCount() {
        return assignmentCount;
    }

    public void setAssignmentCount(long assignmentCount) {
        this.assignmentCount = assignmentCount;
    }

    public int getWeeklyLoad() {
        return weeklyLoad;
    }

    public void setWeeklyLoad(int weeklyLoad) {
        this.weeklyLoad = weeklyLoad;
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
