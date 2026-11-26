package com.gestoracad.dto;

/**
 * Conteo agrupado por una etiqueta del panel institucional
 * (facultad, carrera, ciclo, categoría docente o día de auditoría).
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoConteoDashboard {

    private String etiqueta;
    private long total;

    public DtoConteoDashboard() {
    }

    public DtoConteoDashboard(String etiqueta, long total) {
        this.etiqueta = etiqueta;
        this.total = total;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    public void setEtiqueta(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }
}
