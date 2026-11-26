package com.gestoracad.mapper;

import com.gestoracad.dto.DtoEspecialidadDocente;
import com.gestoracad.entity.EspecialidadDocente;
import org.springframework.stereotype.Component;

/**
 * Mapper manual que convierte la entidad EspecialidadDocente a su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorEspecialidadDocente {

    public DtoEspecialidadDocente toDto(EspecialidadDocente entity) {
        if (entity == null) {
            return null;
        }
        DtoEspecialidadDocente dto = new DtoEspecialidadDocente();
        dto.setId(entity.getId());
        if (entity.getTeacher() != null) {
            dto.setTeacherId(entity.getTeacher().getId());
            dto.setTeacherName(entity.getTeacher().getFirstName() + " " + entity.getTeacher().getLastName());
        }
        dto.setName(entity.getName());
        dto.setArea(entity.getArea());
        dto.setLevel(entity.getLevel());
        dto.setInstitution(entity.getInstitution());
        dto.setYear(entity.getYear());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(EspecialidadDocente entity, DtoEspecialidadDocente dto) {
        entity.setName(dto.getName());
        entity.setArea(dto.getArea());
        entity.setLevel(dto.getLevel());
        entity.setInstitution(dto.getInstitution());
        entity.setYear(dto.getYear());
    }
}
