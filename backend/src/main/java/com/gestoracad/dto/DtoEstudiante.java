package com.gestoracad.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO que representa a un estudiante.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoEstudiante {

    private Long id;

    @NotBlank(message = "El código del estudiante es obligatorio")
    @Size(max = 20, message = "El código no puede exceder 20 caracteres")
    private String code;

    @NotBlank(message = "Los nombres del estudiante son obligatorios")
    @Size(max = 150, message = "Los nombres no pueden exceder 150 caracteres")
    private String firstName;

    @NotBlank(message = "Los apellidos del estudiante son obligatorios")
    @Size(max = 150, message = "Los apellidos no pueden exceder 150 caracteres")
    private String lastName;

    @Size(max = 20, message = "El documento de identidad no puede exceder 20 caracteres")
    private String documentId;

    @Email(message = "El correo electrónico debe tener un formato válido")
    @Size(max = 100, message = "El correo electrónico no puede exceder 100 caracteres")
    private String email;

    @Size(max = 25, message = "El teléfono no puede exceder 25 caracteres")
    private String phone;

    private LocalDate birthDate;

    @Size(max = 20, message = "El género no puede exceder 20 caracteres")
    private String gender;

    @Size(max = 255, message = "La dirección no puede exceder 255 caracteres")
    private String address;

    private String avatar;

    @Size(max = 200, message = "La carrera no puede exceder 200 caracteres")
    private String career;

    @Size(max = 200, message = "La facultad no puede exceder 200 caracteres")
    private String faculty;

    @Min(value = 1, message = "El ciclo académico debe ser al menos 1")
    @Max(value = 20, message = "El ciclo académico no puede exceder 20")
    private Integer currentCycle;

    @Min(value = 0, message = "Los créditos aprobados no pueden ser negativos")
    private Integer approvedCredits;

    @DecimalMin(value = "0.00", message = "El promedio ponderado no puede ser negativo")
    @DecimalMax(value = "20.00", message = "El promedio ponderado no puede exceder 20")
    private BigDecimal weightedAverage;

    @NotBlank(message = "La condición del estudiante es obligatoria")
    private String condition;

    @NotBlank(message = "El estado de matrícula es obligatorio")
    private String enrollmentStatus;

    @Size(max = 20, message = "El periodo de ingreso no puede exceder 20 caracteres")
    private String entryPeriod;

    @Size(max = 40, message = "La modalidad de ingreso no puede exceder 40 caracteres")
    private String admissionModality;

    @Size(max = 200, message = "El colegio de procedencia no puede exceder 200 caracteres")
    private String highSchool;

    private String fullName;
    private Long userId;
    private long admissionCount;

    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DtoEstudiante() {
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

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getCareer() {
        return career;
    }

    public void setCareer(String career) {
        this.career = career;
    }

    public String getFaculty() {
        return faculty;
    }

    public void setFaculty(String faculty) {
        this.faculty = faculty;
    }

    public Integer getCurrentCycle() {
        return currentCycle;
    }

    public void setCurrentCycle(Integer currentCycle) {
        this.currentCycle = currentCycle;
    }

    public Integer getApprovedCredits() {
        return approvedCredits;
    }

    public void setApprovedCredits(Integer approvedCredits) {
        this.approvedCredits = approvedCredits;
    }

    public BigDecimal getWeightedAverage() {
        return weightedAverage;
    }

    public void setWeightedAverage(BigDecimal weightedAverage) {
        this.weightedAverage = weightedAverage;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public String getEnrollmentStatus() {
        return enrollmentStatus;
    }

    public void setEnrollmentStatus(String enrollmentStatus) {
        this.enrollmentStatus = enrollmentStatus;
    }

    public String getEntryPeriod() {
        return entryPeriod;
    }

    public void setEntryPeriod(String entryPeriod) {
        this.entryPeriod = entryPeriod;
    }

    public String getAdmissionModality() {
        return admissionModality;
    }

    public void setAdmissionModality(String admissionModality) {
        this.admissionModality = admissionModality;
    }

    public String getHighSchool() {
        return highSchool;
    }

    public void setHighSchool(String highSchool) {
        this.highSchool = highSchool;
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

    public long getAdmissionCount() {
        return admissionCount;
    }

    public void setAdmissionCount(long admissionCount) {
        this.admissionCount = admissionCount;
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
