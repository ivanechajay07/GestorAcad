package com.gestoracad.mapper;

import com.gestoracad.dto.DtoFacultad;
import com.gestoracad.entity.Facultad;
import org.springframework.stereotype.Component;

/**
 * Mapper manual que convierte la entidad Facultad a su DTO.
 * Los contadores se completan en el servicio porque requieren consultas
 * agregadas sobre carreras, estudiantes y docentes.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorFacultad {

    public DtoFacultad toDto(Facultad entity) {
        if (entity == null) {
            return null;
        }
        DtoFacultad dto = new DtoFacultad();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(Facultad entity, DtoFacultad dto) {
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
    }
}
