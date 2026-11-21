package com.gestoracad.mapper;

import com.gestoracad.audit.AccionAuditoria;
import com.gestoracad.dto.DtoRegistroAuditoria;
import com.gestoracad.entity.RegistroAuditoria;
import com.gestoracad.entity.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Pruebas del mapeo de la bitácora hacia su DTO.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
class MapeadorRegistroAuditoriaTest {

    private final MapeadorRegistroAuditoria mapper = new MapeadorRegistroAuditoria();

    @Test
    @DisplayName("Publica la fecha como instante UTC para que el frontend la convierta")
    void convierteFechaAInstante() {
        LocalDateTime fechaLocal = LocalDateTime.of(2026, 10, 28, 17, 17, 58);
        RegistroAuditoria audit = new RegistroAuditoria();
        audit.setId(21L);
        audit.setUsername("admin.rectoria");
        audit.setAction(AccionAuditoria.LOGIN);
        audit.setModule("SEGURIDAD");
        audit.setDescription("Inicio de sesión exitoso");
        audit.setEndpoint("/api/v1/auth/login");
        audit.setHttpMethod("POST");
        audit.setClientIp("203.0.113.9");
        audit.setUserAgent("Mozilla/5.0 Chrome/140.0");
        audit.setResult("SUCCESS");
        audit.setTimestamp(fechaLocal);

        DtoRegistroAuditoria dto = mapper.toDto(audit);

        assertNotNull(dto);
        assertEquals(fechaLocal.atZone(ZoneId.systemDefault()).toInstant(), dto.getTimestamp());
        assertEquals("admin.rectoria", dto.getUsername());
        assertEquals("LOGIN", dto.getAction());
        assertEquals("203.0.113.9", dto.getClientIp());
        assertEquals("Mozilla/5.0 Chrome/140.0", dto.getUserAgent());
        assertNull(dto.getUserId());
    }

    @Test
    @DisplayName("Tolera registros nulos o sin fecha")
    void toleraDatosAusentes() {
        assertNull(mapper.toDto(null));

        RegistroAuditoria audit = new RegistroAuditoria();
        audit.setId(1L);
        audit.setUsername("ANONIMO");
        audit.setAction(AccionAuditoria.VIEW);
        audit.setModule("SEGURIDAD");
        audit.setDescription("Consulta");
        audit.setEndpoint("/api/v1/health");
        audit.setHttpMethod("GET");
        audit.setResult("SUCCESS");
        audit.setTimestamp(null);
        audit.setUser(new Usuario());

        DtoRegistroAuditoria dto = mapper.toDto(audit);

        assertNull(dto.getTimestamp());
        assertNull(dto.getUserId());
    }
}
