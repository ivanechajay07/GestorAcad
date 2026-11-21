package com.gestoracad.mapper;

import com.gestoracad.dto.DtoSeccion;
import com.gestoracad.entity.Docente;
import com.gestoracad.entity.Seccion;
import org.springframework.stereotype.Component;

/**
 * Mapper manual entre Seccion y su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorSeccion {

    public DtoSeccion toDto(Seccion entity) {
        if (entity == null) {
            return null;
        }
        DtoSeccion dto = new DtoSeccion();
        dto.setId(entity.getId());
        if (entity.getPeriod() != null) {
            dto.setPeriodId(entity.getPeriod().getId());
            dto.setPeriodCode(entity.getPeriod().getCode());
        }
        if (entity.getCourse() != null) {
            dto.setCourseId(entity.getCourse().getId());
            dto.setCourseCode(entity.getCourse().getCode());
            dto.setCourseName(entity.getCourse().getName());
            dto.setCredits(entity.getCourse().getCredits());
        }
        Docente teacher = entity.getTeacher();
        if (teacher != null) {
            dto.setTeacherId(teacher.getId());
            dto.setTeacherName((teacher.getFirstName() + " " + teacher.getLastName()).trim());
        }
        dto.setCode(entity.getCode());
        dto.setCapacity(entity.getCapacity());
        dto.setShift(entity.getShift());
        dto.setClassroom(entity.getClassroom());
        dto.setSchedule(entity.getSchedule());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
