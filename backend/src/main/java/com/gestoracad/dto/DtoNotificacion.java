package com.gestoracad.dto;

import java.time.Instant;

/**
 * Aviso agregado mostrado en el panel de notificaciones del encabezado.
 * <p>
 * El contenido se construye exclusivamente con conteos y estados
 * institucionales: no incluye nombres, documentos ni ningún otro dato
 * personal. La visibilidad de cada aviso depende de los permisos del usuario
 * autenticado.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoNotificacion {

    private String id;
    private String tipo;
    private String titulo;
    private String detalle;
    private String enlace;
    private Instant fecha;

    public DtoNotificacion() {
    }

    public DtoNotificacion(String id, String tipo, String titulo, String detalle,
                           String enlace, Instant fecha) {
        this.id = id;
        this.tipo = tipo;
        this.titulo = titulo;
        this.detalle = detalle;
        this.enlace = enlace;
        this.fecha = fecha;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDetalle() {
        return detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
    }

    public String getEnlace() {
        return enlace;
    }

    public void setEnlace(String enlace) {
        this.enlace = enlace;
    }

    public Instant getFecha() {
        return fecha;
    }

    public void setFecha(Instant fecha) {
        this.fecha = fecha;
    }
}
