package com.gestoracad.controller;

import com.gestoracad.dto.DtoRespuestaApi;
import com.gestoracad.dto.DtoResumenDashboard;
import com.gestoracad.service.ServicioResumenDashboard;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador REST del panel institucional.
 * Expone un único resumen agregado, sin datos personales y filtrado por
 * permisos del usuario autenticado.
 *
 * @author Equipo de Desarrollo Gestor Académico
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "Resumen agregado del panel institucional")
public class ControladorDashboard {

    private final ServicioResumenDashboard dashboardService;

    public ControladorDashboard(ServicioResumenDashboard dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Obtener resumen del panel",
            description = "Devuelve totales y distribuciones agregadas según los permisos del usuario")
    public ResponseEntity<DtoRespuestaApi<DtoResumenDashboard>> getSummary() {
        return ResponseEntity.ok(DtoRespuestaApi.ok(
                dashboardService.getSummary(),
                "Resumen del panel obtenido exitosamente"));
    }
}
