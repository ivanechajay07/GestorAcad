package com.gestoracad.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Resumen de auditoría del panel: total histórico de eventos y actividad
 * agregada por día para la ventana de seguimiento.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoAuditoriaDashboard {

    private long eventosTotales;
    private List<DtoConteoDashboard> eventosPorDia = new ArrayList<>();

    public long getEventosTotales() {
        return eventosTotales;
    }

    public void setEventosTotales(long eventosTotales) {
        this.eventosTotales = eventosTotales;
    }

    public List<DtoConteoDashboard> getEventosPorDia() {
        return eventosPorDia;
    }

    public void setEventosPorDia(List<DtoConteoDashboard> eventosPorDia) {
        this.eventosPorDia = eventosPorDia;
    }
}
