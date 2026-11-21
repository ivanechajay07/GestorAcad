package com.gestoracad.dto;

/**
 * Datos institucionales visibles en el panel: identidad, periodo académico
 * configurado, estado de licenciamiento y sedes activas.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoInstitucionDashboard {

    private String nombre;
    private String nombreCorto;
    private String periodo;
    private String estadoLicenciamiento;
    private Long sedesActivas;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getNombreCorto() {
        return nombreCorto;
    }

    public void setNombreCorto(String nombreCorto) {
        this.nombreCorto = nombreCorto;
    }

    public String getPeriodo() {
        return periodo;
    }

    public void setPeriodo(String periodo) {
        this.periodo = periodo;
    }

    public String getEstadoLicenciamiento() {
        return estadoLicenciamiento;
    }

    public void setEstadoLicenciamiento(String estadoLicenciamiento) {
        this.estadoLicenciamiento = estadoLicenciamiento;
    }

    public Long getSedesActivas() {
        return sedesActivas;
    }

    public void setSedesActivas(Long sedesActivas) {
        this.sedesActivas = sedesActivas;
    }
}
