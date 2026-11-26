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
 * Entidad JPA que representa una especialidad docente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_docente_especialidades")
public class EspecialidadDocente extends EntidadBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "docente_id", nullable = false)
    private Docente teacher;

    @Column(name = "nombre", nullable = false, length = 150)
    private String name;

    @Column(name = "area", length = 100)
    private String area;

    @Column(name = "nivel", nullable = false, length = 30)
    private String level = "ESPECIALIDAD";

    @Column(name = "institucion", length = 200)
    private String institution;

    @Column(name = "anio")
    private Integer year;

    public EspecialidadDocente() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Docente getTeacher() {
        return teacher;
    }

    public void setTeacher(Docente teacher) {
        this.teacher = teacher;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getArea() {
        return area;
    }

    public void setArea(String area) {
        this.area = area;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getInstitution() {
        return institution;
    }

    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }
}
