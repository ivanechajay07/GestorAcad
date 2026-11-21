package com.gestoracad.mapper;

import com.gestoracad.dto.DtoAdmisionEstudiante;
import com.gestoracad.entity.AdmisionEstudiante;
import org.springframework.stereotype.Component;

/**
 * Mapper manual que convierte la entidad AdmisionEstudiante a su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorAdmisionEstudiante {

    public DtoAdmisionEstudiante toDto(AdmisionEstudiante entity) {
        if (entity == null) {
            return null;
        }
        DtoAdmisionEstudiante dto = new DtoAdmisionEstudiante();
        dto.setId(entity.getId());
        if (entity.getStudent() != null) {
            dto.setStudentId(entity.getStudent().getId());
            dto.setStudentName(entity.getStudent().getFirstName() + " " + entity.getStudent().getLastName());
        }
        dto.setModality(entity.getModality());
        dto.setPeriod(entity.getPeriod());
        dto.setHighSchool(entity.getHighSchool());
        dto.setScore(entity.getScore());
        dto.setAdmissionDate(entity.getAdmissionDate());
        dto.setStatus(entity.getStatus());
        dto.setObservation(entity.getObservation());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(AdmisionEstudiante entity, DtoAdmisionEstudiante dto) {
        entity.setModality(dto.getModality());
        entity.setPeriod(dto.getPeriod());
        entity.setHighSchool(dto.getHighSchool());
        entity.setScore(dto.getScore());
        entity.setAdmissionDate(dto.getAdmissionDate());
        entity.setStatus(dto.getStatus());
        entity.setObservation(dto.getObservation());
    }
}
