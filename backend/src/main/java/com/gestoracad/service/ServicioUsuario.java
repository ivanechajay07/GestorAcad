package com.gestoracad.service;

import com.gestoracad.dto.DtoCambiarContrasena;
import com.gestoracad.dto.DtoActualizarPerfil;
import com.gestoracad.dto.DtoCrearUsuario;
import com.gestoracad.dto.DtoRespuestaUsuario;
import com.gestoracad.dto.DtoActualizarUsuario;

import java.util.List;

/**
 * Servicio de gestión de usuarios institucionales.
 * Administra el ciclo de vida de las cuentas (creación, actualización, estado),
 * el perfil propio y el cambio de contraseña, con registro en auditoría.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioUsuario {

    /** Lista todos los usuarios registrados con sus roles y permisos. */
    List<DtoRespuestaUsuario> getAllUsers();

    /** Obtiene un usuario por su identificador. */
    DtoRespuestaUsuario getUserById(Long id);

    /** Obtiene un usuario por su nombre de usuario. */
    DtoRespuestaUsuario getUserByUsername(String username);

    /** Crea una nueva cuenta de usuario validando unicidad de usuario y correo. */
    DtoRespuestaUsuario createUser(DtoCrearUsuario createDto, String clientIp);

    /** Actualiza la cuenta de un usuario (datos, roles, avatar y contraseña opcional). */
    DtoRespuestaUsuario updateUser(Long id, DtoActualizarUsuario updateDto, String clientIp);

    /** Actualiza el perfil del propio usuario autenticado. */
    DtoRespuestaUsuario updateOwnProfile(String username, DtoActualizarPerfil updateDto, String clientIp);

    /** Habilita o deshabilita la cuenta de un usuario. */
    void toggleUserStatus(Long id, boolean active, String clientIp);

    /** Cambia la contraseña del usuario validando la contraseña actual. */
    void changePassword(String username, DtoCambiarContrasena changePasswordDto, String clientIp, String userAgent);
}
