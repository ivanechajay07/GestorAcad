package com.gestoracad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Resolución de una justificación por parte del docente.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoResolucionJustificacion {

    @NotBlank(message = "El estado de la resolución es obligatorio")
    @Pattern(regexp = "APROBADA|RECHAZADA", message = "Estado de resolución inválido")
    private String status;

    @Size(max = 500, message = "La respuesta no puede exceder 500 caracteres")
    private String response;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
}
