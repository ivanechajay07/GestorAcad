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
 * Entidad JPA que representa la asignación (carga académica) de un docente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_docente_asignaciones")
public class AsignacionDocente extends EntidadBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "docente_id", nullable = false)
    private Docente teacher;

    @Column(name = "periodo", nullable = false, length = 20)
    private String period;

    @Column(name = "curso", nullable = false, length = 200)
    private String course;

    @Column(name = "codigo_curso", length = 20)
    private String courseCode;

    @Column(name = "seccion", length = 10)
    private String section;

    @Column(name = "creditos")
    private Integer credits;

    @Column(name = "horas_teoricas", nullable = false)
    private Integer theoryHours = 0;

    @Column(name = "horas_practicas", nullable = false)
    private Integer practiceHours = 0;

    @Column(name = "estado", nullable = false, length = 20)
    private String status = "ASIGNADA";

/** Constructor. */
    public AsignacionDocente() {
    }

/** Obtiene el valor de {@code id}. */
    public Long getId() {
        return id;
    }

/** Establece el valor de {@code id}. */
    public void setId(Long id) {
        this.id = id;
    }

/** Obtiene el valor de {@code teacher}. */
    public Docente getTeacher() {
        return teacher;
    }

/** Establece el valor de {@code teacher}. */
    public void setTeacher(Docente teacher) {
        this.teacher = teacher;
    }

/** Obtiene el valor de {@code period}. */
    public String getPeriod() {
        return period;
    }

/** Establece el valor de {@code period}. */
    public void setPeriod(String period) {
        this.period = period;
    }

/** Obtiene el valor de {@code course}. */
    public String getCourse() {
        return course;
    }

/** Establece el valor de {@code course}. */
    public void setCourse(String course) {
        this.course = course;
    }

/** Obtiene el valor de {@code courseCode}. */
    public String getCourseCode() {
        return courseCode;
    }

/** Establece el valor de {@code courseCode}. */
    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

/** Obtiene el valor de {@code section}. */
    public String getSection() {
        return section;
    }

/** Establece el valor de {@code section}. */
    public void setSection(String section) {
        this.section = section;
    }

/** Obtiene el valor de {@code credits}. */
    public Integer getCredits() {
        return credits;
    }

/** Establece el valor de {@code credits}. */
    public void setCredits(Integer credits) {
        this.credits = credits;
    }

/** Obtiene el valor de {@code theoryHours}. */
    public Integer getTheoryHours() {
        return theoryHours;
    }

/** Establece el valor de {@code theoryHours}. */
    public void setTheoryHours(Integer theoryHours) {
        this.theoryHours = theoryHours;
    }

/** Obtiene el valor de {@code practiceHours}. */
    public Integer getPracticeHours() {
        return practiceHours;
    }

/** Establece el valor de {@code practiceHours}. */
    public void setPracticeHours(Integer practiceHours) {
        this.practiceHours = practiceHours;
    }

/** Obtiene la carga semanal derivada de las horas teóricas y prácticas. */
    public Integer getTotalHours() {
        int theory = theoryHours == null ? 0 : theoryHours;
        int practice = practiceHours == null ? 0 : practiceHours;
        return theory + practice;
    }

/** Obtiene el valor de {@code status}. */
    public String getStatus() {
        return status;
    }

/** Establece el valor de {@code status}. */
    public void setStatus(String status) {
        this.status = status;
    }
}
