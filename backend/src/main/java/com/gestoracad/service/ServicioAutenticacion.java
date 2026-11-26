package com.gestoracad.service;

import com.gestoracad.dto.DtoSolicitudLogin;
import com.gestoracad.dto.DtoRespuestaLogin;

/**
 * Servicio de autenticación institucional.
 * Gestiona el inicio y cierre de sesión, la emisión y renovación de tokens JWT,
 * el bloqueo por intentos fallidos y el latido de presencia del usuario.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioAutenticacion {

    /** Autentica al usuario y devuelve el token de acceso y de refresco con sus roles y permisos. */
    DtoRespuestaLogin login(DtoSolicitudLogin loginRequestDto, String clientIp, String userAgent);

    /** Renueva el token de acceso a partir de un token de refresco válido (rotación). */
    DtoRespuestaLogin refresh(String refreshToken, String clientIp, String userAgent);

    /** Registra el cierre de sesión del usuario autenticado. */
    void logout(String username, String clientIp, String userAgent);

    /** Revoca un token de refresco para que no pueda reutilizarse. */
    void revocarTokenRefresco(String refreshToken);

    /** Actualiza la marca de última conexión (presencia) del usuario. */
    void heartbeat(String username);

    /** Registra una solicitud de restablecimiento de contraseña sin revelar si el correo existe. */
    void requestPasswordReset(String email, String clientIp, String userAgent);
}
