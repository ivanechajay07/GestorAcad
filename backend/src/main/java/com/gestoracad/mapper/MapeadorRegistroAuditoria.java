package com.gestoracad.mapper;

import com.gestoracad.dto.DtoRegistroAuditoria;
import com.gestoracad.entity.RegistroAuditoria;
import org.springframework.stereotype.Component;

import java.time.ZoneId;

/**
 * Mapper manual que convierte la entidad RegistroAuditoria a su DTO.
 * <p>
 * La fecha se guarda en la base de datos como hora local del servidor; el DTO
 * la publica como instante UTC para que el frontend la muestre en la zona
 * horaria institucional sin desfases.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@Component
public class MapeadorRegistroAuditoria {

    public DtoRegistroAuditoria toDto(RegistroAuditoria audit) {
        if (audit == null) {
            return null;
        }

        DtoRegistroAuditoria dto = new DtoRegistroAuditoria();
        dto.setId(audit.getId());
        dto.setUserId(audit.getUser() != null ? audit.getUser().getId() : null);
        dto.setUsername(audit.getUsername());
        dto.setAction(audit.getAction() != null ? audit.getAction().name() : null);
        dto.setModule(audit.getModule());
        dto.setDescription(audit.getDescription());
        dto.setEndpoint(audit.getEndpoint());
        dto.setHttpMethod(audit.getHttpMethod());
        dto.setClientIp(audit.getClientIp());
        dto.setEntityName(audit.getEntityName());
        dto.setEntityId(audit.getEntityId());
        dto.setUserAgent(audit.getUserAgent());
        dto.setResult(audit.getResult());
        dto.setTimestamp(audit.getTimestamp() != null
                ? audit.getTimestamp().atZone(ZoneId.systemDefault()).toInstant()
                : null);

        return dto;
    }
}
