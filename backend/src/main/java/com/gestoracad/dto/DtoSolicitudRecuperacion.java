package com.gestoracad.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Solicitud pública de restablecimiento de contraseña.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoSolicitudRecuperacion {

    @NotBlank(message = "El correo institucional es obligatorio")
    @Email(message = "El correo institucional no es válido")
    @Size(max = 100, message = "El correo no puede exceder 100 caracteres")
    private String email;

    public DtoSolicitudRecuperacion() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
