package com.gestoracad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Mensaje previo de una conversación con el asistente académico.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public class DtoMensajeAsistente {

    @NotBlank(message = "El rol del mensaje es obligatorio")
    @Pattern(regexp = "user|assistant", message = "El rol debe ser user o assistant")
    private String role;

    @NotBlank(message = "El contenido del mensaje no puede estar vacío")
    @Size(max = 2000, message = "El contenido del mensaje no puede exceder 2000 caracteres")
    private String content;

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
