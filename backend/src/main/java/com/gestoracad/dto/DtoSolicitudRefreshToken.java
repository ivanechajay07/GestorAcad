package com.gestoracad.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO de solicitud para renovar el token de acceso o revocar el token de refresco.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoSolicitudRefreshToken {

    @NotBlank(message = "El token de refresco es obligatorio")
    private String refreshToken;

    public DtoSolicitudRefreshToken() {
    }

    public DtoSolicitudRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
