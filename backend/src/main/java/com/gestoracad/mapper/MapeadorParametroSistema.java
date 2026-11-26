package com.gestoracad.mapper;

import com.gestoracad.dto.DtoParametroSistema;
import com.gestoracad.entity.ParametroSistema;
import org.springframework.stereotype.Component;

/**
 * Mapper manual que convierte la entidad ParametroSistema a su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorParametroSistema {

    public DtoParametroSistema toDto(ParametroSistema entity) {
        if (entity == null) {
            return null;
        }
        DtoParametroSistema dto = new DtoParametroSistema();
        dto.setId(entity.getId());
        dto.setKey(entity.getKey());
        dto.setValue(entity.getValue());
        dto.setValueType(entity.getValueType());
        dto.setModule(entity.getModule());
        dto.setDescription(entity.getDescription());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(ParametroSistema entity, DtoParametroSistema dto) {
        entity.setKey(dto.getKey());
        entity.setValue(dto.getValue());
        entity.setValueType(dto.getValueType());
        entity.setModule(dto.getModule());
        entity.setDescription(dto.getDescription());
    }
}
