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
 * Entidad JPA que representa una autoridad institucional.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_autoridades")
public class Autoridad extends EntidadBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "universidad_id", nullable = false)
    private Universidad university;

    @Column(name = "cargo", nullable = false, length = 100)
    private String position;

    @Column(name = "nombres", nullable = false, length = 150)
    private String firstName;

    @Column(name = "apellidos", nullable = false, length = 150)
    private String lastName;

    @Column(name = "grado_academico", length = 200)
    private String academicDegree;

    @Column(name = "documento_identidad", length = 20)
    private String documentNumber;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "telefono", length = 25)
    private String phone;

    @Column(name = "despacho", length = 150)
    private String office;

    @Column(name = "periodo_inicio")
    private LocalDate periodStart;

    @Column(name = "periodo_fin")
    private LocalDate periodEnd;

    @Column(name = "resolucion_nombramiento", length = 100)
    private String appointmentResolution;

/** Constructor. */
    public Autoridad() {
    }

/** Obtiene el valor de {@code id}. */
    public Long getId() {
        return id;
    }

/** Establece el valor de {@code id}. */
    public void setId(Long id) {
        this.id = id;
    }

/** Obtiene el valor de {@code university}. */
    public Universidad getUniversity() {
        return university;
    }

/** Establece el valor de {@code university}. */
    public void setUniversity(Universidad university) {
        this.university = university;
    }

/** Obtiene el valor de {@code position}. */
    public String getPosition() {
        return position;
    }

/** Establece el valor de {@code position}. */
    public void setPosition(String position) {
        this.position = position;
    }

/** Obtiene el valor de {@code firstName}. */
    public String getFirstName() {
        return firstName;
    }

/** Establece el valor de {@code firstName}. */
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

/** Obtiene el valor de {@code lastName}. */
    public String getLastName() {
        return lastName;
    }

/** Establece el valor de {@code lastName}. */
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

/** Obtiene el valor de {@code academicDegree}. */
    public String getAcademicDegree() {
        return academicDegree;
    }

/** Establece el valor de {@code academicDegree}. */
    public void setAcademicDegree(String academicDegree) {
        this.academicDegree = academicDegree;
    }

/** Obtiene el valor de {@code documentNumber}. */
    public String getDocumentNumber() {
        return documentNumber;
    }

/** Establece el valor de {@code documentNumber}. */
    public void setDocumentNumber(String documentNumber) {
        this.documentNumber = documentNumber;
    }

/** Obtiene el valor de {@code email}. */
    public String getEmail() {
        return email;
    }

/** Establece el valor de {@code email}. */
    public void setEmail(String email) {
        this.email = email;
    }

/** Obtiene el valor de {@code phone}. */
    public String getPhone() {
        return phone;
    }

/** Establece el valor de {@code phone}. */
    public void setPhone(String phone) {
        this.phone = phone;
    }

/** Obtiene el valor de {@code office}. */
    public String getOffice() {
        return office;
    }

/** Establece el valor de {@code office}. */
    public void setOffice(String office) {
        this.office = office;
    }

/** Obtiene el valor de {@code periodStart}. */
    public LocalDate getPeriodStart() {
        return periodStart;
    }

/** Establece el valor de {@code periodStart}. */
    public void setPeriodStart(LocalDate periodStart) {
        this.periodStart = periodStart;
    }

/** Obtiene el valor de {@code periodEnd}. */
    public LocalDate getPeriodEnd() {
        return periodEnd;
    }

/** Establece el valor de {@code periodEnd}. */
    public void setPeriodEnd(LocalDate periodEnd) {
        this.periodEnd = periodEnd;
    }

/** Obtiene el valor de {@code appointmentResolution}. */
    public String getAppointmentResolution() {
        return appointmentResolution;
    }

/** Establece el valor de {@code appointmentResolution}. */
    public void setAppointmentResolution(String appointmentResolution) {
        this.appointmentResolution = appointmentResolution;
    }
}
