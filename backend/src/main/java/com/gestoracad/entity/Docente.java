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

import java.time.LocalDate;

/**
 * Entidad JPA que representa a un docente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_docentes")
public class Docente extends EntidadBase {

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

    @Column(name = "grado_academico", length = 200)
    private String academicDegree;

    @Column(name = "titulo_profesional", length = 200)
    private String professionalTitle;

    @Column(name = "categoria", nullable = false, length = 30)
    private String category = "CONTRATADO";

    @Column(name = "dedicacion", nullable = false, length = 30)
    private String dedication = "TIEMPO_COMPLETO";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "facultad_id")
    private Facultad faculty;

    @Column(name = "departamento", length = 150)
    private String department;

    @Column(name = "especialidad_principal", length = 200)
    private String mainSpecialty;

    @Column(name = "fecha_nacimiento")
    private LocalDate birthDate;

    @Column(name = "fecha_ingreso")
    private LocalDate hireDate;

    @Column(name = "direccion", length = 255)
    private String address;

    public Docente() {
    }

    @Column(name = "usuario_id", unique = true)
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

    public Facultad getFaculty() {
        return faculty;
    }

    public void setFaculty(Facultad faculty) {
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
