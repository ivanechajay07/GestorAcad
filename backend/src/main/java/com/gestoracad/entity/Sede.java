package com.gestoracad.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Entidad JPA que representa una sede (campus).
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_sedes")
public class Sede extends EntidadBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "universidad_id", nullable = false)
    private Universidad university;

    @Column(name = "nombre", nullable = false, length = 150)
    private String name;

    @Column(name = "codigo", nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "tipo", nullable = false, length = 30)
    private String campusType = "CAMPUS";

    @Column(name = "direccion", length = 255)
    private String address;

    @Column(name = "distrito", length = 100)
    private String district;

    @Column(name = "ciudad", length = 100)
    private String city;

    @Column(name = "region", length = 100)
    private String region;

    @Column(name = "telefono", length = 25)
    private String phone;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "aforo")
    private Integer capacity;

    @Column(name = "num_pabellones")
    private Integer pavilions;

    @Column(name = "num_laboratorios")
    private Integer laboratories;

    public Sede() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Universidad getUniversity() {
        return university;
    }

    public void setUniversity(Universidad university) {
        this.university = university;
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
}
