package com.gestoracad.mapper;

import com.gestoracad.dto.DtoAutoridad;
import com.gestoracad.entity.Autoridad;
import org.springframework.stereotype.Component;

/**
 * Mapper manual que convierte la entidad Autoridad a su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorAutoridad {

    public DtoAutoridad toDto(Autoridad entity) {
        if (entity == null) {
            return null;
        }
        DtoAutoridad dto = new DtoAutoridad();
        dto.setId(entity.getId());
        if (entity.getUniversity() != null) {
            dto.setUniversityId(entity.getUniversity().getId());
            dto.setUniversityName(entity.getUniversity().getName());
        }
        dto.setPosition(entity.getPosition());
        dto.setFirstName(entity.getFirstName());
        dto.setLastName(entity.getLastName());
        dto.setAcademicDegree(entity.getAcademicDegree());
        dto.setDocumentNumber(entity.getDocumentNumber());
        dto.setEmail(entity.getEmail());
        dto.setPhone(entity.getPhone());
        dto.setOffice(entity.getOffice());
        dto.setPeriodStart(entity.getPeriodStart());
        dto.setPeriodEnd(entity.getPeriodEnd());
        dto.setAppointmentResolution(entity.getAppointmentResolution());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(Autoridad entity, DtoAutoridad dto) {
        entity.setPosition(dto.getPosition());
        entity.setFirstName(dto.getFirstName());
        entity.setLastName(dto.getLastName());
        entity.setAcademicDegree(dto.getAcademicDegree());
        entity.setDocumentNumber(dto.getDocumentNumber());
        entity.setEmail(dto.getEmail());
        entity.setPhone(dto.getPhone());
        entity.setOffice(dto.getOffice());
        entity.setPeriodStart(dto.getPeriodStart());
        entity.setPeriodEnd(dto.getPeriodEnd());
        entity.setAppointmentResolution(dto.getAppointmentResolution());
    }
}
