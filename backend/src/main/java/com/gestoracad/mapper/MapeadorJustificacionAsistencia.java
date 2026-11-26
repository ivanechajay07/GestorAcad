package com.gestoracad.mapper;

import com.gestoracad.dto.DtoJustificacionAsistencia;
import com.gestoracad.entity.JustificacionAsistencia;
import org.springframework.stereotype.Component;

/**
 * Mapper de justificaciones de asistencia.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorJustificacionAsistencia {

    public DtoJustificacionAsistencia toDto(JustificacionAsistencia entity) {
        if (entity == null) {
            return null;
        }
        DtoJustificacionAsistencia dto = new DtoJustificacionAsistencia();
        dto.setId(entity.getId());
        if (entity.getAttendance() != null) {
            dto.setAttendanceId(entity.getAttendance().getId());
            dto.setDate(entity.getAttendance().getDate());
            dto.setAttendanceStatus(entity.getAttendance().getStatus());
        }
        if (entity.getSection() != null) {
            dto.setSectionId(entity.getSection().getId());
        }
        if (entity.getStudent() != null) {
            dto.setStudentId(entity.getStudent().getId());
            dto.setStudentCode(entity.getStudent().getCode());
            dto.setStudentName((entity.getStudent().getFirstName() + " "
                    + entity.getStudent().getLastName()).trim());
        }
        dto.setReason(entity.getReason());
        dto.setStatus(entity.getStatus());
        dto.setResponse(entity.getResponse());
        dto.setResolvedBy(entity.getResolvedBy());
        dto.setResolvedAt(entity.getResolvedAt());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
