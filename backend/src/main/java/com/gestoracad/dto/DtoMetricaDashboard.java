package com.gestoracad.dto;

/**
 * Métrica agregada con total y cantidad de registros activos.
 * Se usa para estudiantes, docentes y usuarios del panel institucional.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoMetricaDashboard {

    private long total;
    private long activos;

    public DtoMetricaDashboard() {
    }

    public DtoMetricaDashboard(long total, long activos) {
        this.total = total;
        this.activos = activos;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getActivos() {
        return activos;
    }

    public void setActivos(long activos) {
        this.activos = activos;
    }
}
