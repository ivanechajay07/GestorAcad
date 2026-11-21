package com.gestoracad.mapper;

import com.gestoracad.dto.DtoAsignacionDocente;
import com.gestoracad.entity.AsignacionDocente;
import org.springframework.stereotype.Component;

/**
 * Mapper manual que convierte la entidad AsignacionDocente a su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorAsignacionDocente {

    public DtoAsignacionDocente toDto(AsignacionDocente entity) {
        if (entity == null) {
            return null;
        }
        DtoAsignacionDocente dto = new DtoAsignacionDocente();
        dto.setId(entity.getId());
        if (entity.getTeacher() != null) {
            dto.setTeacherId(entity.getTeacher().getId());
            dto.setTeacherName(entity.getTeacher().getFirstName() + " " + entity.getTeacher().getLastName());
        }
        dto.setPeriod(entity.getPeriod());
        dto.setCourse(entity.getCourse());
        dto.setCourseCode(entity.getCourseCode());
        dto.setSection(entity.getSection());
        dto.setCredits(entity.getCredits());
        dto.setTheoryHours(entity.getTheoryHours());
        dto.setPracticeHours(entity.getPracticeHours());
        dto.setTotalHours(entity.getTotalHours());
        dto.setStatus(entity.getStatus());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(AsignacionDocente entity, DtoAsignacionDocente dto) {
        entity.setPeriod(dto.getPeriod());
        entity.setCourse(dto.getCourse());
        entity.setCourseCode(dto.getCourseCode());
        entity.setSection(dto.getSection());
        entity.setCredits(dto.getCredits());
        entity.setTheoryHours(dto.getTheoryHours() == null ? 0 : dto.getTheoryHours());
        entity.setPracticeHours(dto.getPracticeHours() == null ? 0 : dto.getPracticeHours());
        entity.setStatus(dto.getStatus());
    }
}
