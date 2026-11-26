package com.gestoracad.mapper;

import com.gestoracad.dto.DtoPrerrequisito;
import com.gestoracad.entity.PrerrequisitoCurso;
import org.springframework.stereotype.Component;

/**
 * Mapper manual de prerrequisitos.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorPrerrequisito {

    public DtoPrerrequisito toDto(PrerrequisitoCurso entity) {
        if (entity == null) {
            return null;
        }
        DtoPrerrequisito dto = new DtoPrerrequisito();
        dto.setId(entity.getId());
        if (entity.getCourse() != null) {
            dto.setCourseId(entity.getCourse().getId());
        }
        if (entity.getPrerequisite() != null) {
            dto.setPrerequisiteId(entity.getPrerequisite().getId());
            dto.setPrerequisiteCode(entity.getPrerequisite().getCode());
            dto.setPrerequisiteName(entity.getPrerequisite().getName());
            dto.setCredits(entity.getPrerequisite().getCredits());
        }
        dto.setActive(entity.isActive());
        return dto;
    }
}
