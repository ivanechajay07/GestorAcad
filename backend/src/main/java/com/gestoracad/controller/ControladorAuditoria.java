package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoRegistroAuditoria;
import com.gestoracad.dto.DtoResumenAuditoria;
import com.gestoracad.service.ServicioAuditoria;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST del módulo de auditoría. Expone la consulta de la bitácora de eventos del sistema.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/audit")
@Tag(name = "Auditoría", description = "Bitácora forense de operaciones y trazabilidad de eventos")
public class ControladorAuditoria {

    private final ServicioAuditoria auditService;

    public ControladorAuditoria(ServicioAuditoria auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/recent")
    @PreAuthorize("hasAuthority('AUDITORIA_VIEW')")
    @Operation(summary = "Obtener últimos eventos de auditoría", description = "Devuelve los últimos 100 registros de auditoría transaccional ordenados por fecha descendente")
    public ResponseEntity<DtoRespuestaApi<List<DtoRegistroAuditoria>>> getRecentLogs() {
        List<DtoRegistroAuditoria> logs = auditService.getRecentLogs();
        return ResponseEntity.ok(DtoRespuestaApi.ok(logs, "Bitácora de auditoría obtenida exitosamente"));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('AUDITORIA_VIEW')")
    @Operation(summary = "Obtener resumen de actividad de auditoría",
            description = "Devuelve totales, promedio diario, variación frente al periodo anterior, "
                    + "serie por día y distribución por acción. Ventana entre 1 y 90 días.")
    public ResponseEntity<DtoRespuestaApi<DtoResumenAuditoria>> getSummary(
            @RequestParam(name = "dias", defaultValue = "7") int dias) {
        DtoResumenAuditoria resumen = auditService.getSummary(dias);
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                resumen,
                "Resumen de auditoría obtenido exitosamente"));
    }
}
