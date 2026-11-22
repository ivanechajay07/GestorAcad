package com.gestoracad.mapper;

import com.gestoracad.dto.DtoEstudiante;
import com.gestoracad.entity.Estudiante;
import org.springframework.stereotype.Component;

/**
 * Mapper manual que convierte la entidad Estudiante a su DTO.
 * Los nombres de facultad y carrera se leen del catálogo normalizado y los
 * datos de ingreso se completan desde la admisión más antigua del servicio.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorEstudiante {

    public DtoEstudiante toDto(Estudiante entity) {
        if (entity == null) {
            return null;
        }
        DtoEstudiante dto = new DtoEstudiante();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setFirstName(entity.getFirstName());
        dto.setLastName(entity.getLastName());
        dto.setDocumentId(entity.getDocumentId());
        dto.setEmail(entity.getEmail());
        dto.setPhone(entity.getPhone());
        dto.setBirthDate(entity.getBirthDate());
        dto.setGender(entity.getGender());
        dto.setAddress(entity.getAddress());
        dto.setAvatar(entity.getAvatar());
        dto.setCareer(entity.getCareer() == null ? null : entity.getCareer().getName());
        if (entity.getFaculty() != null) {
            dto.setFaculty(entity.getFaculty().getName());
        } else {
            dto.setFaculty(entity.getCareer() == null || entity.getCareer().getFaculty() == null
                    ? null
                    : entity.getCareer().getFaculty().getName());
        }
        dto.setCurrentCycle(entity.getCurrentCycle());
        dto.setApprovedCredits(entity.getApprovedCredits());
        dto.setWeightedAverage(entity.getWeightedAverage());
        dto.setCondition(entity.getCondition());
        dto.setEnrollmentStatus(entity.getEnrollmentStatus());
        dto.setFullName(buildFullName(entity));
        dto.setUserId(entity.getUserId());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(Estudiante entity, DtoEstudiante dto) {
        entity.setFirstName(dto.getFirstName());
        entity.setLastName(dto.getLastName());
        entity.setDocumentId(dto.getDocumentId());
        entity.setEmail(dto.getEmail());
        entity.setPhone(dto.getPhone());
        entity.setBirthDate(dto.getBirthDate());
        entity.setGender(dto.getGender());
        entity.setAddress(dto.getAddress());
        if (dto.getAvatar() != null) {
            entity.setAvatar(dto.getAvatar().isEmpty() ? null : dto.getAvatar());
        }
        entity.setCurrentCycle(dto.getCurrentCycle());
        entity.setApprovedCredits(dto.getApprovedCredits());
        entity.setWeightedAverage(dto.getWeightedAverage());
        entity.setCondition(dto.getCondition());
        entity.setEnrollmentStatus(dto.getEnrollmentStatus());
    }

    private String buildFullName(Estudiante entity) {
        String first = entity.getFirstName() == null ? "" : entity.getFirstName().trim();
        String last = entity.getLastName() == null ? "" : entity.getLastName().trim();
        return (first + " " + last).trim();
    }
}
