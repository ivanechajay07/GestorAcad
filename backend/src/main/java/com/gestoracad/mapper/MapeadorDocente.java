package com.gestoracad.mapper;

import com.gestoracad.dto.DtoDocente;
import com.gestoracad.entity.Docente;
import org.springframework.stereotype.Component;

/**
 * Mapper manual que convierte la entidad Docente a su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorDocente {

    public DtoDocente toDto(Docente entity) {
        if (entity == null) {
            return null;
        }
        DtoDocente dto = new DtoDocente();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setFirstName(entity.getFirstName());
        dto.setLastName(entity.getLastName());
        dto.setDocumentId(entity.getDocumentId());
        dto.setEmail(entity.getEmail());
        dto.setPhone(entity.getPhone());
        dto.setAcademicDegree(entity.getAcademicDegree());
        dto.setProfessionalTitle(entity.getProfessionalTitle());
        dto.setCategory(entity.getCategory());
        dto.setDedication(entity.getDedication());
        dto.setFaculty(entity.getFaculty() == null ? null : entity.getFaculty().getName());
        dto.setDepartment(entity.getDepartment());
        dto.setMainSpecialty(entity.getMainSpecialty());
        dto.setBirthDate(entity.getBirthDate());
        dto.setHireDate(entity.getHireDate());
        dto.setAddress(entity.getAddress());
        dto.setFullName(buildFullName(entity));
        dto.setUserId(entity.getUserId());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(Docente entity, DtoDocente dto) {
        entity.setFirstName(dto.getFirstName());
        entity.setLastName(dto.getLastName());
        entity.setDocumentId(dto.getDocumentId());
        entity.setEmail(dto.getEmail());
        entity.setPhone(dto.getPhone());
        entity.setAcademicDegree(dto.getAcademicDegree());
        entity.setProfessionalTitle(dto.getProfessionalTitle());
        entity.setCategory(dto.getCategory());
        entity.setDedication(dto.getDedication());
        entity.setDepartment(dto.getDepartment());
        entity.setMainSpecialty(dto.getMainSpecialty());
        entity.setBirthDate(dto.getBirthDate());
        entity.setHireDate(dto.getHireDate());
        entity.setAddress(dto.getAddress());
    }

    private String buildFullName(Docente entity) {
        String first = entity.getFirstName() == null ? "" : entity.getFirstName().trim();
        String last = entity.getLastName() == null ? "" : entity.getLastName().trim();
        return (first + " " + last).trim();
    }
}
