package com.gestoracad.mapper;

import com.gestoracad.dto.DtoMatricula;
import com.gestoracad.entity.Matricula;
import org.springframework.stereotype.Component;

/**
 * Mapper manual entre Matricula y su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorMatricula {

    public DtoMatricula toDto(Matricula entity) {
        if (entity == null) {
            return null;
        }
        DtoMatricula dto = new DtoMatricula();
        dto.setId(entity.getId());
        if (entity.getStudent() != null) {
            dto.setStudentId(entity.getStudent().getId());
            dto.setStudentCode(entity.getStudent().getCode());
            dto.setStudentName((entity.getStudent().getFirstName() + " " + entity.getStudent().getLastName()).trim());
        }
        if (entity.getSection() != null) {
            dto.setSectionId(entity.getSection().getId());
            dto.setSectionCode(entity.getSection().getCode());
            if (entity.getSection().getCourse() != null) {
                dto.setCourseId(entity.getSection().getCourse().getId());
                dto.setCourseCode(entity.getSection().getCourse().getCode());
                dto.setCourseName(entity.getSection().getCourse().getName());
                dto.setCredits(entity.getSection().getCourse().getCredits());
            }
            if (entity.getSection().getPeriod() != null) {
                dto.setPeriodId(entity.getSection().getPeriod().getId());
                dto.setPeriodCode(entity.getSection().getPeriod().getCode());
            }
        }
        dto.setEnrollmentDate(entity.getEnrollmentDate());
        dto.setStatus(entity.getStatus());
        dto.setObservation(entity.getObservation());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
