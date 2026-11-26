package com.gestoracad.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO que representa la información institucional de la universidad.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoUniversidad {

    private Long id;

    @NotBlank(message = "El nombre oficial de la institución es obligatorio")
    @Size(max = 200, message = "El nombre no puede exceder 200 caracteres")
    private String name;

    @Size(max = 50, message = "El nombre corto no puede exceder 50 caracteres")
    private String shortName;

    @Size(max = 255, message = "El lema no puede exceder 255 caracteres")
    private String motto;

    @NotBlank(message = "El tipo de institución es obligatorio")
    private String institutionType;

    @Size(max = 20, message = "El RUC no puede exceder 20 caracteres")
    private String taxId;

    @Size(max = 100, message = "La resolución de licenciamiento no puede exceder 100 caracteres")
    private String licensingResolution;

    @Size(max = 50, message = "El estado de licenciamiento no puede exceder 50 caracteres")
    private String licensingStatus;

    private LocalDate accreditationValidity;
    private LocalDate foundationDate;

    @Size(max = 255, message = "La dirección no puede exceder 255 caracteres")
    private String address;

    @Size(max = 25, message = "El teléfono no puede exceder 25 caracteres")
    private String phone;

    @Email(message = "El correo electrónico debe tener un formato válido")
    @Size(max = 100, message = "El correo electrónico no puede exceder 100 caracteres")
    private String email;

    @Size(max = 150, message = "El sitio web no puede exceder 150 caracteres")
    private String website;

    @Size(max = 255, message = "La URL del logo no puede exceder 255 caracteres")
    private String logoUrl;

    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DtoUniversidad() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getShortName() {
        return shortName;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public String getMotto() {
        return motto;
    }

    public void setMotto(String motto) {
        this.motto = motto;
    }

    public String getInstitutionType() {
        return institutionType;
    }

    public void setInstitutionType(String institutionType) {
        this.institutionType = institutionType;
    }

    public String getTaxId() {
        return taxId;
    }

    public void setTaxId(String taxId) {
        this.taxId = taxId;
    }

    public String getLicensingResolution() {
        return licensingResolution;
    }

    public void setLicensingResolution(String licensingResolution) {
        this.licensingResolution = licensingResolution;
    }

    public String getLicensingStatus() {
        return licensingStatus;
    }

    public void setLicensingStatus(String licensingStatus) {
        this.licensingStatus = licensingStatus;
    }

    public LocalDate getAccreditationValidity() {
        return accreditationValidity;
    }

    public void setAccreditationValidity(LocalDate accreditationValidity) {
        this.accreditationValidity = accreditationValidity;
    }

    public LocalDate getFoundationDate() {
        return foundationDate;
    }

    public void setFoundationDate(LocalDate foundationDate) {
        this.foundationDate = foundationDate;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
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

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
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
