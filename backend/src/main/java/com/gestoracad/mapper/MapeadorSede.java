package com.gestoracad.mapper;

import com.gestoracad.dto.DtoSede;
import com.gestoracad.entity.Sede;
import org.springframework.stereotype.Component;

/**
 * Mapper manual que convierte la entidad Sede a su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorSede {

    public DtoSede toDto(Sede entity) {
        if (entity == null) {
            return null;
        }
        DtoSede dto = new DtoSede();
        dto.setId(entity.getId());
        if (entity.getUniversity() != null) {
            dto.setUniversityId(entity.getUniversity().getId());
            dto.setUniversityName(entity.getUniversity().getName());
        }
        dto.setName(entity.getName());
        dto.setCode(entity.getCode());
        dto.setCampusType(entity.getCampusType());
        dto.setAddress(entity.getAddress());
        dto.setDistrict(entity.getDistrict());
        dto.setCity(entity.getCity());
        dto.setRegion(entity.getRegion());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        dto.setCapacity(entity.getCapacity());
        dto.setPavilions(entity.getPavilions());
        dto.setLaboratories(entity.getLaboratories());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(Sede entity, DtoSede dto) {
        entity.setName(dto.getName());
        entity.setCode(dto.getCode());
        entity.setCampusType(dto.getCampusType());
        entity.setAddress(dto.getAddress());
        entity.setDistrict(dto.getDistrict());
        entity.setCity(dto.getCity());
        entity.setRegion(dto.getRegion());
        entity.setPhone(dto.getPhone());
        entity.setEmail(dto.getEmail());
        entity.setCapacity(dto.getCapacity());
        entity.setPavilions(dto.getPavilions());
        entity.setLaboratories(dto.getLaboratories());
    }
}
