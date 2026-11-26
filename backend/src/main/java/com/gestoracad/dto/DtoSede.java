package com.gestoracad.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * DTO que representa una sede (campus).
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoSede {

    private Long id;

    private Long universityId;

    private String universityName;

    @NotBlank(message = "El nombre de la sede es obligatorio")
    @Size(max = 150, message = "El nombre no puede exceder 150 caracteres")
    private String name;

    @NotBlank(message = "El código de la sede es obligatorio")
    @Size(max = 20, message = "El código no puede exceder 20 caracteres")
    private String code;

    @NotBlank(message = "El tipo de sede es obligatorio")
    private String campusType;

    @Size(max = 255, message = "La dirección no puede exceder 255 caracteres")
    private String address;

    @Size(max = 100, message = "El distrito no puede exceder 100 caracteres")
    private String district;

    @Size(max = 100, message = "La ciudad no puede exceder 100 caracteres")
    private String city;

    @Size(max = 100, message = "La región no puede exceder 100 caracteres")
    private String region;

    @Size(max = 25, message = "El teléfono no puede exceder 25 caracteres")
    private String phone;

    @Email(message = "El correo electrónico debe tener un formato válido")
    @Size(max = 100, message = "El correo electrónico no puede exceder 100 caracteres")
    private String email;

    @Min(value = 0, message = "El aforo no puede ser negativo")
    private Integer capacity;

    @Min(value = 0, message = "El número de pabellones no puede ser negativo")
    private Integer pavilions;

    @Min(value = 0, message = "El número de laboratorios no puede ser negativo")
    private Integer laboratories;

    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DtoSede() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUniversityId() {
        return universityId;
    }

    public void setUniversityId(Long universityId) {
        this.universityId = universityId;
    }

    public String getUniversityName() {
        return universityName;
    }

    public void setUniversityName(String universityName) {
        this.universityName = universityName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getCampusType() {
        return campusType;
    }

    public void setCampusType(String campusType) {
        this.campusType = campusType;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Integer getPavilions() {
        return pavilions;
    }

    public void setPavilions(Integer pavilions) {
        this.pavilions = pavilions;
    }

    public Integer getLaboratories() {
        return laboratories;
    }

    public void setLaboratories(Integer laboratories) {
        this.laboratories = laboratories;
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
