package com.gestoracad.mapper;

import com.gestoracad.dto.DtoEvaluacion;
import com.gestoracad.entity.Evaluacion;
import org.springframework.stereotype.Component;

/**
 * Mapper de evaluaciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorEvaluacion {

    public DtoEvaluacion toDto(Evaluacion entity) {
        if (entity == null) {
            return null;
        }
        DtoEvaluacion dto = new DtoEvaluacion();
        dto.setId(entity.getId());
        if (entity.getSection() != null) {
            dto.setSectionId(entity.getSection().getId());
        }
        dto.setName(entity.getName());
        dto.setType(entity.getType());
        dto.setWeight(entity.getWeight());
        dto.setDate(entity.getDate());
        dto.setMaxScore(entity.getMaxScore());
        dto.setActive(entity.isActive());
        return dto;
    }

    public void updateEntity(Evaluacion entity, DtoEvaluacion dto) {
        entity.setName(dto.getName());
        entity.setType(dto.getType());
        entity.setWeight(dto.getWeight());
        entity.setDate(dto.getDate());
        entity.setMaxScore(dto.getMaxScore());
    }
}
