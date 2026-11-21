package com.gestoracad.mapper;

import com.gestoracad.dto.DtoPlanCurso;
import com.gestoracad.entity.PlanCurso;
import org.springframework.stereotype.Component;

/**
 * Mapper manual entre PlanCurso y su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorPlanCurso {

    public DtoPlanCurso toDto(PlanCurso entity) {
        if (entity == null) {
            return null;
        }
        DtoPlanCurso dto = new DtoPlanCurso();
        dto.setId(entity.getId());
        if (entity.getPlan() != null) {
            dto.setPlanId(entity.getPlan().getId());
        }
        if (entity.getCourse() != null) {
            dto.setCourseId(entity.getCourse().getId());
            dto.setCourseCode(entity.getCourse().getCode());
            dto.setCourseName(entity.getCourse().getName());
            dto.setCredits(entity.getCourse().getCredits());
        }
        dto.setCycle(entity.getCycle());
        dto.setMandatory(entity.isMandatory());
        dto.setActive(entity.isActive());
        return dto;
    }
}
