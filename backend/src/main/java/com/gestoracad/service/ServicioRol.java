package com.gestoracad.service;

import com.gestoracad.dto.DtoPermiso;
import com.gestoracad.dto.DtoSolicitudPermiso;
import com.gestoracad.dto.DtoRol;
import com.gestoracad.dto.DtoSolicitudRol;

import java.util.List;

/**
 * Servicio de gestión de roles y permisos (RBAC).
 * Expone las operaciones de consulta y mantenimiento del catálogo de roles y permisos,
 * registrando cada operación en la auditoría.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
public interface ServicioRol {

    /** Lista todos los roles junto con sus permisos asociados. */
    List<DtoRol> getAllRoles();

    /** Lista todos los permisos atómicos del sistema. */
    List<DtoPermiso> getAllPermissions();

    /** Obtiene un rol por su nombre. */
    DtoRol getRoleByName(String name);

    /** Crea un nuevo rol con sus permisos asociados. */
    DtoRol createRole(DtoSolicitudRol request, String clientIp);

    /** Actualiza nombre, descripción y permisos de un rol existente. */
    DtoRol updateRole(Long id, DtoSolicitudRol request, String clientIp);

    /** Elimina un rol (no permite eliminar el rol base del sistema). */
    void deleteRole(Long id, String clientIp);

    /** Crea un permiso atómico del sistema. */
    DtoPermiso createPermission(DtoSolicitudPermiso request, String clientIp);

    /** Actualiza nombre, módulo y descripción de un permiso. */
    DtoPermiso updatePermission(Long id, DtoSolicitudPermiso request, String clientIp);

    /** Elimina un permiso y lo desasocia de todos los roles. */
    void deletePermission(Long id, String clientIp);
}
