package com.gestoracad.dto;

import java.time.LocalDate;

/**
 * Estado operativo del periodo académico actual.
 * Solo se completa si el usuario tiene permisos sobre secciones o matrículas.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoPeriodoDashboard {

    private String codigo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Long secciones;
    private Long capacidad;
    private Long matriculas;
    private Long cuposDisponibles;
    private Long estudiantesSinMatricula;
    private Long seccionesSinDocente;
    private Integer avance;

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public Long getSecciones() {
        return secciones;
    }

    public void setSecciones(Long secciones) {
        this.secciones = secciones;
    }

    public Long getCapacidad() {
        return capacidad;
    }

    public void setCapacidad(Long capacidad) {
        this.capacidad = capacidad;
    }

    public Long getMatriculas() {
        return matriculas;
    }

    public void setMatriculas(Long matriculas) {
        this.matriculas = matriculas;
    }

    public Long getCuposDisponibles() {
        return cuposDisponibles;
    }

    public void setCuposDisponibles(Long cuposDisponibles) {
        this.cuposDisponibles = cuposDisponibles;
    }

    public Long getEstudiantesSinMatricula() {
        return estudiantesSinMatricula;
    }

    public void setEstudiantesSinMatricula(Long estudiantesSinMatricula) {
        this.estudiantesSinMatricula = estudiantesSinMatricula;
    }

    public Long getSeccionesSinDocente() {
        return seccionesSinDocente;
    }

    public void setSeccionesSinDocente(Long seccionesSinDocente) {
        this.seccionesSinDocente = seccionesSinDocente;
    }

    public Integer getAvance() {
        return avance;
    }

    public void setAvance(Integer avance) {
        this.avance = avance;
    }
}
