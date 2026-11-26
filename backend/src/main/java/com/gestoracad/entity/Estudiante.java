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

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entidad JPA que representa a un estudiante.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_estudiantes")
public class Estudiante extends EntidadBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "nombres", nullable = false, length = 150)
    private String firstName;

    @Column(name = "apellidos", nullable = false, length = 150)
    private String lastName;

    @Column(name = "documento_identidad", unique = true, length = 20)
    private String documentId;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "telefono", length = 25)
    private String phone;

    @Column(name = "fecha_nacimiento")
    private LocalDate birthDate;

    @Column(name = "genero", length = 20)
    private String gender;

    @Column(name = "direccion", length = 255)
    private String address;

    @Column(name = "avatar", columnDefinition = "TEXT")
    private String avatar;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "carrera_id")
    private Carrera career;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "facultad_id")
    private Facultad faculty;

    @Column(name = "ciclo_actual", nullable = false)
    private Integer currentCycle = 1;

    @Column(name = "creditos_aprobados", nullable = false)
    private Integer approvedCredits = 0;

    @Column(name = "promedio_ponderado", nullable = false, precision = 4, scale = 2)
    private BigDecimal weightedAverage = BigDecimal.ZERO;

    @Column(name = "condicion", nullable = false, length = 30)
    private String condition = "REGULAR";

    @Column(name = "estado_matricula", nullable = false, length = 30)
    private String enrollmentStatus = "MATRICULADO";

    public Estudiante() {
    }

    @Column(name = "usuario_id")
    private Long userId;

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

    public Carrera getCareer() {
        return career;
    }

    public void setCareer(Carrera career) {
        this.career = career;
    }

    public Facultad getFaculty() {
        return faculty;
    }

    public void setFaculty(Facultad faculty) {
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
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
}
