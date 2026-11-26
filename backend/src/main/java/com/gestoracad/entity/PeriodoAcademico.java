package com.gestoracad.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

/**
 * Periodo académico: calendario lectivo y ventana de matrícula.
 * Solo un periodo puede marcarse como vigente; el servicio garantiza esa regla
 * y sincroniza el parámetro global {@code PERIODO_ACADEMICO_ACTUAL}.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_periodos_academicos")
public class PeriodoAcademico extends EntidadBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "nombre", nullable = false, length = 120)
    private String name;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate startDate;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate endDate;

    @Column(name = "matricula_inicio")
    private LocalDate enrollmentStart;

    @Column(name = "matricula_fin")
    private LocalDate enrollmentEnd;

    @Column(name = "es_actual", nullable = false)
    private boolean current;

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LocalDate getEnrollmentStart() {
        return enrollmentStart;
    }

    public void setEnrollmentStart(LocalDate enrollmentStart) {
        this.enrollmentStart = enrollmentStart;
    }

    public LocalDate getEnrollmentEnd() {
        return enrollmentEnd;
    }

    public void setEnrollmentEnd(LocalDate enrollmentEnd) {
        this.enrollmentEnd = enrollmentEnd;
    }

    public boolean isCurrent() {
        return current;
    }

    public void setCurrent(boolean current) {
        this.current = current;
    }
}
