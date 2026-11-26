package com.gestoracad.mapper;

import com.gestoracad.dto.DtoHorarioSeccion;
import com.gestoracad.entity.HorarioSeccion;
import org.springframework.stereotype.Component;

/**
 * Mapper manual de horarios de sección.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorHorarioSeccion {

    public DtoHorarioSeccion toDto(HorarioSeccion entity) {
        if (entity == null) {
            return null;
        }
        DtoHorarioSeccion dto = new DtoHorarioSeccion();
        dto.setId(entity.getId());
        if (entity.getSection() != null) {
            dto.setSectionId(entity.getSection().getId());
        }
        dto.setDay(entity.getDay());
        dto.setStartTime(entity.getStartTime());
        dto.setEndTime(entity.getEndTime());
        dto.setClassroom(entity.getClassroom());
        dto.setActive(entity.isActive());
        return dto;
    }
}
