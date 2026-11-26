package com.gestoracad.mapper;

import com.gestoracad.dto.DtoPeriodoAcademico;
import com.gestoracad.entity.PeriodoAcademico;
import org.springframework.stereotype.Component;

/**
 * Mapper manual entre PeriodoAcademico y su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorPeriodoAcademico {

    public DtoPeriodoAcademico toDto(PeriodoAcademico entity) {
        if (entity == null) {
            return null;
        }
        DtoPeriodoAcademico dto = new DtoPeriodoAcademico();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setEnrollmentStart(entity.getEnrollmentStart());
        dto.setEnrollmentEnd(entity.getEnrollmentEnd());
        dto.setCurrent(entity.isCurrent());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(PeriodoAcademico entity, DtoPeriodoAcademico dto) {
        entity.setCode(dto.getCode());
        entity.setName(dto.getName());
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setEnrollmentStart(dto.getEnrollmentStart());
        entity.setEnrollmentEnd(dto.getEnrollmentEnd());
    }
}
