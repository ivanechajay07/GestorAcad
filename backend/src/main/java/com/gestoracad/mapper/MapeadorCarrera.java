package com.gestoracad.mapper;

import com.gestoracad.dto.DtoCarrera;
import com.gestoracad.entity.Carrera;
import org.springframework.stereotype.Component;

/**
 * Mapper manual que convierte la entidad Carrera a su DTO.
 * Incluye la facultad de adscripción para que el frontend no tenga que
 * resolverla por separado.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorCarrera {

    public DtoCarrera toDto(Carrera entity) {
        if (entity == null) {
            return null;
        }
        DtoCarrera dto = new DtoCarrera();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        if (entity.getFaculty() != null) {
            dto.setFacultyId(entity.getFaculty().getId());
            dto.setFacultyName(entity.getFaculty().getName());
        }
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(Carrera entity, DtoCarrera dto) {
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
    }
}
