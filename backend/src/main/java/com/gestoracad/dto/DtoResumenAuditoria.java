package com.gestoracad.dto;

import java.time.Instant;
import java.util.List;

/**
 * Resumen agregado de la actividad de auditoría para un periodo móvil.
 * <p>
 * No transporta datos personales: solo totales, promedios y distribuciones.
 * Las claves de día usan el calendario institucional de {@code America/Lima}.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoResumenAuditoria {

    private int dias;
    private String desde;
    private String hasta;
    private long total;
    private long exitos;
    private long fallos;
    private double promedioDiario;
    private String diaMasActivo;
    private String diaMasActivoFecha;
    private long eventosDiaMasActivo;
    private Long totalPeriodoAnterior;
    private Double variacionPorcentual;
    private List<DtoConteoAuditoria> porDia;
    private List<DtoConteoAuditoria> porAccion;
    private Instant generadoEn;

    public int getDias() {
        return dias;
    }

    public void setDias(int dias) {
        this.dias = dias;
    }

    public String getDesde() {
        return desde;
    }

    public void setDesde(String desde) {
        this.desde = desde;
    }

    public String getHasta() {
        return hasta;
    }

    public void setHasta(String hasta) {
        this.hasta = hasta;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getExitos() {
        return exitos;
    }

    public void setExitos(long exitos) {
        this.exitos = exitos;
    }

    public long getFallos() {
        return fallos;
    }

    public void setFallos(long fallos) {
        this.fallos = fallos;
    }

    public double getPromedioDiario() {
        return promedioDiario;
    }

    public void setPromedioDiario(double promedioDiario) {
        this.promedioDiario = promedioDiario;
    }

    public String getDiaMasActivo() {
        return diaMasActivo;
    }

    public void setDiaMasActivo(String diaMasActivo) {
        this.diaMasActivo = diaMasActivo;
    }

    public String getDiaMasActivoFecha() {
        return diaMasActivoFecha;
    }

    public void setDiaMasActivoFecha(String diaMasActivoFecha) {
        this.diaMasActivoFecha = diaMasActivoFecha;
    }

    public long getEventosDiaMasActivo() {
        return eventosDiaMasActivo;
    }

    public void setEventosDiaMasActivo(long eventosDiaMasActivo) {
        this.eventosDiaMasActivo = eventosDiaMasActivo;
    }

    public Long getTotalPeriodoAnterior() {
        return totalPeriodoAnterior;
    }

    public void setTotalPeriodoAnterior(Long totalPeriodoAnterior) {
        this.totalPeriodoAnterior = totalPeriodoAnterior;
    }

    public Double getVariacionPorcentual() {
        return variacionPorcentual;
    }

    public void setVariacionPorcentual(Double variacionPorcentual) {
        this.variacionPorcentual = variacionPorcentual;
    }

    public List<DtoConteoAuditoria> getPorDia() {
        return porDia;
    }

    public void setPorDia(List<DtoConteoAuditoria> porDia) {
        this.porDia = porDia;
    }

    public List<DtoConteoAuditoria> getPorAccion() {
        return porAccion;
    }

    public void setPorAccion(List<DtoConteoAuditoria> porAccion) {
        this.porAccion = porAccion;
    }

    public Instant getGeneradoEn() {
        return generadoEn;
    }

    public void setGeneradoEn(Instant generadoEn) {
        this.generadoEn = generadoEn;
    }
}
