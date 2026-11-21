package com.gestoracad.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Prerrequisito académico: un curso exige haber aprobado otro.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Entity
@Table(name = "tb_curso_prerrequisitos")
public class PrerrequisitoCurso extends EntidadBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "curso_id", nullable = false)
    private Curso course;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "prerrequisito_id", nullable = false)
    private Curso prerequisite;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Curso getCourse() {
        return course;
    }

    public void setCourse(Curso course) {
        this.course = course;
    }

    public Curso getPrerequisite() {
        return prerequisite;
    }

    public void setPrerequisite(Curso prerequisite) {
        this.prerequisite = prerequisite;
    }
}
