package com.gestoracad.dto;

/**
 * Conteo agrupado de la bitácora de auditoría.
 * <p>
 * Se usa tanto para la serie diaria ({@code clave} = {@code YYYY-MM-DD}) como
 * para la distribución por acción ({@code clave} = código de la acción).
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoConteoAuditoria {

    private String clave;
    private String etiqueta;
    private long total;

    public DtoConteoAuditoria() {
    }

    public DtoConteoAuditoria(String clave, String etiqueta, long total) {
        this.clave = clave;
        this.etiqueta = etiqueta;
        this.total = total;
    }

    public String getClave() {
        return clave;
    }

    public void setClave(String clave) {
        this.clave = clave;
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
