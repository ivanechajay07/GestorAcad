package com.gestoracad.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

/**
 * Entidad JPA que representa la información institucional de la universidad.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_universidad")
public class Universidad extends EntidadBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 200)
    private String name;

    @Column(name = "nombre_corto", length = 50)
    private String shortName;

    @Column(name = "lema", length = 255)
    private String motto;

    @Column(name = "tipo_institucion", nullable = false, length = 30)
    private String institutionType = "PUBLICA";

    @Column(name = "ruc", unique = true, length = 20)
    private String taxId;

    @Column(name = "resolucion_licenciamiento", length = 100)
    private String licensingResolution;

    @Column(name = "estado_licenciamiento", length = 50)
    private String licensingStatus;

    @Column(name = "vigencia_acreditacion")
    private LocalDate accreditationValidity;

    @Column(name = "fecha_fundacion")
    private LocalDate foundationDate;

    @Column(name = "direccion", length = 255)
    private String address;

    @Column(name = "telefono", length = 25)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "sitio_web", length = 150)
    private String website;

    @Column(name = "logo_url", length = 255)
    private String logoUrl;

    public Universidad() {
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
}
