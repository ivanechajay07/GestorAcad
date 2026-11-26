package com.gestoracad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Solicitud de justificación enviada por un estudiante.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoSolicitudJustificacion {

    @NotBlank(message = "El motivo de la justificación es obligatorio")
    @Size(max = 500, message = "El motivo no puede exceder 500 caracteres")
    private String reason;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
