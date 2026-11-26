package com.gestoracad.mapper;

import com.gestoracad.dto.DtoCurso;
import com.gestoracad.entity.Curso;
import org.springframework.stereotype.Component;

/**
 * Mapper manual entre Curso y su DTO. Las horas totales son derivadas.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorCurso {

    public DtoCurso toDto(Curso entity) {
        if (entity == null) {
            return null;
        }
        DtoCurso dto = new DtoCurso();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setCredits(entity.getCredits());
        dto.setTheoryHours(entity.getTheoryHours());
        dto.setPracticeHours(entity.getPracticeHours());
        dto.setTotalHours(entity.getTheoryHours() + entity.getPracticeHours());
        dto.setType(entity.getType());
        dto.setDescription(entity.getDescription());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(Curso entity, DtoCurso dto) {
        entity.setCode(dto.getCode());
        entity.setName(dto.getName());
        entity.setCredits(dto.getCredits());
        entity.setTheoryHours(dto.getTheoryHours());
        entity.setPracticeHours(dto.getPracticeHours());
        entity.setType(dto.getType());
        entity.setDescription(dto.getDescription());
    }
}
