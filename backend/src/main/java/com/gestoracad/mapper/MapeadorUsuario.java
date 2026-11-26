package com.gestoracad.mapper;

import com.gestoracad.dto.DtoRespuestaUsuario;
import com.gestoracad.entity.Permiso;
import com.gestoracad.entity.Rol;
import com.gestoracad.entity.Usuario;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

/**
 * Mapper manual de {@link Usuario} a {@link DtoRespuestaUsuario}.
 * Construye el DTO con los roles y permisos agregados, sin exponer credenciales.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorUsuario {

    public DtoRespuestaUsuario toDto(Usuario user) {
        if (user == null) {
            return null;
        }

        DtoRespuestaUsuario dto = new DtoRespuestaUsuario();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setFullName(user.getFirstName() + " " + user.getLastName());
        dto.setPhone(user.getPhone());
        dto.setDepartment(user.getDepartment());
        dto.setAvatar(user.getAvatar());
        dto.setActive(user.isActive());
        dto.setAccountLocked(user.isAccountLocked());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setLastSeen(user.getLastSeen());

        Set<String> roleNames = new HashSet<>();
        Set<String> permissionCodes = new HashSet<>();

        if (user.getRoles() != null) {
            for (Rol role : user.getRoles()) {
                roleNames.add(role.getName());
                if (role.getPermissions() != null) {
                    for (Permiso perm : role.getPermissions()) {
                        permissionCodes.add(perm.getName());
                    }
                }
            }
        }

        dto.setRoles(roleNames);
        dto.setPermissions(permissionCodes);

        return dto;
    }
}
