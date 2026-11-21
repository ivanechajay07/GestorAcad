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
 * Entidad JPA que representa el proceso de admisión de un estudiante.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_estudiante_admisiones")
public class AdmisionEstudiante extends EntidadBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Estudiante student;

    @Column(name = "modalidad", nullable = false, length = 40)
    private String modality;

    @Column(name = "periodo", nullable = false, length = 20)
    private String period;

    @Column(name = "colegio_procedencia", length = 200)
    private String highSchool;

    @Column(name = "puntaje", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "fecha_admision")
    private LocalDate admissionDate;

    @Column(name = "estado", nullable = false, length = 20)
    private String status = "ADMITIDO";

    @Column(name = "observacion", length = 255)
    private String observation;

/** Constructor. */
    public AdmisionEstudiante() {
    }

/** Obtiene el valor de {@code id}. */
    public Long getId() {
        return id;
    }

/** Establece el valor de {@code id}. */
    public void setId(Long id) {
        this.id = id;
    }

/** Obtiene el valor de {@code student}. */
    public Estudiante getStudent() {
        return student;
    }

/** Establece el valor de {@code student}. */
    public void setStudent(Estudiante student) {
        this.student = student;
    }

/** Obtiene el valor de {@code modality}. */
    public String getModality() {
        return modality;
    }

/** Establece el valor de {@code modality}. */
    public void setModality(String modality) {
        this.modality = modality;
    }

/** Obtiene el valor de {@code period}. */
    public String getPeriod() {
        return period;
    }

/** Establece el valor de {@code period}. */
    public void setPeriod(String period) {
        this.period = period;
    }

/** Obtiene el valor de {@code highSchool}. */
    public String getHighSchool() {
        return highSchool;
    }

/** Establece el valor de {@code highSchool}. */
    public void setHighSchool(String highSchool) {
        this.highSchool = highSchool;
    }

/** Obtiene el valor de {@code score}. */
    public BigDecimal getScore() {
        return score;
    }

/** Establece el valor de {@code score}. */
    public void setScore(BigDecimal score) {
        this.score = score;
    }

/** Obtiene el valor de {@code admissionDate}. */
    public LocalDate getAdmissionDate() {
        return admissionDate;
    }

/** Establece el valor de {@code admissionDate}. */
    public void setAdmissionDate(LocalDate admissionDate) {
        this.admissionDate = admissionDate;
    }

/** Obtiene el valor de {@code status}. */
    public String getStatus() {
        return status;
    }

/** Establece el valor de {@code status}. */
    public void setStatus(String status) {
        this.status = status;
    }

/** Obtiene el valor de {@code observation}. */
    public String getObservation() {
        return observation;
    }

/** Establece el valor de {@code observation}. */
    public void setObservation(String observation) {
        this.observation = observation;
    }
}
