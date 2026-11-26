package com.gestoracad.dto;

import java.time.LocalDate;

/**
 * Registro de asistencia visible para el estudiante autenticado,
 * incluida su justificación cuando exista.
 */
public class DtoAsistenciaEstudiante {

    private Long id;
    private LocalDate date;
    private String status;
    private String observation;
    private Long justificationId;
    private String justificationStatus;
    private String justificationReason;
    private String justificationResponse;
    private boolean canJustify;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getObservation() { return observation; }
    public void setObservation(String observation) { this.observation = observation; }
    public Long getJustificationId() { return justificationId; }
    public void setJustificationId(Long justificationId) { this.justificationId = justificationId; }
    public String getJustificationStatus() { return justificationStatus; }
    public void setJustificationStatus(String justificationStatus) { this.justificationStatus = justificationStatus; }
    public String getJustificationReason() { return justificationReason; }
    public void setJustificationReason(String justificationReason) { this.justificationReason = justificationReason; }
    public String getJustificationResponse() { return justificationResponse; }
    public void setJustificationResponse(String justificationResponse) { this.justificationResponse = justificationResponse; }
    public boolean isCanJustify() { return canJustify; }
    public void setCanJustify(boolean canJustify) { this.canJustify = canJustify; }
}
