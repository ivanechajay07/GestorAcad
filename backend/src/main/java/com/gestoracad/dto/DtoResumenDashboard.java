package com.gestoracad.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Resumen agregado del panel institucional.
 * <p>
 * Cada bloque se completa únicamente si el usuario autenticado posee el permiso
 * del módulo correspondiente. Un bloque en {@code null} significa que el
 * usuario no está autorizado a ver esa información (el frontend lo omite).
 * No transporta datos personales: solo totales y distribuciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoResumenDashboard {

    private DtoInstitucionDashboard institucion;
    private DtoMetricaDashboard estudiantes;
    private DtoMetricaDashboard docentes;
    private DtoMetricaDashboard usuarios;
    private Long facultades;
    private Long carreras;
    private DtoAuditoriaDashboard auditoria;
    private DtoGestionDashboard gestion;
    private DtoPeriodoDashboard periodo;
    private List<DtoConteoDashboard> estudiantesPorCiclo;
    private List<DtoConteoDashboard> estudiantesPorFacultad;
    private List<DtoConteoDashboard> estudiantesPorCarrera;
    private List<DtoConteoDashboard> docentesPorCategoria;
    private List<DtoConteoDashboard> docentesPorFacultad;
    private LocalDateTime generadoEn;

    public DtoInstitucionDashboard getInstitucion() {
        return institucion;
    }

    public void setInstitucion(DtoInstitucionDashboard institucion) {
        this.institucion = institucion;
    }

    public DtoMetricaDashboard getEstudiantes() {
        return estudiantes;
    }

    public void setEstudiantes(DtoMetricaDashboard estudiantes) {
        this.estudiantes = estudiantes;
    }

    public DtoMetricaDashboard getDocentes() {
        return docentes;
    }

    public void setDocentes(DtoMetricaDashboard docentes) {
        this.docentes = docentes;
    }

    public DtoMetricaDashboard getUsuarios() {
        return usuarios;
    }

    public void setUsuarios(DtoMetricaDashboard usuarios) {
        this.usuarios = usuarios;
    }

    public Long getFacultades() {
        return facultades;
    }

    public void setFacultades(Long facultades) {
        this.facultades = facultades;
    }

    public Long getCarreras() {
        return carreras;
    }

    public void setCarreras(Long carreras) {
        this.carreras = carreras;
    }

    public DtoAuditoriaDashboard getAuditoria() {
        return auditoria;
    }

    public void setAuditoria(DtoAuditoriaDashboard auditoria) {
        this.auditoria = auditoria;
    }

    public DtoGestionDashboard getGestion() {
        return gestion;
    }

    public void setGestion(DtoGestionDashboard gestion) {
        this.gestion = gestion;
    }

    public DtoPeriodoDashboard getPeriodo() {
        return periodo;
    }

    public void setPeriodo(DtoPeriodoDashboard periodo) {
        this.periodo = periodo;
    }

    public List<DtoConteoDashboard> getEstudiantesPorCiclo() {
        return estudiantesPorCiclo;
    }

    public void setEstudiantesPorCiclo(List<DtoConteoDashboard> estudiantesPorCiclo) {
        this.estudiantesPorCiclo = estudiantesPorCiclo;
    }

    public List<DtoConteoDashboard> getEstudiantesPorFacultad() {
        return estudiantesPorFacultad;
    }

    public void setEstudiantesPorFacultad(List<DtoConteoDashboard> estudiantesPorFacultad) {
        this.estudiantesPorFacultad = estudiantesPorFacultad;
    }

    public List<DtoConteoDashboard> getEstudiantesPorCarrera() {
        return estudiantesPorCarrera;
    }

    public void setEstudiantesPorCarrera(List<DtoConteoDashboard> estudiantesPorCarrera) {
        this.estudiantesPorCarrera = estudiantesPorCarrera;
    }

    public List<DtoConteoDashboard> getDocentesPorCategoria() {
        return docentesPorCategoria;
    }

    public void setDocentesPorCategoria(List<DtoConteoDashboard> docentesPorCategoria) {
        this.docentesPorCategoria = docentesPorCategoria;
    }

    public List<DtoConteoDashboard> getDocentesPorFacultad() {
        return docentesPorFacultad;
    }

    public void setDocentesPorFacultad(List<DtoConteoDashboard> docentesPorFacultad) {
        this.docentesPorFacultad = docentesPorFacultad;
    }

    public LocalDateTime getGeneradoEn() {
        return generadoEn;
    }

    public void setGeneradoEn(LocalDateTime generadoEn) {
        this.generadoEn = generadoEn;
    }
}
