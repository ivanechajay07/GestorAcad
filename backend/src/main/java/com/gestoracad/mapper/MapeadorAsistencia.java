package com.gestoracad.mapper;

import com.gestoracad.dto.DtoAsistencia;
import com.gestoracad.entity.Asistencia;
import org.springframework.stereotype.Component;

/**
 * Mapper de asistencia.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorAsistencia {

    public DtoAsistencia toDto(Asistencia entity) {
        if (entity == null) {
            return null;
        }
        DtoAsistencia dto = new DtoAsistencia();
        dto.setId(entity.getId());
        if (entity.getSection() != null) {
            dto.setSectionId(entity.getSection().getId());
        }
        if (entity.getStudent() != null) {
            dto.setStudentId(entity.getStudent().getId());
            dto.setStudentCode(entity.getStudent().getCode());
            dto.setStudentName((entity.getStudent().getFirstName() + " " + entity.getStudent().getLastName()).trim());
        }
        dto.setDate(entity.getDate());
        dto.setStatus(entity.getStatus());
        dto.setObservation(entity.getObservation());
        dto.setActive(entity.isActive());
        return dto;
    }
}
