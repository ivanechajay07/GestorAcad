package com.gestoracad.mapper;

import com.gestoracad.dto.DtoPermiso;
import com.gestoracad.dto.DtoRol;
import com.gestoracad.entity.Permiso;
import com.gestoracad.entity.Rol;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

/**
 * Mapper manual de {@link Rol} a {@link DtoRol}, incluyendo sus permisos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorRol {

    public DtoRol toDto(Rol role) {
        if (role == null) {
            return null;
        }

        DtoRol dto = new DtoRol();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setDescription(role.getDescription());

        Set<DtoPermiso> permissionDtos = new HashSet<>();
        if (role.getPermissions() != null) {
            for (Permiso p : role.getPermissions()) {
                permissionDtos.add(new DtoPermiso(p.getId(), p.getName(), p.getModule(), p.getDescription()));
            }
        }
        dto.setPermissions(permissionDtos);

        return dto;
    }
}
