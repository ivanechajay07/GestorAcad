package com.gestoracad.mapper;

import com.gestoracad.dto.DtoCalificacion;
import com.gestoracad.entity.Calificacion;
import org.springframework.stereotype.Component;

/**
 * Mapper de calificaciones.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorCalificacion {

    public DtoCalificacion toDto(Calificacion entity) {
        if (entity == null) {
            return null;
        }
        DtoCalificacion dto = new DtoCalificacion();
        dto.setId(entity.getId());
        if (entity.getEvaluation() != null) {
            dto.setEvaluationId(entity.getEvaluation().getId());
        }
        if (entity.getStudent() != null) {
            dto.setStudentId(entity.getStudent().getId());
            dto.setStudentCode(entity.getStudent().getCode());
            dto.setStudentName((entity.getStudent().getFirstName() + " " + entity.getStudent().getLastName()).trim());
        }
        dto.setScore(entity.getScore());
        dto.setObservation(entity.getObservation());
        dto.setActive(entity.isActive());
        return dto;
    }
}
