package com.gestoracad.dto;

import java.time.LocalDate;

/**
 * Registro de asistencia visible para el estudiante autenticado.
 */
public class DtoAsistenciaEstudiante {

    private Long id;
    private LocalDate date;
    private String status;
    private String observation;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getObservation() { return observation; }
    public void setObservation(String observation) { this.observation = observation; }
}
