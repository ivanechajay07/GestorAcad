package com.gestoracad.mapper;

import com.gestoracad.dto.DtoUniversidad;
import com.gestoracad.entity.Universidad;
import org.springframework.stereotype.Component;

/**
 * Mapper manual que convierte la entidad Universidad a su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorUniversidad {

    public DtoUniversidad toDto(Universidad entity) {
        if (entity == null) {
            return null;
        }
        DtoUniversidad dto = new DtoUniversidad();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setShortName(entity.getShortName());
        dto.setMotto(entity.getMotto());
        dto.setInstitutionType(entity.getInstitutionType());
        dto.setTaxId(entity.getTaxId());
        dto.setLicensingResolution(entity.getLicensingResolution());
        dto.setLicensingStatus(entity.getLicensingStatus());
        dto.setAccreditationValidity(entity.getAccreditationValidity());
        dto.setFoundationDate(entity.getFoundationDate());
        dto.setAddress(entity.getAddress());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        dto.setWebsite(entity.getWebsite());
        dto.setLogoUrl(entity.getLogoUrl());
        dto.setActive(entity.isActive());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public void updateEntity(Universidad entity, DtoUniversidad dto) {
        entity.setName(dto.getName());
        entity.setShortName(dto.getShortName());
        entity.setMotto(dto.getMotto());
        entity.setInstitutionType(dto.getInstitutionType());
        entity.setTaxId(dto.getTaxId());
        entity.setLicensingResolution(dto.getLicensingResolution());
        entity.setLicensingStatus(dto.getLicensingStatus());
        entity.setAccreditationValidity(dto.getAccreditationValidity());
        entity.setFoundationDate(dto.getFoundationDate());
        entity.setAddress(dto.getAddress());
        entity.setPhone(dto.getPhone());
        entity.setEmail(dto.getEmail());
        entity.setWebsite(dto.getWebsite());
        entity.setLogoUrl(dto.getLogoUrl());
    }
}
