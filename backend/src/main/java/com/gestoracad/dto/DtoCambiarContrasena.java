package com.gestoracad.dto;

import com.gestoracad.security.ContrasenaSegura;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO de solicitud para el cambio de contraseña del usuario autenticado.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoCambiarContrasena {

    @NotBlank(message = "La contraseña actual es obligatoria")
    private String currentPassword;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @ContrasenaSegura
    private String newPassword;

    public DtoCambiarContrasena() {
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
