package com.gestoracad.mapper;

import com.gestoracad.dto.DtoPlanEstudio;
import com.gestoracad.entity.PlanEstudio;
import org.springframework.stereotype.Component;

/**
 * Mapper manual entre PlanEstudio y su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorPlanEstudio {

    public DtoPlanEstudio toDto(PlanEstudio entity) {
        if (entity == null) {
            return null;
        }
        DtoPlanEstudio dto = new DtoPlanEstudio();
        dto.setId(entity.getId());
        if (entity.getCareer() != null) {
            dto.setCareerId(entity.getCareer().getId());
            dto.setCareerName(entity.getCareer().getName());
        }
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setYear(entity.getYear());
        dto.setDescription(entity.getDescription());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(PlanEstudio entity, DtoPlanEstudio dto) {
        entity.setCode(dto.getCode());
        entity.setName(dto.getName());
        entity.setYear(dto.getYear());
        entity.setDescription(dto.getDescription());
    }
}
